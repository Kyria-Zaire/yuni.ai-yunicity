"""Unit tests for health endpoints and security middleware."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_endpoint_returns_200(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_health_includes_environment(client: AsyncClient) -> None:
    response = await client.get("/health")
    data = response.json()
    assert data["environment"] == "dev"


@pytest.mark.asyncio
async def test_health_includes_version(client: AsyncClient) -> None:
    response = await client.get("/health")
    data = response.json()
    assert data["version"] == "1.2.0"


@pytest.mark.asyncio
async def test_health_includes_services(client: AsyncClient) -> None:
    response = await client.get("/health")
    data = response.json()
    assert "redis" in data["services"]
    assert "qdrant" in data["services"]
    assert "mistral" in data["services"]


@pytest.mark.asyncio
async def test_health_redis_status_when_not_configured(client: AsyncClient) -> None:
    response = await client.get("/health")
    data = response.json()
    assert data["services"]["redis"] == "not_configured"


@pytest.mark.asyncio
async def test_ready_endpoint_503_when_redis_not_configured(client: AsyncClient) -> None:
    response = await client.get("/health/ready")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "not_ready"


@pytest.mark.asyncio
async def test_security_headers_present(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert response.headers["X-XSS-Protection"] == "1; mode=block"
    assert response.headers["Content-Security-Policy"] == "default-src 'none'"


@pytest.mark.asyncio
async def test_request_id_header_present(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert "X-Request-ID" in response.headers


@pytest.mark.asyncio
async def test_unknown_route_returns_404(client: AsyncClient) -> None:
    response = await client.get("/nonexistent")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_method_not_allowed_returns_405(client: AsyncClient) -> None:
    response = await client.post("/health")
    assert response.status_code == 405
