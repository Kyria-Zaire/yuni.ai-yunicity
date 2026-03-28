"""Gamification XP and badges endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request

from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.models.gamification import (
    BADGES_CATALOG,
    AwardXPRequest,
    UserXPProfile,
    XPEvent,
)
from app.services.gamification_service import GamificationService

logger = get_logger("gamification_router")

router = APIRouter(tags=["gamification"])


@router.get(
    "/v1/gamification/profile",
    response_model=UserXPProfile,
    summary="Profil XP de l'utilisateur courant",
    responses={401: {"description": "JWT manquant"}},
)
async def get_xp_profile(
    request: Request,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> UserXPProfile:
    svc: GamificationService = request.app.state.gamification_service
    user_hash: str = jwt_payload.get("sub", "")
    return await svc.get_profile(user_hash)


@router.get(
    "/v1/gamification/badges",
    summary="Catalogue complet des badges",
    responses={200: {"description": "Liste des 15 badges"}},
)
async def list_badges() -> list[dict[str, Any]]:
    return [b.model_dump() for b in BADGES_CATALOG]


@router.post(
    "/v1/gamification/award",
    response_model=XPEvent,
    summary="Attribuer des XP (usage interne)",
    responses={401: {"description": "JWT manquant"}},
)
async def award_xp(
    request: Request,
    body: AwardXPRequest,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> XPEvent:
    svc: GamificationService = request.app.state.gamification_service
    user_hash: str = jwt_payload.get("sub", "")
    return await svc.award_xp(user_hash, body.action, body.city)
