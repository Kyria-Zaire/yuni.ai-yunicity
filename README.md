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

# Pre-deploy check
make predeploy
```

## Deploiement

### Prerequis Railway

1. Compte Railway actif sur [railway.app](https://railway.app)
2. Projet `yuni-ai` cree avec service `yuni-ai-recette`
3. Plugin Redis installe sur le projet Railway
4. Token Railway (`RAILWAY_TOKEN_RECETTE`) configure dans les GitHub Secrets

### Variables d'environnement

Toutes les variables sont documentees dans `infra/environments/recette.env.template`.
Elles doivent etre configurees **manuellement** dans Railway > Settings > Variables.

Variables obligatoires :
- `MISTRAL_API_KEY` — cle API Mistral
- `REDIS_URL` — fourni automatiquement par Railway Redis
- `JWT_PUBLIC_KEY` — cle publique RSA Yunicity
- `ALLOWED_HOSTS` — hostname Railway
- `ANONYMIZATION_SALT` — generer avec `python -c "import secrets; print(secrets.token_hex(32))"`
- `YUNICITY_API_BASE_URL` — URL API Yunicity
- `YUNICITY_SERVICE_TOKEN` — token service

### Declencher un deploy

Tout push sur `develop` declenche automatiquement le workflow `.github/workflows/deploy-recette.yml` qui :
1. Installe Railway CLI
2. Deploy sur Railway recette
3. Attend 45 secondes
4. Execute les smoke tests (health check + endpoint disponible)

### Verifier le deploy

```bash
# Health check
curl https://yuni-ai-recette.up.railway.app/health

# Endpoint (doit retourner 401 sans JWT)
curl -X POST https://yuni-ai-recette.up.railway.app/v1/recommend/engagement \
  -H "Content-Type: application/json" -d '{}'
```

### Rollback

```bash
railway rollback --service yuni-ai-recette
```
