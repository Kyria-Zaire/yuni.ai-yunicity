"""Abstract interface for Yunicity API access."""

from abc import ABC, abstractmethod

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


class RealYunicityAPIService(YunicityAPIService):
    """Production client — calls the real Yunicity APIs (Mois 2)."""

    async def get_user_passport(self, user_id_hash: str) -> UserPassport:
        raise NotImplementedError("RealYunicityAPIService will be implemented in Mois 2")

    async def get_city_tribes(self, city: str) -> list[Tribe]:
        raise NotImplementedError("RealYunicityAPIService will be implemented in Mois 2")

    async def get_map_data(self, lat: float, lng: float) -> MapData:
        raise NotImplementedError("RealYunicityAPIService will be implemented in Mois 2")
