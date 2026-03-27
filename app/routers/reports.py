"""Citizen report endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request

from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.models.report import ReportCategory, ReportInput, ReportOutput
from app.services.report_service import ReportService

logger = get_logger("reports_router")

router = APIRouter(tags=["reports"])


@router.post(
    "/v1/reports",
    response_model=ReportOutput,
    summary="Créer un signalement citoyen",
    responses={
        200: {"description": "Signalement créé et transmis"},
        401: {"description": "JWT manquant"},
    },
)
async def create_report(
    request: Request,
    body: ReportInput,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> ReportOutput:
    yunicity = getattr(request.app.state, "yunicity_service", None)
    svc = ReportService(yunicity=yunicity)
    user_hash: str = jwt_payload.get("sub", "")
    return await svc.create_report(body, user_hash)


@router.get(
    "/v1/reports/categories",
    summary="Lister les catégories de signalement",
    responses={200: {"description": "Liste des catégories"}},
)
async def list_categories() -> list[dict[str, str]]:
    return [
        {"value": c.value, "label": c.value.replace("_", " ").capitalize()}
        for c in ReportCategory
    ]
