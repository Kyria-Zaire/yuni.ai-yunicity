"""Orchestrates cache-aside pattern with semantic search, Mistral, and Yunicity."""

from __future__ import annotations

import asyncio
from typing import TYPE_CHECKING

from app.core.config import CacheTTL
from app.core.logging import get_logger
from app.core.metrics import metrics
from app.models.recommend import RecommendationOutput
from app.models.yunicity import MapData

if TYPE_CHECKING:
    from app.models.recommend import UserInput
    from app.services.mistral_service import MistralService
    from app.services.redis_service import RedisService
    from app.services.semantic_search_service import SemanticSearchService
    from app.services.yunicity_api import YunicityAPIService

logger = get_logger("recommendation")


class RecommendationService:
    """Cache-aside orchestrator with optional semantic pre-selection."""

    def __init__(
        self,
        redis: RedisService,
        mistral: MistralService,
        yunicity: YunicityAPIService,
        semantic: SemanticSearchService | None = None,
    ) -> None:
        self._redis = redis
        self._mistral = mistral
        self._yunicity = yunicity
        self._semantic = semantic

    async def get_recommendations(
        self,
        user: UserInput,
    ) -> tuple[RecommendationOutput, str]:
        """Return (output, source) using cache-aside + semantic search."""
        cache_key = user.cache_key

        cached = await self._redis.get(cache_key)
        if cached is not None:
            logger.info("cache_hit", cache_key=cache_key[:20])
            output = RecommendationOutput.model_validate_json(cached)
            return output, "yuni_ai_cache"

        logger.info("cache_miss_fetching_data", city=user.city)

        use_semantic = False
        semantic_actor_ids: set[str] = set()
        semantic_tribe_ids: set[str] = set()

        if self._semantic is not None:
            try:
                actor_cands, tribe_cands = await asyncio.gather(
                    self._semantic.search_actors(user.interests, user.city, top_k=5),
                    self._semantic.search_tribes(user.interests, user.city, top_k=3),
                )
                semantic_actor_ids = {c.actor_id for c in actor_cands}
                semantic_tribe_ids = {c.tribe_id for c in tribe_cands}
                use_semantic = bool(semantic_actor_ids or semantic_tribe_ids)
                metrics.record_semantic_search()
            except Exception as exc:
                logger.warning("semantic_search_failed", error=str(exc))
                metrics.record_semantic_fallback()

        passport, map_data = await asyncio.gather(
            self._yunicity.get_user_passport(user.user_id_hash),
            self._yunicity.get_map_data(
                user.geo.lat_truncated, user.geo.lng_truncated,
            ),
        )

        if use_semantic:
            filtered_actors = [
                a for a in map_data.actors if a.id in semantic_actor_ids
            ]
            reduced_map = MapData(
                actors=filtered_actors or map_data.actors[:5],
                tribes=map_data.tribes,
                events=map_data.events,
                zone=map_data.zone,
            )
        else:
            reduced_map = map_data

        output, mistral_source = await self._mistral.recommend(
            user, reduced_map, passport,
        )

        await self._redis.set(
            cache_key,
            output.model_dump_json(),
            ttl_seconds=CacheTTL.RECOMMENDATIONS,
        )

        source = (
            "yuni_ai_mistral" if mistral_source == "mistral"
            else "yuni_ai_fallback"
        )
        return output, source

    async def invalidate_user_cache(self, user_id_hash: str) -> int:
        """RGPD: anonymous cache keys expire naturally via TTL."""
        logger.info("cache_invalidation_requested", user_hash=user_id_hash[:8])
        return 0
