"""Qdrant vector store and Mistral embedding pipeline."""

from __future__ import annotations

import asyncio
import hashlib
import json
from typing import TYPE_CHECKING, Any

from app.core.config import CacheTTL
from app.core.logging import get_logger

if TYPE_CHECKING:
    from app.core.config import Settings
    from app.models.yunicity import Actor, Tribe
    from app.services.redis_service import RedisService

logger = get_logger("embedding")

COLLECTION_ACTORS = "yuni_actors_v1"
COLLECTION_TRIBES = "yuni_tribes_v1"
VECTOR_SIZE = 1024


class EmbeddingService:
    """Manages Qdrant collections and Mistral embeddings with Redis caching."""

    def __init__(
        self,
        settings: Settings,
        redis: RedisService,
    ) -> None:
        from qdrant_client import QdrantClient
        from qdrant_client.models import Distance, VectorParams

        api_key = (
            settings.QDRANT_API_KEY.get_secret_value()
            if settings.QDRANT_API_KEY
            else None
        )
        self.qdrant: Any = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=api_key,
            timeout=10,
        )
        self._redis = redis
        self._mistral_key = settings.MISTRAL_API_KEY.get_secret_value()
        self._mistral_client: Any = None
        self._distance = Distance
        self._vector_params_cls = VectorParams

    def _get_mistral(self) -> Any:
        if self._mistral_client is None:
            from mistralai import Mistral
            self._mistral_client = Mistral(api_key=self._mistral_key)
        return self._mistral_client

    async def ensure_collections(self) -> None:
        """Create Qdrant collections if they don't exist."""
        existing = [
            c.name for c in self.qdrant.get_collections().collections
        ]
        for name in [COLLECTION_ACTORS, COLLECTION_TRIBES]:
            if name not in existing:
                self.qdrant.create_collection(
                    collection_name=name,
                    vectors_config=self._vector_params_cls(
                        size=VECTOR_SIZE,
                        distance=self._distance.COSINE,
                    ),
                )
                logger.info("qdrant_collection_created", name=name)

    async def embed_text(self, text: str) -> list[float]:
        """Generate an embedding via mistral-embed with Redis cache."""
        text_hash = hashlib.sha256(text.encode()).hexdigest()[:16]
        cache_key = f"embed:v1:{text_hash}"

        cached = await self._redis.get(cache_key)
        if cached:
            result: list[float] = json.loads(cached)
            return result

        client = self._get_mistral()
        response = await client.embeddings.create_async(
            model="mistral-embed",
            inputs=[text[:2000]],
        )
        embedding: list[float] = response.data[0].embedding

        await self._redis.set(
            cache_key,
            json.dumps(embedding),
            ttl_seconds=CacheTTL.CITY_VITALITY,
        )
        return embedding

    async def index_actor(self, actor: Actor) -> None:
        from qdrant_client.models import PointStruct

        text = f"{actor.name}. {actor.description}. {' '.join(actor.tags)}"
        embedding = await self.embed_text(text)
        self.qdrant.upsert(
            collection_name=COLLECTION_ACTORS,
            points=[PointStruct(
                id=_stable_id(actor.id),
                vector=embedding,
                payload={
                    "id": actor.id,
                    "name": actor.name,
                    "category": actor.category,
                    "city": actor.city.lower(),
                    "tags": actor.tags,
                    "geo": actor.geo,
                },
            )],
        )

    async def index_tribe(self, tribe: Tribe) -> None:
        from qdrant_client.models import PointStruct

        text = (
            f"{tribe.name}. {tribe.description}. "
            f"Categorie: {tribe.category}"
        )
        embedding = await self.embed_text(text)
        self.qdrant.upsert(
            collection_name=COLLECTION_TRIBES,
            points=[PointStruct(
                id=_stable_id(tribe.id),
                vector=embedding,
                payload={
                    "id": tribe.id,
                    "name": tribe.name,
                    "category": tribe.category,
                    "city": tribe.city.lower(),
                    "members_count": tribe.members_count,
                    "activity_score": tribe.activity_score,
                },
            )],
        )

    async def index_batch(
        self,
        actors: list[Actor],
        tribes: list[Tribe],
        max_concurrent: int = 5,
    ) -> dict[str, int]:
        sem = asyncio.Semaphore(max_concurrent)

        async def _safe_actor(a: Actor) -> None:
            async with sem:
                await self.index_actor(a)

        async def _safe_tribe(t: Tribe) -> None:
            async with sem:
                await self.index_tribe(t)

        results = await asyncio.gather(
            *[_safe_actor(a) for a in actors],
            *[_safe_tribe(t) for t in tribes],
            return_exceptions=True,
        )
        errors = sum(1 for r in results if isinstance(r, Exception))
        logger.info(
            "batch_indexing_complete",
            actors=len(actors),
            tribes=len(tribes),
            errors=errors,
        )
        return {"actors": len(actors), "tribes": len(tribes), "errors": errors}

    def check_health(self) -> bool:
        try:
            self.qdrant.get_collections()
            return True
        except Exception:
            return False


def _stable_id(string_id: str) -> int:
    """Deterministic int ID for Qdrant from a string identifier."""
    return int(hashlib.md5(string_id.encode()).hexdigest()[:8], 16)  # noqa: S324
