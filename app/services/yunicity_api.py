"""Abstract interface for Yunicity API access."""

from abc import ABC, abstractmethod

from app.models.vitality import VitalityInputData
from app.models.yunicity import MapData, Tribe, UserPassport


class YunicityAPIService(ABC):
    """Base class for Yunicity API clients.

    In dev/recette: MockYunicityAPIService returns fixture data.
    In prod: RealYunicityAPIService calls the live Yunicity APIs.
    """

    @abstractmethod
    async def get_user_passport(self, user_id_hash: str) -> UserPassport:
        """Fetch a user's gamification passport."""

    @abstractmethod
    async def get_city_tribes(self, city: str) -> list[Tribe]:
        """Fetch community tribes for a given city."""

    @abstractmethod
    async def get_map_data(self, lat: float, lng: float) -> MapData:
        """Fetch actors and events for a geographic zone."""

    @abstractmethod
    async def get_vitality_data(self, city: str, zone: str) -> VitalityInputData:
        """Fetch aggregated vitality metrics for a zone."""


