"""Budget dashboard API endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Request

from app.core.logging import get_logger
from app.services.budget_tracker import BudgetTracker, DailyBudgetStats, MonthlyBudgetReport

logger = get_logger("budget_router")

router = APIRouter(tags=["budget"])


def _verify_admin(token: str) -> None:
    from app.core.config import get_settings
    settings = get_settings()
    expected = settings.ADMIN_BYPASS_TOKEN.get_secret_value()
    if not expected or token != expected:
        raise HTTPException(status_code=403, detail="Invalid admin token")


@router.get(
    "/v1/admin/budget/daily",
    response_model=DailyBudgetStats,
    summary="Stats budget du jour",
)
async def get_daily_budget(
    request: Request,
    x_admin_token: str = Header(...),
) -> DailyBudgetStats:
    _verify_admin(x_admin_token)
    tracker: BudgetTracker = request.app.state.budget_tracker
    return await tracker.get_daily_stats()


@router.get(
    "/v1/admin/budget/monthly",
    response_model=MonthlyBudgetReport,
    summary="Rapport budget mensuel",
)
async def get_monthly_budget(
    request: Request,
    x_admin_token: str = Header(...),
) -> MonthlyBudgetReport:
    _verify_admin(x_admin_token)
    tracker: BudgetTracker = request.app.state.budget_tracker
    return await tracker.get_monthly_report()
