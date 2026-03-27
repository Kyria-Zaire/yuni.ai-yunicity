"""RGPD deletion request logging (Article 17 right to erasure)."""

from __future__ import annotations

from datetime import UTC, datetime

from app.core.logging import get_logger

logger = get_logger("rgpd")


async def log_deletion_request(
    user_hash: str,
    request_ip_truncated: str,
    jwt_sub: str,
) -> None:
    """Record a structured RGPD deletion request for the processing registry.

    Retained for 3 years per legal obligation.
    """
    logger.info(
        "rgpd_deletion_request",
        user_hash=user_hash[:8] + "...",
        request_ip_truncated=request_ip_truncated,
        jwt_sub=jwt_sub,
        timestamp=datetime.now(UTC).isoformat(),
        data_stores_checked=["redis_cache"],
        result="completed",
        note="Cache keys are anonymous and zone-based, not user-based",
    )
