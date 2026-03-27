"""Mock Yunicity API service with realistic Reims fixture data."""

import asyncio
import os
import random
from datetime import UTC, datetime, timedelta

from app.models.yunicity import Actor, Event, MapData, Tribe, UserPassport
from app.services.yunicity_api import YunicityAPIService

_DISABLE_LATENCY = os.environ.get("DISABLE_MOCK_LATENCY", "false").lower() == "true"


async def _simulate_latency() -> None:
    """Simulate network latency (50-200ms) unless disabled."""
    if not _DISABLE_LATENCY:
        delay = random.uniform(0.05, 0.2)  # noqa: S311
        await asyncio.sleep(delay)


def _future_date(days_offset: int) -> datetime:
    """Return a UTC datetime `days_offset` days from now."""
    return datetime.now(UTC) + timedelta(days=days_offset)


# ---------------------------------------------------------------------------
# Fixture data — Reims
# ---------------------------------------------------------------------------

REIMS_TRIBES: list[Tribe] = [
    Tribe(
        id="tribe-sport-reims",
        name="Sport Reims",
        city="Reims",
        category="sport",
        members_count=342,
        activity_score=8.7,
        description="Communaute sportive de Reims : running, foot, basket et bien plus.",
    ),
    Tribe(
        id="tribe-culture-champagne",
        name="Culture & Art Champagne",
        city="Reims",
        category="culture",
        members_count=218,
        activity_score=7.2,
        description="Art, patrimoine et culture dans la region champenoise.",
    ),
    Tribe(
        id="tribe-eco-citoyens",
        name="Eco-Citoyens Reims",
        city="Reims",
        category="environnement",
        members_count=156,
        activity_score=9.1,
        description="Transition ecologique, zero dechet et actions citoyennes a Reims.",
    ),
    Tribe(
        id="tribe-parents-enfants",
        name="Parents & Enfants Reims",
        city="Reims",
        category="famille",
        members_count=445,
        activity_score=6.8,
        description="Sorties, activites et entraide pour les familles remoises.",
    ),
    Tribe(
        id="tribe-startup-innovation",
        name="Startup & Innovation",
        city="Reims",
        category="tech",
        members_count=89,
        activity_score=7.5,
        description="Ecosysteme startup, tech et innovation de Reims.",
    ),
]

REIMS_ACTORS: list[Actor] = [
    Actor(
        id="actor-cnsmd",
        name="CNSMD Reims",
        category="musique",
        city="Reims",
        geo={"lat": 49.2539, "lng": 4.0316},
        description="Conservatoire national superieur de musique et de danse.",
        tags=["musique", "danse", "formation"],
    ),
    Actor(
        id="actor-maison-citoyen",
        name="Maison du Citoyen",
        category="civic",
        city="Reims",
        geo={"lat": 49.2480, "lng": 4.0280},
        description="Espace citoyen du quartier Clairmarais.",
        tags=["citoyennete", "democratie", "participation"],
    ),
    Actor(
        id="actor-parc-lagrange",
        name="Parc Leo Lagrange",
        category="sport",
        city="Reims",
        geo={"lat": 49.2450, "lng": 4.0400},
        description="Parc sportif du quartier Wilson.",
        tags=["sport", "plein-air", "foot", "basket"],
    ),
    Actor(
        id="actor-mjc-croix-rouge",
        name="MJC Croix-Rouge",
        category="culture",
        city="Reims",
        geo={"lat": 49.2620, "lng": 4.0100},
        description="Maison des jeunes et de la culture du quartier Croix-Rouge.",
        tags=["culture", "jeunesse", "ateliers"],
    ),
    Actor(
        id="actor-cartonnerie",
        name="La Cartonnerie",
        category="concert",
        city="Reims",
        geo={"lat": 49.2510, "lng": 4.0350},
        description="Salle de concerts et musiques actuelles.",
        tags=["concert", "musique", "spectacle"],
    ),
    Actor(
        id="actor-ferme-urbaine",
        name="Ferme Urbaine Reims",
        category="environnement",
        city="Reims",
        geo={"lat": 49.2380, "lng": 4.0500},
        description="Agriculture urbaine et ateliers ecologiques en peripherie.",
        tags=["ecologie", "agriculture", "bio", "atelier"],
    ),
]

REIMS_EVENTS: list[Event] = [
    Event(
        id="evt-tournoi-foot",
        title="Tournoi de foot inter-quartiers",
        actor_id="actor-parc-lagrange",
        city="Reims",
        date=_future_date(3),
        category="sport",
        description="Tournoi amical ouvert a tous les niveaux.",
    ),
    Event(
        id="evt-brocante",
        title="Brocante de printemps",
        actor_id="actor-maison-citoyen",
        city="Reims",
        date=_future_date(7),
        category="marche",
        description="Grande brocante organisee par le comite de quartier.",
    ),
    Event(
        id="evt-concert-jazz",
        title="Concert jazz manouche",
        actor_id="actor-cartonnerie",
        city="Reims",
        date=_future_date(5),
        category="musique",
        description="Soiree jazz manouche avec artistes locaux.",
    ),
    Event(
        id="evt-repair-cafe",
        title="Repair Cafe",
        actor_id="actor-ferme-urbaine",
        city="Reims",
        date=_future_date(10),
        category="environnement",
        description="Reparez vos objets du quotidien avec des benevoles.",
    ),
    Event(
        id="evt-marche-bio",
        title="Marche bio mensuel",
        actor_id="actor-ferme-urbaine",
        city="Reims",
        date=_future_date(14),
        category="marche",
        description="Producteurs locaux et bio de la region.",
    ),
    Event(
        id="evt-atelier-peinture",
        title="Atelier peinture en plein air",
        actor_id="actor-mjc-croix-rouge",
        city="Reims",
        date=_future_date(6),
        category="culture",
        description="Peinture aquarelle dans le parc de la Croix-Rouge.",
    ),
    Event(
        id="evt-conf-startup",
        title="Conference startup : IA et territoire",
        actor_id="actor-maison-citoyen",
        city="Reims",
        date=_future_date(12),
        category="tech",
        description="Comment l'IA peut servir les territoires ?",
    ),
    Event(
        id="evt-fete-quartier",
        title="Fete de quartier Wilson",
        actor_id="actor-parc-lagrange",
        city="Reims",
        date=_future_date(20),
        category="fete",
        description="Animations, musique et convivialite pour tous.",
    ),
]

SAMPLE_PASSPORT = UserPassport(
    user_id_hash="a1b2c3d4e5f6",
    points=1250,
    level="acteur",
    badges=["early-adopter", "eco-warrior", "community-builder"],
    interests=["sport", "ecologie", "tech"],
    joined_at=datetime(2025, 6, 15, tzinfo=UTC),
)


class MockYunicityAPIService(YunicityAPIService):
    """Returns realistic Reims fixture data with simulated network latency."""

    async def get_user_passport(self, user_id_hash: str) -> UserPassport:
        """Return a sample user passport."""
        await _simulate_latency()
        return SAMPLE_PASSPORT.model_copy(update={"user_id_hash": user_id_hash})

    async def get_city_tribes(self, city: str) -> list[Tribe]:
        """Return Reims tribes (filters by city name)."""
        await _simulate_latency()
        return [t for t in REIMS_TRIBES if t.city.lower() == city.lower()]

    async def get_map_data(self, lat: float, lng: float) -> MapData:
        """Return Reims actors and events for any coordinate."""
        await _simulate_latency()
        return MapData(
            actors=REIMS_ACTORS,
            tribes=REIMS_TRIBES,
            events=REIMS_EVENTS,
            zone=f"reims-{lat:.2f}-{lng:.2f}",
        )
