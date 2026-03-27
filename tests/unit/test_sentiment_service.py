"""Unit tests for SentimentService (YAI-037)."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.sentiment_service import SentimentService

MOCK_SENTIMENT_JSON = json.dumps({
    "mood_score": 72,
    "sentiment": "positif",
    "top_topics": ["securite", "proprete", "evenements"],
    "summary": "Ambiance globalement positive",
})


def _make_mistral(content: str = MOCK_SENTIMENT_JSON) -> MagicMock:
    client = MagicMock()
    choice = MagicMock()
    choice.message.content = content
    response = MagicMock()
    response.choices = [choice]
    client.chat.complete_async = AsyncMock(return_value=response)
    return client


class _FakeRedis:
    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def set(self, key: str, value: str, ttl_seconds: int = 0) -> None:
        self._store[key] = value


@pytest.mark.asyncio
async def test_analyze_empty_posts_returns_neutral_50() -> None:
    svc = SentimentService(_make_mistral(), _FakeRedis())
    result = await svc.analyze_zone("reims", "centre", [])
    assert result.mood_score == 50
    assert result.sentiment.value == "neutre"


@pytest.mark.asyncio
async def test_analyze_returns_score_between_0_and_100() -> None:
    svc = SentimentService(_make_mistral(), _FakeRedis())
    result = await svc.analyze_zone("reims", "centre", ["Super quartier"])
    assert 0 <= result.mood_score <= 100


def test_anonymize_removes_email() -> None:
    text = "Contactez moi a jean@example.com svp"
    cleaned = SentimentService._anonymize_post(text)
    assert "jean@example.com" not in cleaned
    assert "[email]" in cleaned


def test_anonymize_removes_phone() -> None:
    text = "Mon numero 06 12 34 56 78 merci"
    cleaned = SentimentService._anonymize_post(text)
    assert "06 12 34 56 78" not in cleaned
    assert "[tel]" in cleaned


def test_anonymize_removes_precise_address() -> None:
    text = "Probleme au 12 rue Voltaire"
    cleaned = SentimentService._anonymize_post(text)
    assert "12 rue Voltaire" not in cleaned


@pytest.mark.asyncio
async def test_compute_trend_improving_when_score_increases() -> None:
    trend = SentimentService._compute_trend(80, 50)
    assert trend == "improving"


@pytest.mark.asyncio
async def test_compute_trend_degrading_when_score_drops() -> None:
    trend = SentimentService._compute_trend(30, 70)
    assert trend == "degrading"


@pytest.mark.asyncio
async def test_sentiment_cached_7_days() -> None:
    redis = _FakeRedis()
    svc = SentimentService(_make_mistral(), redis)
    await svc.analyze_zone("reims", "centre", ["Beau quartier"])
    cached = await svc.get_cached("reims", "centre")
    assert cached is not None
    assert cached.city == "reims"


@pytest.mark.asyncio
async def test_posts_limited_to_50_max() -> None:
    redis = _FakeRedis()
    svc = SentimentService(_make_mistral(), redis)
    posts = [f"Post {i}" for i in range(100)]
    result = await svc.analyze_zone("reims", "centre", posts)
    assert result.sample_count == 50
