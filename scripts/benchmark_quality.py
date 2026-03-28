"""Benchmark semantic search quality against expected categories.

Usage: python scripts/benchmark_quality.py
"""

from __future__ import annotations

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.core.config import get_settings
from app.core.logging import configure_logging, get_logger
from app.services.embedding_service import EmbeddingService
from app.services.redis_service import RedisService
from app.services.semantic_search_service import SemanticSearchService

logger = get_logger("benchmark")

TEST_CASES = [
    {
        "name": "Famille sportive",
        "interests": ["sport", "famille"],
        "expected_categories": ["sport", "famille"],
    },
    {
        "name": "Artiste engage",
        "interests": ["culture", "environnement"],
        "expected_categories": ["culture", "environnement"],
    },
    {
        "name": "Tech entrepreneur",
        "interests": ["tech", "innovation"],
        "expected_categories": ["tech"],
    },
    {
        "name": "Citoyen solidaire",
        "interests": ["solidarite", "politique"],
        "expected_categories": ["civic"],
    },
]


async def benchmark() -> None:
    settings = get_settings()
    configure_logging(level="info", is_dev=True)

    redis = RedisService(settings)
    embedding = EmbeddingService(settings, redis)
    semantic = SemanticSearchService(embedding)

    results = []
    for case in TEST_CASES:
        actors = await semantic.search_actors(
            case["interests"], "reims", top_k=5,
        )
        categories = {a.category for a in actors}
        expected = set(case["expected_categories"])
        recall = len(categories & expected) / len(expected) if expected else 0.0
        results.append({
            "case": case["name"],
            "recall": round(recall, 2),
            "top": [a.name for a in actors[:3]],
        })

    avg = sum(r["recall"] for r in results) / len(results) if results else 0.0
    print("\nBenchmark Qualite Recommandations")
    print(f"Recall moyen : {avg:.0%}")
    for r in results:
        status = "OK" if r["recall"] >= 0.5 else "WARN"
        print(f"  [{status}] {r['case']}: {r['recall']:.0%} — {r['top']}")

    await redis.close()


if __name__ == "__main__":
    asyncio.run(benchmark())
