"""Unit tests for FederationService — EU city federation."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.federation_service import CityPeer, FederationService


def _make_service() -> FederationService:
    redis = MagicMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock()
    return FederationService(redis=redis)


class TestPeers:
    @pytest.mark.asyncio
    async def test_get_peers_excludes_requesting_city(self) -> None:
        svc = _make_service()
        peers = await svc.get_peers("reims-fr")
        city_ids = [p.city_id for p in peers]
        assert "reims-fr" not in city_ids

    @pytest.mark.asyncio
    async def test_get_peers_filters_by_country(self) -> None:
        svc = _make_service()
        peers = await svc.get_peers("reims-fr", country="DE")
        for p in peers:
            assert p.country == "DE"

    @pytest.mark.asyncio
    async def test_get_peers_filters_by_population(self) -> None:
        svc = _make_service()
        peers = await svc.get_peers("reims-fr", population_range="100k-200k")
        for p in peers:
            assert p.population_range == "100k-200k"


class TestStats:
    @pytest.mark.asyncio
    async def test_federation_stats_computes_average(self) -> None:
        svc = _make_service()
        stats = await svc.get_federation_stats()
        assert stats.total_cities == 3
        assert stats.avg_vitality_score > 0
        assert len(stats.countries) >= 2


class TestComparison:
    @pytest.mark.asyncio
    async def test_compare_returns_percentile(self) -> None:
        svc = _make_service()
        result = await svc.compare_with_peers("reims-fr", 72.5)
        assert "percentile" in result
        assert "delta" in result
        assert "ranking" in result


class TestJoin:
    @pytest.mark.asyncio
    async def test_join_adds_city_to_registry(self) -> None:
        svc = _make_service()
        from datetime import UTC, datetime
        peer = CityPeer(
            city_id="lyon-fr",
            display_name="Lyon",
            country="FR",
            population_range="200k-300k",
            vitality_score_avg=74.0,
            joined_federation_at=datetime(2026, 11, 1, tzinfo=UTC),
        )
        await svc.join(peer)
        svc._redis.set.assert_called_once()
