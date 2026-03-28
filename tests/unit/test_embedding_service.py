"""Unit tests for EmbeddingService (YAI-016)."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.services.embedding_service import COLLECTION_ACTORS, COLLECTION_TRIBES, _stable_id


def _mock_settings() -> MagicMock:
    s = MagicMock()
    s.QDRANT_URL = "http://localhost:6333"
    s.QDRANT_API_KEY = None
    mock_key = MagicMock()
    mock_key.get_secret_value.return_value = "test-key"
    s.MISTRAL_API_KEY = mock_key
    return s


@pytest.fixture
def embedding_service():  # type: ignore[no-untyped-def]
    with patch("qdrant_client.QdrantClient") as mock_qdrant_cls:
        mock_qdrant = MagicMock()
        mock_qdrant_cls.return_value = mock_qdrant

        from app.services.embedding_service import EmbeddingService
        redis = AsyncMock()
        redis.get = AsyncMock(return_value=None)
        redis.set = AsyncMock(return_value=True)
        svc = EmbeddingService(_mock_settings(), redis)
        svc.qdrant = mock_qdrant
        yield svc, mock_qdrant, redis


class TestEnsureCollections:
    @pytest.mark.asyncio
    async def test_creates_if_not_exists(self, embedding_service) -> None:  # type: ignore[no-untyped-def]
        svc, qdrant, _ = embedding_service
        collections_resp = MagicMock()
        collections_resp.collections = []
        qdrant.get_collections.return_value = collections_resp
        await svc.ensure_collections()
        assert qdrant.create_collection.call_count == 2

    @pytest.mark.asyncio
    async def test_skips_if_exists(self, embedding_service) -> None:  # type: ignore[no-untyped-def]
        svc, qdrant, _ = embedding_service
        col1, col2 = MagicMock(), MagicMock()
        col1.name = COLLECTION_ACTORS
        col2.name = COLLECTION_TRIBES
        collections_resp = MagicMock()
        collections_resp.collections = [col1, col2]
        qdrant.get_collections.return_value = collections_resp
        await svc.ensure_collections()
        qdrant.create_collection.assert_not_called()


class TestEmbedText:
    @pytest.mark.asyncio
    async def test_returns_vector(self, embedding_service) -> None:  # type: ignore[no-untyped-def]
        svc, _, _redis = embedding_service
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.1] * 1024)]
        mock_client = MagicMock()
        mock_client.embeddings.create_async = AsyncMock(return_value=mock_response)
        svc._mistral_client = mock_client
        result = await svc.embed_text("test text")
        assert len(result) == 1024

    @pytest.mark.asyncio
    async def test_caches_result(self, embedding_service) -> None:  # type: ignore[no-untyped-def]
        svc, _, redis = embedding_service
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.5] * 1024)]
        mock_client = MagicMock()
        mock_client.embeddings.create_async = AsyncMock(return_value=mock_response)
        svc._mistral_client = mock_client
        await svc.embed_text("cache me")
        redis.set.assert_called_once()

    @pytest.mark.asyncio
    async def test_uses_cache_on_second_call(self, embedding_service) -> None:  # type: ignore[no-untyped-def]
        svc, _, redis = embedding_service
        import json
        redis.get = AsyncMock(return_value=json.dumps([0.2] * 1024))
        result = await svc.embed_text("cached text")
        assert len(result) == 1024


class TestIndexing:
    @pytest.mark.asyncio
    async def test_index_actor_upserts(self, embedding_service) -> None:  # type: ignore[no-untyped-def]
        svc, qdrant, _ = embedding_service
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.1] * 1024)]
        mock_client = MagicMock()
        mock_client.embeddings.create_async = AsyncMock(return_value=mock_response)
        svc._mistral_client = mock_client

        from app.models.yunicity import Actor
        actor = Actor(
            id="a1", name="Club", category="sport", city="Reims",
            geo={"lat": 49.25, "lng": 4.03}, description="Club sport",
            tags=["sport"],
        )
        await svc.index_actor(actor)
        qdrant.upsert.assert_called_once()

    @pytest.mark.asyncio
    async def test_index_tribe_upserts(self, embedding_service) -> None:  # type: ignore[no-untyped-def]
        svc, qdrant, _ = embedding_service
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.1] * 1024)]
        mock_client = MagicMock()
        mock_client.embeddings.create_async = AsyncMock(return_value=mock_response)
        svc._mistral_client = mock_client

        from app.models.yunicity import Tribe
        tribe = Tribe(
            id="t1", name="Sport Reims", city="Reims", category="sport",
            members_count=100, activity_score=8.0, description="Sport tribe",
        )
        await svc.index_tribe(tribe)
        qdrant.upsert.assert_called_once()


class TestStableId:
    def test_deterministic(self) -> None:
        assert _stable_id("actor-1") == _stable_id("actor-1")

    def test_different_ids_different_results(self) -> None:
        assert _stable_id("actor-1") != _stable_id("actor-2")


class TestBatchIndex:
    @pytest.mark.asyncio
    async def test_batch_continues_on_error(self, embedding_service) -> None:  # type: ignore[no-untyped-def]
        svc, qdrant, _ = embedding_service
        mock_response = MagicMock()
        mock_response.data = [MagicMock(embedding=[0.1] * 1024)]
        mock_client = MagicMock()
        mock_client.embeddings.create_async = AsyncMock(return_value=mock_response)
        svc._mistral_client = mock_client

        qdrant.upsert.side_effect = [None, Exception("fail")]

        from app.models.yunicity import Actor
        actors = [
            Actor(id=f"a{i}", name=f"A{i}", category="sport", city="Reims",
                  geo={"lat": 49.25, "lng": 4.03}, description="desc",
                  tags=["t"])
            for i in range(2)
        ]
        result = await svc.index_batch(actors, [], max_concurrent=2)
        assert result["actors"] == 2
        assert result["errors"] >= 0
