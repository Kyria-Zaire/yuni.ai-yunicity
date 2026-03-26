# Yuni AI

Microservice IA hyperlocal pour Yunicity — recommandations personnalisées basées sur le profil citoyen, les tribus et l'activité locale.

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Framework | FastAPI 0.115.x |
| Runtime | Python 3.12 |
| IA | Mistral Large 2 (fallback GPT-4o) |
| Cache | Redis 7.x |
| Validation | Pydantic v2 (strict) |
| Tests | pytest + httpx |
| Lint | ruff + mypy |
| Deploy | Docker + Railway |

## Commandes

```bash
# Installation
pip install -e ".[dev]"

# Lancer en local (Docker)
make run

# Lancer sans Docker
uvicorn app.main:app --reload --port 8000

# Tests
make test

# Qualite (lint + typecheck + audit)
make check
```
