"""Vitality Index endpoint — GET /v1/vitality/{city}/{zone}."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, Path, Request

from app.core.config import CacheTTL
from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.models.audit import AIDecisionType
from app.models.common import APIResponse, ResponseMeta
from app.models.vitality import VitalityIndex, VitalityIndexResponse
from app.services.redis_service import get_redis_service
from app.services.vitality_service import VitalityIndexService

logger = get_logger("vitality")

router = APIRouter(tags=["vitality"])


def _get_vitality_service(request: Request) -> VitalityIndexService:
    svc: VitalityIndexService = request.app.state.vitality_service
    return svc


@router.get(
    "/v1/vitality/{city}/{zone}",
    response_model=APIResponse[VitalityIndexResponse],
    summary="Indice de vitalite d'un quartier",
    description=(
        "Retourne le score de vitalite locale (0-100) d'un quartier, "
        "calcule sur 5 dimensions citoyennes. Cache 30 jours."
    ),
    responses={
        200: {"description": "Indice de vitalite"},
        401: {"description": "JWT manquant ou invalide"},
    },
)
async def get_vitality_index(
    request: Request,
    city: str = Path(..., min_length=2, max_length=100),
    zone: str = Path(..., min_length=2, max_length=100),
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
    vitality_svc: VitalityIndexService = Depends(_get_vitality_service),
) -> APIResponse[VitalityIndexResponse]:
    redis = get_redis_service()
    cache_key = f"vitality:v1:{city}:{zone}"

    cached = await redis.get(cache_key)
    if cached:
        index = VitalityIndex.model_validate_json(cached)
        if index.valid_until > datetime.now(UTC):
            return _build_response(index)

    from app.services.yunicity_api import YunicityAPIService
    yunicity: YunicityAPIService = request.app.state.yunicity_service
    vitality_data = await yunicity.get_vitality_data(city, zone)

    old_cached = await redis.get(cache_key)
    if old_cached:
        old_index = VitalityIndex.model_validate_json(old_cached)
        prev_key = f"vitality:prev:{city}:{zone}"
        await redis.set(prev_key, str(old_index.score), CacheTTL.CITY_VITALITY)

    index = await vitality_svc.compute(city, zone, vitality_data)

    await redis.set(
        cache_key,
        index.model_dump_json(),
        ttl_seconds=CacheTTL.CITY_VITALITY,
    )

    blackbox = getattr(request.app.state, "civic_blackbox_service", None)
    if blackbox:
        asyncio.create_task(blackbox.record(  # noqa: RUF006
            decision_type=AIDecisionType.VITALITY_SCORE,
            model_used="computation",
            source="vitality_engine",
            city=city,
            zone=zone,
            decision_summary=f"Vitalite {zone}: {index.score}/100 ({index.grade})",
            factors=[d.name for d in index.dimensions],
            confidence=0.95,
            latency_ms=0,
        ))

    return _build_response(index)


def _build_response(index: VitalityIndex) -> APIResponse[VitalityIndexResponse]:
    data = VitalityIndexResponse(
        city=index.city,
        zone=index.zone,
        score=index.score,
        grade=index.grade,
        trend=index.trend,
        dimensions=[d.model_dump() for d in index.dimensions],
        computed_at=index.computed_at,
        valid_until=index.valid_until,
    )
    return APIResponse(
        data=data,
        meta=ResponseMeta(
            request_id=str(uuid4()),
            timestamp=datetime.now(UTC),
            source="yuni-ai-vitality",
        ),
    )
