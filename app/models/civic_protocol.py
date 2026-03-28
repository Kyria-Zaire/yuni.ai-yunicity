"""Schemas for civic data protocol ODBL exports."""

from __future__ import annotations

from datetime import UTC, datetime

from pydantic import BaseModel, Field


class ZoneVitalityExport(BaseModel):
    zone_id: str
    zone_name: str
    bbox: dict[str, float] = Field(default_factory=dict)
    vitality_score: float = 0.0
    vitality_grade: str = "C"
    engagement_index: float = 0.0
    sentiment_mood: float = 50.0
    active_actors_count: int = 0
    upcoming_events_count: int = 0


class CivicEngagementStats(BaseModel):
    total_active_citizens: int = 0
    participation_rate: float = 0.0
    top_interests: list[str] = Field(default_factory=list)
    reports_per_1000_citizens: float = 0.0
    quests_completed_rate: float = 0.0


class ReportsSummary(BaseModel):
    total_reports: int = 0
    by_category: dict[str, int] = Field(default_factory=dict)
    resolution_rate: float = 0.0
    avg_resolution_days: float = 0.0


class DataQualityMetrics(BaseModel):
    completeness: float = 0.0
    freshness_hours: int = 24
    zones_covered: int = 0
    total_zones: int = 0


class CivicDataExport(BaseModel):
    export_id: str
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    license: str = "ODbL-1.0"
    license_url: str = "https://opendatacommons.org/licenses/odbl/1-0/"
    source: str = "Yuni AI Civic Intelligence"
    city: str
    period_start: datetime
    period_end: datetime
    data_version: str = "1.0"
    zones_vitality: list[ZoneVitalityExport] = Field(default_factory=list)
    engagement_stats: CivicEngagementStats = Field(
        default_factory=CivicEngagementStats,
    )
    reports_summary: ReportsSummary = Field(default_factory=ReportsSummary)
    data_quality: DataQualityMetrics = Field(default_factory=DataQualityMetrics)
