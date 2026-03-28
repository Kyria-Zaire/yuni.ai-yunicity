"""Unit tests for AgentService (ReAct pattern)."""

from __future__ import annotations

import json
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.agent_service import (
    MAX_ITERATIONS,
    AgentService,
    should_use_agent,
)


def _make_choice(content: str, tool_calls: list | None = None) -> SimpleNamespace:
    msg = SimpleNamespace(content=content, tool_calls=tool_calls)
    return SimpleNamespace(choices=[SimpleNamespace(message=msg)])


def _make_tool_call(name: str, args: dict, call_id: str = "tc1") -> SimpleNamespace:
    func = SimpleNamespace(name=name, arguments=json.dumps(args))
    tc = SimpleNamespace(id=call_id, function=func)
    tc.model_dump = lambda: {
        "id": call_id,
        "function": {"name": name, "arguments": json.dumps(args)},
    }
    return tc


@pytest.fixture
def agent() -> tuple[AgentService, AsyncMock, AsyncMock]:
    client = AsyncMock()
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=None)
    semantic = AsyncMock()
    svc = AgentService(client, redis, semantic)
    return svc, client, semantic


@pytest.mark.asyncio
async def test_agent_returns_final_answer_without_tool(
    agent: tuple[AgentService, AsyncMock, AsyncMock],
) -> None:
    svc, client, _ = agent
    client.chat.complete_async = AsyncMock(
        return_value=_make_choice("Voici la reponse"),
    )
    answer, actions = await svc.run("Bonjour", "reims", [])
    assert answer == "Voici la reponse"
    assert actions == []


@pytest.mark.asyncio
async def test_agent_calls_search_tool(
    agent: tuple[AgentService, AsyncMock, AsyncMock],
) -> None:
    svc, client, semantic = agent
    tc = _make_tool_call("search_local_actors", {"query": "sport", "city": "reims"})

    call1 = _make_choice("", tool_calls=[tc])
    call2 = _make_choice("Voici les resultats")

    client.chat.complete_async = AsyncMock(side_effect=[call1, call2])
    mock_result = MagicMock()
    mock_result.model_dump.return_value = {"actor_id": "a1", "name": "Club"}
    semantic.search_actors = AsyncMock(return_value=[mock_result])

    answer, actions = await svc.run("trouve sport", "reims", [])
    assert "resultats" in answer
    assert len(actions) == 1
    assert actions[0]["tool"] == "search_local_actors"


@pytest.mark.asyncio
async def test_agent_calls_vitality_tool(
    agent: tuple[AgentService, AsyncMock, AsyncMock],
) -> None:
    svc, client, _ = agent
    tc = _make_tool_call("get_vitality_score", {"city": "reims", "zone": "centre"})

    svc._redis.get = AsyncMock(return_value=json.dumps({
        "score": 75.0, "grade": "B", "trend": "up",
    }))

    call1 = _make_choice("", tool_calls=[tc])
    call2 = _make_choice("Score centre 75")
    client.chat.complete_async = AsyncMock(side_effect=[call1, call2])

    _answer, actions = await svc.run("score centre", "reims", [])
    assert len(actions) == 1
    assert actions[0]["tool"] == "get_vitality_score"


@pytest.mark.asyncio
async def test_agent_stops_after_max_iterations(
    agent: tuple[AgentService, AsyncMock, AsyncMock],
) -> None:
    svc, client, semantic = agent
    tc = _make_tool_call("search_local_actors", {"query": "x", "city": "reims"})
    response = _make_choice("", tool_calls=[tc])
    client.chat.complete_async = AsyncMock(return_value=response)

    mock_r = MagicMock()
    mock_r.model_dump.return_value = {}
    semantic.search_actors = AsyncMock(return_value=[mock_r])

    answer, actions = await svc.run("loop", "reims", [])
    assert "reformuler" in answer.lower()
    assert len(actions) == MAX_ITERATIONS


@pytest.mark.asyncio
async def test_agent_returns_fallback_on_max_iterations(
    agent: tuple[AgentService, AsyncMock, AsyncMock],
) -> None:
    svc, client, semantic = agent
    tc = _make_tool_call("search_local_actors", {"query": "x", "city": "reims"})
    client.chat.complete_async = AsyncMock(
        return_value=_make_choice("", tool_calls=[tc]),
    )
    mock_r = MagicMock()
    mock_r.model_dump.return_value = {}
    semantic.search_actors = AsyncMock(return_value=[mock_r])

    answer, _ = await svc.run("loop", "reims", [])
    assert "reformuler" in answer.lower()


@pytest.mark.asyncio
async def test_execute_tool_search_actors(
    agent: tuple[AgentService, AsyncMock, AsyncMock],
) -> None:
    svc, _, semantic = agent
    mock_r = MagicMock()
    mock_r.model_dump.return_value = {"name": "Club"}
    semantic.search_actors = AsyncMock(return_value=[mock_r])

    result = await svc._execute_tool(
        "search_local_actors", {"query": "sport", "city": "reims"}, "reims",
    )
    assert "actors" in result


@pytest.mark.asyncio
async def test_execute_tool_vitality_uses_cache(
    agent: tuple[AgentService, AsyncMock, AsyncMock],
) -> None:
    svc, _, _ = agent
    svc._redis.get = AsyncMock(return_value=json.dumps({
        "score": 80, "grade": "A", "trend": "up",
    }))
    result = await svc._execute_tool(
        "get_vitality_score", {"city": "reims", "zone": "centre"}, "reims",
    )
    assert result["score"] == 80


@pytest.mark.asyncio
async def test_execute_tool_unknown_returns_error(
    agent: tuple[AgentService, AsyncMock, AsyncMock],
) -> None:
    svc, _, _ = agent
    result = await svc._execute_tool("fake_tool", {}, "reims")
    assert "error" in result


def test_should_use_agent_detects_keywords() -> None:
    assert should_use_agent("Trouve moi un club de sport") is True
    assert should_use_agent("quel est le score") is True
    assert should_use_agent("bonjour") is False
