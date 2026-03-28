"""Unit tests for SemanticSearchService (YAI-017)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.semantic import ActorSearchResult, TribeSearchResult
from app.services.semantic_search_service import SemanticSearchService, _build_query


def _mock_embedding() -> MagicMock:
    emb = MagicMock()
    emb.embed_text = AsyncMock(return_value=[0.1] * 1024)
    emb.qdrant = MagicMock()
    return emb


def _actor_hit(actor_id: str, name: str, category: str, score: float) -> MagicMock:
    hit = MagicMock()
    hit.payload = {
        "id": actor_id, "name": name, "category": category,
        "city": "reims", "tags": [],
    }
    hit.score = score
    return hit


def _tribe_hit(tribe_id: str, name: str, category: str, score: float) -> MagicMock:
    hit = MagicMock()
    hit.payload = {
        "id": tribe_id, "name": name, "category": category,
        "city": "reims", "members_count": 50,
    }
    hit.score = score
    return hit


class TestSearchActors:
    @pytest.mark.asyncio
    async def test_returns_top_k_results(self) -> None:
        emb = _mock_embedding()
        emb.qdrant.search.return_value = [
            _actor_hit("a1", "Club", "sport", 0.9),
            _actor_hit("a2", "MJC", "culture", 0.8),
        ]
        svc = SemanticSearchService(emb)
        results = await svc.search_actors(["sport"], "reims", top_k=5)
        assert len(results) == 2
        assert all(isinstance(r, ActorSearchResult) for r in results)

    @pytest.mark.asyncio
    async def test_sorted_by_score(self) -> None:
        emb = _mock_embedding()
        emb.qdrant.search.return_value = [
            _actor_hit("a1", "High", "sport", 0.95),
            _actor_hit("a2", "Low", "culture", 0.60),
        ]
        svc = SemanticSearchService(emb)
        results = await svc.search_actors(["sport"], "reims")
        assert results[0].semantic_score > results[1].semantic_score

    @pytest.mark.asyncio
    async def test_returns_empty_on_qdrant_error(self) -> None:
        emb = _mock_embedding()
        emb.qdrant.search.side_effect = Exception("Qdrant down")
        svc = SemanticSearchService(emb)
        results = await svc.search_actors(["sport"], "reims")
        assert results == []

    @pytest.mark.asyncio
    async def test_score_between_0_and_1(self) -> None:
        emb = _mock_embedding()
        emb.qdrant.search.return_value = [_actor_hit("a1", "X", "sport", 0.85)]
        svc = SemanticSearchService(emb)
        results = await svc.search_actors(["sport"], "reims")
        assert 0 <= results[0].semantic_score <= 1


class TestSearchTribes:
    @pytest.mark.asyncio
    async def test_returns_results(self) -> None:
        emb = _mock_embedding()
        emb.qdrant.search.return_value = [_tribe_hit("t1", "Sport", "sport", 0.9)]
        svc = SemanticSearchService(emb)
        results = await svc.search_tribes(["sport"], "reims")
        assert len(results) == 1
        assert isinstance(results[0], TribeSearchResult)

    @pytest.mark.asyncio
    async def test_returns_empty_on_qdrant_error(self) -> None:
        emb = _mock_embedding()
        emb.qdrant.search.side_effect = Exception("fail")
        svc = SemanticSearchService(emb)
        results = await svc.search_tribes(["sport"], "reims")
        assert results == []


class TestBuildQuery:
    def test_creates_natural_language_query(self) -> None:
        q = _build_query(["sport", "famille"], "acteurs locaux")
        assert "sport" in q
        assert "famille" in q
        assert "acteurs locaux" in q

    def test_includes_all_interests(self) -> None:
        q = _build_query(["tech", "culture", "sport"], "tribus")
        assert "tech" in q
        assert "culture" in q
        assert "sport" in q
