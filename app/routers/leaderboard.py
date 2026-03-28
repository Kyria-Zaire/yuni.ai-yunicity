"""Anonymised leaderboard endpoint."""

from __future__ import annotations

from typing import Any, Literal

from fastapi import APIRouter, Depends, Query, Request

from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.services.leaderboard_service import Leaderboard, LeaderboardService

logger = get_logger("leaderboard_router")

router = APIRouter(tags=["leaderboard"])


@router.get(
    "/v1/leaderboard/{city}",
    response_model=Leaderboard,
    summary="Leaderboard anonymise d'une ville",
    responses={401: {"description": "JWT manquant"}},
)
async def get_leaderboard(
    request: Request,
    city: str,
    period: Literal["week", "month", "all_time"] = Query(default="week"),
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> Leaderboard:
    svc: LeaderboardService = request.app.state.leaderboard_service
    user_hash: str = jwt_payload.get("sub", "")
    return await svc.get_leaderboard(city.lower(), period, user_hash)
