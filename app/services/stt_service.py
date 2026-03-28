"""Speech-to-Text service via OpenAI Whisper API."""

from __future__ import annotations

import asyncio
from io import BytesIO
from typing import Any

from app.core.exceptions import ExternalAPIError
from app.core.logging import get_logger
from app.models.voice import STTResult

logger = get_logger("stt_service")


SUPPORTED_FORMATS = frozenset({
    "audio/webm",
    "audio/mp3",
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/m4a",
})

MAX_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB
MIN_SIZE_BYTES = 100
TRANSCRIBE_TIMEOUT = 15.0
COMMAND_MAX_CHARS = 500


class STTService:
    """Transcribes audio to text using OpenAI Whisper."""

    def __init__(self, openai_client: Any) -> None:
        self._client = openai_client
        self._model = "whisper-1"

    async def transcribe(
        self,
        audio_data: bytes,
        content_type: str,
        language: str = "fr",
    ) -> STTResult:
        if content_type not in SUPPORTED_FORMATS:
            msg = f"Format non supporté: {content_type}"
            raise ValueError(msg)
        if len(audio_data) > MAX_SIZE_BYTES:
            msg = "Fichier audio trop grand (max 25MB)"
            raise ValueError(msg)
        if len(audio_data) < MIN_SIZE_BYTES:
            return STTResult(text="", language="fr", confidence=0.0, is_silent=True)

        try:
            ext = content_type.split("/")[-1].replace("mpeg", "mp3")
            audio_file = BytesIO(audio_data)
            audio_file.name = f"audio.{ext}"

            response = await asyncio.wait_for(
                self._client.audio.transcriptions.create(
                    model=self._model,
                    file=audio_file,
                    language=language,
                    response_format="verbose_json",
                    temperature=0.0,
                ),
                timeout=TRANSCRIBE_TIMEOUT,
            )

            text: str = response.text.strip() if hasattr(response, "text") else ""
            detected_lang: str = getattr(response, "language", language) or language

            return STTResult(
                text=text,
                language=detected_lang,
                confidence=self._estimate_confidence(response),
                is_silent=len(text) == 0,
                duration_seconds=getattr(response, "duration", None),
            )
        except TimeoutError as exc:
            logger.warning("stt_timeout", size_bytes=len(audio_data))
            raise ExternalAPIError("whisper", "Transcription timeout — réessayez") from exc
        except (ValueError, ExternalAPIError):
            raise
        except Exception as exc:
            logger.error("stt_error", error=str(exc))
            raise ExternalAPIError("whisper", f"Transcription échouée: {exc}") from exc

    @staticmethod
    def _estimate_confidence(response: Any) -> float:
        segments: list[Any] = getattr(response, "segments", None) or []
        if not segments:
            return 0.8
        total = sum(
            getattr(s, "avg_logprob", -0.5)
            if hasattr(s, "avg_logprob")
            else s.get("avg_logprob", -0.5)
            for s in segments
        )
        avg_logprob = total / len(segments)
        return max(0.0, min(1.0, avg_logprob + 1.0))

    async def transcribe_command(
        self,
        audio_data: bytes,
        content_type: str,
    ) -> str:
        result = await self.transcribe(audio_data, content_type)
        if result.is_silent:
            msg = "Aucune voix détectée"
            raise ValueError(msg)
        if len(result.text) > COMMAND_MAX_CHARS:
            msg = "Commande trop longue"
            raise ValueError(msg)
        return result.text
