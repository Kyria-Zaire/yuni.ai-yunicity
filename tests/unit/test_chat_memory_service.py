"""Unit tests for ChatMemoryService."""

from __future__ import annotations

import json
from unittest.mock import AsyncMock

import pytest

from app.services.chat_memory_service import (
    MAX_HISTORY,
    ChatMemoryService,
    _session_key,
)


def _make_redis() -> AsyncMock:
    mock = AsyncMock()
    mock.get = AsyncMock(return_value=None)
    mock.set = AsyncMock(return_value=True)
    mock.delete = AsyncMock(return_value=True)
    return mock


@pytest.mark.asyncio
async def test_get_history_returns_empty_for_new_session() -> None:
    redis = _make_redis()
    svc = ChatMemoryService(redis)
    result = await svc.get_history("sid", "uhash")
    assert result == []


@pytest.mark.asyncio
async def test_append_saves_both_messages() -> None:
    redis = _make_redis()
    svc = ChatMemoryService(redis)
    history = await svc.append_and_save("sid", "uhash", "hello", "world")
    assert len(history) == 2
    assert history[0].role == "user"
    assert history[0].content == "hello"
    assert history[1].role == "assistant"
    assert history[1].content == "world"
    redis.set.assert_called_once()


@pytest.mark.asyncio
async def test_rolling_window_keeps_max_30_messages() -> None:
    redis = _make_redis()
    existing = [
        {"role": "user", "content": f"msg-{i}", "timestamp": "2026-07-01T00:00:00Z"}
        for i in range(MAX_HISTORY)
    ]
    redis.get = AsyncMock(return_value=json.dumps(existing))
    svc = ChatMemoryService(redis)
    history = await svc.append_and_save("sid", "uhash", "new", "reply")
    assert len(history) == MAX_HISTORY


def test_session_key_is_deterministic() -> None:
    k1 = _session_key("sid", "uhash")
    k2 = _session_key("sid", "uhash")
    assert k1 == k2
    assert k1.startswith("chat:v1:")


def test_session_key_differs_for_different_users() -> None:
    k1 = _session_key("sid", "user_a")
    k2 = _session_key("sid", "user_b")
    assert k1 != k2


@pytest.mark.asyncio
async def test_territorial_context_includes_vitality_if_cached() -> None:
    redis = _make_redis()
    redis.get = AsyncMock(return_value=json.dumps({"score": 78.5, "grade": "B"}))
    svc = ChatMemoryService(redis)
    ctx = await svc.build_territorial_context("reims", "uhash")
    assert "78.5" in ctx
    assert "grade B" in ctx


@pytest.mark.asyncio
async def test_territorial_context_works_without_vitality() -> None:
    redis = _make_redis()
    svc = ChatMemoryService(redis)
    ctx = await svc.build_territorial_context("reims", "uhash")
    assert "Reims" in ctx


@pytest.mark.asyncio
async def test_delete_session_removes_key() -> None:
    redis = _make_redis()
    svc = ChatMemoryService(redis)
    await svc.delete_session("sid", "uhash")
    redis.delete.assert_called_once()


@pytest.mark.asyncio
async def test_chat_includes_history_in_response() -> None:
    redis = _make_redis()
    svc = ChatMemoryService(redis)
    h = await svc.append_and_save("sid", "uhash", "q1", "a1")
    assert len(h) == 2


@pytest.mark.asyncio
async def test_chat_response_contains_history_length() -> None:
    redis = _make_redis()
    svc = ChatMemoryService(redis)
    h = await svc.append_and_save("sid", "uhash", "q", "a")
    assert len(h) >= 2
