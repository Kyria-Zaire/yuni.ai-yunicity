"""Map data endpoint — acteurs / événements pour affichage carte."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Query, Request

from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.models.yunicity import MapData

logger = get_logger("map_router")

router = APIRouter(tags=["map"])

# Centres approximatifs (lat, lng) — utilisés pour interroger Yunicity / mock.
_CITY_CENTERS: dict[str, tuple[float, float]] = {
    "reims": (49.2583, 4.0317),
}


@router.get(
    "/v1/map/data",
    response_model=MapData,
    summary="Données carte (acteurs, événements)",
    responses={200: {"description": "Données agrégées pour la carte"}, 401: {}},
)
async def get_map_data(
    request: Request,
    city: str = Query(..., min_length=2, max_length=100),
    _jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> MapData:
    yunicity = request.app.state.yunicity_service
    key = city.strip().lower()
    lat, lng = _CITY_CENTERS.get(key, _CITY_CENTERS["reims"])
    data = await yunicity.get_map_data(lat, lng)
    return data
