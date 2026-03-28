"""RGPD endpoints — right to erasure (Article 17)."""

from __future__ import annotations

import re
from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

from fastapi import APIRouter, Depends, Request
from pydantic import BaseModel

from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.models.common import ResponseMeta
from app.services.redis_service import get_redis_service
from app.services.rgpd_log import log_deletion_request

logger = get_logger("rgpd")

router = APIRouter(tags=["rgpd"])

_HASH_PATTERN = re.compile(r"^[a-f0-9]{64}$")


class DeletionDetails(BaseModel):
    cache_keys_deleted: int
    note: str


class DeletionResponse(BaseModel):
    deleted: bool
    user_hash: str
    details: DeletionDetails
    meta: ResponseMeta


@router.delete(
    "/v1/ai/user-data/{user_hash}",
    response_model=DeletionResponse,
    summary="RGPD droit a l'effacement",
    description="Supprime les donnees IA associees a un utilisateur.",
    responses={
        200: {"description": "Donnees supprimees"},
        401: {"description": "JWT manquant ou invalide"},
        422: {"description": "Format hash invalide"},
    },
)
async def delete_user_data(
    request: Request,
    user_hash: str,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> DeletionResponse:
    if not _HASH_PATTERN.match(user_hash):
        from fastapi import HTTPException

        raise HTTPException(status_code=422, detail="Invalid SHA-256 hash format")

    redis = get_redis_service()
    deleted_count = await redis.delete_pattern(f"profile:{user_hash}*")

    client_ip = request.client.host if request.client else "unknown"
    ip_truncated = ".".join(client_ip.split(".")[:3]) if "." in client_ip else client_ip

    await log_deletion_request(
        user_hash=user_hash,
        request_ip_truncated=ip_truncated,
        jwt_sub=str(jwt_payload.get("sub", "unknown")),
    )

    return DeletionResponse(
        deleted=True,
        user_hash=user_hash[:8] + "...",
        details=DeletionDetails(
            cache_keys_deleted=deleted_count,
            note=(
                "Les recommandations sont stockees par zone geographique "
                "anonyme, non par utilisateur. Elles expireront sous 24h."
            ),
        ),
        meta=ResponseMeta(
            request_id=str(uuid4()),
            timestamp=datetime.now(UTC),
            source="yuni-ai-rgpd",
        ),
    )
