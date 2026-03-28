"""EU city federation endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Header, HTTPException, Request

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.services.federation_service import CityPeer, FederationService, FederationStats

logger = get_logger("federation_router")

router = APIRouter(tags=["federation"])


@router.get(
    "/v1/federation/peers/{city_id}",
    response_model=list[CityPeer],
    summary="Villes pairs de taille similaire",
)
async def get_peers(
    request: Request,
    city_id: str,
    country: str | None = None,
    population_range: str | None = None,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> list[CityPeer]:
    svc: FederationService = request.app.state.federation_service
    return await svc.get_peers(city_id, population_range, country)


@router.get(
    "/v1/federation/stats",
    response_model=FederationStats,
    summary="Stats agregees de la federation EU",
)
async def get_stats(
    request: Request,
) -> FederationStats:
    svc: FederationService = request.app.state.federation_service
    return await svc.get_federation_stats()


@router.get(
    "/v1/federation/compare/{city_id}",
    summary="Comparer une ville avec ses pairs",
)
async def compare_city(
    request: Request,
    city_id: str,
    my_score: float = 70.0,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> dict[str, Any]:
    svc: FederationService = request.app.state.federation_service
    return await svc.compare_with_peers(city_id, my_score)


@router.post(
    "/v1/federation/join",
    response_model=CityPeer,
    summary="Inscrire une ville a la federation",
)
async def join_federation(
    request: Request,
    body: CityPeer,
    x_admin_token: str = Header(...),
) -> CityPeer:
    settings = get_settings()
    expected = settings.ADMIN_BYPASS_TOKEN.get_secret_value()
    if not expected or x_admin_token != expected:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    svc: FederationService = request.app.state.federation_service
    await svc.join(body)
    return body
