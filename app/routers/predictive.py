"""Predictive analytics endpoints — urban flow forecasting."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request

from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.services.predictive_service import PredictiveService, WeeklyForecast

logger = get_logger("predictive_router")

router = APIRouter(tags=["predictive"])


@router.get(
    "/v1/predictive/{city}/{zone}/forecast",
    response_model=WeeklyForecast,
    summary="Previsions d'affluence 7 jours",
)
async def get_forecast(
    request: Request,
    city: str,
    zone: str,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> WeeklyForecast:
    svc: PredictiveService = request.app.state.predictive_service
    return await svc.forecast_week(city.lower(), zone.lower())
