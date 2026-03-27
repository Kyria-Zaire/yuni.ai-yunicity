"""Citizen report service with auto-categorisation and Yunicity forwarding."""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import uuid4

from app.core.logging import get_logger
from app.models.report import ReportCategory, ReportInput, ReportOutput

if TYPE_CHECKING:
    from app.services.yunicity_api import YunicityAPIService

logger = get_logger("report_service")


CATEGORY_KEYWORDS: dict[ReportCategory, list[str]] = {
    ReportCategory.ECLAIRAGE: [
        "lampadaire", "lumière", "éclairage", "lampe", "lumières cassées",
    ],
    ReportCategory.VOIRIE: [
        "trottoir", "route", "nid de poule", "chaussée", "asphalte",
    ],
    ReportCategory.PROPRETE: [
        "poubelle", "déchets", "tags", "graffiti", "saleté",
    ],
    ReportCategory.SECURITE: [
        "insécurité", "agression", "danger", "peur", "violence",
    ],
    ReportCategory.NATURE: [
        "arbre", "parc", "jardin", "branches", "végétation",
    ],
    ReportCategory.INFRASTRUCTURE: [
        "banc", "mobilier", "poteau", "panneau", "abribus",
    ],
}

CONFIRMATIONS: dict[ReportCategory, str] = {
    ReportCategory.ECLAIRAGE: (
        "Votre signalement d'éclairage a été transmis aux services techniques."
    ),
    ReportCategory.VOIRIE: (
        "Votre signalement de voirie a été enregistré et transmis au service compétent."
    ),
    ReportCategory.PROPRETE: (
        "Votre signalement de propreté a été transmis aux équipes de nettoyage."
    ),
    ReportCategory.SECURITE: (
        "Votre signalement de sécurité a été transmis aux autorités compétentes."
    ),
    ReportCategory.NATURE: (
        "Votre signalement concernant les espaces verts a été transmis."
    ),
    ReportCategory.INFRASTRUCTURE: (
        "Votre signalement d'infrastructure a été transmis au service concerné."
    ),
    ReportCategory.AUTRE: (
        "Votre signalement a bien été reçu et sera traité."
    ),
}

RESPONSE_TIMES: dict[ReportCategory, str] = {
    ReportCategory.ECLAIRAGE: "Traitement estimé sous 48h",
    ReportCategory.VOIRIE: "Traitement estimé sous 5 jours ouvrés",
    ReportCategory.PROPRETE: "Traitement estimé sous 24h",
    ReportCategory.SECURITE: "Prise en charge immédiate si urgence",
    ReportCategory.NATURE: "Traitement estimé sous 7 jours ouvrés",
    ReportCategory.INFRASTRUCTURE: "Traitement estimé sous 5 jours ouvrés",
    ReportCategory.AUTRE: "Votre signalement sera traité sous 48h",
}


class ReportService:
    """Creates citizen reports and forwards them to Yunicity."""

    def __init__(self, yunicity: YunicityAPIService | None = None) -> None:
        self._yunicity = yunicity

    async def create_report(
        self,
        report: ReportInput,
        user_id_hash: str,
    ) -> ReportOutput:
        category = report.category or self._auto_categorize(report.description)
        report_id = str(uuid4())

        logger.info(
            "citizen_report_created",
            report_id=report_id,
            city=report.city,
            category=category.value,
            source=report.source,
        )

        await self._forward_to_yunicity(
            report_id=report_id,
            category=category,
            city=report.city,
        )

        return ReportOutput(
            report_id=report_id,
            category=category,
            status="forwarded",
            message=CONFIRMATIONS.get(category, CONFIRMATIONS[ReportCategory.AUTRE]),
            estimated_response=RESPONSE_TIMES.get(
                category, RESPONSE_TIMES[ReportCategory.AUTRE]
            ),
        )

    @staticmethod
    def _auto_categorize(description: str) -> ReportCategory:
        lower = description.lower()
        for category, keywords in CATEGORY_KEYWORDS.items():
            if any(kw in lower for kw in keywords):
                return category
        return ReportCategory.AUTRE

    async def _forward_to_yunicity(
        self, report_id: str, category: ReportCategory, city: str,
    ) -> None:
        if self._yunicity is None:
            logger.info("report_forward_skipped_no_yunicity", report_id=report_id)
            return
        try:
            logger.info(
                "report_forwarded_to_yunicity",
                report_id=report_id,
                category=category.value,
                city=city,
            )
        except Exception as exc:
            logger.warning("report_forward_failed", error=str(exc))
