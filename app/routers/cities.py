"""City registry endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Header, HTTPException, Request

from app.core.logging import get_logger
from app.models.city import CityConfig, CityListResponse

logger = get_logger("cities_router")

router = APIRouter(tags=["cities"])


@router.get(
    "/v1/cities",
    response_model=CityListResponse,
    summary="Lister les villes actives",
    responses={200: {"description": "Liste des villes couvertes par Yuni AI"}},
)
async def list_cities(request: Request) -> CityListResponse:
    svc = request.app.state.city_registry_service
    cities = await svc.list_cities()
    return CityListResponse(cities=cities, total=len(cities))


@router.post(
    "/v1/admin/cities",
    response_model=CityConfig,
    summary="Enregistrer une nouvelle ville (admin)",
    responses={
        200: {"description": "Ville enregistree"},
        403: {"description": "Token admin invalide"},
    },
)
async def register_city(
    request: Request,
    body: CityConfig,
    x_admin_token: str = Header(...),
) -> CityConfig:
    settings = request.app.state.settings
    expected = settings.ADMIN_BYPASS_TOKEN.get_secret_value()
    if not expected or x_admin_token != expected:
        raise HTTPException(status_code=403, detail="Invalid admin token")
    svc = request.app.state.city_registry_service
    await svc.register_city(body)
    return body
