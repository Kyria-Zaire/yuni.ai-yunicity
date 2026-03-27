"""Application settings loaded from environment variables."""

from functools import lru_cache
from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class CacheTTL:
    """Cache TTL constants in seconds."""

    RECOMMENDATIONS: int = 60 * 60 * 24       # 24h
    TRIBES: int = 60 * 60 * 6                 # 6h
    EVENTS: int = 60 * 60 * 1                 # 1h
    USER_PROFILE: int = 60 * 60 * 24 * 7      # 7 days
    CITY_VITALITY: int = 60 * 60 * 24 * 30    # 30 days


class Settings(BaseSettings):
    """Yuni AI application settings — loaded from .env file."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="forbid",
    )

    # --- Application ---
    YUNI_ENV: Literal["dev", "recette", "recette_mock", "preprod", "prod"] = "dev"
    APP_NAME: str = "yuni-ai"
    APP_VERSION: str = "1.3.0"
    LOG_LEVEL: str = "info"

    # --- AI Providers ---
    MISTRAL_API_KEY: SecretStr = SecretStr("test-key-not-real")
    OPENAI_API_KEY: SecretStr | None = None

    # --- Redis ---
    REDIS_URL: SecretStr = SecretStr("redis://localhost:6379/0")

    # --- Security ---
    JWT_PUBLIC_KEY: str = ""
    ALLOWED_HOSTS: str = "localhost,127.0.0.1"
    CORS_ORIGINS: str = "http://localhost:3000"
    RATE_LIMIT_PER_MINUTE: int = 20
    ANONYMIZATION_SALT: SecretStr = SecretStr("change-me-in-prod")

    # --- Qdrant ---
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_API_KEY: SecretStr | None = None

    # --- Yunicity APIs ---
    YUNICITY_API_BASE_URL: str = "http://localhost:4000"
    YUNICITY_SERVICE_TOKEN: SecretStr = SecretStr("mock-token-dev")

    # --- Rollout ---
    ROLLOUT_PERCENTAGE: int = 10
    ROLLOUT_CITIES: str = "reims"
    ADMIN_BYPASS_TOKEN: SecretStr = SecretStr("")
    INTERNAL_METRICS_TOKEN: SecretStr = SecretStr("")

    # --- Stripe ---
    STRIPE_SECRET_KEY: SecretStr = SecretStr("sk_test_mock")
    STRIPE_WEBHOOK_SECRET: SecretStr = SecretStr("whsec_mock")
    STRIPE_PUBLISHABLE_KEY: str = "pk_test_mock"

    # --- AWS (Polly TTS) ---
    AWS_ACCESS_KEY_ID: SecretStr = SecretStr("")
    AWS_SECRET_ACCESS_KEY: SecretStr = SecretStr("")
    AWS_REGION: str = "eu-west-1"
    TTS_VOICE_ID: str = "Lea"
    TTS_CACHE_ENABLED: bool = True
    TTS_MAX_CHARS: int = 3000

    # --- Voice (STT Whisper) ---
    WHISPER_LOCAL: bool = False

    # --- Firebase (Notifications) ---
    FIREBASE_CREDENTIALS_JSON: str = ""
    FIREBASE_PROJECT_ID: str = ""

    @property
    def is_prod(self) -> bool:
        """True if running in production."""
        return self.YUNI_ENV == "prod"

    @property
    def is_dev(self) -> bool:
        """True if running in local development."""
        return self.YUNI_ENV == "dev"

    @property
    def allowed_hosts_list(self) -> list[str]:
        """Hosts parsed from ALLOWED_HOSTS CSV."""
        return [host.strip() for host in self.ALLOWED_HOSTS.split(",") if host.strip()]

    @property
    def cors_origins_list(self) -> list[str]:
        """Origins parsed from CORS_ORIGINS CSV."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def rollout_cities_list(self) -> list[str]:
        """Cities parsed from ROLLOUT_CITIES CSV."""
        return [c.strip() for c in self.ROLLOUT_CITIES.split(",") if c.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return cached application settings singleton."""
    return Settings()
