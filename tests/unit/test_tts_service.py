"""Unit tests for TTS service (YAI-028)."""

from __future__ import annotations

from io import BytesIO
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.tts_service import MAX_CHARS, SHORT_TEXT_THRESHOLD, TTSService


def _make_polly_client(audio: bytes = b"fake-mp3-data") -> MagicMock:
    client = MagicMock()
    stream = BytesIO(audio)
    client.synthesize_speech.return_value = {"AudioStream": stream}
    return client


def _make_redis() -> MagicMock:
    redis = MagicMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock(return_value=True)
    return redis


@pytest.mark.asyncio
async def test_synthesize_returns_audio_bytes() -> None:
    polly = _make_polly_client(b"audio-data")
    redis = _make_redis()
    svc = TTSService(polly, redis)
    result = await svc.synthesize("Bonjour")
    assert result.audio_data == b"audio-data"
    assert result.content_type == "audio/mpeg"
    assert result.cached is False


@pytest.mark.asyncio
async def test_synthesize_caches_short_responses() -> None:
    polly = _make_polly_client(b"audio")
    redis = _make_redis()
    svc = TTSService(polly, redis)
    short = "Bonjour"
    assert len(short) < SHORT_TEXT_THRESHOLD
    await svc.synthesize(short)
    redis.set.assert_called_once()


@pytest.mark.asyncio
async def test_synthesize_uses_cache_on_second_call() -> None:
    import base64
    polly = _make_polly_client(b"audio")
    redis = _make_redis()
    redis.get = AsyncMock(return_value=base64.b64encode(b"cached-audio").decode())
    svc = TTSService(polly, redis)
    result = await svc.synthesize("Bonjour")
    assert result.cached is True
    assert result.audio_data == b"cached-audio"
    polly.synthesize_speech.assert_not_called()


@pytest.mark.asyncio
async def test_synthesize_skips_cache_for_long_text() -> None:
    polly = _make_polly_client(b"audio")
    redis = _make_redis()
    svc = TTSService(polly, redis)
    long_text = "x" * (SHORT_TEXT_THRESHOLD + 10)
    await svc.synthesize(long_text)
    redis.set.assert_not_called()


def test_clean_text_removes_markdown() -> None:
    assert TTSService._clean_text("**bold** and *italic*") == "bold and italic"


def test_clean_text_replaces_urls() -> None:
    result = TTSService._clean_text("Voir https://example.com ici")
    assert "lien disponible" in result
    assert "https://" not in result


def test_clean_text_does_not_truncate() -> None:
    result = TTSService._clean_text("a" * (MAX_CHARS + 100))
    assert len(result) == MAX_CHARS + 100


def test_cache_key_is_deterministic() -> None:
    key1 = TTSService._cache_key("Bonjour", "Lea")
    key2 = TTSService._cache_key("Bonjour", "Lea")
    assert key1 == key2
    assert key1.startswith("tts:v1:Lea:")


@pytest.mark.asyncio
async def test_polly_called_with_neural_engine() -> None:
    polly = _make_polly_client(b"audio")
    redis = _make_redis()
    svc = TTSService(polly, redis, cache_enabled=False)
    await svc.synthesize("Bonjour")
    call_args = polly.synthesize_speech.call_args
    assert call_args.kwargs.get("Engine") == "neural" or call_args[1].get("Engine") == "neural"


@pytest.mark.asyncio
async def test_synthesize_disabled_cache() -> None:
    polly = _make_polly_client(b"audio")
    redis = _make_redis()
    svc = TTSService(polly, redis, cache_enabled=False)
    result = await svc.synthesize("Bonjour")
    redis.get.assert_not_called()
    redis.set.assert_not_called()
    assert result.cached is False
