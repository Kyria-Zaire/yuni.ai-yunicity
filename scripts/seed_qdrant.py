"""Seed Qdrant with Reims actor and tribe data.

Usage: python scripts/seed_qdrant.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import get_settings
from app.core.dependencies import get_yunicity_service
from app.core.logging import configure_logging, get_logger
from app.services.embedding_service import EmbeddingService
from app.services.redis_service import RedisService

logger = get_logger("seed_qdrant")


async def main() -> None:
    settings = get_settings()
    configure_logging(level=settings.LOG_LEVEL, is_dev=settings.is_dev)

    redis = RedisService(settings)
    embedding = EmbeddingService(settings, redis)

    await embedding.ensure_collections()

    yunicity = get_yunicity_service(settings)
    tribes = await yunicity.get_city_tribes("reims")
    map_data = await yunicity.get_map_data(49.25, 4.03)
    actors = map_data.actors

    logger.info("starting_qdrant_seed", actors=len(actors), tribes=len(tribes))

    result = await embedding.index_batch(actors, tribes, max_concurrent=3)
    logger.info("qdrant_seed_complete", **result)

    await redis.close()


if __name__ == "__main__":
    asyncio.run(main())
