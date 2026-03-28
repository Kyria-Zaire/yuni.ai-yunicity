"""Text-to-Speech service via Amazon Polly with Redis cache."""

from __future__ import annotations

import asyncio
import base64
import hashlib
import re
from typing import TYPE_CHECKING, Any

from app.core.logging import get_logger
from app.models.voice import TTSResult

if TYPE_CHECKING:
    from app.services.redis_service import RedisService

logger = get_logger("tts_service")

CACHE_TTL = 60 * 60 * 24 * 7  # 7 days
MAX_CHARS = 3000
SHORT_TEXT_THRESHOLD = 200


class TTSService:
    """Synthesises text to audio using Amazon Polly (neural engine)."""

    def __init__(
        self,
        polly_client: Any,
        redis: RedisService,
        voice_id: str = "Lea",
        cache_enabled: bool = True,
    ) -> None:
        self._polly = polly_client
        self._redis = redis
        self._voice_id = voice_id
        self._cache_enabled = cache_enabled

    async def synthesize(
        self,
        text: str,
        voice_id: str | None = None,
        use_cache: bool = True,
    ) -> TTSResult:
        clean_text = self._clean_text(text)
        if len(clean_text) > MAX_CHARS:
            clean_text = clean_text[:MAX_CHARS] + "..."

        chosen_voice = voice_id or self._voice_id

        if use_cache and self._cache_enabled:
            cache_key = self._cache_key(clean_text, chosen_voice)
            cached = await self._redis.get(cache_key)
            if cached:
                audio_bytes = base64.b64decode(cached)
                return TTSResult(
                    audio_data=audio_bytes,
                    content_type="audio/mpeg",
                    cached=True,
                    char_count=len(clean_text),
                )

        loop = asyncio.get_running_loop()
        audio_data: bytes = await loop.run_in_executor(
            None,
            self._polly_synthesize,
            clean_text,
            chosen_voice,
        )

        if use_cache and self._cache_enabled and len(clean_text) < SHORT_TEXT_THRESHOLD:
            cache_key = self._cache_key(clean_text, chosen_voice)
            await self._redis.set(
                cache_key,
                base64.b64encode(audio_data).decode(),
                ttl_seconds=CACHE_TTL,
            )

        return TTSResult(
            audio_data=audio_data,
            content_type="audio/mpeg",
            cached=False,
            char_count=len(clean_text),
        )

    def _polly_synthesize(self, text: str, voice_id: str) -> bytes:
        response = self._polly.synthesize_speech(
            Text=text,
            OutputFormat="mp3",
            VoiceId=voice_id,
            Engine="neural",
            LanguageCode="fr-FR",
        )
        return response["AudioStream"].read()  # type: ignore[no-any-return]

    @staticmethod
    def _clean_text(text: str) -> str:
        text = re.sub(r"\*\*?(.*?)\*\*?", r"\1", text)
        text = re.sub(r"#+ ", "", text)
        text = re.sub(r"https?://\S+", "lien disponible", text)
        text = re.sub(r"\n+", ". ", text)
        return text.strip()

    @staticmethod
    def _cache_key(text: str, voice_id: str) -> str:
        text_hash = hashlib.md5(text.encode()).hexdigest()[:12]  # noqa: S324
        return f"tts:v1:{voice_id}:{text_hash}"
