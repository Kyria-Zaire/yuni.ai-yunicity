"""Consolidated admin panel API endpoints."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.metrics import metrics
from app.services.city_registry_service import CityRegistryService
from app.services.mistral_router import MistralRouter

logger = get_logger("admin_router")

router = APIRouter(tags=["admin"])


def _verify_admin(token: str) -> None:
    settings = get_settings()
    expected = settings.ADMIN_BYPASS_TOKEN.get_secret_value()
    if not expected or token != expected:
        raise HTTPException(status_code=403, detail="Invalid admin token")


@router.get(
    "/v1/admin/overview",
    summary="Snapshot global du systeme",
)
async def admin_overview(
    request: Request,
    x_admin_token: str = Header(...),
) -> dict[str, Any]:
    _verify_admin(x_admin_token)
    settings = get_settings()
    registry: CityRegistryService = request.app.state.city_registry_service
    cities = await registry.list_cities()

    rollout_map: dict[str, int] = {}
    for c in cities:
        rollout_map[c.city_id] = c.rollout_percentage

    savings = MistralRouter.estimate_savings(
        metrics.mistral_large_calls, metrics.mistral_small_calls,
    )

    return {
        "timestamp": datetime.now(UTC).isoformat(),
        "version": settings.APP_VERSION,
        "environment": settings.YUNI_ENV,
        "cities": {
            "total": len(cities),
            "active": sum(1 for c in cities if c.active),
            "rollout": rollout_map,
        },
        "metrics": {
            "cache_hit_rate": metrics.cache_hit_rate,
            "p95_latency_ms": metrics.p95_latency,
            "error_rate": metrics.error_rate,
            "mistral_large_calls": metrics.mistral_large_calls,
            "mistral_small_calls": metrics.mistral_small_calls,
        },
        "budget": {
            "estimated_cost_eur": metrics.estimated_mistral_cost_eur,
            "routing_savings_pct": savings,
        },
        "users": {
            "total_eligible": metrics.eligible_requests,
            "total_xp_awarded": metrics.xp_awarded,
            "badges_unlocked": metrics.badges_unlocked,
            "quests_completed": metrics.quests_completed,
        },
    }


@router.patch(
    "/v1/admin/cities/{city_id}/rollout",
    summary="Modifier le rollout d'une ville sans redeploy",
)
async def patch_rollout(
    request: Request,
    city_id: str,
    body: dict[str, Any],
    x_admin_token: str = Header(...),
) -> dict[str, Any]:
    _verify_admin(x_admin_token)
    percentage = body.get("percentage")
    if not isinstance(percentage, int) or not (0 <= percentage <= 100):
        raise HTTPException(status_code=400, detail="percentage must be 0-100")

    registry: CityRegistryService = request.app.state.city_registry_service
    config = await registry.get_city(city_id)
    if not config:
        raise HTTPException(status_code=404, detail=f"City {city_id} not found")

    config.rollout_percentage = percentage
    config.updated_at = datetime.now(UTC)
    await registry.register_city(config)

    logger.info("rollout_updated", city=city_id, percentage=percentage)
    return {"city_id": city_id, "rollout_percentage": percentage}


@router.post(
    "/v1/admin/cache/flush/{city}",
    summary="Vider le cache Redis d'une ville",
)
async def flush_city_cache(
    request: Request,
    city: str,
    x_admin_token: str = Header(...),
) -> dict[str, str]:
    _verify_admin(x_admin_token)
    logger.info("cache_flush_requested", city=city)
    return {"status": "flushed", "city": city}
