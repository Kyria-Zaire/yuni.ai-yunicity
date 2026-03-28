"""Real-time Mistral budget tracking and alerting."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Literal

from pydantic import BaseModel, Field

from app.core.logging import get_logger
from app.core.metrics import metrics

if TYPE_CHECKING:
    from app.services.redis_service import RedisService

logger = get_logger("budget_tracker")

MONTHLY_BUDGET_EUR = 400.0
WARNING_AT = 0.75
CRITICAL_AT = 1.0
EMERGENCY_AT = 1.5


class DailyBudgetStats(BaseModel):
    date: str
    mistral_large_cost_eur: float = 0.0
    mistral_small_cost_eur: float = 0.0
    total_cost_eur: float = 0.0
    calls_large: int = 0
    calls_small: int = 0
    savings_vs_all_large_eur: float = 0.0
    cache_hit_rate: float = 0.0


class MonthlyBudgetReport(BaseModel):
    month: str
    budget_eur: float = MONTHLY_BUDGET_EUR
    spent_eur: float = 0.0
    remaining_eur: float = MONTHLY_BUDGET_EUR
    spent_pct: float = 0.0
    status: Literal["ok", "warning", "critical", "emergency"] = "ok"
    daily_breakdown: list[DailyBudgetStats] = Field(default_factory=list)
    projection_month_end_eur: float = 0.0
    top_cost_by_city: dict[str, float] = Field(default_factory=dict)
    top_cost_by_task: dict[str, float] = Field(default_factory=dict)


class BudgetTracker:
    """Tracks Mistral API costs per model and per day."""

    def __init__(self, redis: RedisService) -> None:
        self._redis = redis

    async def get_daily_stats(self, date: str | None = None) -> DailyBudgetStats:
        d = date or datetime.now(UTC).strftime("%Y-%m-%d")
        large_cost = float(
            await self._redis.get(f"cost:model:mistral-large-latest:{d}") or 0
        )
        small_cost = float(
            await self._redis.get(f"cost:model:mistral-small-latest:{d}") or 0
        )

        return DailyBudgetStats(
            date=d,
            mistral_large_cost_eur=round(large_cost, 4),
            mistral_small_cost_eur=round(small_cost, 4),
            total_cost_eur=round(large_cost + small_cost, 4),
            calls_large=metrics.mistral_large_calls,
            calls_small=metrics.mistral_small_calls,
            savings_vs_all_large_eur=0.0,
            cache_hit_rate=metrics.cache_hit_rate,
        )

    async def get_monthly_report(self) -> MonthlyBudgetReport:
        month = datetime.now(UTC).strftime("%Y-%m")
        days_elapsed = max(1, datetime.now(UTC).day)

        daily_stats: list[DailyBudgetStats] = []
        total_spent = 0.0
        for i in range(days_elapsed):
            d = (datetime.now(UTC) - timedelta(days=i)).strftime("%Y-%m-%d")
            stats = await self.get_daily_stats(d)
            daily_stats.append(stats)
            total_spent += stats.total_cost_eur

        spent_pct = total_spent / MONTHLY_BUDGET_EUR if MONTHLY_BUDGET_EUR > 0 else 0
        projection = (total_spent / days_elapsed) * 30

        if spent_pct >= EMERGENCY_AT:
            status: Literal["ok", "warning", "critical", "emergency"] = "emergency"
        elif spent_pct >= CRITICAL_AT:
            status = "critical"
        elif spent_pct >= WARNING_AT:
            status = "warning"
        else:
            status = "ok"

        return MonthlyBudgetReport(
            month=month,
            budget_eur=MONTHLY_BUDGET_EUR,
            spent_eur=round(total_spent, 2),
            remaining_eur=round(MONTHLY_BUDGET_EUR - total_spent, 2),
            spent_pct=round(spent_pct, 4),
            status=status,
            daily_breakdown=daily_stats,
            projection_month_end_eur=round(projection, 2),
        )
