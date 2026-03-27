# Yuni AI

Microservice IA hyperlocal pour Yunicity — recommandations personnalisees, chat conversationnel, indice de vitalite et dashboards villes.

## Architecture

```
                  ┌─────────────┐
                  │   Yunicity   │
                  │  (frontend)  │
                  └──────┬──────┘
                         │ JWT RS256
                  ┌──────▼──────┐
                  │   Yuni AI   │
                  │   FastAPI   │
                  └──┬──┬──┬──┬─┘
                     │  │  │  │
          ┌──────────┘  │  │  └──────────┐
          ▼             ▼  ▼             ▼
     ┌─────────┐  ┌──────┐ ┌───────┐ ┌────────┐
     │ Mistral │  │Redis │ │Qdrant │ │ Stripe │
     │Large 2  │  │  7   │ │vector │ │webhooks│
     └─────────┘  └──────┘ └───────┘ └────────┘
```

## Stack technique

| Composant | Technologie | Role |
|-----------|-------------|------|
| Framework | FastAPI 0.115 | API REST async |
| Runtime | Python 3.12 | Typage strict (mypy) |
| IA generation | Mistral Large 2 | Recommandations + Chat + Agent |
| IA embeddings | mistral-embed | Recherche semantique (1024 dims) |
| Cache + memoire | Redis 7 | Cache, sessions chat, abonnements |
| Vector store | Qdrant | Similarite cosine acteurs/tribus |
| Auth | PyJWT[crypto] | JWT RS256 |
| Paiements | Stripe | Abonnements Pro |
| Validation | Pydantic v2 | Schemas stricts |
| Tests | pytest + httpx | 225 tests, coverage >= 80% |
| Lint | ruff + mypy | 0 warning, strict mode |
| Hosting | Railway | Auto-scaling, Redis plugin |
| CI/CD | GitHub Actions | Deploy recette + prod |

## Endpoints

| Methode | Endpoint | Description | Auth |
|---------|----------|-------------|------|
| POST | `/v1/recommend/engagement` | Recommandations IA personnalisees | JWT |
| POST | `/v1/chat` | Chat conversationnel avec memoire | JWT |
| DELETE | `/v1/chat/{session_id}` | Suppression session (RGPD) | JWT |
| GET | `/v1/vitality/{city}/{zone}` | Indice de vitalite 0-100 | JWT |
| GET | `/v1/dashboard/{city}/vitality` | Scores vitalite par zone | JWT city_dashboard |
| GET | `/v1/dashboard/{city}/engagement` | KPIs engagement agreges | JWT city_dashboard |
| GET | `/v1/dashboard/{city}/actors` | Acteurs avec compteur reco | JWT city_dashboard |
| GET | `/v1/dashboard/{city}/export` | Export CSV/JSON | JWT city_dashboard |
| DELETE | `/v1/ai/user-data/{hash}` | Effacement donnees (RGPD Art.17) | JWT |
| POST | `/v1/webhooks/stripe` | Webhook abonnements | Signature Stripe |
| GET | `/health` | Status + metriques | Public |
| GET | `/internal/metrics` | Metriques detaillees | Token admin |

## Commandes

```bash
# Installation
pip install -e ".[dev]"

# Lancer en local (Docker — Redis + Qdrant)
make run

# Lancer sans Docker
uvicorn app.main:app --reload --port 8000

# Tests
make test

# Qualite (lint + typecheck + audit)
make check

# Pre-deploy check
make predeploy

# Indexer Qdrant (donnees Reims)
make seed-qdrant

# Benchmark qualite recommandations
make benchmark

# Pre-computation vitalite nocturne
make precompute-vitality

# Load test k6 (recette)
make load-test TEST_JWT=<token>
```

## Deploiement

### Prerequis

1. Compte Railway actif sur [railway.app](https://railway.app)
2. Projet `yuni-ai` avec services `yuni-ai-recette` et `yuni-ai-prod`
3. Plugin Redis installe sur chaque service Railway
4. Qdrant Cloud EU (ou Railway Qdrant service)
5. Tokens Railway dans GitHub Secrets (`RAILWAY_TOKEN_RECETTE` + `RAILWAY_TOKEN_PROD`)

### Variables d'environnement

Toutes les variables sont documentees dans :
- Recette : `infra/environments/recette.env.template`
- Production : `infra/environments/prod.env.template`

### Workflows CI/CD

| Workflow | Trigger | Cible |
|----------|---------|-------|
| `deploy-recette.yml` | Push sur `develop` | Railway recette |
| `deploy-prod.yml` | Push sur `main` | Railway prod (approbation manuelle) |

### Verifier un deploy

```bash
# Health check
curl https://yuni-ai.up.railway.app/health

# Endpoint (retourne 401 sans JWT)
curl -X POST https://yuni-ai.up.railway.app/v1/recommend/engagement \
  -H "Content-Type: application/json" -d '{}'
```

### Rollback

```bash
railway rollback --service yuni-ai-prod
```

## Securite

- JWT RS256 sur tous les endpoints sensibles
- Rate limiting : 20 req/min par user
- Feature flag rollout deterministe (hash-based)
- Guard webhook : bloque en dev/recette, actif uniquement en prod
- Stripe signature verification + idempotence
- Anonymisation : SHA-256 avec sel, geoloc tronquee
- Zero PII dans les logs
- Headers securite : HSTS, X-Frame-Options, CSP, X-XSS-Protection

## RGPD

- DELETE `/v1/ai/user-data/{hash}` — droit a l'effacement
- DELETE `/v1/chat/{session_id}` — suppression session chat
- Registre des traitements : `docs/rgpd/data-processing.md`
- Sous-traitants documentes : Mistral AI (FR), Railway (US), Qdrant (DE)
- Consentement explicite capture lors de l'onboarding Yunicity

## Documentation

- [CHANGELOG](docs/CHANGELOG.md) — Historique complet Sprint 0 a Sprint 4
- [Release Checklist](docs/RELEASE-CHECKLIST.md) — Actions avant mise en prod
- [SLO](docs/infra/slo.md) — Objectifs de niveau de service
- [Kubernetes Roadmap](docs/infra/kubernetes-roadmap.md) — Migration Phase 3
- [Data Processing Registry](docs/rgpd/data-processing.md) — Registre RGPD
