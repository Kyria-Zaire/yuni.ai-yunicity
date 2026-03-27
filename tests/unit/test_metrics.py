"""Unit tests for YuniAIMetrics and budget alerting (YAI-013)."""

from __future__ import annotations

import pytest

from app.core.metrics import YuniAIMetrics
from app.services.budget_alert import (
    DAILY_BUDGET_EUR,
    EMERGENCY_THRESHOLD,
    check_budget,
)


class TestCacheHitRate:
    def test_cache_hit_rate_calculated_correctly(self) -> None:
        m = YuniAIMetrics()
        m.cache_hits = 73
        m.cache_misses = 27
        assert m.cache_hit_rate == 0.73


class TestLatency:
    def test_p95_latency_requires_20_samples_minimum(self) -> None:
        m = YuniAIMetrics()
        for i in range(10):
            m.record_latency(float(i))
        assert m.p95_latency == 0.0

    def test_p50_latency_requires_10_samples_minimum(self) -> None:
        m = YuniAIMetrics()
        for i in range(5):
            m.record_latency(float(i))
        assert m.p50_latency == 0.0

    def test_p95_with_enough_samples(self) -> None:
        m = YuniAIMetrics()
        for i in range(100):
            m.record_latency(float(i))
        assert m.p95_latency >= 90.0


class TestCostEstimation:
    def test_cost_estimation_formula(self) -> None:
        m = YuniAIMetrics()
        m.mistral_tokens_input = 1_000_000
        m.mistral_tokens_output = 1_000_000
        expected = 3.0 + 9.0
        assert m.estimated_mistral_cost_eur == expected


class TestErrorRate:
    def test_error_rate_zero_calls(self) -> None:
        m = YuniAIMetrics()
        assert m.error_rate == 0.0

    def test_error_rate_with_errors(self) -> None:
        m = YuniAIMetrics()
        m.mistral_calls = 100
        m.mistral_errors = 5
        assert m.error_rate == 0.05


class TestRecordMethods:
    def test_metrics_incremented_on_cache_hit(self) -> None:
        m = YuniAIMetrics()
        m.record_cache_hit()
        m.record_cache_hit()
        m.record_cache_miss()
        assert m.cache_hits == 2
        assert m.cache_misses == 1

    def test_metrics_incremented_on_mistral_call(self) -> None:
        m = YuniAIMetrics()
        m.record_mistral_call()
        m.record_mistral_error()
        assert m.mistral_calls == 1
        assert m.mistral_errors == 1

    def test_record_tokens(self) -> None:
        m = YuniAIMetrics()
        m.record_tokens(100, 50)
        m.record_tokens(200, 100)
        assert m.mistral_tokens_input == 300
        assert m.mistral_tokens_output == 150

    def test_record_eligible_counters(self) -> None:
        m = YuniAIMetrics()
        m.record_eligible()
        m.record_not_eligible()
        m.record_not_eligible()
        assert m.eligible_requests == 1
        assert m.not_eligible_requests == 2


class TestToDict:
    def test_to_dict_contains_all_keys(self) -> None:
        m = YuniAIMetrics()
        d = m.to_dict()
        expected_keys = {
            "cache_hit_rate", "cache_hits", "cache_misses",
            "mistral_calls", "mistral_errors", "fallback_calls",
            "error_rate", "p50_latency_ms", "p95_latency_ms",
            "estimated_cost_eur", "eligible_requests", "not_eligible_requests",
            "semantic_searches", "semantic_fallbacks",
            "voice_turns", "stt_calls", "tts_calls", "tts_cache_hits",
            "xp_awarded", "badges_unlocked",
            "quests_generated", "quests_completed",
            "mistral_large_calls", "mistral_small_calls",
            "semantic_cache_hits",
        }
        assert set(d.keys()) == expected_keys


class TestBudgetAlert:
    @pytest.mark.asyncio
    async def test_budget_alert_warning_at_75_percent(self) -> None:
        m = YuniAIMetrics()
        cost_75 = DAILY_BUDGET_EUR * 0.75
        m.mistral_tokens_input = int(cost_75 / 3.0 * 1_000_000)
        await check_budget(m)

    @pytest.mark.asyncio
    async def test_budget_alert_critical_at_100_percent(self) -> None:
        m = YuniAIMetrics()
        m.mistral_tokens_input = int(DAILY_BUDGET_EUR / 3.0 * 1_000_000)
        await check_budget(m)

    @pytest.mark.asyncio
    async def test_budget_emergency_raises_exception(self) -> None:
        from app.core.exceptions import BudgetExceededError
        m = YuniAIMetrics()
        cost_target = DAILY_BUDGET_EUR * EMERGENCY_THRESHOLD + 1.0
        m.mistral_tokens_input = int(cost_target / 3.0 * 1_000_000)
        with pytest.raises(BudgetExceededError):
            await check_budget(m)
