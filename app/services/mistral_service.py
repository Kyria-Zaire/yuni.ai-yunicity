"""Mistral AI service with retry, timeout, and business rules fallback."""

from __future__ import annotations

import json
import re
from typing import TYPE_CHECKING, Any

from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.core.logging import get_logger
from app.core.prompts import FALLBACK_TEMPLATES, SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
from app.models.recommend import (
    ActorRecommendation,
    EventRecommendation,
    RecommendationOutput,
    TribeRecommendation,
)

if TYPE_CHECKING:
    from app.core.config import Settings
    from app.models.recommend import UserInput
    from app.models.yunicity import MapData, UserPassport

logger = get_logger("mistral")

_INJECTION_PATTERNS = [
    re.compile(r"ignore (previous|above|all) instructions", re.IGNORECASE),
    re.compile(r"you are now", re.IGNORECASE),
    re.compile(r"act as", re.IGNORECASE),
    re.compile(r"jailbreak", re.IGNORECASE),
    re.compile(r"system\s*prompt", re.IGNORECASE),
]

_MAX_INPUT_LENGTH = 500
_MAX_DATA_ITEMS = 10


class MistralParseError(Exception):
    """Raised when Mistral response cannot be parsed."""


class MistralService:
    """Handles Mistral API calls with retry and fallback to business rules."""

    def __init__(self, settings: Settings) -> None:
        self._api_key = settings.MISTRAL_API_KEY.get_secret_value()
        self._model = "mistral-large-latest"
        self._timeout = 10.0
        self._client: Any = None

    def _get_client(self) -> Any:
        if self._client is None:
            from mistralai import Mistral
            self._client = Mistral(api_key=self._api_key)
        return self._client

    async def recommend(
        self,
        user: UserInput,
        local_data: MapData,
        passport: UserPassport,
    ) -> tuple[RecommendationOutput, str]:
        """Return (recommendations, source). Source is 'mistral' or 'fallback'."""
        try:
            prompt = self._build_prompt(user, local_data, passport)
            raw = await self._call_with_retry(prompt, user.city)
            output = self._parse_response(raw)
            return output, "mistral"
        except Exception as exc:
            logger.warning("mistral_failed_using_fallback", error=str(exc))
            output = self._business_rules_fallback(user, local_data)
            return output, "fallback"

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception_type(Exception),
        reraise=True,
    )
    async def _call_with_retry(self, user_prompt: str, city: str) -> str:
        import asyncio
        client = self._get_client()
        system = SYSTEM_PROMPT.format(city=city)
        coro = client.chat.complete_async(
            model=self._model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            response_format={"type": "json_object"},
        )
        response = await asyncio.wait_for(coro, timeout=self._timeout)
        content: str = response.choices[0].message.content
        return content

    def _build_prompt(
        self,
        user: UserInput,
        local_data: MapData,
        passport: UserPassport,
    ) -> str:
        actors = local_data.actors[:_MAX_DATA_ITEMS]
        tribes = local_data.tribes[:_MAX_DATA_ITEMS]
        events = local_data.events[:_MAX_DATA_ITEMS]

        actors_text = "\n".join(
            f"- {a.id}: {self._sanitize(a.name)} ({a.category})"
            f" — {self._sanitize(a.description[:80])}"
            for a in actors
        )
        tribes_text = "\n".join(
            f"- {t.id}: {self._sanitize(t.name)} ({t.category}) — {t.members_count} membres"
            for t in tribes
        )
        events_text = "\n".join(
            f"- {e.id}: {self._sanitize(e.title)} ({e.category}) le {e.date.strftime('%d/%m/%Y')}"
            for e in events
        )

        return USER_PROMPT_TEMPLATE.format(
            interests=", ".join(user.interests),
            points=user.points,
            level=passport.level,
            geo_zone=f"{user.geo.lat_truncated},{user.geo.lng_truncated}",
            actors_count=len(actors),
            actors_data=actors_text or "Aucun acteur",
            tribes_count=len(tribes),
            tribes_data=tribes_text or "Aucune tribu",
            events_count=len(events),
            events_data=events_text or "Aucun evenement",
        )

    @staticmethod
    def _sanitize(text: str) -> str:
        """Guard against prompt injection and enforce max length."""
        for pattern in _INJECTION_PATTERNS:
            if pattern.search(text):
                msg = "Input potentiellement malveillant detecte"
                raise ValueError(msg)
        cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f]", "", text)
        return cleaned[:_MAX_INPUT_LENGTH]

    @staticmethod
    def _parse_response(raw: str) -> RecommendationOutput:
        cleaned = raw.strip()
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
            cleaned = re.sub(r"\s*```$", "", cleaned)
        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError as exc:
            raise MistralParseError(f"Invalid JSON from Mistral: {exc}") from exc
        data["source"] = "yuni_ai_mistral"
        return RecommendationOutput.model_validate(data)

    @staticmethod
    def _business_rules_fallback(
        user: UserInput,
        local_data: MapData,
    ) -> RecommendationOutput:
        primary_interest = user.interests[0] if user.interests else "default"
        template = FALLBACK_TEMPLATES.get(primary_interest, FALLBACK_TEMPLATES["default"])
        raw_filter = template.get("actor_filter", [])
        actor_filter: list[str] = list(raw_filter) if isinstance(raw_filter, list) else []

        matched_actors = [
            a for a in local_data.actors
            if not actor_filter or a.category in actor_filter
        ][:3]
        fallback_actors = [
            ActorRecommendation(
                id=a.id, name=a.name, category=a.category,
                reason=f"Correspond a vos interets ({primary_interest})",
                score=0.7,
            )
            for a in matched_actors
        ]
        if not fallback_actors and local_data.actors:
            a = local_data.actors[0]
            fallback_actors = [ActorRecommendation(
                id=a.id, name=a.name, category=a.category,
                reason="Acteur populaire dans votre zone", score=0.5,
            )]

        fallback_tribes = [
            TribeRecommendation(
                id=f"tribe-fallback-{i}", name=f"Tribu {primary_interest}",
                category=primary_interest, members_count=50,
                reason="Tribu active dans votre zone", score=0.6,
            )
            for i in range(min(2, 1))
        ]

        sorted_events = sorted(local_data.events, key=lambda e: e.date)[:3]
        fallback_events = [
            EventRecommendation(
                id=e.id, title=e.title, actor_id=e.actor_id,
                date=e.date, category=e.category,
                reason="Evenement a venir dans votre zone",
            )
            for e in sorted_events
        ]

        return RecommendationOutput(
            actors=fallback_actors,
            tribes=fallback_tribes,
            events=fallback_events,
            reason=str(template.get("reason", "Recommandations locales")),
            source="yuni_ai_fallback",
        )
