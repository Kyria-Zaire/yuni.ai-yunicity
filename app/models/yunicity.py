"""Pydantic schemas for Yunicity API data models."""

from datetime import datetime

from pydantic import BaseModel


class UserPassport(BaseModel):
    """Gamification passport for a Yunicity user."""

    user_id_hash: str
    points: int
    level: str  # "citoyen" | "acteur" | "ambassadeur"
    badges: list[str]
    interests: list[str]
    joined_at: datetime


class Tribe(BaseModel):
    """A local community group (tribu)."""

    id: str
    name: str
    city: str
    category: str
    members_count: int
    activity_score: float
    description: str


class Actor(BaseModel):
    """A local actor (association, lieu, commerce)."""

    id: str
    name: str
    category: str
    city: str
    geo: dict[str, float]
    description: str
    tags: list[str]


class Event(BaseModel):
    """A local event."""

    id: str
    title: str
    actor_id: str
    city: str
    date: datetime
    category: str
    description: str


class MapData(BaseModel):
    """Aggregated map data for a geographic zone."""

    actors: list[Actor]
    events: list[Event]
    zone: str
