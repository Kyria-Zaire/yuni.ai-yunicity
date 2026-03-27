"""Prompt templates for the Mistral recommendation service."""

from __future__ import annotations

SYSTEM_PROMPT = """Tu es Yuni AI, l'assistant IA territorial de {city}.
Tu recommandes des acteurs locaux, tribus citoyennes et evenements
en fonction du profil citoyen.

REGLES ABSOLUES :
- Reponds UNIQUEMENT en JSON valide, sans markdown, sans explication
- Respecte exactement la structure demandee
- Maximum 3 acteurs, 2 tribus, 3 evenements
- Raisons courtes (max 100 caracteres par raison)
- Priorite aux acteurs/evenements proches geographiquement
- Langue : francais uniquement"""

USER_PROMPT_TEMPLATE = """Profil citoyen :
- Interets : {interests}
- Points citoyens : {points} (niveau : {level})
- Zone geographique : {geo_zone}

Donnees locales disponibles :
ACTEURS ({actors_count}) :
{actors_data}

TRIBUS ({tribes_count}) :
{tribes_data}

EVENEMENTS A VENIR ({events_count}) :
{events_data}

Genere les recommandations personnalisees.
Format JSON attendu :
{{
  "actors": [
    {{"id":"...","name":"...","category":"...","reason":"...","score":0.0}}
  ],
  "tribes": [
    {{"id":"...","name":"...","category":"...","members_count":0,"reason":"...","score":0.0}}
  ],
  "events": [
    {{"id":"...","title":"...","actor_id":"...","date":"...","category":"...","reason":"..."}}
  ],
  "reason": "Explication globale courte en francais"
}}"""

FALLBACK_TEMPLATES: dict[str, dict[str, object]] = {
    "sport": {
        "reason": "Recommandations basees sur vos interets sportifs",
        "actor_filter": ["sport", "fitness"],
        "tribe_filter": ["sport"],
    },
    "culture": {
        "reason": "Recommandations culturelles pour votre zone",
        "actor_filter": ["culture", "musique", "art"],
        "tribe_filter": ["culture"],
    },
    "environnement": {
        "reason": "Recommandations eco-citoyennes pour votre territoire",
        "actor_filter": ["environnement"],
        "tribe_filter": ["environnement"],
    },
    "famille": {
        "reason": "Recommandations familiales et loisirs",
        "actor_filter": ["famille"],
        "tribe_filter": ["famille"],
    },
    "tech": {
        "reason": "Recommandations tech et innovation locales",
        "actor_filter": ["tech", "innovation"],
        "tribe_filter": ["tech"],
    },
    "default": {
        "reason": "Recommandations locales basees sur votre profil",
        "actor_filter": [],
        "tribe_filter": [],
    },
}
