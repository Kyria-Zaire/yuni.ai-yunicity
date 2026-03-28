"""Unit tests for STT service (YAI-027)."""

from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.core.exceptions import ExternalAPIError
from app.models.voice import STTResult
from app.services.stt_service import (
    COMMAND_MAX_CHARS,
    MAX_SIZE_BYTES,
    SUPPORTED_FORMATS,
    STTService,
)


def _make_openai_client(text: str = "Bonjour", language: str = "fr") -> MagicMock:
    client = MagicMock()
    response = SimpleNamespace(
        text=text,
        language=language,
        segments=[],
        duration=1.5,
    )
    client.audio.transcriptions.create = AsyncMock(return_value=response)
    return client


@pytest.mark.asyncio
async def test_transcribe_returns_text_from_audio() -> None:
    client = _make_openai_client("Bonjour le monde")
    svc = STTService(client)
    result = await svc.transcribe(b"\x00" * 200, "audio/webm", "fr")
    assert result.text == "Bonjour le monde"
    assert isinstance(result, STTResult)


@pytest.mark.asyncio
async def test_transcribe_detects_language() -> None:
    client = _make_openai_client("Hello world", "en")
    svc = STTService(client)
    result = await svc.transcribe(b"\x00" * 200, "audio/mp3", "fr")
    assert result.language == "en"


@pytest.mark.asyncio
async def test_transcribe_returns_silent_for_empty_audio() -> None:
    client = _make_openai_client()
    svc = STTService(client)
    result = await svc.transcribe(b"\x00" * 50, "audio/webm", "fr")
    assert result.is_silent is True
    assert result.confidence == 0.0
    client.audio.transcriptions.create.assert_not_called()


@pytest.mark.asyncio
async def test_transcribe_rejects_unsupported_format() -> None:
    svc = STTService(MagicMock())
    with pytest.raises(ValueError, match="Format non supporté"):
        await svc.transcribe(b"\x00" * 200, "video/mp4", "fr")


@pytest.mark.asyncio
async def test_transcribe_rejects_oversized_file() -> None:
    svc = STTService(MagicMock())
    with pytest.raises(ValueError, match="trop grand"):
        await svc.transcribe(b"\x00" * (MAX_SIZE_BYTES + 1), "audio/webm", "fr")


@pytest.mark.asyncio
async def test_transcribe_timeout_raises_external_api_error() -> None:
    client = MagicMock()
    client.audio.transcriptions.create = AsyncMock(side_effect=TimeoutError())
    svc = STTService(client)
    with pytest.raises(ExternalAPIError):
        await svc.transcribe(b"\x00" * 200, "audio/webm", "fr")


@pytest.mark.asyncio
async def test_transcribe_command_rejects_long_text() -> None:
    long_text = "a" * (COMMAND_MAX_CHARS + 10)
    client = _make_openai_client(long_text)
    svc = STTService(client)
    with pytest.raises(ValueError, match="trop longue"):
        await svc.transcribe_command(b"\x00" * 200, "audio/webm")


@pytest.mark.asyncio
async def test_transcribe_command_rejects_silence() -> None:
    client = _make_openai_client("")
    svc = STTService(client)
    result_silent = await svc.transcribe(b"\x00" * 50, "audio/webm")
    assert result_silent.is_silent
    with pytest.raises(ValueError, match="voix détectée"):
        await svc.transcribe_command(b"\x00" * 50, "audio/webm")


def test_confidence_score_between_0_and_1() -> None:
    response = SimpleNamespace(
        segments=[
            SimpleNamespace(avg_logprob=-0.3),
            SimpleNamespace(avg_logprob=-0.5),
        ]
    )
    score = STTService._estimate_confidence(response)
    assert 0.0 <= score <= 1.0


def test_confidence_defaults_when_no_segments() -> None:
    response = SimpleNamespace(segments=[])
    score = STTService._estimate_confidence(response)
    assert score == 0.8


def test_supported_formats_cover_expected_types() -> None:
    assert "audio/webm" in SUPPORTED_FORMATS
    assert "audio/mp3" in SUPPORTED_FORMATS
    assert "audio/wav" in SUPPORTED_FORMATS
    assert "audio/ogg" in SUPPORTED_FORMATS
