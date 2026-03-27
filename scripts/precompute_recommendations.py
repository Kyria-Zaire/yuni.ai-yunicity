"""Pre-compute recommendations for common zone/interest/points combinations.

Intended to run nightly (2:00 AM) via Railway cron.
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import get_settings
from app.core.dependencies import get_yunicity_service
from app.core.logging import configure_logging, get_logger
from app.models.recommend import GeoInput, UserInput
from app.services.mistral_service import MistralService
from app.services.recommendation_service import RecommendationService
from app.services.redis_service import RedisService

logger = get_logger("precompute")

ZONES_REIMS = [
    {"lat": 49.25, "lng": 4.03, "label": "Centre"},
    {"lat": 49.26, "lng": 4.01, "label": "Clairmarais"},
    {"lat": 49.24, "lng": 4.06, "label": "Croix-Rouge"},
    {"lat": 49.23, "lng": 4.04, "label": "Wilson"},
    {"lat": 49.27, "lng": 4.02, "label": "Laon-Zola"},
]

COMMON_INTEREST_COMBOS: list[list[str]] = [
    ["sport"],
    ["culture"],
    ["environnement"],
    ["sport", "culture"],
    ["famille", "culture"],
    ["tech", "innovation"],
]

POINTS_BUCKETS = [0, 100, 300, 500, 1000]


async def precompute_zone(
    semaphore: asyncio.Semaphore,
    zone: dict[str, object],
    interests: list[str],
    points_bucket: int,
    service: RecommendationService,
) -> None:
    async with semaphore:
        fake_user = UserInput(
            user_id_hash="a" * 64,
            city="reims",
            interests=interests,
            points=points_bucket,
            geo=GeoInput(
                lat_truncated=float(zone["lat"]),
                lng_truncated=float(zone["lng"]),
            ),
        )
        await service.get_recommendations(fake_user)
        logger.info(
            "precomputed",
            zone=zone["label"],
            interests=interests,
            points=points_bucket,
        )


async def main() -> None:
    settings = get_settings()
    configure_logging(level=settings.LOG_LEVEL, is_dev=settings.is_dev)

    redis_service = RedisService(settings)
    mistral_service = MistralService(settings)
    yunicity_service = get_yunicity_service(settings)

    service = RecommendationService(
        redis=redis_service,
        mistral=mistral_service,
        yunicity=yunicity_service,
    )

    semaphore = asyncio.Semaphore(5)
    tasks = []
    for zone in ZONES_REIMS:
        for interests in COMMON_INTEREST_COMBOS:
            for points in POINTS_BUCKETS:
                tasks.append(
                    precompute_zone(semaphore, zone, interests, points, service)
                )

    results = await asyncio.gather(*tasks, return_exceptions=True)
    errors = [r for r in results if isinstance(r, Exception)]
    logger.info("precompute_complete", total=len(tasks), errors=len(errors))

    await redis_service.close()


if __name__ == "__main__":
    asyncio.run(main())
