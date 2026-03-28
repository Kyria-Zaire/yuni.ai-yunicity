"""City dashboard API — role-based access for municipalities."""

from __future__ import annotations

import csv
import io
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Path, Query, Request
from fastapi.responses import StreamingResponse

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.metrics import metrics
from app.core.security import verify_jwt
from app.models.common import ProblemDetail
from app.models.vitality import VitalityIndex
from app.services.redis_service import get_redis_service

logger = get_logger("dashboard")

router = APIRouter(tags=["dashboard"])

ZONES_REIMS = [
    "centre", "clairmarais", "croix-rouge",
    "wilson", "laon-zola", "europe", "orgeval",
]


def _verify_city_jwt(
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> dict[str, Any]:
    """Require ``role=city_dashboard`` in the JWT claims."""
    if jwt_payload.get("role") != "city_dashboard":
        raise HTTPException(
            status_code=403,
            detail=ProblemDetail(
                type="https://yuni.ai/errors/forbidden",
                title="Acces reserve aux dashboards villes",
                status=403,
                detail="Ce endpoint requiert le role city_dashboard.",
            ).model_dump(),
        )
    return jwt_payload


@router.get("/v1/dashboard/{city}/vitality")
async def dashboard_vitality(
    city: str = Path(..., min_length=2, max_length=100),
    jwt_payload: dict[str, Any] = Depends(_verify_city_jwt),
) -> dict[str, Any]:
    jwt_city = jwt_payload.get("city", "")
    if jwt_city and jwt_city.lower() != city.lower():
        raise HTTPException(403, detail="Acces interdit pour cette ville")

    redis = get_redis_service()
    zones: list[dict[str, Any]] = []
    for zone in ZONES_REIMS:
        cached = await redis.get(f"vitality:v1:{city}:{zone}")
        if cached:
            try:
                idx = VitalityIndex.model_validate_json(cached)
                zones.append({
                    "zone": zone,
                    "score": idx.score,
                    "grade": idx.grade,
                    "trend": idx.trend,
                    "dimensions": {
                        d.name: {"score": d.score, "weight": d.weight}
                        for d in idx.dimensions
                    },
                })
            except Exception:
                logger.warning("vitality_parse_error", zone=zone)

    scores = [z["score"] for z in zones]
    avg = round(sum(scores) / len(scores), 1) if scores else 0.0
    top = max(zones, key=lambda z: z["score"])["zone"] if zones else ""
    bottom = min(zones, key=lambda z: z["score"])["zone"] if zones else ""

    return {
        "city": city,
        "computed_at": datetime.now(UTC).isoformat(),
        "zones": zones,
        "city_average": avg,
        "top_zone": top,
        "bottom_zone": bottom,
    }


@router.get("/v1/dashboard/{city}/engagement")
async def dashboard_engagement(
    city: str = Path(..., min_length=2, max_length=100),
    jwt_payload: dict[str, Any] = Depends(_verify_city_jwt),
) -> dict[str, Any]:
    settings = get_settings()
    m = metrics.to_dict()
    return {
        "city": city,
        "period": "last_30_days",
        "metrics": {
            "recommendations_served": int(m.get("cache_hits", 0) + m.get("cache_misses", 0)),
            "cache_hit_rate": m.get("cache_hit_rate", 0),
            "rollout_percentage": settings.ROLLOUT_PERCENTAGE,
            "mistral_calls": int(m.get("mistral_calls", 0)),
            "estimated_cost_eur": m.get("estimated_cost_eur", 0),
        },
    }


@router.get("/v1/dashboard/{city}/actors")
async def dashboard_actors(
    request: Request,
    city: str = Path(..., min_length=2, max_length=100),
    jwt_payload: dict[str, Any] = Depends(_verify_city_jwt),
) -> dict[str, Any]:
    redis = get_redis_service()
    actors: list[dict[str, Any]] = []

    from app.mocks.yunicity_mock_service import REIMS_ACTORS
    for actor in REIMS_ACTORS:
        count_raw = await redis.get(f"actor_recs:{city}:{actor.id}")
        count = int(count_raw) if count_raw else 0
        actors.append({
            "id": actor.id,
            "name": actor.name,
            "category": actor.category,
            "recommendation_count": count,
        })
    actors.sort(key=lambda a: a["recommendation_count"], reverse=True)
    return {"city": city, "actors": actors}


@router.get("/v1/dashboard/{city}/export")
async def dashboard_export(
    city: str = Path(..., min_length=2, max_length=100),
    fmt: str = Query("json", alias="format", pattern=r"^(json|csv)$"),
    jwt_payload: dict[str, Any] = Depends(_verify_city_jwt),
) -> Any:
    redis = get_redis_service()
    zones: list[dict[str, Any]] = []
    for zone in ZONES_REIMS:
        cached = await redis.get(f"vitality:v1:{city}:{zone}")
        if cached:
            try:
                idx = VitalityIndex.model_validate_json(cached)
                zones.append({
                    "zone": zone, "score": idx.score,
                    "grade": idx.grade, "trend": idx.trend,
                })
            except Exception:
                logger.warning("export_parse_error", zone=zone)

    if fmt == "csv":
        buf = io.StringIO()
        writer = csv.DictWriter(buf, fieldnames=["zone", "score", "grade", "trend"])
        writer.writeheader()
        for z in zones:
            writer.writerow(z)
        return StreamingResponse(
            iter([buf.getvalue()]),
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename={city}_vitality.csv",
            },
        )

    return {
        "city": city,
        "exported_at": datetime.now(UTC).isoformat(),
        "request_id": str(uuid4()),
        "zones": zones,
    }
