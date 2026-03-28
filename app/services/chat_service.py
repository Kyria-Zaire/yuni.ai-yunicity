"""Chat orchestration — builds Mistral messages from history + context."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

from app.core.logging import get_logger
from app.models.chat import ChatMessage, ChatResponse
from app.services.chat_memory_service import SYSTEM_PROMPT_TEMPLATE

if TYPE_CHECKING:
    from app.models.chat import ChatRequest
    from app.services.chat_memory_service import ChatMemoryService

logger = get_logger("chat_service")


class ChatService:
    """Stateless chat handler — delegates memory and Mistral calls."""

    def __init__(self, mistral_client: Any) -> None:
        self._client = mistral_client

    async def chat(
        self,
        request: ChatRequest,
        memory: ChatMemoryService,
    ) -> ChatResponse:
        history = await memory.get_history(
            request.session_id, request.user_id_hash,
        )
        territorial_context = await memory.build_territorial_context(
            request.city, request.user_id_hash,
        )

        system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
            city=request.city,
            territorial_context=territorial_context,
        )

        messages: list[dict[str, str]] = [
            {"role": "system", "content": system_prompt},
            *[{"role": m.role, "content": m.content} for m in history],
            {"role": "user", "content": request.message},
        ]

        response = await self._client.chat.complete_async(
            model="mistral-large-latest",
            messages=messages,
            max_tokens=800,
            temperature=0.7,
        )
        assistant_content: str = response.choices[0].message.content

        updated = await memory.append_and_save(
            request.session_id,
            request.user_id_hash,
            request.message,
            assistant_content,
        )

        context_used = ["territorial_context"]
        if history:
            context_used.append("history")

        return ChatResponse(
            session_id=request.session_id,
            message=ChatMessage(role="assistant", content=assistant_content),
            history_length=len(updated),
            context_used=context_used,
        )
