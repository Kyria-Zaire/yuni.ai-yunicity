"""Integration tests for the full FastAPI application foundation."""

import pytest
from httpx import AsyncClient


class TestHealthEndpoints:
    """Verify health check endpoints work end-to-end."""

    @pytest.mark.asyncio
    async def test_health_returns_200_with_valid_schema(self, client: AsyncClient) -> None:
        response = await client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "version" in data
        assert "environment" in data
        assert "timestamp" in data
        assert "services" in data

    @pytest.mark.asyncio
    async def test_health_shows_correct_environment(self, client: AsyncClient) -> None:
        response = await client.get("/health")
        data = response.json()
        assert data["environment"] == "dev"

    @pytest.mark.asyncio
    async def test_health_shows_redis_status(self, client: AsyncClient) -> None:
        response = await client.get("/health")
        data = response.json()
        assert data["services"]["redis"] in ("connected", "disconnected", "not_configured")

    @pytest.mark.asyncio
    async def test_ready_endpoint_returns_response(self, client: AsyncClient) -> None:
        response = await client.get("/health/ready")
        assert response.status_code in (200, 503)
        data = response.json()
        assert data["status"] in ("ready", "not_ready")


class TestSecurityMiddleware:
    """Verify security headers and CORS configuration."""

    @pytest.mark.asyncio
    async def test_security_headers_on_all_responses(self, client: AsyncClient) -> None:
        response = await client.get("/health")
        assert response.headers["X-Content-Type-Options"] == "nosniff"
        assert response.headers["X-Frame-Options"] == "DENY"
        assert response.headers["X-XSS-Protection"] == "1; mode=block"
        assert response.headers["Content-Security-Policy"] == "default-src 'none'"

    @pytest.mark.asyncio
    async def test_no_server_header_exposed(self, client: AsyncClient) -> None:
        response = await client.get("/health")
        assert "server" not in response.headers

    @pytest.mark.asyncio
    async def test_request_id_present(self, client: AsyncClient) -> None:
        response = await client.get("/health")
        assert "X-Request-ID" in response.headers
        # UUID format check
        request_id = response.headers["X-Request-ID"]
        assert len(request_id) == 36


class TestErrorHandling:
    """Verify error responses follow RFC 7807 format."""

    @pytest.mark.asyncio
    async def test_404_returns_json(self, client: AsyncClient) -> None:
        response = await client.get("/nonexistent-route")
        assert response.status_code == 404

    @pytest.mark.asyncio
    async def test_method_not_allowed_returns_405(self, client: AsyncClient) -> None:
        response = await client.post("/health")
        assert response.status_code == 405

    @pytest.mark.asyncio
    async def test_unknown_route_returns_404(self, client: AsyncClient) -> None:
        response = await client.get("/api/v99/fake")
        assert response.status_code == 404
