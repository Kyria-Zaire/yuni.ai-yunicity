"""Chat endpoints — POST /v1/chat and DELETE /v1/chat/{session_id}."""

from __future__ import annotations

import asyncio
import time
from typing import Any

from fastapi import APIRouter, Depends, Path, Request

from app.core.logging import get_logger
from app.core.security import verify_jwt
from app.models.audit import AIDecisionType
from app.models.chat import ChatRequest, ChatResponse
from app.services.agent_service import AgentService, should_use_agent
from app.services.chat_memory_service import ChatMemoryService
from app.services.chat_service import ChatService
from app.services.redis_service import get_redis_service

logger = get_logger("chat_router")

router = APIRouter(tags=["chat"])


@router.post(
    "/v1/chat",
    response_model=ChatResponse,
    summary="Chat conversationnel avec memoire",
    responses={
        200: {"description": "Reponse du chat"},
        401: {"description": "JWT manquant ou invalide"},
        422: {"description": "Donnees invalides"},
    },
)
async def chat(
    request: Request,
    body: ChatRequest,
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> ChatResponse:
    start = time.perf_counter()
    redis = get_redis_service()
    memory = ChatMemoryService(redis)
    mistral_client = request.app.state.mistral_client
    semantic = getattr(request.app.state, "semantic_service", None)
    blackbox = getattr(request.app.state, "civic_blackbox_service", None)

    if should_use_agent(body.message) and semantic is not None:
        agent = AgentService(mistral_client, redis, semantic)
        history = await memory.get_history(body.session_id, body.user_id_hash)
        answer, _actions = await agent.run(body.message, body.city, history)
        updated = await memory.append_and_save(
            body.session_id, body.user_id_hash,
            body.message, answer,
        )
        latency_ms = int((time.perf_counter() - start) * 1000)
        if blackbox:
            asyncio.create_task(blackbox.record(  # noqa: RUF006
                decision_type=AIDecisionType.AGENT_ACTION,
                model_used="mistral-large-latest",
                source="agent",
                city=body.city,
                decision_summary=f"Agent ReAct: {answer[:80]}",
                factors=["agent", "tools"],
                confidence=0.8,
                latency_ms=latency_ms,
                user_id_hash=body.user_id_hash,
            ))
        from app.models.chat import ChatMessage
        return ChatResponse(
            session_id=body.session_id,
            message=ChatMessage(role="assistant", content=answer),
            history_length=len(updated),
            context_used=["agent", "tools"],
        )

    svc = ChatService(mistral_client)
    response = await svc.chat(body, memory)
    latency_ms = int((time.perf_counter() - start) * 1000)
    if blackbox:
        asyncio.create_task(blackbox.record(  # noqa: RUF006
            decision_type=AIDecisionType.CHAT_RESPONSE,
            model_used="mistral-large-latest",
            source="mistral",
            city=body.city,
            decision_summary=f"Chat: {response.message.content[:80]}",
            factors=["chat", "memory"],
            confidence=0.85,
            latency_ms=latency_ms,
            user_id_hash=body.user_id_hash,
        ))
    return response


@router.delete(
    "/v1/chat/{session_id}",
    summary="Supprimer une session de chat (RGPD)",
    responses={200: {"description": "Session supprimee"}},
)
async def delete_chat_session(
    session_id: str = Path(..., min_length=36, max_length=36),
    jwt_payload: dict[str, Any] = Depends(verify_jwt),
) -> dict[str, str]:
    user_hash = jwt_payload.get("sub", "")
    redis = get_redis_service()
    memory = ChatMemoryService(redis)
    await memory.delete_session(session_id, user_hash)
    return {"status": "deleted", "session_id": session_id}
