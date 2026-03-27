# Changelog — Yuni AI

## v1.1.0 — Sprint 4 (Juillet 2026)

### Chat IA
- POST /v1/chat avec memoire Redis (30 messages, rolling window)
- Contexte territorial injecte automatiquement (vitalite)
- DELETE /v1/chat/{session_id} pour suppression RGPD

### Agent territorial ReAct
- Pattern ReAct avec Mistral function calling
- 3 outils : search_local_actors, get_vitality_score, get_recommendations
- Dispatch automatique agent vs chat classique (keyword detection)
- Protection max 5 iterations + timeout 30s

### Dashboard villes API
- GET /v1/dashboard/{city}/vitality — scores par zone
- GET /v1/dashboard/{city}/engagement — KPIs agreges
- GET /v1/dashboard/{city}/actors — acteurs avec compteur recommandations
- GET /v1/dashboard/{city}/export — export CSV/JSON
- Auth role=city_dashboard avec scoping par ville

### Abonnement Pro Stripe
- Feature gate Pro sur /v1/chat (402 Payment Required)
- Webhook Stripe avec 4 gardes (env, test key, signature, idempotence)
- SubscriptionService avec statuts FREE/PRO/PRO_PLUS

### Production
- Workflow deploy-prod.yml avec approbation manuelle
- Smoke tests production (health + endpoint secured)
- Monitoring 5 min post-deploy
- ROLLOUT_PERCENTAGE=100

### Load testing et SLO
- Script k6 (50 → 200 → 500 VUs)
- SLO documentes : 99.5% uptime, P95 < 800ms, cache > 70%
- Runbooks incidents
- Kubernetes roadmap documentee

---

## v0.3.0 — Sprint 3 (Juin 2026)

### Embeddings et Qdrant
- Qdrant vector store integre (Docker dev, Cloud prod)
- EmbeddingService avec mistral-embed (1024 dims)
- Cache Redis des embeddings (TTL 30 jours)
- Batch indexing avec semaphore

### Recherche semantique
- SemanticSearchService avec cosine similarity
- Filtre par ville via payload Qdrant
- Query naturelle construite a partir des interets
- Fallback gracieux si Qdrant indisponible

### Indice de vitalite
- Score composite 0-100 sur 5 dimensions
- Grades A-E et trend up/stable/down
- GET /v1/vitality/{city}/{zone}
- Cache 30 jours avec pre-computation nocturne

### Pipeline semantique
- /recommend enrichi : Qdrant top-5 → Mistral preselection
- Reduction tokens Mistral grace a la preselection

---

## v0.2.0 — Sprint 2 (Mai 2026)

### Deploy Railway recette
- Workflow deploy-recette.yml avec smoke tests
- Script pre_deploy_check.py

### Feature flag rollout
- RolloutService deterministe (hash-based buckets)
- ROLLOUT_PERCENTAGE configurable sans redeploy
- Admin bypass header

### Monitoring et budget
- YuniAIMetrics enrichi (latence P50/P95, cout Mistral)
- Budget alerting (warning/critical/emergency)
- GET /internal/metrics (admin)

### Service Yunicity reel
- RealYunicityHTTPService avec degradation gracieuse
- httpx client partage avec connection pool

### RGPD
- DELETE /v1/ai/user-data/{user_hash}
- Registre des traitements documente
- docs/rgpd/data-processing.md

---

## v0.1.0 — Sprint 1 (Avril 2026 — Semaines 2-3)

### Endpoint recommandation
- POST /v1/recommend/engagement
- MistralService avec retry et fallback business rules
- Cache Redis (TTL 1h)
- Prompt engineering securise (anti-injection)

### Modeles Yunicity
- UserPassport, MapData, Actor, Tribe, Event
- Mock Yunicity service (donnees Reims)

---

## v0.0.1 — Sprint 0 (Avril 2026 — Semaine 1)

### Fondations
- Projet FastAPI structure (app/, tests/, infra/, docs/)
- Config centralisee (Pydantic Settings)
- Logging structure JSON
- JWT RS256 authentication
- Redis service avec degradation gracieuse
- Health endpoint
- Docker Compose dev
- CI GitHub Actions (ruff, mypy, pytest, pip-audit)
