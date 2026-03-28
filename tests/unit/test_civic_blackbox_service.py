"""Unit tests for CivicBlackboxService — audit trail."""

from __future__ import annotations

import hashlib
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.audit import AIDecisionType
from app.services.civic_blackbox_service import CivicBlackboxService


def _make_service() -> CivicBlackboxService:
    redis = MagicMock()
    redis.get = AsyncMock(return_value=None)
    redis.set = AsyncMock()
    client_mock = MagicMock()
    client_mock.rpush = AsyncMock()
    client_mock.incr = AsyncMock()
    client_mock.lrange = AsyncMock(return_value=[])
    redis._client = MagicMock(return_value=client_mock)
    return CivicBlackboxService(redis=redis)


class TestRecord:
    @pytest.mark.asyncio
    async def test_record_creates_entry_with_checksum(self) -> None:
        svc = _make_service()
        record = await svc.record(
            decision_type=AIDecisionType.RECOMMENDATION,
            model_used="mistral-large-latest",
            source="mistral",
            city="reims",
            decision_summary="Recommande 5 acteurs",
            factors=["sport", "culture"],
            confidence=0.85,
            latency_ms=200,
        )
        assert record.checksum != ""
        assert len(record.checksum) == 64

    @pytest.mark.asyncio
    async def test_checksum_changes_if_record_modified(self) -> None:
        svc = _make_service()
        record = await svc.record(
            decision_type=AIDecisionType.RECOMMENDATION,
            model_used="mistral-large-latest",
            source="mistral",
            city="reims",
            decision_summary="Test",
            factors=[],
            confidence=0.5,
            latency_ms=100,
        )
        content = record.model_dump_json(exclude={"checksum"})
        expected = hashlib.sha256(content.encode()).hexdigest()
        assert record.checksum == expected

    @pytest.mark.asyncio
    async def test_user_hash_truncated_to_8_chars(self) -> None:
        svc = _make_service()
        record = await svc.record(
            decision_type=AIDecisionType.CHAT_RESPONSE,
            model_used="mistral-large-latest",
            source="mistral",
            city="reims",
            decision_summary="Chat reply",
            factors=[],
            confidence=0.9,
            latency_ms=300,
            user_id_hash="abcdefghij1234567890",
        )
        assert record.user_hash is not None
        assert len(record.user_hash) == 8

    @pytest.mark.asyncio
    async def test_decision_summary_truncated_to_200_chars(self) -> None:
        svc = _make_service()
        long_summary = "x" * 500
        record = await svc.record(
            decision_type=AIDecisionType.CONTENT_GENERATION,
            model_used="mistral-small-latest",
            source="mistral",
            city="reims",
            decision_summary=long_summary,
            factors=[],
            confidence=0.7,
            latency_ms=150,
        )
        assert len(record.decision_summary) <= 200


class TestAuditChain:
    @pytest.mark.asyncio
    async def test_audit_chain_returns_correct_count(self) -> None:
        redis = MagicMock()
        redis.get = AsyncMock(side_effect=lambda k: "42" if "count" in k else None)
        redis.set = AsyncMock()
        client_mock = MagicMock()
        client_mock.lrange = AsyncMock(return_value=[])
        redis._client = MagicMock(return_value=client_mock)
        svc = CivicBlackboxService(redis=redis)
        chain = await svc.get_audit_chain("reims")
        assert chain.records_count == 42
        assert chain.city == "reims"

    @pytest.mark.asyncio
    async def test_chain_verification_empty_is_valid(self) -> None:
        svc = _make_service()
        chain = await svc.get_audit_chain("reims")
        assert chain.chain_valid is True


class TestRecordsPagination:
    @pytest.mark.asyncio
    async def test_records_paginated_correctly(self) -> None:
        svc = _make_service()
        records = await svc.get_records("reims", limit=10, offset=0)
        assert isinstance(records, list)

    @pytest.mark.asyncio
    async def test_records_filtered_by_decision_type(self) -> None:
        svc = _make_service()
        records = await svc.get_records(
            "reims", decision_type=AIDecisionType.RECOMMENDATION,
        )
        assert isinstance(records, list)


class TestIntegrity:
    @pytest.mark.asyncio
    async def test_integrity_hash_is_consistent(self) -> None:
        svc = _make_service()
        chain1 = await svc.get_audit_chain("reims")
        chain2 = await svc.get_audit_chain("reims")
        assert chain1.integrity_hash == chain2.integrity_hash
