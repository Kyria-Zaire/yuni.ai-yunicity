"""Territorial agent with ReAct pattern and Mistral function calling."""

from __future__ import annotations

import asyncio
import json
from typing import TYPE_CHECKING, Any

from app.core.logging import get_logger
from app.models.chat import ChatMessage

if TYPE_CHECKING:
    from app.services.redis_service import RedisService
    from app.services.semantic_search_service import SemanticSearchService

logger = get_logger("agent")

MAX_ITERATIONS = 5
AGENT_TIMEOUT = 30.0

AGENT_TOOLS: list[dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "search_local_actors",
            "description": (
                "Recherche des acteurs locaux dans une ville. "
                "Utilise quand l'utilisateur demande des lieux ou organisations."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string"},
                    "city": {"type": "string"},
                    "top_k": {"type": "integer", "default": 3},
                },
                "required": ["query", "city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_vitality_score",
            "description": (
                "Retourne l'indice de vitalite locale d'un quartier. "
                "Utilise quand l'utilisateur demande l'etat du quartier."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string"},
                    "zone": {"type": "string"},
                },
                "required": ["city", "zone"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_recommendations",
            "description": (
                "Genere des recommandations personnalisees. "
                "Utilise quand l'utilisateur veut des suggestions."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "interests": {"type": "array", "items": {"type": "string"}},
                    "city": {"type": "string"},
                },
                "required": ["interests", "city"],
            },
        },
    },
]

AGENT_TRIGGER_KEYWORDS = [
    "trouve", "cherche", "montre", "quel", "comment",
    "vitalite", "score", "recommande", "conseil",
    "où", "recherche",
]


def should_use_agent(message: str) -> bool:
    words = set(message.lower().split())
    return bool(words & set(AGENT_TRIGGER_KEYWORDS))


class AgentService:
    """ReAct agent that reasons and acts using Mistral function calling."""

    def __init__(
        self,
        mistral_client: Any,
        redis: RedisService,
        semantic: SemanticSearchService | None,
    ) -> None:
        self._client = mistral_client
        self._redis = redis
        self._semantic = semantic

    async def run(
        self,
        user_message: str,
        city: str,
        history: list[ChatMessage],
    ) -> tuple[str, list[dict[str, Any]]]:
        messages: list[dict[str, Any]] = [
            {"role": "system", "content": _agent_system_prompt(city)},
            *[{"role": m.role, "content": m.content} for m in history],
            {"role": "user", "content": user_message},
        ]
        actions: list[dict[str, Any]] = []

        for _iteration in range(MAX_ITERATIONS):
            try:
                response = await asyncio.wait_for(
                    self._client.chat.complete_async(
                        model="mistral-large-latest",
                        messages=messages,
                        tools=AGENT_TOOLS,
                        tool_choice="auto",
                        max_tokens=1000,
                    ),
                    timeout=AGENT_TIMEOUT / MAX_ITERATIONS,
                )
            except TimeoutError:
                logger.warning("agent_iteration_timeout")
                break

            choice = response.choices[0]
            if not choice.message.tool_calls:
                return choice.message.content or "", actions

            msg_dict: dict[str, Any] = {
                "role": "assistant",
                "content": choice.message.content or "",
                "tool_calls": [
                    tc.model_dump() for tc in choice.message.tool_calls
                ],
            }
            messages.append(msg_dict)

            for tc in choice.message.tool_calls:
                args = json.loads(tc.function.arguments)
                result = await self._execute_tool(
                    tc.function.name, args, city,
                )
                actions.append({
                    "tool": tc.function.name,
                    "args": args,
                    "result_preview": str(result)[:200],
                })
                messages.append({
                    "role": "tool",
                    "tool_call_id": tc.id,
                    "content": json.dumps(result, ensure_ascii=False),
                })

        logger.warning("agent_max_iterations_reached", city=city)
        return (
            "Je n'ai pas pu completer ma recherche. "
            "Pouvez-vous reformuler votre question ?",
            actions,
        )

    async def _execute_tool(
        self,
        name: str,
        args: dict[str, Any],
        city: str,
    ) -> dict[str, Any]:
        if name == "search_local_actors" and self._semantic is not None:
            results = await self._semantic.search_actors(
                interests=[args["query"]],
                city=args.get("city", city),
                top_k=min(args.get("top_k", 3), 5),
            )
            return {"actors": [r.model_dump() for r in results]}

        if name == "get_vitality_score":
            cache_key = f"vitality:v1:{args['city']}:{args['zone']}"
            cached = await self._redis.get(cache_key)
            if cached:
                vdata = json.loads(cached)
                return {
                    "score": vdata["score"],
                    "grade": vdata["grade"],
                    "trend": vdata["trend"],
                }
            return {"error": "Score de vitalite non disponible"}

        if name == "get_recommendations" and self._semantic is not None:
            actors = await self._semantic.search_actors(
                interests=args["interests"],
                city=args.get("city", city),
                top_k=3,
            )
            return {"actors": [r.model_dump() for r in actors]}

        logger.warning("unknown_tool_called", tool=name)
        return {"error": f"Outil inconnu: {name}"}


def _agent_system_prompt(city: str) -> str:
    return (
        f"Tu es Yuni AI, l'agent territorial intelligent de {city}.\n\n"
        "Tu as acces a des outils pour rechercher des acteurs locaux, "
        "obtenir les scores de vitalite et generer des recommandations.\n\n"
        "1. Analyse la demande\n"
        "2. Utilise les outils pour obtenir des donnees reelles\n"
        "3. Synthetise une reponse basee sur les donnees\n"
        "4. Cite tes sources\n\n"
        f"Tu reponds en francais. Ne reponds JAMAIS avec des infos inventees sur {city}."
    )
