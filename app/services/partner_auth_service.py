"""Partner SDK authentication — API key generation, verification, rate limiting."""

from __future__ import annotations

import hashlib
import secrets
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from app.core.logging import get_logger
from app.models.partner import TIERS_CONFIG, PartnerConfig, PartnerTier

if TYPE_CHECKING:
    from app.services.redis_service import RedisService

logger = get_logger("partner_auth")


class PartnerAuthService:
    """Manages partner API keys, verification, and rate limiting."""

    def __init__(self, redis: RedisService) -> None:
        self._redis = redis

    @staticmethod
    def generate_api_key() -> tuple[str, str]:
        random_part = secrets.token_urlsafe(32)
        api_key = f"yai_pk_{random_part}"
        api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        return api_key, api_key_hash

    async def register_partner(
        self,
        name: str,
        contact_email: str,
        tier: PartnerTier,
        allowed_cities: list[str] | None = None,
    ) -> tuple[PartnerConfig, str]:
        api_key, api_key_hash = self.generate_api_key()

        tier_config = TIERS_CONFIG.get(tier, TIERS_CONFIG[PartnerTier.SANDBOX])
        rate_limit_raw = tier_config.get("rate_limit")
        rate_limit_val = int(str(rate_limit_raw)) if rate_limit_raw is not None else 100000

        config = PartnerConfig(
            name=name,
            contact_email=contact_email,
            tier=tier,
            api_key_hash=api_key_hash,
            allowed_cities=allowed_cities or ["reims"],
            rate_limit_per_hour=rate_limit_val,
        )

        await self._redis.set(
            f"partner:hash:{api_key_hash}",
            config.model_dump_json(),
            ttl_seconds=60 * 60 * 24 * 365,
        )

        logger.info(
            "partner_registered",
            partner_id=config.partner_id,
            tier=tier.value,
        )
        return config, api_key

    async def verify_api_key(self, api_key: str) -> PartnerConfig | None:
        api_key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        raw = await self._redis.get(f"partner:hash:{api_key_hash}")
        if not raw:
            return None
        return PartnerConfig.model_validate_json(raw)

    async def check_rate_limit(
        self, partner_id: str, tier: PartnerTier,
    ) -> bool:
        tier_config = TIERS_CONFIG.get(tier, TIERS_CONFIG[PartnerTier.SANDBOX])
        limit_raw = tier_config.get("rate_limit")
        if limit_raw is None:
            return True

        limit_val = int(str(limit_raw))
        hour_key = datetime.now(UTC).strftime("%Y-%m-%d-%H")
        key = f"partner:ratelimit:{partner_id}:{hour_key}"
        count_raw = await self._redis.get(key)
        count = int(count_raw) if count_raw else 0

        if count >= limit_val:
            return False

        client = self._redis._client()
        await client.incr(key)
        await client.expire(key, 3600)
        return True
