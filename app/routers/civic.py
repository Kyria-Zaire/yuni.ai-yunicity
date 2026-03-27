"""Civic data protocol ODBL export endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request

from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.models.civic_protocol import CivicDataExport
from app.services.civic_export_service import CivicDataExportService

logger = get_logger("civic_router")

router = APIRouter(tags=["civic"])


@router.get(
    "/v1/civic/export/{city}",
    response_model=CivicDataExport,
    summary="Export ODBL des donnees civiques agregees",
    responses={401: {"description": "JWT manquant"}},
)
async def export_civic_data(
    request: Request,
    city: str,
    period_days: int = 30,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> CivicDataExport:
    svc: CivicDataExportService = request.app.state.civic_export_service
    return await svc.generate_export(city.lower(), period_days)


@router.get(
    "/v1/civic/export/{city}/metadata",
    summary="Metadonnees DCAT-AP de l'export civique",
    responses={200: {"description": "Metadonnees publiques"}},
)
async def export_metadata(
    request: Request,
    city: str,
) -> dict[str, str]:
    svc: CivicDataExportService = request.app.state.civic_export_service
    return await svc.get_metadata(city.lower())


@router.post(
    "/v1/civic/export/{city}/validate",
    summary="Valider la conformite RGPD d'un export",
)
async def validate_export(
    request: Request,
    city: str,
    x_admin_token: str = Header(...),
) -> dict[str, Any]:
    from app.core.config import get_settings
    settings = get_settings()
    expected = settings.ADMIN_BYPASS_TOKEN.get_secret_value()
    if not expected or x_admin_token != expected:
        raise HTTPException(status_code=403, detail="Invalid admin token")

    svc: CivicDataExportService = request.app.state.civic_export_service
    export = await svc.generate_export(city.lower())

    issues: list[str] = []
    if export.engagement_stats.total_active_citizens % 100 != 0:
        issues.append("total_active_citizens not rounded to 100")

    return {
        "city": city,
        "valid": len(issues) == 0,
        "issues": issues,
        "zones_count": len(export.zones_vitality),
        "license": export.license,
    }
