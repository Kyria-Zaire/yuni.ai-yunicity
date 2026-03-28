"""Unit tests for RecommendationService (YAI-008)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.recommendation_service import RecommendationService
from tests.fixtures.recommend_fixtures import (
    make_map_data,
    make_passport,
    make_recommendation_output,
    make_user_input,
)


def _make_mocks() -> tuple[MagicMock, MagicMock, MagicMock]:
    redis = MagicMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock(return_value=True)

    mistral = MagicMock()
    mistral.recommend = AsyncMock(
        return_value=(make_recommendation_output("yuni_ai_mistral"), "mistral")
    )

    yunicity = MagicMock()
    yunicity.get_user_passport = AsyncMock(return_value=make_passport())
    yunicity.get_map_data = AsyncMock(return_value=make_map_data())

    return redis, mistral, yunicity


class TestCacheHit:
    @pytest.mark.asyncio
    async def test_cache_hit_returns_cached_data_without_calling_mistral(self) -> None:
        redis, mistral, yunicity = _make_mocks()
        cached_output = make_recommendation_output("yuni_ai_cache")
        redis.get = AsyncMock(return_value=cached_output.model_dump_json())

        svc = RecommendationService(redis=redis, mistral=mistral, yunicity=yunicity)
        _, source = await svc.get_recommendations(make_user_input())

        assert source == "yuni_ai_cache"
        mistral.recommend.assert_not_called()
        yunicity.get_user_passport.assert_not_called()

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_source_is_yuni_ai_cache_on_hit(self) -> None:
        redis, mistral, yunicity = _make_mocks()
        cached_output = make_recommendation_output("yuni_ai_cache")
        redis.get = AsyncMock(return_value=cached_output.model_dump_json())

        svc = RecommendationService(redis=redis, mistral=mistral, yunicity=yunicity)
        _, source = await svc.get_recommendations(make_user_input())
        assert source == "yuni_ai_cache"


class TestCacheMiss:
    @pytest.mark.asyncio
    async def test_cache_miss_calls_mistral_and_caches_result(self) -> None:
        redis, mistral, yunicity = _make_mocks()
        svc = RecommendationService(redis=redis, mistral=mistral, yunicity=yunicity)
        _, source = await svc.get_recommendations(make_user_input())

        assert source == "yuni_ai_mistral"
        mistral.recommend.assert_called_once()
        redis.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_cache_miss_stores_result_with_correct_ttl(self) -> None:
        redis, mistral, yunicity = _make_mocks()
        svc = RecommendationService(redis=redis, mistral=mistral, yunicity=yunicity)
        await svc.get_recommendations(make_user_input())

        from app.core.config import CacheTTL
        call_args = redis.set.call_args
        assert call_args.kwargs.get("ttl_seconds") == CacheTTL.RECOMMENDATIONS or \
            call_args[0][2] == CacheTTL.RECOMMENDATIONS if len(call_args[0]) > 2 else \
            call_args.kwargs.get("ttl_seconds") == CacheTTL.RECOMMENDATIONS

    @pytest.mark.asyncio
    async def test_parallel_yunicity_calls_with_asyncio_gather(self) -> None:
        redis, mistral, yunicity = _make_mocks()
        svc = RecommendationService(redis=redis, mistral=mistral, yunicity=yunicity)
        await svc.get_recommendations(make_user_input())

        yunicity.get_user_passport.assert_called_once()
        yunicity.get_map_data.assert_called_once()

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_source_is_yuni_ai_mistral_on_miss_mistral_ok(self) -> None:
        redis, mistral, yunicity = _make_mocks()
        svc = RecommendationService(redis=redis, mistral=mistral, yunicity=yunicity)
        _, source = await svc.get_recommendations(make_user_input())
        assert source == "yuni_ai_mistral"

    @pytest.mark.asyncio
    @pytest.mark.asyncio
    async def test_source_is_yuni_ai_fallback_on_miss_mistral_ko(self) -> None:
        redis, mistral, yunicity = _make_mocks()
        mistral.recommend = AsyncMock(
            return_value=(make_recommendation_output("yuni_ai_fallback"), "fallback")
        )
        svc = RecommendationService(redis=redis, mistral=mistral, yunicity=yunicity)
        _, source = await svc.get_recommendations(make_user_input())
        assert source == "yuni_ai_fallback"


class TestCacheKeyBehavior:
    @pytest.mark.asyncio
    async def test_cache_key_same_for_same_input(self) -> None:
        u1 = make_user_input()
        u2 = make_user_input()
        assert u1.cache_key == u2.cache_key

    @pytest.mark.asyncio
    async def test_cache_key_different_for_different_city(self) -> None:
        u1 = make_user_input(city="reims")
        u2 = make_user_input(city="paris")
        assert u1.cache_key != u2.cache_key

    @pytest.mark.asyncio
    async def test_cache_key_different_for_different_points_bucket(self) -> None:
        u1 = make_user_input(points=100)
        u2 = make_user_input(points=200)
        assert u1.cache_key != u2.cache_key
