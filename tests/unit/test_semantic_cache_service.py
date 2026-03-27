"""Unit tests for SemanticCacheService — similarity-based caching."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.semantic_cache_service import (
    SemanticCacheService,
)


def _make_service(
    qdrant: MagicMock | None = None,
    embed_result: list[float] | None = None,
) -> SemanticCacheService:
    embed_svc = MagicMock()
    embed_svc.embed_text = AsyncMock(return_value=embed_result or [0.1] * 1024)
    redis = MagicMock()
    redis.get = AsyncMock(return_value=None)
    return SemanticCacheService(
        embedding_svc=embed_svc,
        qdrant_client=qdrant,
        redis=redis,
    )


class TestGet:
    @pytest.mark.asyncio
    async def test_get_returns_none_for_new_query(self) -> None:
        qdrant = MagicMock()
        qdrant.search = MagicMock(return_value=[])
        svc = _make_service(qdrant=qdrant)
        result = await svc.get("new query")
        assert result is None

    @pytest.mark.asyncio
    async def test_get_returns_result_above_threshold(self) -> None:
        hit = MagicMock()
        hit.score = 0.95
        hit.payload = {"result_json": '{"data": "cached"}'}
        qdrant = MagicMock()
        qdrant.search = MagicMock(return_value=[hit])
        svc = _make_service(qdrant=qdrant)
        result = await svc.get("similar query")
        assert result == '{"data": "cached"}'

    @pytest.mark.asyncio
    async def test_get_returns_none_below_threshold(self) -> None:
        hit = MagicMock()
        hit.score = 0.80
        hit.payload = {"result_json": '{"data": "cached"}'}
        qdrant = MagicMock()
        qdrant.search = MagicMock(return_value=[hit])
        svc = _make_service(qdrant=qdrant)
        result = await svc.get("different query")
        assert result is None

    @pytest.mark.asyncio
    async def test_get_fails_gracefully_on_qdrant_error(self) -> None:
        qdrant = MagicMock()
        qdrant.search = MagicMock(side_effect=ConnectionError("qdrant down"))
        svc = _make_service(qdrant=qdrant)
        result = await svc.get("any query")
        assert result is None


class TestSet:
    @pytest.mark.asyncio
    async def test_set_stores_in_qdrant(self) -> None:
        qdrant = MagicMock()
        qdrant.upsert = MagicMock()
        svc = _make_service(qdrant=qdrant)
        await svc.set("test query", '{"result": "ok"}')
        qdrant.upsert.assert_called_once()

    @pytest.mark.asyncio
    async def test_set_fails_gracefully_on_qdrant_error(self) -> None:
        qdrant = MagicMock()
        qdrant.upsert = MagicMock(side_effect=ConnectionError("qdrant down"))
        svc = _make_service(qdrant=qdrant)
        await svc.set("test query", '{"result": "ok"}')


class TestBuildQuery:
    def test_build_query_text_sorts_interests(self) -> None:
        q1 = SemanticCacheService.build_query_text("reims", ["culture", "sport"], 3)
        q2 = SemanticCacheService.build_query_text("reims", ["sport", "culture"], 3)
        assert q1 == q2

    def test_build_query_text_uses_points_bucket(self) -> None:
        q = SemanticCacheService.build_query_text("reims", ["sport"], 5)
        assert "points_5" in q

    def test_build_query_text_same_for_equivalent_inputs(self) -> None:
        q1 = SemanticCacheService.build_query_text("reims", ["a", "b", "c"], 10)
        q2 = SemanticCacheService.build_query_text("reims", ["c", "a", "b"], 10)
        assert q1 == q2


class TestMetrics:
    @pytest.mark.asyncio
    async def test_semantic_cache_hit_increments_metrics(self) -> None:
        from app.core.metrics import YuniAIMetrics
        m = YuniAIMetrics()
        initial = m.semantic_cache_hits
        m.record_semantic_cache_hit()
        assert m.semantic_cache_hits == initial + 1
