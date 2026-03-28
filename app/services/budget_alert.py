"""Budget alerting service for Mistral API cost monitoring."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.core.exceptions import BudgetExceededError
from app.core.logging import get_logger

if TYPE_CHECKING:
    from app.core.metrics import YuniAIMetrics

logger = get_logger("budget")

DAILY_BUDGET_EUR = 20.0
WARNING_THRESHOLD = 0.75
CRITICAL_THRESHOLD = 1.0
EMERGENCY_THRESHOLD = 1.5


async def check_budget(metrics: YuniAIMetrics) -> None:
    """Evaluate current Mistral spend against daily budget thresholds."""
    cost = metrics.estimated_mistral_cost_eur
    if DAILY_BUDGET_EUR <= 0:
        return
    ratio = cost / DAILY_BUDGET_EUR

    if ratio >= EMERGENCY_THRESHOLD:
        logger.critical(
            "budget_emergency_mistral_disabled",
            cost_eur=cost,
            budget_eur=DAILY_BUDGET_EUR,
            ratio=round(ratio, 2),
        )
        raise BudgetExceededError(f"Budget Mistral depasse: {cost:.2f}EUR")

    if ratio >= CRITICAL_THRESHOLD:
        logger.error("budget_critical", cost_eur=cost, ratio=round(ratio, 2))
    elif ratio >= WARNING_THRESHOLD:
        logger.warning("budget_warning", cost_eur=cost, ratio=round(ratio, 2))
