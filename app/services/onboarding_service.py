"""Newcomer onboarding guide for cities."""

from __future__ import annotations

from typing import Any

from app.core.logging import get_logger
from app.models.onboarding import OnboardingGuide, OnboardingStep

logger = get_logger("onboarding")


REIMS_GUIDE = OnboardingGuide(
    city="reims",
    total_steps=8,
    estimated_time_days=30,
    steps=[
        OnboardingStep(
            order=1,
            title="Inscription en mairie",
            description=(
                "Enregistrez votre adresse à la mairie de Reims pour "
                "être inscrit sur les listes électorales et accéder aux services municipaux."
            ),
            category="admin",
            action_url="https://www.reims.fr/mairie",
            voice_text="Première étape : allez à la mairie pour enregistrer votre adresse.",
        ),
        OnboardingStep(
            order=2,
            title="Carte Vitale et médecin traitant",
            description=(
                "Mettez à jour votre carte Vitale avec votre nouvelle adresse et "
                "choisissez un médecin traitant près de chez vous."
            ),
            category="sante",
            action_url="https://www.ameli.fr",
            voice_text=(
                "Deuxième étape : mettez à jour votre carte Vitale "
                "et choisissez un médecin traitant."
            ),
        ),
        OnboardingStep(
            order=3,
            title="Transports en commun — Citura",
            description=(
                "Procurez-vous un abonnement Citura pour le tramway et les bus de Reims. "
                "Tarifs réduits possibles selon votre situation."
            ),
            category="transport",
            action_url="https://www.citura.fr",
            voice_text="Troisième étape : prenez un abonnement Citura pour les transports.",
        ),
        OnboardingStep(
            order=4,
            title="Inscription CAF et aides au logement",
            description=(
                "Faites votre demande d'APL ou d'ALS sur le site de la CAF. "
                "Pensez à signaler votre changement d'adresse."
            ),
            category="logement",
            action_url="https://www.caf.fr",
            voice_text="Quatrième étape : inscrivez-vous à la CAF pour les aides au logement.",
        ),
        OnboardingStep(
            order=5,
            title="Découvrir les quartiers",
            description=(
                "Reims est composée de quartiers dynamiques : Centre-ville, Clairmarais, "
                "Croix-Rouge, Cernay. Chaque quartier a son identité."
            ),
            category="culture",
            voice_text="Cinquième étape : découvrez les quartiers de Reims et leur identité.",
        ),
        OnboardingStep(
            order=6,
            title="Inscription scolaire",
            description=(
                "Si vous avez des enfants, inscrivez-les à l'école de votre secteur "
                "via le portail famille de la mairie."
            ),
            category="admin",
            action_url="https://www.reims.fr/education",
            voice_text="Sixième étape : inscrivez vos enfants à l'école si nécessaire.",
        ),
        OnboardingStep(
            order=7,
            title="Vie associative et loisirs",
            description=(
                "Rejoignez une association locale ! Reims a plus de 2000 associations. "
                "Sport, culture, bénévolat : il y en a pour tous les goûts."
            ),
            category="social",
            voice_text="Septième étape : rejoignez une association pour rencontrer des Rémois.",
        ),
        OnboardingStep(
            order=8,
            title="Contacts utiles",
            description=(
                "CCAS de Reims pour l'aide sociale, Maison de l'emploi, "
                "médiathèques, Pôle Emploi — gardez ces contacts à portée de main."
            ),
            category="social",
            voice_text=(
                "Dernière étape : notez les contacts utiles "
                "comme le CCAS et la Maison de l'emploi."
            ),
        ),
    ],
    local_contacts=[
        {"name": "CCAS Reims", "phone": "03 26 35 60 00", "type": "social"},
        {"name": "Mairie de Reims", "phone": "03 26 77 78 79", "type": "admin"},
        {"name": "Citura (transports)", "phone": "03 26 88 25 38", "type": "transport"},
        {"name": "CAF de la Marne", "phone": "32 30", "type": "logement"},
    ],
)


class OnboardingService:
    """Provides newcomer integration guides for cities."""

    def __init__(self, mistral_client: Any = None) -> None:
        self._mistral = mistral_client

    async def get_guide(self, city: str) -> OnboardingGuide:
        guides = {"reims": REIMS_GUIDE}
        guide = guides.get(city.lower())
        if guide:
            return guide
        return self._generic_guide(city)

    async def get_voice_tour(self, city: str, step: int | None = None) -> str:
        guide = await self.get_guide(city)
        if step is None or step == 0:
            return (
                f"Bienvenue à {city.capitalize()} ! "
                f"Je suis Yuni, votre guide local. "
                f"Voici les {guide.total_steps} étapes pour bien vous installer."
            )
        if 1 <= step <= len(guide.steps):
            return guide.steps[step - 1].voice_text
        return "Cette étape n'existe pas."

    @staticmethod
    def _generic_guide(city: str) -> OnboardingGuide:
        return OnboardingGuide(
            city=city,
            total_steps=3,
            estimated_time_days=30,
            steps=[
                OnboardingStep(
                    order=1,
                    title="Inscription en mairie",
                    description=f"Enregistrez-vous à la mairie de {city.capitalize()}.",
                    category="admin",
                    voice_text=(
                        f"Première étape : inscrivez-vous à la mairie "
                        f"de {city.capitalize()}."
                    ),
                ),
                OnboardingStep(
                    order=2,
                    title="Carte Vitale",
                    description="Mettez à jour votre carte Vitale et choisissez un médecin.",
                    category="sante",
                    voice_text="Deuxième étape : mettez à jour votre carte Vitale.",
                ),
                OnboardingStep(
                    order=3,
                    title="Découvrir la ville",
                    description=(
                        f"Explorez les quartiers de {city.capitalize()} "
                        "et ses associations."
                    ),
                    category="culture",
                    voice_text=(
                        f"Troisième étape : découvrez {city.capitalize()} "
                        "et ses associations."
                    ),
                ),
            ],
            local_contacts=[],
        )
