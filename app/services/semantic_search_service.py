"""Semantic search over Qdrant vector collections."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from app.core.logging import get_logger
from app.models.semantic import ActorSearchResult, TribeSearchResult
from app.services.embedding_service import COLLECTION_ACTORS, COLLECTION_TRIBES

if TYPE_CHECKING:
    from app.services.embedding_service import EmbeddingService

logger = get_logger("semantic_search")


class SemanticSearchService:
    """Finds actors and tribes by cosine similarity to user interests."""

    def __init__(self, embedding: EmbeddingService) -> None:
        self._embedding = embedding

    async def search_actors(
        self,
        interests: list[str],
        city: str,
        top_k: int = 5,
    ) -> list[ActorSearchResult]:
        try:
            return await self._search_actors(interests, city, top_k)
        except Exception as exc:
            logger.warning(
                "qdrant_actor_search_failed",
                error=str(exc),
                interests=interests,
            )
            return []

    async def search_tribes(
        self,
        interests: list[str],
        city: str,
        top_k: int = 3,
    ) -> list[TribeSearchResult]:
        try:
            return await self._search_tribes(interests, city, top_k)
        except Exception as exc:
            logger.warning(
                "qdrant_tribe_search_failed",
                error=str(exc),
                interests=interests,
            )
            return []

    async def _search_actors(
        self,
        interests: list[str],
        city: str,
        top_k: int,
    ) -> list[ActorSearchResult]:
        from qdrant_client.models import FieldCondition, Filter, MatchValue

        query_text = _build_query(interests, "acteurs locaux")
        vector = await self._embedding.embed_text(query_text)

        results: Any = self._embedding.qdrant.search(
            collection_name=COLLECTION_ACTORS,
            query_vector=vector,
            query_filter=Filter(must=[
                FieldCondition(
                    key="city",
                    match=MatchValue(value=city.lower()),
                ),
            ]),
            limit=top_k,
            with_payload=True,
        )
        return [
            ActorSearchResult(
                actor_id=r.payload["id"],
                name=r.payload["name"],
                category=r.payload["category"],
                semantic_score=round(float(r.score), 4),
                payload=dict(r.payload),
            )
            for r in results
        ]

    async def _search_tribes(
        self,
        interests: list[str],
        city: str,
        top_k: int,
    ) -> list[TribeSearchResult]:
        from qdrant_client.models import FieldCondition, Filter, MatchValue

        query_text = _build_query(interests, "tribus citoyennes")
        vector = await self._embedding.embed_text(query_text)

        results: Any = self._embedding.qdrant.search(
            collection_name=COLLECTION_TRIBES,
            query_vector=vector,
            query_filter=Filter(must=[
                FieldCondition(
                    key="city",
                    match=MatchValue(value=city.lower()),
                ),
            ]),
            limit=top_k,
            with_payload=True,
        )
        return [
            TribeSearchResult(
                tribe_id=r.payload["id"],
                name=r.payload["name"],
                category=r.payload["category"],
                members_count=int(r.payload["members_count"]),
                semantic_score=round(float(r.score), 4),
                payload=dict(r.payload),
            )
            for r in results
        ]


def _build_query(interests: list[str], context: str) -> str:
    interests_text = ", ".join(interests)
    return (
        f"Recommandations de {context} pour quelqu'un "
        f"interesse par : {interests_text}. Activites locales."
    )
