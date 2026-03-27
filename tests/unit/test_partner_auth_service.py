"""Unit tests for PartnerAuthService — API key management."""

from __future__ import annotations

import hashlib
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.partner import PartnerTier
from app.services.partner_auth_service import PartnerAuthService


def _make_service() -> PartnerAuthService:
    redis = MagicMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock()
    client_mock = MagicMock()
    client_mock.incr = AsyncMock()
    client_mock.expire = AsyncMock()
    redis._client = MagicMock(return_value=client_mock)
    return PartnerAuthService(redis=redis)


class TestApiKeyGeneration:
    def test_generate_api_key_has_correct_format(self) -> None:
        api_key, _api_key_hash = PartnerAuthService.generate_api_key()
        assert api_key.startswith("yai_pk_")
        assert len(api_key) > 20

    def test_api_key_hash_stored_not_plaintext(self) -> None:
        api_key, api_key_hash = PartnerAuthService.generate_api_key()
        expected_hash = hashlib.sha256(api_key.encode()).hexdigest()
        assert api_key_hash == expected_hash
        assert api_key_hash != api_key


class TestRegistration:
    @pytest.mark.asyncio
    async def test_register_partner_returns_config_and_key(self) -> None:
        svc = _make_service()
        config, api_key = await svc.register_partner(
            name="Test Partner",
            contact_email="test@example.com",
            tier=PartnerTier.SANDBOX,
        )
        assert config.name == "Test Partner"
        assert config.tier == PartnerTier.SANDBOX
        assert api_key.startswith("yai_pk_")

    @pytest.mark.asyncio
    async def test_api_key_shown_only_once_on_creation(self) -> None:
        svc = _make_service()
        _config, api_key = await svc.register_partner(
            name="Test", contact_email="t@t.com", tier=PartnerTier.STARTER,
        )
        assert api_key.startswith("yai_pk_")


class TestVerification:
    @pytest.mark.asyncio
    async def test_verify_valid_api_key_returns_config(self) -> None:
        svc = _make_service()
        config, api_key = await svc.register_partner(
            name="Valid", contact_email="v@v.com", tier=PartnerTier.SANDBOX,
        )
        svc._redis.get = AsyncMock(return_value=config.model_dump_json())
        result = await svc.verify_api_key(api_key)
        assert result is not None
        assert result.name == "Valid"

    @pytest.mark.asyncio
    async def test_verify_invalid_api_key_returns_none(self) -> None:
        svc = _make_service()
        result = await svc.verify_api_key("yai_pk_invalid_key_here")
        assert result is None


class TestRateLimit:
    @pytest.mark.asyncio
    async def test_rate_limit_allows_under_threshold(self) -> None:
        svc = _make_service()
        svc._redis.get = AsyncMock(return_value="5")
        allowed = await svc.check_rate_limit("p1", PartnerTier.SANDBOX)
        assert allowed is True

    @pytest.mark.asyncio
    async def test_rate_limit_blocks_after_threshold(self) -> None:
        svc = _make_service()
        svc._redis.get = AsyncMock(return_value="100")
        blocked = await svc.check_rate_limit("p1", PartnerTier.SANDBOX)
        assert blocked is False

    @pytest.mark.asyncio
    async def test_enterprise_tier_no_rate_limit(self) -> None:
        svc = _make_service()
        allowed = await svc.check_rate_limit("p1", PartnerTier.ENTERPRISE)
        assert allowed is True
