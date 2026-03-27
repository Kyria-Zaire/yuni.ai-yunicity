"""Recommendation endpoint — POST /v1/recommend/engagement."""

from __future__ import annotations

import time
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.exceptions import ExternalAPIError
from app.core.logging import get_logger
from app.core.metrics import metrics
from app.core.security import verify_jwt
from app.models.common import ProblemDetail, ResponseMeta
from app.models.recommend import (
    RecommendationResponse,
    UserInput,
)
from app.services.recommendation_service import RecommendationService

logger = get_logger("recommend")

router = APIRouter(tags=["recommendations"])


def get_recommendation_service(request: Request) -> RecommendationService:
    """Retrieve the RecommendationService from app state."""
    svc: RecommendationService = request.app.state.recommendation_service
    return svc


@router.post(
    "/v1/recommend/engagement",
    response_model=RecommendationResponse,
    status_code=200,
    summary="Recommandations personnalisees pour un utilisateur",
    description=(
        "Retourne des recommandations d'acteurs locaux, tribus et evenements "
        "adaptees au profil citoyen. Servies depuis le cache Redis (< 5ms) "
        "ou calculees par Mistral Large 2 (< 800ms). "
        "Requiert un JWT Bearer token. Rate limit: 20 req/min."
    ),
    responses={
        200: {"description": "Recommandations generees avec succes"},
        401: {"description": "JWT manquant ou invalide"},
        422: {"description": "Donnees d'entree invalides"},
        429: {"description": "Trop de requetes"},
        503: {"description": "Service temporairement indisponible"},
    },
)
async def recommend_engagement(
    request: Request,
    user: UserInput,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
    svc: RecommendationService = Depends(get_recommendation_service),
) -> RecommendationResponse:
    start = time.perf_counter()
    request_id = str(uuid4())

    try:
        output, source = await svc.get_recommendations(user)
    except ExternalAPIError as exc:
        logger.error("external_api_error", error=str(exc))
        raise HTTPException(
            status_code=503,
            detail=ProblemDetail(
                type="https://yuni.ai/errors/service-unavailable",
                title="Service temporairement indisponible",
                status=503,
                detail="Les services IA sont temporairement indisponibles.",
                instance=str(request.url),
            ).model_dump(),
        ) from exc

    latency_ms = round((time.perf_counter() - start) * 1000, 2)

    if source == "yuni_ai_cache":
        metrics.record_cache_hit()
    else:
        metrics.record_cache_miss()
    if source == "yuni_ai_mistral":
        metrics.record_mistral_call()
    elif source == "yuni_ai_fallback":
        metrics.record_fallback_call()
    metrics.record_latency(latency_ms)

    logger.info(
        "recommendation_generated",
        city=user.city,
        source=source,
        latency_ms=latency_ms,
        cache_hit=(source == "yuni_ai_cache"),
    )

    return RecommendationResponse(
        data=output,
        meta=ResponseMeta(
            request_id=request_id,
            timestamp=datetime.now(UTC),
            source=source,
            latency_ms=latency_ms,
        ),
    )
