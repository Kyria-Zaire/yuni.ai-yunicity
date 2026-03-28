"""Voice endpoints — STT, TTS, and WebSocket pipeline."""

from __future__ import annotations

import asyncio
import base64
import time
from typing import Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
    WebSocket,
)
from fastapi.responses import StreamingResponse
from starlette.websockets import WebSocketDisconnect

from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.models.voice import STTRequest, STTResponse, TTSSynthesizeRequest
from app.services.chat_memory_service import ChatMemoryService
from app.services.chat_service import ChatService
from app.services.redis_service import get_redis_service
from app.services.stt_service import SUPPORTED_FORMATS, STTService
from app.services.tts_service import TTSService
from app.services.voice_pipeline_service import AUDIO_BUFFER_MAX, VoicePipelineService

logger = get_logger("voice_router")

router = APIRouter(tags=["voice"])


def _websocket_origin_allowed(origin: str | None, settings: Any) -> bool:
    """Clients sans Origin (natifs) ; sinon aligné sur CORS + assouplissement dev."""
    if not origin:
        return True
    if origin in settings.cors_origins_list:
        return True
    if settings.is_dev:
        if origin.startswith(("http://localhost:", "http://127.0.0.1:")):
            return True
        if origin.startswith("exp://"):
            return True
    return False


def _get_stt_service(request: Request) -> STTService:
    svc: STTService = request.app.state.stt_service
    return svc


def _get_tts_service(request: Request) -> TTSService:
    svc: TTSService = request.app.state.tts_service
    return svc


@router.post(
    "/v1/voice/transcribe",
    response_model=STTResponse,
    summary="Transcrire un fichier audio en texte (Whisper)",
    responses={
        200: {"description": "Texte transcrit"},
        401: {"description": "JWT manquant"},
        422: {"description": "Format audio non supporté"},
    },
)
async def transcribe_audio(
    request: Request,
    audio: UploadFile = File(...),
    metadata: str = Form(...),
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> STTResponse:
    start = time.perf_counter()

    stt_request = STTRequest.model_validate_json(metadata)

    content_type = audio.content_type or "application/octet-stream"
    if content_type not in SUPPORTED_FORMATS:
        raise HTTPException(status_code=422, detail="Format audio non supporté")

    audio_data = await audio.read()
    stt_svc = _get_stt_service(request)

    result = await stt_svc.transcribe(
        audio_data, content_type, stt_request.language,
    )

    processing_ms = int((time.perf_counter() - start) * 1000)

    logger.info(
        "stt_transcription",
        language=result.language,
        confidence=result.confidence,
        context=stt_request.context,
        processing_ms=processing_ms,
    )

    return STTResponse(
        text=result.text,
        language=result.language,
        confidence=result.confidence,
        context=stt_request.context,
        processing_ms=processing_ms,
    )


@router.post(
    "/v1/voice/synthesize",
    summary="Synthétiser du texte en audio (Polly)",
    responses={200: {"content": {"audio/mpeg": {}}}},
)
async def synthesize_speech(
    request: Request,
    body: TTSSynthesizeRequest,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> StreamingResponse:
    tts_svc = _get_tts_service(request)
    result = await tts_svc.synthesize(body.text, body.voice_id)

    return StreamingResponse(
        iter([result.audio_data]),
        media_type="audio/mpeg",
        headers={
            "X-Cache": "HIT" if result.cached else "MISS",
            "X-Char-Count": str(result.char_count),
            "Content-Disposition": "inline; filename=yuni_response.mp3",
        },
    )


@router.websocket("/ws/voice/{session_id}")
async def voice_websocket(
    websocket: WebSocket,
    session_id: str,
    token: str = Query(...),
    city: str = Query(default="reims"),
) -> None:
    from app.core.config import get_settings
    from app.core.exceptions import AuthenticationError

    settings = get_settings()
    try:
        payload = _verify_jwt_from_token(token, settings)
        user_id_hash: str = payload.get("sub", "")
    except AuthenticationError:
        await websocket.close(code=4001, reason="Unauthorized")
        return

    origin = websocket.headers.get("origin")
    if not _websocket_origin_allowed(origin, settings):
        await websocket.close(code=4403, reason="Origin not allowed")
        return

    await websocket.accept()
    audio_buffer: list[bytes] = []

    stt_svc: STTService = websocket.app.state.stt_service
    tts_svc: TTSService = websocket.app.state.tts_service
    mistral_client = websocket.app.state.mistral_client
    redis = get_redis_service()
    memory = ChatMemoryService(redis)
    chat_svc = ChatService(mistral_client)
    pipeline = VoicePipelineService()

    try:
        while True:
            data: dict[str, Any] = await asyncio.wait_for(
                websocket.receive_json(), timeout=60.0,
            )
            msg_type = data.get("type")

            if msg_type == "audio_chunk":
                chunk_b64 = data.get("data", "")
                if len(audio_buffer) < AUDIO_BUFFER_MAX:
                    audio_buffer.append(base64.b64decode(chunk_b64))

            elif msg_type == "audio_end":
                if audio_buffer:
                    await pipeline.process_voice_turn(
                        audio_buffer, session_id, user_id_hash, city,
                        websocket, stt_svc, chat_svc, tts_svc, memory,
                    )
                    audio_buffer = []

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

    except TimeoutError:
        await websocket.close(code=4000, reason="Timeout")
    except WebSocketDisconnect:
        logger.info("voice_websocket_disconnected", session=session_id[:8])
    finally:
        audio_buffer.clear()


def _verify_jwt_from_token(token: str, settings: Any) -> dict[str, Any]:
    """Validate a raw JWT string (for WebSocket query-param auth)."""
    import jwt as pyjwt

    from app.core.exceptions import AuthenticationError

    if not settings.JWT_PUBLIC_KEY:
        if settings.is_dev:
            return {"sub": "dev-user", "env": "dev"}
        raise AuthenticationError("JWT public key not configured")

    try:
        payload: dict[str, Any] = pyjwt.decode(
            token, settings.JWT_PUBLIC_KEY, algorithms=["RS256"],
            options={"verify_exp": True},
        )
    except pyjwt.ExpiredSignatureError as exc:
        raise AuthenticationError("Token expiré") from exc
    except pyjwt.InvalidTokenError as exc:
        raise AuthenticationError("Token invalide") from exc

    return payload
