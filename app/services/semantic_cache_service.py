"""Semantic cache v2 — similarity-based caching via Qdrant."""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Any

from pydantic import BaseModel

from app.core.logging import get_logger
from app.core.metrics import metrics

if TYPE_CHECKING:
    from app.services.redis_service import RedisService

logger = get_logger("semantic_cache")

SIMILARITY_THRESHOLD = 0.92
CACHE_COLLECTION = "yuni_semantic_cache_v1"


class SemanticCacheEntry(BaseModel):
    cache_id: str
    query_text: str
    result_json: str
    hit_count: int = 0
    created_at: datetime
    expires_at: datetime


class SemanticCacheService:
    """Caches Mistral responses by semantic similarity using Qdrant vectors."""

    def __init__(
        self,
        embedding_svc: Any,
        qdrant_client: Any | None,
        redis: RedisService,
    ) -> None:
        self._embed = embedding_svc
        self._qdrant = qdrant_client
        self._redis = redis

    @property
    def available(self) -> bool:
        return self._qdrant is not None and self._embed is not None

    async def get(self, query_text: str) -> str | None:
        if not self.available or self._qdrant is None:
            return None
        try:
            query_vector = await self._embed.embed_text(query_text)
            results = self._qdrant.search(
                collection_name=CACHE_COLLECTION,
                query_vector=query_vector,
                limit=1,
                score_threshold=SIMILARITY_THRESHOLD,
                with_payload=True,
            )
            if not results:
                return None
            best = results[0]
            if best.score >= SIMILARITY_THRESHOLD:
                logger.info("semantic_cache_hit", similarity=round(best.score, 3))
                metrics.record_semantic_cache_hit()
                return str(best.payload.get("result_json", ""))
        except Exception as exc:
            logger.warning("semantic_cache_get_failed", error=str(exc))
        return None

    async def set(
        self,
        query_text: str,
        result_json: str,
        ttl_days: int = 1,
    ) -> None:
        if not self.available or self._qdrant is None:
            return
        try:
            query_vector = await self._embed.embed_text(query_text)
            cache_id = hashlib.md5(query_text.encode()).hexdigest()  # noqa: S324
            point_id = int(cache_id[:8], 16)
            self._qdrant.upsert(
                collection_name=CACHE_COLLECTION,
                points=[{
                    "id": point_id,
                    "vector": query_vector,
                    "payload": {
                        "result_json": result_json,
                        "created_at": datetime.now(UTC).isoformat(),
                        "expires_at": (
                            datetime.now(UTC) + timedelta(days=ttl_days)
                        ).isoformat(),
                    },
                }],
            )
        except Exception as exc:
            logger.warning("semantic_cache_set_failed", error=str(exc))

    @staticmethod
    def build_query_text(
        city: str,
        interests: list[str],
        points_bucket: int,
    ) -> str:
        sorted_interests = sorted(interests)
        return f"recommandations {city} {' '.join(sorted_interests)} points_{points_bucket}"
