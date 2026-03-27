"""AI-generated urban quests service."""

from __future__ import annotations

import json
import re
from datetime import UTC, datetime, timedelta
from typing import Any

from app.core.logging import get_logger
from app.models.quest import (
    Quest,
    QuestCategory,
    QuestDifficulty,
    QuestStep,
    UserQuestProgress,
)

logger = get_logger("quest_service")

QUEST_TTL = 60 * 60 * 24 * 7  # 7 days
QUESTS_PER_CITY_WEEK = 5

XP_RANGES: dict[QuestDifficulty, tuple[int, int]] = {
    QuestDifficulty.EASY: (10, 20),
    QuestDifficulty.MEDIUM: (30, 50),
    QuestDifficulty.HARD: (80, 100),
    QuestDifficulty.EPIC: (150, 200),
}

FORBIDDEN_PATTERNS = [
    r"ignore (previous|above|all) instructions",
    r"you are now",
    r"act as",
    r"jailbreak",
    r"system prompt",
]

QUEST_GENERATION_PROMPT = """Tu es Yuni AI, createur de quetes urbaines \
pour {city}. Genere une quete engageante qui pousse les habitants \
a explorer leur ville.

Contexte : saison {season}, quartier {zone}.
{actors_section}\
Difficulte : {difficulty}. Categorie : {category}.

Reponds UNIQUEMENT en JSON valide :
{{
  "title": "Titre accrocheur (max 60 chars)",
  "description": "Description engageante (max 200 chars)",
  "xp_reward": {xp_min}-{xp_max},
  "estimated_duration": "X minutes",
  "steps": [
    {{
      "order": 1,
      "description": "Description precise",
      "validation_hint": "Comment valider"
    }}
  ],
  "interests_match": ["sport", "culture"]
}}"""


class QuestService:
    """Generates and manages AI-powered urban quests."""

    def __init__(self, mistral_client: Any, redis: Any) -> None:
        self._client = mistral_client
        self._redis = redis

    async def generate_quest(
        self,
        city: str,
        category: QuestCategory,
        difficulty: QuestDifficulty,
        zone: str = "centre",
        local_actors: list[Any] | None = None,
    ) -> Quest:
        xp_min, xp_max = XP_RANGES[difficulty]

        actors_section = ""
        if local_actors:
            actors_preview = "\n".join(
                f"- {self._sanitize_for_prompt(str(getattr(a, 'name', a)))} "
                f"({self._sanitize_for_prompt(str(getattr(a, 'category', '')))})"
                for a in local_actors[:5]
            )
            actors_section = f"Acteurs locaux :\n{actors_preview}\n"

        prompt = QUEST_GENERATION_PROMPT.format(
            city=city,
            season=self._current_season(),
            zone=zone,
            actors_section=actors_section,
            difficulty=difficulty.value,
            category=category.value,
            xp_min=xp_min,
            xp_max=xp_max,
        )

        response = await self._client.chat.complete_async(
            model="mistral-large-latest",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=600,
            temperature=0.9,
        )

        raw: str = response.choices[0].message.content
        quest_data = self._parse_quest_response(raw)

        xp_reward = quest_data.get("xp_reward", xp_min)
        if isinstance(xp_reward, str) and "-" in xp_reward:
            xp_reward = int(xp_reward.split("-")[0])
        xp_reward = max(xp_min, min(xp_max, int(xp_reward)))

        steps = [
            QuestStep(
                order=s.get("order", i + 1),
                description=s.get("description", ""),
                validation_hint=s.get("validation_hint", ""),
            )
            for i, s in enumerate(quest_data.get("steps", []))
        ]
        if not steps:
            steps = [QuestStep(
                order=1,
                description="Explorez le quartier",
                validation_hint="Partagez votre experience",
            )]

        quest = Quest(
            city=city,
            title=str(quest_data.get("title", f"Quete {category.value}"))[:100],
            description=str(quest_data.get("description", ""))[:500],
            category=category,
            difficulty=difficulty,
            xp_reward=xp_reward,
            estimated_duration=str(
                quest_data.get("estimated_duration", "30 minutes")
            ),
            steps=steps,
            interests_match=quest_data.get("interests_match", []),
            expires_at=datetime.now(UTC) + timedelta(days=7),
        )

        await self._redis.set(
            f"quest:v1:{city}:{quest.id}",
            quest.model_dump_json(),
            ttl_seconds=QUEST_TTL,
        )

        return quest

    async def get_city_quests(
        self,
        city: str,
        interests: list[str] | None = None,
    ) -> list[Quest]:
        raw_index = await self._redis.get(f"quest:index:{city}")
        if not raw_index:
            return []

        quest_ids: list[str] = json.loads(raw_index)
        quests: list[Quest] = []
        for qid in quest_ids:
            raw = await self._redis.get(f"quest:v1:{city}:{qid}")
            if raw:
                quest = Quest.model_validate_json(raw)
                if not interests or any(
                    i in quest.interests_match for i in interests
                ):
                    quests.append(quest)
        return quests

    async def start_quest(
        self, quest_id: str, user_id_hash: str,
    ) -> UserQuestProgress:
        progress = UserQuestProgress(
            quest_id=quest_id,
            user_id_hash=user_id_hash,
            status="in_progress",
            started_at=datetime.now(UTC),
        )
        await self._save_progress(user_id_hash, quest_id, progress)
        return progress

    async def complete_step(
        self,
        quest_id: str,
        user_id_hash: str,
        step: int,
        city: str,
    ) -> UserQuestProgress:
        progress = await self._get_progress(user_id_hash, quest_id)
        if not progress:
            msg = "Quete introuvable"
            raise ValueError(msg)

        quest_raw = await self._redis.get(f"quest:v1:{city}:{quest_id}")
        if not quest_raw:
            msg = "Quete introuvable"
            raise ValueError(msg)
        quest = Quest.model_validate_json(quest_raw)

        progress.current_step = step
        if step >= len(quest.steps):
            progress.status = "completed"
            progress.completed_at = datetime.now(UTC)

        await self._save_progress(user_id_hash, quest_id, progress)
        return progress

    async def _save_progress(
        self, user_id_hash: str, quest_id: str, progress: UserQuestProgress,
    ) -> None:
        key = f"quest:progress:{user_id_hash[:16]}:{quest_id}"
        await self._redis.set(key, progress.model_dump_json(), ttl_seconds=QUEST_TTL)

    async def _get_progress(
        self, user_id_hash: str, quest_id: str,
    ) -> UserQuestProgress | None:
        key = f"quest:progress:{user_id_hash[:16]}:{quest_id}"
        raw = await self._redis.get(key)
        if raw:
            return UserQuestProgress.model_validate_json(raw)
        return None

    @staticmethod
    def _sanitize_for_prompt(text: str) -> str:
        for pattern in FORBIDDEN_PATTERNS:
            text = re.sub(pattern, "", text, flags=re.IGNORECASE)
        return text[:200]

    @staticmethod
    def _current_season() -> str:
        month = datetime.now(UTC).month
        if month in (3, 4, 5):
            return "printemps"
        if month in (6, 7, 8):
            return "ete"
        if month in (9, 10, 11):
            return "automne"
        return "hiver"

    @staticmethod
    def _parse_quest_response(raw: str) -> dict[str, Any]:
        try:
            cleaned = raw.strip()
            if cleaned.startswith("```"):
                cleaned = re.sub(r"```\w*\n?", "", cleaned).strip()
            return json.loads(cleaned)  # type: ignore[no-any-return]
        except (json.JSONDecodeError, ValueError):
            return {"title": "Quete urbaine", "description": raw[:200]}
