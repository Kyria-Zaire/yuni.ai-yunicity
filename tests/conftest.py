"""Shared pytest fixtures for the Yuni AI test suite."""

import os
from collections.abc import AsyncGenerator

import pytest
from httpx import ASGITransport, AsyncClient

# Set test environment before any app imports
os.environ.update({
    "YUNI_ENV": "dev",
    "MISTRAL_API_KEY": "test-key-not-real",
    "REDIS_URL": "redis://localhost:6379/0",
    "JWT_PUBLIC_KEY": "",
    "ANONYMIZATION_SALT": "test-salt",
    "YUNICITY_API_BASE_URL": "http://mock-not-called",
    "YUNICITY_SERVICE_TOKEN": "mock-token",
    "STRIPE_SECRET_KEY": "sk_test_mock",
    "STRIPE_WEBHOOK_SECRET": "whsec_mock",
    "STRIPE_PUBLISHABLE_KEY": "pk_test_mock",
    "ALLOWED_HOSTS": "*",
})

from app.main import app


@pytest.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client wired to the FastAPI test app."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
