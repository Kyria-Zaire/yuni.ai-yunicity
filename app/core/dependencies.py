"""FastAPI dependency injection providers."""

from __future__ import annotations

from functools import lru_cache

from app.core.config import Settings, get_settings
from app.services.yunicity_api import YunicityAPIService


@lru_cache(maxsize=1)
def get_yunicity_service(
    settings: Settings | None = None,
) -> YunicityAPIService:
    """Return the appropriate Yunicity API service based on environment."""
    if settings is None:
        settings = get_settings()

    if settings.YUNI_ENV in ("dev", "recette"):
        from app.mocks.yunicity_mock_service import MockYunicityAPIService
        return MockYunicityAPIService()

    from app.services.yunicity_api import RealYunicityAPIService
    return RealYunicityAPIService()
