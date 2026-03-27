"""Orchestrates cache-aside pattern with Mistral and Yunicity services."""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING

from app.core.config import CacheTTL
from app.core.logging import get_logger
from app.models.recommend import RecommendationOutput

if TYPE_CHECKING:
    from app.models.recommend import UserInput
    from app.services.mistral_service import MistralService
    from app.services.redis_service import RedisService
    from app.services.yunicity_api import YunicityAPIService

logger = get_logger("recommendation")


class RecommendationService:
    """Cache-aside orchestrator: Redis cache -> Yunicity data -> Mistral AI."""

    def __init__(
        self,
        redis: RedisService,
        mistral: MistralService,
        yunicity: YunicityAPIService,
    ) -> None:
        self._redis = redis
        self._mistral = mistral
        self._yunicity = yunicity

    async def get_recommendations(
        self,
        user: UserInput,
    ) -> tuple[RecommendationOutput, str]:
        """Return (output, source) using cache-aside pattern.

        source is one of: yuni_ai_cache, yuni_ai_mistral, yuni_ai_fallback
        """
        cache_key = user.cache_key

        cached = await self._redis.get(cache_key)
        if cached is not None:
            logger.info("cache_hit", cache_key=cache_key[:20])
            output = RecommendationOutput.model_validate_json(cached)
            return output, "yuni_ai_cache"

        logger.info("cache_miss_fetching_data", city=user.city)
        passport, map_data = await asyncio.gather(
            self._yunicity.get_user_passport(user.user_id_hash),
            self._yunicity.get_map_data(user.geo.lat_truncated, user.geo.lng_truncated),
        )

        output, mistral_source = await self._mistral.recommend(user, map_data, passport)

        await self._redis.set(
            cache_key,
            output.model_dump_json(),
            ttl_seconds=CacheTTL.RECOMMENDATIONS,
        )

        source = "yuni_ai_mistral" if mistral_source == "mistral" else "yuni_ai_fallback"
        return output, source

    async def invalidate_user_cache(self, user_id_hash: str) -> int:
        """RGPD: anonymous cache keys expire naturally via TTL."""
        logger.info("cache_invalidation_requested", user_hash=user_id_hash[:8])
        return 0
