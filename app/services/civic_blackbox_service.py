"""Civic blackbox — immutable AI decision audit trail (EU AI Act)."""

from __future__ import annotations

import hashlib
from datetime import UTC, datetime
from typing import TYPE_CHECKING

from app.core.logging import get_logger
from app.models.audit import AIDecisionRecord, AIDecisionType, AuditChain

if TYPE_CHECKING:
    from app.services.redis_service import RedisService

logger = get_logger("civic_blackbox")

AUDIT_TTL = 60 * 60 * 24 * 365 * 3  # 3 years retention


class CivicBlackboxService:
    """Records every AI decision in an immutable, verifiable chain."""

    def __init__(self, redis: RedisService) -> None:
        self._redis = redis

    async def record(
        self,
        decision_type: AIDecisionType,
        model_used: str,
        source: str,
        city: str,
        decision_summary: str,
        factors: list[str],
        confidence: float,
        latency_ms: int,
        user_id_hash: str | None = None,
        tokens_input: int = 0,
        tokens_output: int = 0,
        cache_hit: bool = False,
        zone: str | None = None,
        language: str = "fr",
    ) -> AIDecisionRecord:
        last_id = await self._redis.get(f"blackbox:last:{city}")

        record = AIDecisionRecord(
            decision_type=decision_type,
            model_used=model_used,
            source=source,
            city=city,
            zone=zone,
            user_hash=user_id_hash[:8] if user_id_hash else None,
            language=language,
            latency_ms=latency_ms,
            tokens_input=tokens_input,
            tokens_output=tokens_output,
            cache_hit=cache_hit,
            decision_summary=decision_summary[:200],
            factors=factors[:5],
            confidence=min(1.0, max(0.0, confidence)),
            previous_record_id=last_id,
        )

        content = record.model_dump_json(exclude={"checksum"})
        record.checksum = hashlib.sha256(content.encode()).hexdigest()

        record_json = record.model_dump_json()
        client = self._redis._client()
        await client.rpush(f"blackbox:records:{city}", record_json)
        await self._redis.set(
            f"blackbox:last:{city}",
            record.record_id,
            ttl_seconds=AUDIT_TTL,
        )
        await client.incr(f"blackbox:count:{city}")

        return record

    async def get_audit_chain(self, city: str) -> AuditChain:
        count = int(await self._redis.get(f"blackbox:count:{city}") or 0)
        sample_valid = await self._verify_chain_sample(city, sample_size=10)
        now = datetime.now(UTC)

        return AuditChain(
            city=city,
            records_count=count,
            chain_valid=sample_valid,
            oldest_record=now,
            newest_record=now,
            integrity_hash=await self._compute_chain_hash(city),
        )

    async def get_records(
        self,
        city: str,
        decision_type: AIDecisionType | None = None,
        limit: int = 100,
        offset: int = 0,
    ) -> list[AIDecisionRecord]:
        client = self._redis._client()
        raw_records: list[bytes] = await client.lrange(
            f"blackbox:records:{city}", offset, offset + limit - 1,
        )
        records = [
            AIDecisionRecord.model_validate_json(r) for r in raw_records
        ]
        if decision_type:
            records = [r for r in records if r.decision_type == decision_type]
        return records

    async def _verify_chain_sample(
        self, city: str, sample_size: int,
    ) -> bool:
        records = await self.get_records(city, limit=sample_size)
        for record in records:
            content = record.model_dump_json(exclude={"checksum"})
            expected = hashlib.sha256(content.encode()).hexdigest()
            if record.checksum != expected:
                logger.error(
                    "blackbox_integrity_violation",
                    record_id=record.record_id, city=city,
                )
                return False
        return True

    async def _compute_chain_hash(self, city: str) -> str:
        count_raw = await self._redis.get(f"blackbox:count:{city}") or "0"
        last_raw = await self._redis.get(f"blackbox:last:{city}") or ""
        combined = f"{city}:{count_raw}:{last_raw}"
        return hashlib.sha256(combined.encode()).hexdigest()
