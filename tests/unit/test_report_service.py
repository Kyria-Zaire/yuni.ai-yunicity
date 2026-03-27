"""Unit tests for citizen report service (YAI-030)."""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.models.report import ReportCategory, ReportInput, ReportOutput
from app.services.report_service import CONFIRMATIONS, ReportService


@pytest.mark.asyncio
async def test_create_report_returns_report_id() -> None:
    svc = ReportService()
    report = ReportInput(city="reims", description="Lampadaire cassé rue Victor Hugo")
    result = await svc.create_report(report, "a" * 64)
    assert isinstance(result, ReportOutput)
    assert len(result.report_id) == 36


@pytest.mark.asyncio
async def test_auto_categorize_lampadaire_is_eclairage() -> None:
    svc = ReportService()
    report = ReportInput(city="reims", description="Le lampadaire est en panne")
    result = await svc.create_report(report, "a" * 64)
    assert result.category == ReportCategory.ECLAIRAGE


@pytest.mark.asyncio
async def test_auto_categorize_trottoir_is_voirie() -> None:
    svc = ReportService()
    report = ReportInput(city="reims", description="Trottoir défoncé devant chez moi")
    result = await svc.create_report(report, "a" * 64)
    assert result.category == ReportCategory.VOIRIE


@pytest.mark.asyncio
async def test_auto_categorize_unknown_is_autre() -> None:
    svc = ReportService()
    report = ReportInput(city="reims", description="Problème bizarre que je vois")
    result = await svc.create_report(report, "a" * 64)
    assert result.category == ReportCategory.AUTRE


@pytest.mark.asyncio
async def test_auto_categorize_proprete() -> None:
    svc = ReportService()
    report = ReportInput(city="reims", description="Des déchets partout dans la rue")
    result = await svc.create_report(report, "a" * 64)
    assert result.category == ReportCategory.PROPRETE


@pytest.mark.asyncio
async def test_confirmation_message_matches_category() -> None:
    svc = ReportService()
    report = ReportInput(
        city="reims",
        description="Lampadaire cassé",
        category=ReportCategory.ECLAIRAGE,
    )
    result = await svc.create_report(report, "a" * 64)
    assert result.message == CONFIRMATIONS[ReportCategory.ECLAIRAGE]


@pytest.mark.asyncio
async def test_create_report_respects_explicit_category() -> None:
    svc = ReportService()
    report = ReportInput(
        city="reims",
        description="Un truc",
        category=ReportCategory.SECURITE,
    )
    result = await svc.create_report(report, "a" * 64)
    assert result.category == ReportCategory.SECURITE


@pytest.mark.asyncio
async def test_create_report_status_is_forwarded() -> None:
    svc = ReportService()
    report = ReportInput(city="reims", description="Lampadaire cassé")
    result = await svc.create_report(report, "a" * 64)
    assert result.status == "forwarded"


@pytest.mark.asyncio
async def test_create_report_voice_source() -> None:
    svc = ReportService()
    report = ReportInput(
        city="reims",
        description="Lampadaire cassé rue Hugo",
        source="voice",
    )
    result = await svc.create_report(report, "a" * 64)
    assert result.report_id


def test_all_categories_have_confirmations() -> None:
    for cat in ReportCategory:
        assert cat in CONFIRMATIONS


@pytest.mark.asyncio
async def test_report_endpoint_requires_jwt(client: AsyncClient) -> None:
    response = await client.post(
        "/v1/reports",
        json={"city": "reims", "description": "Lampadaire cassé"},
    )
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_categories_endpoint_is_public(client: AsyncClient) -> None:
    response = await client.get("/v1/reports/categories")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) == len(ReportCategory)
