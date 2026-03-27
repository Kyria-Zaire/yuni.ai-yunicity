"""Unit tests for GamificationService (YAI-033)."""

from __future__ import annotations

import hashlib

import pytest

from app.models.gamification import (
    XP_VALUES,
    CitizenLevel,
    XPAction,
)
from app.services.gamification_service import GamificationService, _xp_key


class _FakeRedis:
    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def set(self, key: str, value: str, ttl_seconds: int = 0) -> None:
        self._store[key] = value


def _svc() -> tuple[GamificationService, _FakeRedis]:
    redis = _FakeRedis()
    return GamificationService(redis), redis  # type: ignore[arg-type]


@pytest.mark.asyncio
async def test_award_xp_increases_total() -> None:
    svc, _ = _svc()
    event = await svc.award_xp("user1", XPAction.CHAT_MESSAGE, "reims")
    assert event.new_total >= XP_VALUES[XPAction.CHAT_MESSAGE]


@pytest.mark.asyncio
async def test_award_xp_returns_correct_xp_earned() -> None:
    svc, _ = _svc()
    event = await svc.award_xp("user1", XPAction.CITIZEN_REPORT, "reims")
    assert event.xp_earned == XP_VALUES[XPAction.CITIZEN_REPORT]


@pytest.mark.asyncio
async def test_level_visiteur_under_100_xp() -> None:
    svc, _ = _svc()
    assert svc._compute_level(50) == CitizenLevel.VISITEUR


@pytest.mark.asyncio
async def test_level_habitant_at_100_xp() -> None:
    svc, _ = _svc()
    assert svc._compute_level(100) == CitizenLevel.HABITANT


@pytest.mark.asyncio
async def test_level_ambassadeur_at_5000_xp() -> None:
    svc, _ = _svc()
    assert svc._compute_level(5000) == CitizenLevel.AMBASSADEUR


@pytest.mark.asyncio
async def test_badge_first_recommendation_unlocked() -> None:
    svc, _ = _svc()
    event = await svc.award_xp("user1", XPAction.RECOMMENDATION_USED, "reims")
    assert "first_recommendation" in event.badges_unlocked


@pytest.mark.asyncio
async def test_badge_voice_pioneer_unlocked() -> None:
    svc, _ = _svc()
    event = await svc.award_xp("user1", XPAction.VOICE_COMMAND, "reims")
    assert "voice_pioneer" in event.badges_unlocked


@pytest.mark.asyncio
async def test_badge_not_awarded_twice() -> None:
    svc, _ = _svc()
    await svc.award_xp("user1", XPAction.VOICE_COMMAND, "reims")
    event2 = await svc.award_xp("user1", XPAction.VOICE_COMMAND, "reims")
    assert "voice_pioneer" not in event2.badges_unlocked


@pytest.mark.asyncio
async def test_xp_history_rolling_10() -> None:
    svc, _ = _svc()
    for _ in range(15):
        await svc.award_xp("user1", XPAction.CHAT_MESSAGE, "reims")
    profile = await svc.get_profile("user1")
    assert len(profile.xp_history) == 10


def test_xp_key_is_anonymous() -> None:
    key = _xp_key("abc123")
    assert "abc123" not in key
    expected_prefix = "xp:v1:"
    assert key.startswith(expected_prefix)
    hash_part = key[len(expected_prefix):]
    assert hash_part == hashlib.sha256(b"abc123").hexdigest()[:16]


@pytest.mark.asyncio
async def test_award_xp_fire_and_forget_doesnt_block() -> None:
    svc, _ = _svc()
    event = await svc.award_xp("user1", XPAction.DAILY_LOGIN, "reims")
    assert event.xp_earned == XP_VALUES[XPAction.DAILY_LOGIN]


@pytest.mark.asyncio
async def test_gamification_failure_doesnt_break_main_flow() -> None:
    try:
        svc, _ = _svc()
        await svc.award_xp("user1", XPAction.CHAT_MESSAGE, "reims")
    except Exception:
        pytest.fail("Gamification should never raise to caller")
