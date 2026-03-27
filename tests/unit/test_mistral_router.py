"""Unit tests for MistralRouter — Large vs Small routing."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.mistral_router import (
    MistralRouter,
    MistralTaskType,
)


def _make_redis() -> MagicMock:
    redis = MagicMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock()
    return redis


def _make_router() -> MistralRouter:
    return MistralRouter(redis=_make_redis())


def _make_client(content: str = "ok") -> MagicMock:
    choice = MagicMock()
    choice.message.content = content
    usage = MagicMock()
    usage.prompt_tokens = 100
    usage.completion_tokens = 50
    response = MagicMock()
    response.choices = [choice]
    response.usage = usage
    client = MagicMock()
    client.chat.complete_async = AsyncMock(return_value=response)
    return client


class TestRouting:
    def test_sentiment_routes_to_small(self) -> None:
        router = _make_router()
        model = router.get_model(MistralTaskType.SENTIMENT_ANALYSIS)
        assert model == "mistral-small-latest"

    def test_recommendation_routes_to_large(self) -> None:
        router = _make_router()
        model = router.get_model(MistralTaskType.RECOMMENDATION)
        assert model == "mistral-large-latest"

    def test_chat_agent_routes_to_large(self) -> None:
        router = _make_router()
        model = router.get_model(MistralTaskType.CHAT_AGENT)
        assert model == "mistral-large-latest"

    def test_sms_routes_to_small(self) -> None:
        router = _make_router()
        model = router.get_model(MistralTaskType.MERCHANT_SMS)
        assert model == "mistral-small-latest"

    def test_quest_generation_routes_to_large(self) -> None:
        router = _make_router()
        model = router.get_model(MistralTaskType.QUEST_GENERATION)
        assert model == "mistral-large-latest"


class TestComplete:
    @pytest.mark.asyncio
    async def test_complete_returns_text_and_model(self) -> None:
        router = _make_router()
        client = _make_client("result text")
        text, model = await router.complete(
            MistralTaskType.SENTIMENT_ANALYSIS,
            [{"role": "user", "content": "hello"}],
            client=client,
        )
        assert text == "result text"
        assert model == "mistral-small-latest"

    @pytest.mark.asyncio
    async def test_small_timeout_fallback_to_large(self) -> None:

        router = _make_router()
        client = _make_client("fallback result")
        call_count = 0
        original_fn = client.chat.complete_async

        async def side_effect(**kwargs: object) -> object:
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise TimeoutError
            return await original_fn(**kwargs)

        client.chat.complete_async = AsyncMock(side_effect=side_effect)
        _text, model = await router.complete(
            MistralTaskType.SENTIMENT_ANALYSIS,
            [{"role": "user", "content": "test"}],
            client=client,
        )
        assert model == "mistral-large-latest"


class TestCostTracking:
    @pytest.mark.asyncio
    async def test_cost_tracked_per_model(self) -> None:
        redis = _make_redis()
        router = MistralRouter(redis=redis)
        await router._track_usage("mistral-small-latest", 1000, 500)
        redis.set.assert_called_once()

    def test_small_cheaper_than_large(self) -> None:
        from app.services.mistral_router import MODEL_COSTS
        small_in, small_out = MODEL_COSTS["mistral-small-latest"]
        large_in, large_out = MODEL_COSTS["mistral-large-latest"]
        assert small_in < large_in
        assert small_out < large_out

    def test_estimate_savings_with_routing(self) -> None:
        savings = MistralRouter.estimate_savings(large_calls=100, small_calls=900)
        assert savings > 0
