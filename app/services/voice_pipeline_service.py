"""Voice pipeline orchestration: Audio → STT → Chat/Agent → TTS → Audio."""

from __future__ import annotations

import base64
from typing import TYPE_CHECKING, Any

from app.core.logging import get_logger
from app.models.chat import ChatRequest

if TYPE_CHECKING:
    from starlette.websockets import WebSocket

    from app.services.chat_memory_service import ChatMemoryService
    from app.services.chat_service import ChatService
    from app.services.stt_service import STTService
    from app.services.tts_service import TTSService

logger = get_logger("voice_pipeline")

PIPELINE_TIMEOUT = 30.0
AUDIO_BUFFER_MAX = 10


class VoicePipelineService:
    """Orchestrates a single voice conversation turn over WebSocket."""

    async def process_voice_turn(
        self,
        audio_chunks: list[bytes],
        session_id: str,
        user_id_hash: str,
        city: str,
        websocket: WebSocket,
        stt: STTService,
        chat: ChatService,
        tts: TTSService,
        memory: ChatMemoryService,
    ) -> None:
        try:
            audio_data = b"".join(audio_chunks)

            await websocket.send_json({"type": "thinking"})
            text_input = await stt.transcribe_command(audio_data, "audio/webm")

            await websocket.send_json({
                "type": "transcription",
                "text": text_input,
            })

            chat_request = ChatRequest(
                session_id=session_id,
                user_id_hash=user_id_hash,
                city=city,
                message=text_input,
            )
            chat_response = await chat.chat(chat_request, memory)
            response_text: str = chat_response.message.content

            await websocket.send_json({
                "type": "text_response",
                "text": response_text,
            })

            tts_result = await tts.synthesize(response_text)
            audio_b64 = base64.b64encode(tts_result.audio_data).decode()

            await websocket.send_json({
                "type": "audio_response",
                "data": audio_b64,
                "mime": "audio/mpeg",
            })

        except ValueError as exc:
            await self._send_error(websocket, str(exc), "VOICE_ERROR")
        except Exception as exc:
            logger.error("voice_pipeline_error", error=str(exc))
            await self._send_error(
                websocket, "Désolé, une erreur est survenue.", "INTERNAL_ERROR",
            )

    @staticmethod
    async def _send_error(websocket: Any, message: str, code: str) -> None:
        await websocket.send_json({
            "type": "error",
            "message": message,
            "code": code,
        })
