"""Unit tests for voice pipeline (YAI-029)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.chat import ChatMessage, ChatResponse
from app.models.voice import TTSResult
from app.services.voice_pipeline_service import AUDIO_BUFFER_MAX, VoicePipelineService


def _make_stt(text: str = "Bonjour Yuni") -> MagicMock:
    stt = MagicMock()
    stt.transcribe_command = AsyncMock(return_value=text)
    return stt


def _make_chat(response_text: str = "Bienvenue à Reims !") -> MagicMock:
    chat = MagicMock()
    chat.chat = AsyncMock(return_value=ChatResponse(
        session_id="00000000-0000-4000-8000-000000000000",
        message=ChatMessage(role="assistant", content=response_text),
        history_length=2,
        context_used=["territorial_context"],
    ))
    return chat


def _make_tts(audio: bytes = b"mp3-data") -> MagicMock:
    tts = MagicMock()
    tts.synthesize = AsyncMock(return_value=TTSResult(
        audio_data=audio,
        content_type="audio/mpeg",
        cached=False,
        char_count=20,
    ))
    return tts


def _make_memory() -> MagicMock:
    return MagicMock()


def _make_websocket() -> MagicMock:
    ws = MagicMock()
    ws.send_json = AsyncMock()
    return ws


@pytest.mark.asyncio
async def test_pipeline_sends_transcription_event() -> None:
    ws = _make_websocket()
    pipeline = VoicePipelineService()
    await pipeline.process_voice_turn(
        [b"\x00" * 200], "00000000-0000-4000-8000-000000000000",
        "a" * 64, "reims", ws, _make_stt(), _make_chat(), _make_tts(), _make_memory(),
    )
    calls = [c.args[0] for c in ws.send_json.call_args_list]
    types = [c["type"] for c in calls]
    assert "transcription" in types


@pytest.mark.asyncio
async def test_pipeline_sends_text_response_event() -> None:
    ws = _make_websocket()
    pipeline = VoicePipelineService()
    await pipeline.process_voice_turn(
        [b"\x00" * 200], "00000000-0000-4000-8000-000000000000",
        "a" * 64, "reims", ws, _make_stt(), _make_chat(), _make_tts(), _make_memory(),
    )
    calls = [c.args[0] for c in ws.send_json.call_args_list]
    types = [c["type"] for c in calls]
    assert "text_response" in types


@pytest.mark.asyncio
async def test_pipeline_sends_audio_response_event() -> None:
    ws = _make_websocket()
    pipeline = VoicePipelineService()
    await pipeline.process_voice_turn(
        [b"\x00" * 200], "00000000-0000-4000-8000-000000000000",
        "a" * 64, "reims", ws, _make_stt(), _make_chat(), _make_tts(), _make_memory(),
    )
    calls = [c.args[0] for c in ws.send_json.call_args_list]
    types = [c["type"] for c in calls]
    assert "audio_response" in types


@pytest.mark.asyncio
async def test_pipeline_sends_error_on_silence() -> None:
    ws = _make_websocket()
    stt = MagicMock()
    stt.transcribe_command = AsyncMock(side_effect=ValueError("Aucune voix détectée"))
    pipeline = VoicePipelineService()
    await pipeline.process_voice_turn(
        [b"\x00" * 200], "00000000-0000-4000-8000-000000000000",
        "a" * 64, "reims", ws, stt, _make_chat(), _make_tts(), _make_memory(),
    )
    calls = [c.args[0] for c in ws.send_json.call_args_list]
    error_msgs = [c for c in calls if c["type"] == "error"]
    assert len(error_msgs) == 1
    assert error_msgs[0]["code"] == "VOICE_ERROR"


@pytest.mark.asyncio
async def test_pipeline_sends_error_on_exception() -> None:
    ws = _make_websocket()
    stt = MagicMock()
    stt.transcribe_command = AsyncMock(side_effect=RuntimeError("boom"))
    pipeline = VoicePipelineService()
    await pipeline.process_voice_turn(
        [b"\x00" * 200], "00000000-0000-4000-8000-000000000000",
        "a" * 64, "reims", ws, stt, _make_chat(), _make_tts(), _make_memory(),
    )
    calls = [c.args[0] for c in ws.send_json.call_args_list]
    error_msgs = [c for c in calls if c["type"] == "error"]
    assert len(error_msgs) == 1
    assert error_msgs[0]["code"] == "INTERNAL_ERROR"


@pytest.mark.asyncio
async def test_pipeline_assembles_chunks() -> None:
    ws = _make_websocket()
    stt = _make_stt()
    pipeline = VoicePipelineService()
    chunks = [b"chunk1", b"chunk2", b"chunk3"]
    await pipeline.process_voice_turn(
        chunks, "00000000-0000-4000-8000-000000000000",
        "a" * 64, "reims", ws, stt, _make_chat(), _make_tts(), _make_memory(),
    )
    stt.transcribe_command.assert_called_once()
    call_audio = stt.transcribe_command.call_args.args[0]
    assert call_audio == b"chunk1chunk2chunk3"


def test_audio_buffer_max_limit() -> None:
    assert AUDIO_BUFFER_MAX == 10


@pytest.mark.asyncio
async def test_pipeline_full_message_flow() -> None:
    ws = _make_websocket()
    pipeline = VoicePipelineService()
    await pipeline.process_voice_turn(
        [b"\x00" * 200], "00000000-0000-4000-8000-000000000000",
        "a" * 64, "reims", ws, _make_stt(), _make_chat(), _make_tts(), _make_memory(),
    )
    calls = [c.args[0] for c in ws.send_json.call_args_list]
    types = [c["type"] for c in calls]
    assert types == ["thinking", "transcription", "text_response", "audio_response"]
