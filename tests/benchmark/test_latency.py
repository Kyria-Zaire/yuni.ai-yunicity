"""Latency benchmark tests (YAI-010). Skipped outside recette."""

from __future__ import annotations

import os
import time
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.mistral_service import MistralService
from app.services.recommendation_service import RecommendationService
from tests.fixtures.recommend_fixtures import (
    make_map_data,
    make_recommendation_output,
    make_user_input,
)

skip_outside_recette = pytest.mark.skipif(
    os.environ.get("YUNI_ENV") != "recette",
    reason="Benchmark only runs in recette environment",
)


class TestCacheHitLatency:
    @pytest.mark.asyncio
    async def test_cache_hit_latency_under_5ms(self) -> None:
        """P95 cache hit latency should be under 5ms."""
        cached_output = make_recommendation_output("yuni_ai_cache")
        cached_json = cached_output.model_dump_json()

        redis = MagicMock()
        redis.get = AsyncMock(return_value=cached_json)
        redis.set = AsyncMock(return_value=True)
        mistral = MagicMock()
        yunicity = MagicMock()

        svc = RecommendationService(redis=redis, mistral=mistral, yunicity=yunicity)
        user = make_user_input()

        latencies: list[float] = []
        for _ in range(100):
            start = time.perf_counter()
            await svc.get_recommendations(user)
            latencies.append((time.perf_counter() - start) * 1000)

        latencies.sort()
        p50 = latencies[50]
        p95 = latencies[95]

        assert p95 < 5.0, f"Cache hit P95 = {p95:.2f}ms (target < 5ms)"
        assert p50 < 2.0, f"Cache hit P50 = {p50:.2f}ms (target < 2ms)"


class TestFallbackLatency:
    @pytest.mark.asyncio
    async def test_fallback_latency_under_5ms(self) -> None:
        """Business rules fallback P95 must be under 5ms."""
        user = make_user_input()
        data = make_map_data()

        latencies: list[float] = []
        for _ in range(100):
            start = time.perf_counter()
            MistralService._business_rules_fallback(user, data)
            latencies.append((time.perf_counter() - start) * 1000)

        latencies.sort()
        p95 = latencies[95]
        assert p95 < 5.0, f"Fallback P95 = {p95:.2f}ms (target < 5ms)"


class TestMistralLatency:
    @skip_outside_recette
    @pytest.mark.asyncio
    async def test_mistral_response_latency_under_800ms(self) -> None:
        """Mistral P95 should be < 800ms (recette only with real API)."""
        pytest.skip("Requires real Mistral API key in recette")
