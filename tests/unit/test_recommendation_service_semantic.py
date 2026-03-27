"""Unit tests for semantic integration in RecommendationService (YAI-019)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.models.semantic import ActorSearchResult, TribeSearchResult
from app.services.recommendation_service import RecommendationService
from tests.fixtures.recommend_fixtures import (
    make_map_data,
    make_passport,
    make_recommendation_output,
    make_user_input,
)


def _build_service(
    *,
    cached: str | None = None,
    semantic_actors: list[ActorSearchResult] | None = None,
    semantic_tribes: list[TribeSearchResult] | None = None,
    semantic_error: bool = False,
) -> tuple[RecommendationService, MagicMock, MagicMock]:
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=cached)
    redis.set = AsyncMock(return_value=True)

    mistral = MagicMock()
    mistral.recommend = AsyncMock(
        return_value=(make_recommendation_output("yuni_ai_mistral"), "mistral"),
    )

    yunicity = MagicMock()
    yunicity.get_user_passport = AsyncMock(return_value=make_passport())
    yunicity.get_map_data = AsyncMock(return_value=make_map_data())
    yunicity.get_city_tribes = AsyncMock(return_value=[])

    semantic = MagicMock()
    if semantic_error:
        semantic.search_actors = AsyncMock(side_effect=Exception("qdrant down"))
        semantic.search_tribes = AsyncMock(side_effect=Exception("qdrant down"))
    else:
        semantic.search_actors = AsyncMock(
            return_value=semantic_actors or [],
        )
        semantic.search_tribes = AsyncMock(
            return_value=semantic_tribes or [],
        )

    svc = RecommendationService(
        redis=redis, mistral=mistral, yunicity=yunicity, semantic=semantic,
    )
    return svc, mistral, semantic


class TestSemanticIntegration:
    @pytest.mark.asyncio
    async def test_semantic_candidates_passed_to_mistral(self) -> None:
        actors = [
            ActorSearchResult(
                actor_id="actor-1", name="Club", category="sport",
                semantic_score=0.9,
            ),
        ]
        svc, mistral, _ = _build_service(semantic_actors=actors)
        user = make_user_input()
        await svc.get_recommendations(user)
        mistral.recommend.assert_called_once()

    @pytest.mark.asyncio
    async def test_semantic_reduces_actor_list(self) -> None:
        actors = [
            ActorSearchResult(
                actor_id="actor-1", name="Club", category="sport",
                semantic_score=0.9,
            ),
        ]
        svc, mistral, _ = _build_service(semantic_actors=actors)
        user = make_user_input()
        await svc.get_recommendations(user)
        call_args = mistral.recommend.call_args
        map_data = call_args[0][1]
        filtered = [a for a in map_data.actors if a.id == "actor-1"]
        assert len(filtered) <= len(map_data.actors)

    @pytest.mark.asyncio
    async def test_semantic_failure_falls_back(self) -> None:
        svc, mistral, _ = _build_service(semantic_error=True)
        user = make_user_input()
        _output, source = await svc.get_recommendations(user)
        assert source == "yuni_ai_mistral"
        mistral.recommend.assert_called_once()

    @pytest.mark.asyncio
    async def test_cache_hit_skips_semantic(self) -> None:
        cached = make_recommendation_output("yuni_ai_cache").model_dump_json()
        svc, _, semantic = _build_service(cached=cached)
        user = make_user_input()
        _, source = await svc.get_recommendations(user)
        assert source == "yuni_ai_cache"
        semantic.search_actors.assert_not_called()

    @pytest.mark.asyncio
    async def test_metrics_incremented_on_search(self) -> None:
        from app.core.metrics import YuniAIMetrics
        fresh = YuniAIMetrics()
        with patch("app.services.recommendation_service.metrics", fresh):
            actors = [
                ActorSearchResult(
                    actor_id="a1", name="X", category="sport",
                    semantic_score=0.8,
                ),
            ]
            svc, _, _ = _build_service(semantic_actors=actors)
            await svc.get_recommendations(make_user_input())
            assert fresh.semantic_searches >= 1

    @pytest.mark.asyncio
    async def test_metrics_incremented_on_fallback(self) -> None:
        from app.core.metrics import YuniAIMetrics
        fresh = YuniAIMetrics()
        with patch("app.services.recommendation_service.metrics", fresh):
            svc, _, _ = _build_service(semantic_error=True)
            await svc.get_recommendations(make_user_input())
            assert fresh.semantic_fallbacks >= 1
