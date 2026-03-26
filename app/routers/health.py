"""Health check endpoints for liveness and readiness probes."""

from datetime import UTC, datetime

from fastapi import APIRouter, Response

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.redis_service import RedisService

router = APIRouter(tags=["health"])
logger = get_logger("health")

_redis_service: RedisService | None = None


def set_redis_service(service: RedisService) -> None:
    """Set the Redis service instance (called from lifespan)."""
    global _redis_service
    _redis_service = service


async def _check_redis() -> str:
    """Return Redis connectivity status."""
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
    """Liveness probe — always returns 200 if the process is running."""
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
    }


@router.get("/health/ready")
async def readiness(response: Response) -> dict[str, object]:
    """Readiness probe — returns 503 if critical services are down."""
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
