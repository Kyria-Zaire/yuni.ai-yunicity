"""Integration tests for the semantic recommendation pipeline (YAI-020)."""

from __future__ import annotations

import os
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from tests.fixtures.auth_fixtures import TEST_RSA_PUBLIC_KEY, create_test_jwt
from tests.fixtures.recommend_fixtures import (
    VALID_USER_ID_HASH,
    make_recommendation_output,
)

os.environ.setdefault("YUNI_ENV", "dev")
os.environ.setdefault("JWT_PUBLIC_KEY", TEST_RSA_PUBLIC_KEY)
os.environ.setdefault("DISABLE_MOCK_LATENCY", "true")

VALID_BODY = {
    "user_id_hash": VALID_USER_ID_HASH,
    "city": "reims",
    "interests": ["sport", "culture"],
    "points": 340,
    "geo": {"lat_truncated": 49.25, "lng_truncated": 4.03},
}


def _mock_recommendation_service(source: str = "yuni_ai_mistral") -> MagicMock:
    svc = MagicMock()
    svc.get_recommendations = AsyncMock(
        return_value=(make_recommendation_output(source), source),
    )
    return svc


@pytest.fixture
async def client():  # type: ignore[no-untyped-def]
    from app.core.config import get_settings
    get_settings.cache_clear()

    with patch.dict(os.environ, {
        "YUNI_ENV": "dev",
        "JWT_PUBLIC_KEY": TEST_RSA_PUBLIC_KEY,
        "ALLOWED_HOSTS": "*",
        "DISABLE_MOCK_LATENCY": "true",
    }):
        get_settings.cache_clear()
        from app.main import create_app
        app = create_app()

        mock_svc = _mock_recommendation_service("yuni_ai_mistral")
        app.state.recommendation_service = mock_svc

        mock_rollout = MagicMock()
        mock_rollout.is_eligible = MagicMock(return_value=True)
        mock_rollout.rollout_percentage = 10
        app.state.rollout_service = mock_rollout

        from app.services.vitality_service import VitalityIndexService
        mock_redis = AsyncMock()
        mock_redis.get = AsyncMock(return_value=None)
        mock_redis.set = AsyncMock(return_value=True)
        app.state.vitality_service = VitalityIndexService(mock_redis)

        from app.services.redis_service import RedisService, set_global_redis_service
        mock_global_redis = AsyncMock(spec=RedisService)
        mock_global_redis.get = AsyncMock(return_value=None)
        mock_global_redis.set = AsyncMock(return_value=True)
        mock_global_redis.ping = AsyncMock(return_value=True)
        set_global_redis_service(mock_global_redis)

        mock_yunicity = MagicMock()
        from app.models.vitality import VitalityInputData
        mock_yunicity.get_vitality_data = AsyncMock(return_value=VitalityInputData(
            active_users_30d=200, event_participation_rate=0.4,
            avg_citizen_points=500, posts_count_30d=80,
            content_freshness_score=0.6, content_diversity_score=0.5,
            active_actors_count=15, avg_actor_activity_score=6.0,
            actor_category_diversity=0.7, upcoming_events_30d=10,
            avg_event_fill_rate=0.5, events_per_week=2.0,
            active_tribes_count=4, avg_tribe_activity_rate=0.4,
            avg_tribe_activity_score=6.5,
        ))
        app.state.yunicity_service = mock_yunicity

        async with AsyncClient(
            transport=ASGITransport(app=app),
            base_url="http://testserver",
        ) as ac:
            yield ac, mock_svc

        set_global_redis_service(None)
    get_settings.cache_clear()


class TestSemanticPipeline:
    @pytest.mark.asyncio
    async def test_full_pipeline_e2e(self, client) -> None:  # type: ignore[no-untyped-def]
        ac, _mock_svc = client
        token = create_test_jwt()
        headers = {"Authorization": f"Bearer {token}"}

        resp = await ac.post("/v1/recommend/engagement", json=VALID_BODY, headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["data"]["source"] == "yuni_ai_mistral"

    @pytest.mark.asyncio
    async def test_second_call_can_use_cache(self, client) -> None:  # type: ignore[no-untyped-def]
        ac, mock_svc = client
        token = create_test_jwt()
        headers = {"Authorization": f"Bearer {token}"}

        await ac.post("/v1/recommend/engagement", json=VALID_BODY, headers=headers)

        mock_svc.get_recommendations = AsyncMock(
            return_value=(make_recommendation_output("yuni_ai_cache"), "yuni_ai_cache"),
        )

        resp2 = await ac.post("/v1/recommend/engagement", json=VALID_BODY, headers=headers)
        assert resp2.status_code == 200
        assert resp2.json()["data"]["source"] == "yuni_ai_cache"


class TestVitalityEndpoint:
    @pytest.mark.asyncio
    async def test_vitality_returns_score(self, client) -> None:  # type: ignore[no-untyped-def]
        ac, _ = client
        token = create_test_jwt()
        resp = await ac.get(
            "/v1/vitality/reims/centre",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "data" in data
        assert 0 <= data["data"]["score"] <= 100
        assert data["data"]["grade"] in ("A", "B", "C", "D", "E")

    @pytest.mark.asyncio
    async def test_vitality_requires_jwt(self, client) -> None:  # type: ignore[no-untyped-def]
        ac, _ = client
        resp = await ac.get("/v1/vitality/reims/centre")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_vitality_has_dimensions(self, client) -> None:  # type: ignore[no-untyped-def]
        ac, _ = client
        token = create_test_jwt()
        resp = await ac.get(
            "/v1/vitality/reims/centre",
            headers={"Authorization": f"Bearer {token}"},
        )
        data = resp.json()["data"]
        assert len(data["dimensions"]) == 5
