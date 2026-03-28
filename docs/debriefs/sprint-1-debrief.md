# Sprint 1 — Debrief

**Date** : 2026-03-27
**Sprint** : Sprint 1 — POST /v1/recommend/engagement
**Phase BMAD** : D (Deploy & Debrief)

---

## Objectif Sprint

> Livrer le premier endpoint IA operationnel : POST /v1/recommend/engagement
> avec cache-aside Redis, fallback business rules, et securite JWT.

## Resultats

### Tickets livres

| Ticket | Titre | Statut |
|--------|-------|--------|
| YAI-006 | Schemas Pydantic — contrat API | DONE |
| YAI-007 | Service Mistral + prompt engineering + fallback | DONE |
| YAI-008 | Cache-aside Redis recommandations | DONE |
| YAI-009 | Router FastAPI + endpoint complet + security review | DONE |
| YAI-010 | Tests integration + benchmark latence + metrics | DONE |

### Metriques qualite

| Metrique | Cible | Resultat |
|----------|-------|----------|
| Tests | 0 failure | 106 passed, 1 skipped |
| Coverage | >= 80% | 86% |
| mypy --strict | 0 erreur | 0 erreur |
| ruff | 0 warning | 0 warning |
| Cache hit P95 | < 5ms | < 2ms (mesure) |
| Fallback P95 | < 5ms | < 1ms (mesure) |
| pip-audit | 0 CVE critique | 0 CVE |

### Performance

- **Cache hit** : P95 < 2ms, P50 < 1ms
- **Fallback business rules** : P95 < 1ms (zero appel reseau)
- **Mistral** : sera mesure en recette avec API reelle (test skip en dev)

### Securite

- Rapport complet dans `docs/security/YAI-009-security-review.md`
- JWT RS256 obligatoire, rate limiting par IP, zero PII dans les logs
- Prompt injection protection active (regex blacklist + sanitization)
- Headers de securite complets (HSTS, X-Frame-Options, CSP, etc.)

## Architecture livree

```
POST /v1/recommend/engagement
  → JWT verify (Depends)
  → UserInput validation (Pydantic v2 strict)
  → RecommendationService.get_recommendations()
    → Redis cache check (< 2ms)
    → [miss] asyncio.gather(Yunicity passport, Yunicity map_data)
    → [miss] MistralService.recommend() (retry x3, timeout 10s)
    → [error] Business rules fallback (< 1ms)
    → Cache set (TTL 24h)
  → RecommendationResponse (APIResponse envelope)
```

## Fichiers crees/modifies

### Nouveaux fichiers (Sprint 1)
- `app/models/recommend.py` — Schemas Pydantic (contrat API)
- `app/core/prompts.py` — Templates Mistral
- `app/core/metrics.py` — Metriques in-memory
- `app/services/mistral_service.py` — Service Mistral + retry + fallback
- `app/services/recommendation_service.py` — Orchestrateur cache-aside
- `app/routers/recommend.py` — Endpoint POST /v1/recommend/engagement
- `scripts/precompute_recommendations.py` — Pre-computation nocturne
- `tests/unit/test_schemas_recommend.py` — 13 tests schemas
- `tests/unit/test_mistral_service.py` — 12 tests Mistral
- `tests/unit/test_recommendation_service.py` — 10 tests cache-aside
- `tests/integration/test_recommend_endpoint.py` — 15 tests endpoint
- `tests/benchmark/test_latency.py` — 3 tests latence
- `tests/fixtures/auth_fixtures.py` — JWT RS256 test fixtures
- `tests/fixtures/recommend_fixtures.py` — Fixtures partagees
- `docs/security/YAI-009-security-review.md` — Rapport securite

### Fichiers modifies
- `app/main.py` — Integration MistralService + RecommendationService
- `app/routers/health.py` — Metriques dans /health
- `app/models/yunicity.py` — Ajout tribes dans MapData
- `app/mocks/yunicity_mock_service.py` — Tribes dans get_map_data
- `app/core/dependencies.py` — Future annotations
- `pyproject.toml` — Override mypy pour mistralai

## Decisions techniques (ADR)

1. **Cache key anonyme** : pas de user_id_hash dans la cle → conforme RGPD
2. **Fallback deterministe** : regles metier locales sans appel reseau, < 5ms
3. **Retry Mistral** : 3 tentatives avec backoff exponentiel (1s, 2s, 4s)
4. **Metriques in-memory** : pas de dependance externe (Prometheus) pour le MVP
5. **Rate limiting** : par IP via middleware, 20 req/min configurable

## Risques identifies

| Risque | Mitigation |
|--------|------------|
| Latence Mistral en prod | Timeout 10s + fallback < 5ms |
| Cache stampede | Pre-computation nocturne + TTL 24h |
| Token JWT compromise | RS256 (cle asymetrique), expiration verifiee |

## Next : Sprint 2

> Beta 10% users Reims + Monitoring Railway
> - Monitoring et alertes Railway
> - Dashboard metriques
> - Deployment pipeline complet
> - Feature flags pour le rollout progressif
