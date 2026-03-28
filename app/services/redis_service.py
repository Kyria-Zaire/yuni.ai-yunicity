"""Redis service with connection pooling and graceful degradation."""

from __future__ import annotations

from typing import Any, Self

import redis.asyncio as aioredis
from redis.asyncio import ConnectionPool, Redis

from app.core.config import Settings
from app.core.logging import get_logger

logger = get_logger("redis")


class RedisService:
    """Async Redis client with connection pooling and error handling.

    All public methods degrade gracefully: Redis failures return default
    values instead of raising exceptions, so the app stays available.
    """

    def __init__(self, settings: Settings) -> None:
        url = settings.REDIS_URL.get_secret_value()
        self._pool: ConnectionPool[Any] = aioredis.ConnectionPool.from_url(
            url,
            max_connections=20,
            decode_responses=True,
        )

    def _client(self) -> Redis[Any]:
        """Return a Redis client bound to the connection pool."""
        return aioredis.Redis(connection_pool=self._pool)

    async def ping(self) -> bool:
        """Check Redis connectivity. Returns False on failure."""
        try:
            client = self._client()
            result: bool = await client.ping()
            return result
        except Exception:
            logger.warning("redis_ping_failed")
            return False

    async def get(self, key: str) -> str | None:
        """GET a key. Returns None on miss or connection error."""
        try:
            client = self._client()
            value: str | None = await client.get(key)
            return value
        except Exception:
            logger.warning("redis_get_failed", key=key)
            return None

    async def set(self, key: str, value: str, ttl_seconds: int) -> bool:
        """SETEX a key with TTL. Returns False on error."""
        try:
            client = self._client()
            await client.setex(key, ttl_seconds, value)
            return True
        except Exception:
            logger.warning("redis_set_failed", key=key)
            return False

    async def delete(self, key: str) -> bool:
        """DEL a key. Returns False on error."""
        try:
            client = self._client()
            await client.delete(key)
            return True
        except Exception:
            logger.warning("redis_delete_failed", key=key)
            return False

    async def incr(self, key: str) -> int:
        """Increment an integer key. Returns 0 on error."""
        try:
            client = self._client()
            result: int = await client.incr(key)
            return result
        except Exception:
            logger.warning("redis_incr_failed", key=key)
            return 0

    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern via SCAN. Returns count deleted."""
        deleted = 0
        try:
            client = self._client()
            cursor = 0
            while True:
                cursor, keys = await client.scan(cursor=cursor, match=pattern, count=100)
                if keys:
                    await client.delete(*keys)
                    deleted += len(keys)
                if cursor == 0:
                    break
        except Exception:
            logger.warning("redis_delete_pattern_failed", pattern=pattern)
        return deleted

    async def close(self) -> None:
        """Close the connection pool."""
        await self._pool.disconnect()
        logger.info("redis_pool_closed")

    # Context manager support
    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *args: object) -> None:
        await self.close()


# Global instance set during lifespan
_redis_service: RedisService | None = None


def get_redis_service() -> RedisService:
    """FastAPI dependency — returns the global RedisService instance."""
    if _redis_service is None:
        msg = "Redis service not initialized"
        raise RuntimeError(msg)
    return _redis_service


def set_global_redis_service(service: RedisService | None) -> None:
    """Set or clear the global Redis service instance."""
    global _redis_service
    _redis_service = service
