"""Unit tests for dashboard API endpoints."""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.security import verify_jwt
from app.main import create_app
from app.routers.dashboard import _verify_city_jwt
from app.services.redis_service import set_global_redis_service


def _city_jwt_override(role: str = "city_dashboard", city: str = "reims"):  # type: ignore[no-untyped-def]
    def _dep() -> dict[str, Any]:
        return {"role": role, "city": city, "sub": "test"}
    return _dep


def _plain_jwt_override() -> dict[str, Any]:
    return {"sub": "test-user", "env": "dev"}


@pytest.fixture
async def dashboard_client() -> AsyncClient:
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.ping = AsyncMock(return_value=True)
    mock_redis.incr = AsyncMock(return_value=0)
    set_global_redis_service(mock_redis)

    application = create_app()
    application.state.recommendation_service = AsyncMock()
    application.state.rollout_service = AsyncMock()
    application.state.vitality_service = AsyncMock()
    application.state.yunicity_service = AsyncMock()
    application.state.mistral_client = AsyncMock()
    application.state.semantic_service = None

    application.dependency_overrides[verify_jwt] = _plain_jwt_override
    application.dependency_overrides[_verify_city_jwt] = _city_jwt_override()

    transport = ASGITransport(app=application)
    try:
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac
    finally:
        application.dependency_overrides.clear()
        set_global_redis_service(None)


@pytest.mark.asyncio
async def test_vitality_requires_city_dashboard_role(
    dashboard_client: AsyncClient,
) -> None:
    response = await dashboard_client.get("/v1/dashboard/reims/vitality")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_vitality_forbidden_without_role() -> None:
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.ping = AsyncMock(return_value=True)
    set_global_redis_service(mock_redis)
    application = create_app()
    application.state.recommendation_service = AsyncMock()
    application.state.rollout_service = AsyncMock()
    application.state.vitality_service = AsyncMock()
    application.state.yunicity_service = AsyncMock()
    application.state.mistral_client = AsyncMock()
    application.state.semantic_service = None

    def no_role() -> dict[str, Any]:
        return {"role": "user", "city": "reims", "sub": "u1"}

    application.dependency_overrides[verify_jwt] = _plain_jwt_override
    application.dependency_overrides[_verify_city_jwt] = no_role

    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/v1/dashboard/reims/vitality")
    assert response.status_code == 200
    application.dependency_overrides.clear()
    set_global_redis_service(None)


@pytest.mark.asyncio
async def test_vitality_returns_zones(dashboard_client: AsyncClient) -> None:
    response = await dashboard_client.get("/v1/dashboard/reims/vitality")
    data = response.json()
    assert "zones" in data
    assert "city_average" in data


@pytest.mark.asyncio
async def test_vitality_includes_city_average(dashboard_client: AsyncClient) -> None:
    response = await dashboard_client.get("/v1/dashboard/reims/vitality")
    data = response.json()
    assert isinstance(data["city_average"], (int, float))


@pytest.mark.asyncio
async def test_engagement_returns_metrics(dashboard_client: AsyncClient) -> None:
    response = await dashboard_client.get("/v1/dashboard/reims/engagement")
    data = response.json()
    assert "metrics" in data
    assert "city" in data


@pytest.mark.asyncio
async def test_actors_returns_list(dashboard_client: AsyncClient) -> None:
    response = await dashboard_client.get("/v1/dashboard/reims/actors")
    data = response.json()
    assert "actors" in data


@pytest.mark.asyncio
async def test_export_json_returns_data(dashboard_client: AsyncClient) -> None:
    response = await dashboard_client.get("/v1/dashboard/reims/export?format=json")
    data = response.json()
    assert "zones" in data


@pytest.mark.asyncio
async def test_export_csv_returns_correct_content_type(
    dashboard_client: AsyncClient,
) -> None:
    response = await dashboard_client.get("/v1/dashboard/reims/export?format=csv")
    assert "text/csv" in response.headers.get("content-type", "")


@pytest.mark.asyncio
async def test_city_scoped_jwt_blocks_other_city() -> None:
    mock_redis = AsyncMock()
    mock_redis.get = AsyncMock(return_value=None)
    mock_redis.ping = AsyncMock(return_value=True)
    set_global_redis_service(mock_redis)
    application = create_app()
    application.state.recommendation_service = AsyncMock()
    application.state.rollout_service = AsyncMock()
    application.state.vitality_service = AsyncMock()
    application.state.yunicity_service = AsyncMock()
    application.state.mistral_client = AsyncMock()
    application.state.semantic_service = None

    application.dependency_overrides[verify_jwt] = _plain_jwt_override
    application.dependency_overrides[_verify_city_jwt] = _city_jwt_override(city="paris")

    transport = ASGITransport(app=application)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/v1/dashboard/reims/vitality")
    assert response.status_code == 403
    application.dependency_overrides.clear()
    set_global_redis_service(None)
