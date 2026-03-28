"""Vitality Index computation — composite score 0-100 over 5 dimensions."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import TYPE_CHECKING, Literal

from app.core.logging import get_logger
from app.models.vitality import VitalityDimension, VitalityIndex

if TYPE_CHECKING:
    from app.models.vitality import VitalityInputData
    from app.services.redis_service import RedisService

logger = get_logger("vitality")

WEIGHTS: dict[str, float] = {
    "engagement": 0.30,
    "content": 0.20,
    "actors": 0.20,
    "events": 0.15,
    "tribes": 0.15,
}

GRADE_THRESHOLDS: list[tuple[str, int]] = [
    ("A", 80), ("B", 60), ("C", 40), ("D", 20), ("E", 0),
]


class VitalityIndexService:
    """Computes the local vitality index for a geographic zone."""

    def __init__(self, redis: RedisService) -> None:
        self._redis = redis

    async def compute(
        self,
        city: str,
        zone: str,
        data: VitalityInputData,
    ) -> VitalityIndex:
        dimensions = [
            _compute_engagement(data),
            _compute_content(data),
            _compute_actors(data),
            _compute_events(data),
            _compute_tribes(data),
        ]
        composite = sum(d.score * d.weight for d in dimensions)
        composite = min(100.0, max(0.0, round(composite, 1)))
        trend = await self._compute_trend(city, zone, composite)
        now = datetime.now(UTC)

        return VitalityIndex(
            city=city,
            zone=zone,
            score=composite,
            grade=_grade(composite),
            dimensions=dimensions,
            trend=trend,
            computed_at=now,
            valid_until=now + timedelta(days=30),
        )

    async def _compute_trend(
        self,
        city: str,
        zone: str,
        current: float,
    ) -> Literal["up", "stable", "down"]:
        prev_key = f"vitality:prev:{city}:{zone}"
        prev = await self._redis.get(prev_key)
        if not prev:
            return "stable"
        try:
            delta = current - float(prev)
        except ValueError:
            return "stable"
        if delta > 3:
            return "up"
        if delta < -3:
            return "down"
        return "stable"


def _compute_engagement(data: VitalityInputData) -> VitalityDimension:
    active_score = min(100.0, (data.active_users_30d / 500) * 100)
    participation_score = data.event_participation_rate * 100
    points_score = min(100.0, (data.avg_citizen_points / 1000) * 100)
    raw = active_score * 0.5 + participation_score * 0.3 + points_score * 0.2
    return VitalityDimension(
        name="engagement",
        score=round(raw, 1),
        weight=WEIGHTS["engagement"],
        details={
            "active_users_30d": data.active_users_30d,
            "event_participation_rate": data.event_participation_rate,
            "avg_citizen_points": data.avg_citizen_points,
        },
    )


def _compute_content(data: VitalityInputData) -> VitalityDimension:
    volume = min(100.0, (data.posts_count_30d / 200) * 100)
    freshness = data.content_freshness_score * 100
    diversity = data.content_diversity_score * 100
    raw = volume * 0.4 + freshness * 0.35 + diversity * 0.25
    return VitalityDimension(
        name="content",
        score=round(raw, 1),
        weight=WEIGHTS["content"],
        details={
            "posts_count_30d": data.posts_count_30d,
            "content_freshness_score": data.content_freshness_score,
            "content_diversity_score": data.content_diversity_score,
        },
    )


def _compute_actors(data: VitalityInputData) -> VitalityDimension:
    density = min(100.0, (data.active_actors_count / 50) * 100)
    activity = (data.avg_actor_activity_score / 10) * 100
    diversity = data.actor_category_diversity * 100
    raw = density * 0.4 + activity * 0.35 + diversity * 0.25
    return VitalityDimension(
        name="actors",
        score=round(raw, 1),
        weight=WEIGHTS["actors"],
        details={
            "active_actors_count": data.active_actors_count,
            "avg_actor_activity_score": data.avg_actor_activity_score,
            "actor_category_diversity": data.actor_category_diversity,
        },
    )


def _compute_events(data: VitalityInputData) -> VitalityDimension:
    upcoming = min(100.0, (data.upcoming_events_30d / 30) * 100)
    fill = data.avg_event_fill_rate * 100
    freq = min(100.0, (data.events_per_week / 5) * 100)
    raw = upcoming * 0.4 + fill * 0.3 + freq * 0.3
    return VitalityDimension(
        name="events",
        score=round(raw, 1),
        weight=WEIGHTS["events"],
        details={
            "upcoming_events_30d": data.upcoming_events_30d,
            "avg_event_fill_rate": data.avg_event_fill_rate,
            "events_per_week": data.events_per_week,
        },
    )


def _compute_tribes(data: VitalityInputData) -> VitalityDimension:
    count = min(100.0, (data.active_tribes_count / 10) * 100)
    activity_rate = data.avg_tribe_activity_rate * 100
    activity_score = (data.avg_tribe_activity_score / 10) * 100
    raw = count * 0.4 + activity_rate * 0.3 + activity_score * 0.3
    return VitalityDimension(
        name="tribes",
        score=round(raw, 1),
        weight=WEIGHTS["tribes"],
        details={
            "active_tribes_count": data.active_tribes_count,
            "avg_tribe_activity_rate": data.avg_tribe_activity_rate,
            "avg_tribe_activity_score": data.avg_tribe_activity_score,
        },
    )


def _grade(score: float) -> str:
    for g, threshold in GRADE_THRESHOLDS:
        if score >= threshold:
            return g
    return "E"
