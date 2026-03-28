"""Daily cleanup of expired semantic cache entries in Qdrant."""

from __future__ import annotations

import asyncio
from datetime import UTC, datetime

from qdrant_client import QdrantClient
from qdrant_client.models import FieldCondition, Filter, PointIdsList, Range

from app.core.config import get_settings

CACHE_COLLECTION = "yuni_semantic_cache_v1"


async def cleanup() -> None:
    settings = get_settings()
    qdrant = QdrantClient(url=settings.QDRANT_URL)

    try:
        results, _next = qdrant.scroll(
            collection_name=CACHE_COLLECTION,
            scroll_filter=Filter(
                must=[FieldCondition(
                    key="expires_at",
                    range=Range(lt=datetime.now(UTC).isoformat()),
                )]
            ),
            limit=100,
        )
        ids_to_delete = [r.id for r in results]
        if ids_to_delete:
            qdrant.delete(
                collection_name=CACHE_COLLECTION,
                points_selector=PointIdsList(points=ids_to_delete),
            )
            print(f"Deleted {len(ids_to_delete)} expired cache entries")
        else:
            print("No expired entries found")
    finally:
        qdrant.close()


if __name__ == "__main__":
    asyncio.run(cleanup())
