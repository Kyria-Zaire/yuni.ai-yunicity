"""Unit tests for LeaderboardService (YAI-035)."""

from __future__ import annotations

import json

import pytest

from app.services.leaderboard_service import (
    LeaderboardService,
    generate_pseudonym,
)


class _FakeGamification:
    async def get_profile(self, user_id_hash: str) -> object:
        from app.models.gamification import CitizenLevel, UserXPProfile
        return UserXPProfile(
            user_id_hash=user_id_hash,
            total_xp=100,
            level=CitizenLevel.HABITANT,
            badges=["first_chat"],
        )


class _FakeRedis:
    def __init__(self) -> None:
        self._store: dict[str, str] = {}

    async def get(self, key: str) -> str | None:
        return self._store.get(key)

    async def set(self, key: str, value: str, ttl_seconds: int = 0) -> None:
        self._store[key] = value


def test_pseudonym_is_deterministic() -> None:
    p1 = generate_pseudonym("abc123", "reims")
    p2 = generate_pseudonym("abc123", "reims")
    assert p1 == p2


def test_pseudonym_never_contains_user_hash() -> None:
    user_hash = "abc123def456"
    pseudonym = generate_pseudonym(user_hash, "reims")
    assert user_hash not in pseudonym


def test_different_users_different_pseudonyms() -> None:
    p1 = generate_pseudonym("aaaa1111", "reims")
    p2 = generate_pseudonym("bbbb2222", "reims")
    assert p1 != p2


@pytest.mark.asyncio
async def test_leaderboard_returns_top_10() -> None:
    redis = _FakeRedis()
    entries = [{"hash": f"user{i:04d}", "xp": 1000 - i * 10} for i in range(15)]
    await redis.set("leaderboard:reims:week", json.dumps(entries))
    svc = LeaderboardService(redis, _FakeGamification())  # type: ignore[arg-type]
    board = await svc.get_leaderboard("reims", "week", "user0099")
    assert len(board.entries) <= 10


@pytest.mark.asyncio
async def test_current_user_marked_in_entries() -> None:
    redis = _FakeRedis()
    entries = [{"hash": "me", "xp": 500}, {"hash": "other", "xp": 300}]
    await redis.set("leaderboard:reims:week", json.dumps(entries))
    svc = LeaderboardService(redis, _FakeGamification())  # type: ignore[arg-type]
    board = await svc.get_leaderboard("reims", "week", "me")
    me_entries = [e for e in board.entries if e.is_current_user]
    assert len(me_entries) == 1


@pytest.mark.asyncio
async def test_current_user_rank_shown_even_outside_top_10() -> None:
    redis = _FakeRedis()
    svc = LeaderboardService(redis, _FakeGamification())  # type: ignore[arg-type]
    board = await svc.get_leaderboard("reims", "week", "nobody")
    assert board.current_user_rank is None


@pytest.mark.asyncio
async def test_leaderboard_sorted_by_xp_descending() -> None:
    redis = _FakeRedis()
    entries = [{"hash": "low", "xp": 50}, {"hash": "high", "xp": 999}]
    await redis.set("leaderboard:reims:month", json.dumps(entries))
    svc = LeaderboardService(redis, _FakeGamification())  # type: ignore[arg-type]
    board = await svc.get_leaderboard("reims", "month", "x")
    assert board.entries[0].total_xp >= board.entries[1].total_xp
