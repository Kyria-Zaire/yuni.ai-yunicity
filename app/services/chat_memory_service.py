"""Chat session memory backed by Redis with territorial context injection."""

from __future__ import annotations

import hashlib
import json
from typing import TYPE_CHECKING

from app.core.logging import get_logger
from app.models.chat import ChatMessage

if TYPE_CHECKING:
    from app.services.redis_service import RedisService

logger = get_logger("chat_memory")

MAX_HISTORY = 30
SESSION_TTL = 60 * 60 * 24  # 24 hours

SYSTEM_PROMPT_TEMPLATE = """Tu es Yuni AI, l'assistant IA territorial de {city}.
Tu aides les citoyens a decouvrir leur ville, a s'engager localement
et a comprendre la vitalite de leur quartier.

Contexte territorial actuel :
{territorial_context}

Regles :
- Reponds en francais, avec bienveillance et precision
- Cite des acteurs/evenements locaux specifiques quand pertinent
- Si tu ne sais pas, dis-le honnetement
- Pas de reponse generique : toujours ancre dans {city}
- Respecte la vie privee : ne mentionne jamais d'autres utilisateurs"""


class ChatMemoryService:
    """Manages per-session chat history in Redis with user isolation."""

    def __init__(self, redis: RedisService) -> None:
        self._redis = redis

    async def get_history(
        self, session_id: str, user_id_hash: str,
    ) -> list[ChatMessage]:
        key = _session_key(session_id, user_id_hash)
        raw = await self._redis.get(key)
        if not raw:
            return []
        return [ChatMessage.model_validate(m) for m in json.loads(raw)]

    async def append_and_save(
        self,
        session_id: str,
        user_id_hash: str,
        user_message: str,
        assistant_message: str,
    ) -> list[ChatMessage]:
        history = await self.get_history(session_id, user_id_hash)
        history.append(ChatMessage(role="user", content=user_message))
        history.append(ChatMessage(role="assistant", content=assistant_message))
        if len(history) > MAX_HISTORY:
            history = history[-MAX_HISTORY:]
        key = _session_key(session_id, user_id_hash)
        await self._redis.set(
            key,
            json.dumps([m.model_dump(mode="json") for m in history]),
            ttl_seconds=SESSION_TTL,
        )
        return history

    async def build_territorial_context(
        self, city: str, user_id_hash: str,
    ) -> str:
        parts: list[str] = []
        vitality_key = f"vitality:v1:{city}:centre"
        cached = await self._redis.get(vitality_key)
        if cached:
            try:
                vdata = json.loads(cached)
                parts.append(
                    f"Vitalite {city.capitalize()} Centre : "
                    f"{vdata['score']}/100 (grade {vdata['grade']})"
                )
            except (json.JSONDecodeError, KeyError):
                pass
        parts.append(f"Ville : {city.capitalize()}")
        return "\n".join(parts)

    async def delete_session(
        self, session_id: str, user_id_hash: str,
    ) -> None:
        key = _session_key(session_id, user_id_hash)
        await self._redis.delete(key)


def _session_key(session_id: str, user_id_hash: str) -> str:
    combined = hashlib.sha256(
        f"{session_id}:{user_id_hash}".encode(),
    ).hexdigest()[:16]
    return f"chat:v1:{combined}"
