"""Pro subscription management backed by Redis (source of truth: Stripe webhooks)."""

from __future__ import annotations

from enum import StrEnum
from typing import TYPE_CHECKING

from app.core.logging import get_logger

if TYPE_CHECKING:
    from app.services.redis_service import RedisService

logger = get_logger("subscription")

SUB_TTL = 60 * 60 * 24 * 32  # 32 days


class SubscriptionStatus(StrEnum):
    FREE = "free"
    PRO = "pro"
    PRO_PLUS = "pro_plus"


class SubscriptionService:
    """Reads and writes subscription status in Redis."""

    def __init__(self, redis: RedisService) -> None:
        self._redis = redis

    async def get_user_status(self, user_id_hash: str) -> SubscriptionStatus:
        key = f"sub:v1:{user_id_hash}"
        status = await self._redis.get(key)
        if status and status in {s.value for s in SubscriptionStatus}:
            return SubscriptionStatus(status)
        return SubscriptionStatus.FREE

    async def set_user_status(
        self,
        user_id_hash: str,
        status: SubscriptionStatus,
        ttl_seconds: int = SUB_TTL,
    ) -> None:
        key = f"sub:v1:{user_id_hash}"
        await self._redis.set(key, status.value, ttl_seconds)
        logger.info(
            "subscription_updated",
            user_hash=user_id_hash[:8],
            status=status.value,
        )

    @staticmethod
    def requires_pro(status: SubscriptionStatus) -> bool:
        return status in (SubscriptionStatus.PRO, SubscriptionStatus.PRO_PLUS)
