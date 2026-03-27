"""Urban quest endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Request

from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.models.quest import Quest, UserQuestProgress
from app.services.quest_service import QuestService

logger = get_logger("quests_router")

router = APIRouter(tags=["quests"])


@router.get(
    "/v1/quests/{city}",
    response_model=list[Quest],
    summary="Quetes actives pour une ville",
    responses={401: {"description": "JWT manquant"}},
)
async def get_city_quests(
    request: Request,
    city: str,
    interests: str | None = Query(default=None),
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> list[Quest]:
    svc: QuestService = request.app.state.quest_service
    interest_list = interests.split(",") if interests else None
    return await svc.get_city_quests(city.lower(), interest_list)


@router.post(
    "/v1/quests/{city}/{quest_id}/start",
    response_model=UserQuestProgress,
    summary="Demarrer une quete",
    responses={401: {"description": "JWT manquant"}},
)
async def start_quest(
    request: Request,
    city: str,
    quest_id: str,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> UserQuestProgress:
    svc: QuestService = request.app.state.quest_service
    user_hash: str = jwt_payload.get("sub", "")
    return await svc.start_quest(quest_id, user_hash)


@router.post(
    "/v1/quests/{city}/{quest_id}/step/{step}",
    response_model=UserQuestProgress,
    summary="Valider une etape de quete",
    responses={401: {"description": "JWT manquant"}},
)
async def complete_step(
    request: Request,
    city: str,
    quest_id: str,
    step: int,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> UserQuestProgress:
    svc: QuestService = request.app.state.quest_service
    user_hash: str = jwt_payload.get("sub", "")
    return await svc.complete_step(quest_id, user_hash, step, city.lower())


@router.get(
    "/v1/quests/{city}/{quest_id}/progress",
    response_model=UserQuestProgress | None,
    summary="Progression d'une quete",
    responses={401: {"description": "JWT manquant"}},
)
async def get_progress(
    request: Request,
    city: str,
    quest_id: str,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> UserQuestProgress | None:
    svc: QuestService = request.app.state.quest_service
    user_hash: str = jwt_payload.get("sub", "")
    return await svc._get_progress(user_hash, quest_id)
