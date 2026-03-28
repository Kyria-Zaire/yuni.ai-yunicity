"""Schemas for XP gamification system."""

from __future__ import annotations

from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, Field


class XPAction(StrEnum):
    RECOMMENDATION_USED = "recommendation_used"
    CHAT_MESSAGE = "chat_message"
    VOICE_COMMAND = "voice_command"
    CITIZEN_REPORT = "citizen_report"
    QUEST_COMPLETED = "quest_completed"
    DAILY_LOGIN = "daily_login"
    PROFILE_COMPLETE = "profile_complete"
    MERCHANT_CONTENT = "merchant_content"


XP_VALUES: dict[XPAction, int] = {
    XPAction.RECOMMENDATION_USED: 5,
    XPAction.CHAT_MESSAGE: 2,
    XPAction.VOICE_COMMAND: 3,
    XPAction.CITIZEN_REPORT: 15,
    XPAction.QUEST_COMPLETED: 50,
    XPAction.DAILY_LOGIN: 10,
    XPAction.PROFILE_COMPLETE: 25,
    XPAction.MERCHANT_CONTENT: 8,
}


class CitizenLevel(StrEnum):
    VISITEUR = "visiteur"
    HABITANT = "habitant"
    CITOYEN = "citoyen"
    ACTEUR = "acteur"
    AMBASSADEUR = "ambassadeur"


LEVEL_THRESHOLDS: dict[CitizenLevel, int] = {
    CitizenLevel.VISITEUR: 0,
    CitizenLevel.HABITANT: 100,
    CitizenLevel.CITOYEN: 500,
    CitizenLevel.ACTEUR: 1500,
    CitizenLevel.AMBASSADEUR: 5000,
}


class Badge(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    category: Literal[
        "exploration", "social", "citoyen", "vocal", "commerce", "special"
    ]
    xp_reward: int
    condition: str


BADGES_CATALOG: list[Badge] = [
    Badge(
        id="first_recommendation", name="Découvreur",
        description="Première recommandation IA utilisée",
        icon="compass", category="exploration", xp_reward=10,
        condition="Utiliser /recommend pour la première fois",
    ),
    Badge(
        id="voice_pioneer", name="Voix de la ville",
        description="Premier message vocal envoyé à Yuni",
        icon="microphone", category="vocal", xp_reward=20,
        condition="Envoyer un message vocal via Hey Yuni",
    ),
    Badge(
        id="first_report", name="Gardien du quartier",
        description="Premier signalement citoyen effectué",
        icon="shield", category="citoyen", xp_reward=25,
        condition="Effectuer un signalement via /reports",
    ),
    Badge(
        id="quest_master", name="Explorateur urbain",
        description="5 quêtes complétées",
        icon="map", category="exploration", xp_reward=50,
        condition="Compléter 5 quêtes urbaines",
    ),
    Badge(
        id="social_butterfly", name="Ambassadeur",
        description="Niveau Ambassadeur atteint",
        icon="star", category="social", xp_reward=100,
        condition="Atteindre 5000 XP",
    ),
    Badge(
        id="chatterbox", name="Bavard",
        description="50 messages envoyés au chat",
        icon="chat", category="social", xp_reward=15,
        condition="Envoyer 50 messages via /chat",
    ),
    Badge(
        id="night_owl", name="Oiseau de nuit",
        description="Utiliser Yuni entre 22h et 6h",
        icon="moon", category="special", xp_reward=10,
        condition="Utiliser Yuni AI la nuit",
    ),
    Badge(
        id="merchant_friend", name="Ami des commerçants",
        description="Générer du contenu pour un commerçant",
        icon="shop", category="commerce", xp_reward=15,
        condition="Utiliser le générateur de contenu",
    ),
    Badge(
        id="explorer_3", name="Explorateur Bronze",
        description="3 quêtes complétées",
        icon="medal_bronze", category="exploration", xp_reward=20,
        condition="Compléter 3 quêtes",
    ),
    Badge(
        id="reporter_5", name="Sentinelle",
        description="5 signalements effectués",
        icon="eye", category="citoyen", xp_reward=30,
        condition="Effectuer 5 signalements",
    ),
    Badge(
        id="newcomer_guide", name="Guide local",
        description="Consulter le guide nouveaux arrivants",
        icon="book", category="social", xp_reward=10,
        condition="Consulter /onboarding",
    ),
    Badge(
        id="level_citoyen", name="Citoyen engagé",
        description="Atteindre le niveau Citoyen",
        icon="badge", category="social", xp_reward=30,
        condition="Atteindre 500 XP",
    ),
    Badge(
        id="level_acteur", name="Acteur local",
        description="Atteindre le niveau Acteur",
        icon="trophy", category="social", xp_reward=50,
        condition="Atteindre 1500 XP",
    ),
    Badge(
        id="first_chat", name="Premier échange",
        description="Premier message au chat Yuni",
        icon="speech", category="social", xp_reward=5,
        condition="Envoyer un message via /chat",
    ),
    Badge(
        id="daily_streak_7", name="Assidu",
        description="7 jours consécutifs d'utilisation",
        icon="flame", category="special", xp_reward=35,
        condition="Se connecter 7 jours de suite",
    ),
]

BADGES_MAP: dict[str, Badge] = {b.id: b for b in BADGES_CATALOG}


class UserXPProfile(BaseModel):
    user_id_hash: str
    total_xp: int = 0
    level: CitizenLevel = CitizenLevel.VISITEUR
    badges: list[str] = Field(default_factory=list)
    xp_history: list[dict[str, Any]] = Field(default_factory=list)
    next_level_xp: int = 100


class XPEvent(BaseModel):
    action: XPAction
    xp_earned: int
    new_total: int
    new_level: CitizenLevel | None = None
    badges_unlocked: list[str] = Field(default_factory=list)


class AwardXPRequest(BaseModel):
    action: XPAction
    city: str = Field(..., min_length=2, max_length=100)
