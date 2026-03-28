"""FastAPI dependency injection providers."""

from __future__ import annotations

from typing import TYPE_CHECKING

from app.core.config import Settings, get_settings
from app.services.yunicity_api import YunicityAPIService

if TYPE_CHECKING:
    import httpx


def get_yunicity_service(
    settings: Settings | None = None,
    http_client: httpx.AsyncClient | None = None,
) -> YunicityAPIService:
    """Return the appropriate Yunicity API service based on environment."""
    if settings is None:
        settings = get_settings()

    if settings.YUNI_ENV in ("dev", "recette_mock"):
        from app.mocks.yunicity_mock_service import MockYunicityAPIService
        return MockYunicityAPIService()

    from app.services.yunicity_real_service import RealYunicityHTTPService

    if http_client is None:
        from app.core.http_client import get_http_client
        http_client = get_http_client()

    return RealYunicityHTTPService(settings, http_client)
