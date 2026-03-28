"""Sentiment NLP endpoints."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, Request

from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.models.sentiment import ZoneSentiment
from app.services.city_registry_service import CityRegistryService
from app.services.sentiment_service import SentimentService

logger = get_logger("sentiment_router")

router = APIRouter(tags=["sentiment"])


@router.get(
    "/v1/sentiment/{city}/{zone}",
    response_model=ZoneSentiment,
    summary="Sentiment d'un quartier",
    responses={401: {"description": "JWT manquant"}},
)
async def get_zone_sentiment(
    request: Request,
    city: str,
    zone: str,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> ZoneSentiment:
    svc: SentimentService = request.app.state.sentiment_service
    cached = await svc.get_cached(city.lower(), zone.lower())
    if cached:
        return cached
    return await svc.analyze_zone(city.lower(), zone.lower(), [])


@router.get(
    "/v1/sentiment/{city}",
    response_model=list[ZoneSentiment],
    summary="Sentiment de toutes les zones d'une ville",
    responses={401: {"description": "JWT manquant"}},
)
async def get_city_sentiments(
    request: Request,
    city: str,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> list[ZoneSentiment]:
    svc: SentimentService = request.app.state.sentiment_service
    registry: CityRegistryService = request.app.state.city_registry_service
    config = await registry.get_city(city.lower())
    if not config:
        return []
    results: list[ZoneSentiment] = []
    for zone in config.zones:
        cached = await svc.get_cached(city.lower(), zone)
        if cached:
            results.append(cached)
    return results
