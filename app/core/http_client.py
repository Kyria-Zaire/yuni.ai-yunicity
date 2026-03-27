"""Shared async HTTP client for external API calls."""

from __future__ import annotations

import httpx

_client: httpx.AsyncClient | None = None


def get_http_client() -> httpx.AsyncClient:
    """Return the global httpx client singleton."""
    if _client is None:
        msg = "HTTP client not initialized — call init_http_client() first"
        raise RuntimeError(msg)
    return _client


async def init_http_client() -> httpx.AsyncClient:
    """Create the shared httpx.AsyncClient with sensible defaults."""
    global _client
    _client = httpx.AsyncClient(
        limits=httpx.Limits(max_connections=20, max_keepalive_connections=10),
        timeout=httpx.Timeout(5.0, connect=2.0),
        headers={"User-Agent": "yuni-ai/0.2.0"},
    )
    return _client


async def close_http_client() -> None:
    """Gracefully close the HTTP client."""
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
