"""Unit tests for BudgetTracker — realtime cost monitoring."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.services.budget_tracker import (
    MONTHLY_BUDGET_EUR,
    BudgetTracker,
)


def _make_tracker(cost_large: float = 0, cost_small: float = 0) -> BudgetTracker:
    redis = MagicMock()

    async def mock_get(key: str) -> str | None:
        if "large" in key:
            return str(cost_large)
        if "small" in key:
            return str(cost_small)
        return None

    redis.get = AsyncMock(side_effect=mock_get)
    return BudgetTracker(redis=redis)


class TestDailyStats:
    @pytest.mark.asyncio
    async def test_daily_stats_aggregates_correctly(self) -> None:
        tracker = _make_tracker(cost_large=5.0, cost_small=0.5)
        stats = await tracker.get_daily_stats("2026-10-01")
        assert stats.mistral_large_cost_eur == 5.0
        assert stats.mistral_small_cost_eur == 0.5
        assert stats.total_cost_eur == 5.5


class TestMonthlyReport:
    @pytest.mark.asyncio
    async def test_monthly_status_ok_under_75pct(self) -> None:
        from datetime import UTC, datetime
        days = max(1, datetime.now(UTC).day)
        daily = (MONTHLY_BUDGET_EUR * 0.50) / days
        tracker = _make_tracker(cost_large=daily, cost_small=0)
        report = await tracker.get_monthly_report()
        assert report.status == "ok"

    @pytest.mark.asyncio
    async def test_monthly_status_warning_at_75pct(self) -> None:
        from datetime import UTC, datetime
        days = max(1, datetime.now(UTC).day)
        daily = (MONTHLY_BUDGET_EUR * 0.80) / days
        tracker = _make_tracker(cost_large=daily, cost_small=0)
        report = await tracker.get_monthly_report()
        assert report.status == "warning"

    @pytest.mark.asyncio
    async def test_monthly_status_critical_at_100pct(self) -> None:
        from datetime import UTC, datetime
        days = max(1, datetime.now(UTC).day)
        daily = (MONTHLY_BUDGET_EUR * 1.05) / days
        tracker = _make_tracker(cost_large=daily, cost_small=0)
        report = await tracker.get_monthly_report()
        assert report.status == "critical"

    @pytest.mark.asyncio
    async def test_monthly_status_emergency_at_150pct(self) -> None:
        from datetime import UTC, datetime
        days = max(1, datetime.now(UTC).day)
        daily = (MONTHLY_BUDGET_EUR * 1.6) / days
        tracker = _make_tracker(cost_large=daily, cost_small=0)
        report = await tracker.get_monthly_report()
        assert report.status == "emergency"


class TestProjection:
    @pytest.mark.asyncio
    async def test_projection_extrapolates_linearly(self) -> None:
        tracker = _make_tracker(cost_large=10.0, cost_small=1.0)
        report = await tracker.get_monthly_report()
        assert report.projection_month_end_eur > 0

    @pytest.mark.asyncio
    async def test_savings_calculated_vs_all_large(self) -> None:
        tracker = _make_tracker(cost_large=5.0, cost_small=0.5)
        stats = await tracker.get_daily_stats("2026-10-01")
        assert stats.total_cost_eur < 10.0
