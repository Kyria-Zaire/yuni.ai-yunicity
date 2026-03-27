"""Health check endpoints for liveness and readiness probes."""

from __future__ import annotations

from datetime import UTC, datetime

from fastapi import APIRouter, Response

from app.core.config import get_settings
from app.core.logging import get_logger
from app.core.metrics import metrics
from app.services.redis_service import RedisService

router = APIRouter(tags=["health"])
logger = get_logger("health")

_redis_service: RedisService | None = None


def set_redis_service(service: RedisService) -> None:
    global _redis_service
    _redis_service = service


async def _check_redis() -> str:
    if _redis_service is None:
        return "not_configured"
    try:
        result: bool = await _redis_service.ping()
        return "connected" if result else "disconnected"
    except Exception:
        logger.warning("redis_health_check_failed")
        return "disconnected"


@router.get("/health")
async def health() -> dict[str, object]:
    settings = get_settings()
    redis_status = await _check_redis()
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.YUNI_ENV,
        "timestamp": datetime.now(UTC).isoformat(),
        "services": {
            "redis": redis_status,
            "mistral": "available",
        },
        "metrics": metrics.to_dict(),
    }


@router.get("/health/ready")
async def readiness(response: Response) -> dict[str, object]:
    redis_status = await _check_redis()
    is_ready = redis_status == "connected"

    if not is_ready:
        response.status_code = 503

    return {
        "status": "ready" if is_ready else "not_ready",
        "services": {
            "redis": redis_status,
        },
    }
