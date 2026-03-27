"""Unit tests for VitalityIndexService (YAI-018)."""

from __future__ import annotations

from unittest.mock import AsyncMock

import pytest

from app.models.vitality import VitalityInputData
from app.services.vitality_service import WEIGHTS, VitalityIndexService


def _make_data(**overrides: object) -> VitalityInputData:
    defaults = {
        "active_users_30d": 300,
        "event_participation_rate": 0.5,
        "avg_citizen_points": 600.0,
        "posts_count_30d": 100,
        "content_freshness_score": 0.7,
        "content_diversity_score": 0.6,
        "active_actors_count": 25,
        "avg_actor_activity_score": 7.0,
        "actor_category_diversity": 0.8,
        "upcoming_events_30d": 15,
        "avg_event_fill_rate": 0.6,
        "events_per_week": 3.0,
        "active_tribes_count": 5,
        "avg_tribe_activity_rate": 0.5,
        "avg_tribe_activity_score": 7.0,
    }
    defaults.update(overrides)
    return VitalityInputData.model_validate(defaults)


def _mock_redis(prev_score: str | None = None) -> AsyncMock:
    redis = AsyncMock()
    redis.get = AsyncMock(return_value=prev_score)
    redis.set = AsyncMock(return_value=True)
    return redis


class TestCompute:
    @pytest.mark.asyncio
    async def test_score_between_0_and_100(self) -> None:
        svc = VitalityIndexService(_mock_redis())
        result = await svc.compute("reims", "centre", _make_data())
        assert 0 <= result.score <= 100

    @pytest.mark.asyncio
    async def test_grade_a_for_high_score(self) -> None:
        svc = VitalityIndexService(_mock_redis())
        data = _make_data(
            active_users_30d=500, event_participation_rate=1.0,
            avg_citizen_points=1000, posts_count_30d=200,
            content_freshness_score=1.0, content_diversity_score=1.0,
            active_actors_count=50, avg_actor_activity_score=10.0,
            actor_category_diversity=1.0, upcoming_events_30d=30,
            avg_event_fill_rate=1.0, events_per_week=5.0,
            active_tribes_count=10, avg_tribe_activity_rate=1.0,
            avg_tribe_activity_score=10.0,
        )
        result = await svc.compute("reims", "centre", data)
        assert result.grade == "A"

    @pytest.mark.asyncio
    async def test_grade_e_for_low_score(self) -> None:
        svc = VitalityIndexService(_mock_redis())
        data = _make_data(
            active_users_30d=0, event_participation_rate=0,
            avg_citizen_points=0, posts_count_30d=0,
            content_freshness_score=0, content_diversity_score=0,
            active_actors_count=0, avg_actor_activity_score=0,
            actor_category_diversity=0, upcoming_events_30d=0,
            avg_event_fill_rate=0, events_per_week=0,
            active_tribes_count=0, avg_tribe_activity_rate=0,
            avg_tribe_activity_score=0,
        )
        result = await svc.compute("reims", "centre", data)
        assert result.grade == "E"
        assert result.score == 0.0


class TestDimensions:
    @pytest.mark.asyncio
    async def test_engagement_weight_is_030(self) -> None:
        svc = VitalityIndexService(_mock_redis())
        result = await svc.compute("reims", "centre", _make_data())
        eng = next(d for d in result.dimensions if d.name == "engagement")
        assert eng.weight == 0.30

    def test_weights_sum_to_1(self) -> None:
        assert abs(sum(WEIGHTS.values()) - 1.0) < 1e-9

    @pytest.mark.asyncio
    async def test_composite_is_weighted_sum(self) -> None:
        svc = VitalityIndexService(_mock_redis())
        result = await svc.compute("reims", "centre", _make_data())
        expected = sum(d.score * d.weight for d in result.dimensions)
        assert abs(result.score - round(expected, 1)) < 0.2


class TestTrend:
    @pytest.mark.asyncio
    async def test_stable_when_no_previous(self) -> None:
        svc = VitalityIndexService(_mock_redis(prev_score=None))
        result = await svc.compute("reims", "centre", _make_data())
        assert result.trend == "stable"

    @pytest.mark.asyncio
    async def test_up_when_increased(self) -> None:
        svc = VitalityIndexService(_mock_redis(prev_score="30.0"))
        result = await svc.compute("reims", "centre", _make_data())
        assert result.score > 33.0
        assert result.trend == "up"


class TestValidation:
    def test_rejects_negative_users(self) -> None:
        with pytest.raises(ValueError, match="greater than or equal to 0"):
            _make_data(active_users_30d=-1)

    @pytest.mark.asyncio
    async def test_grade_thresholds_cover_all(self) -> None:
        from app.services.vitality_service import _grade
        assert _grade(100) == "A"
        assert _grade(80) == "A"
        assert _grade(79) == "B"
        assert _grade(60) == "B"
        assert _grade(59) == "C"
        assert _grade(40) == "C"
        assert _grade(39) == "D"
        assert _grade(20) == "D"
        assert _grade(19) == "E"
        assert _grade(0) == "E"
