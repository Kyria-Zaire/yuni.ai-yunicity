"""Unit tests for RedisService using fakeredis."""

from unittest.mock import AsyncMock, patch

import fakeredis.aioredis
import pytest

from app.services.redis_service import RedisService


class FakeRedisService(RedisService):
    """RedisService subclass using fakeredis for testing."""

    def __init__(self) -> None:
        self._fake_redis = fakeredis.aioredis.FakeRedis(decode_responses=True)

    def _client(self):  # type: ignore[override]
        return self._fake_redis

    async def close(self) -> None:
        await self._fake_redis.aclose()


@pytest.fixture
async def redis() -> FakeRedisService:
    svc = FakeRedisService()
    yield svc
    await svc.close()


@pytest.mark.asyncio
async def test_redis_ping_returns_true(redis: FakeRedisService) -> None:
    assert await redis.ping() is True


@pytest.mark.asyncio
async def test_redis_get_returns_none_when_missing(redis: FakeRedisService) -> None:
    result = await redis.get("nonexistent_key")
    assert result is None


@pytest.mark.asyncio
async def test_redis_set_and_get_roundtrip(redis: FakeRedisService) -> None:
    await redis.set("test_key", "test_value", ttl_seconds=60)
    result = await redis.get("test_key")
    assert result == "test_value"


@pytest.mark.asyncio
async def test_redis_set_returns_true(redis: FakeRedisService) -> None:
    result = await redis.set("k", "v", ttl_seconds=10)
    assert result is True


@pytest.mark.asyncio
async def test_redis_delete_removes_key(redis: FakeRedisService) -> None:
    await redis.set("to_delete", "value", ttl_seconds=60)
    assert await redis.get("to_delete") == "value"
    await redis.delete("to_delete")
    assert await redis.get("to_delete") is None


@pytest.mark.asyncio
async def test_redis_delete_pattern_removes_matching_keys(redis: FakeRedisService) -> None:
    await redis.set("prefix:a", "1", ttl_seconds=60)
    await redis.set("prefix:b", "2", ttl_seconds=60)
    await redis.set("other:c", "3", ttl_seconds=60)
    deleted = await redis.delete_pattern("prefix:*")
    assert deleted == 2
    assert await redis.get("other:c") == "3"


@pytest.mark.asyncio
async def test_redis_get_returns_none_on_connection_error() -> None:
    """Simulate a connection failure — get should return None, not raise."""
    svc = FakeRedisService()
    with patch.object(svc, "_client") as mock_client:
        fake = AsyncMock()
        fake.get.side_effect = ConnectionError("Connection refused")
        mock_client.return_value = fake
        result = await svc.get("any_key")
        assert result is None
    await svc.close()


@pytest.mark.asyncio
async def test_redis_ping_returns_false_when_disconnected() -> None:
    """Simulate disconnection — ping should return False."""
    svc = FakeRedisService()
    with patch.object(svc, "_client") as mock_client:
        fake = AsyncMock()
        fake.ping.side_effect = ConnectionError("Connection refused")
        mock_client.return_value = fake
        result = await svc.ping()
        assert result is False
    await svc.close()
