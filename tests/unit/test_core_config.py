"""Unit tests for core configuration."""

from app.core.config import CacheTTL, Settings


def test_settings_defaults() -> None:
    settings = Settings()
    assert settings.YUNI_ENV == "dev"
    assert settings.APP_NAME == "yuni-ai"
    assert settings.APP_VERSION == "0.2.0"


def test_settings_is_dev() -> None:
    settings = Settings(YUNI_ENV="dev")
    assert settings.is_dev is True
    assert settings.is_prod is False


def test_settings_is_prod() -> None:
    settings = Settings(YUNI_ENV="prod")
    assert settings.is_prod is True
    assert settings.is_dev is False


def test_cache_ttl_values() -> None:
    assert CacheTTL.RECOMMENDATIONS == 86400
    assert CacheTTL.TRIBES == 21600
    assert CacheTTL.EVENTS == 3600
    assert CacheTTL.USER_PROFILE == 604800
    assert CacheTTL.CITY_VITALITY == 2592000
