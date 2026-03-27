# SLO — Yuni AI Production

## Service Level Objectives

### Disponibilite

- **SLO** : 99.5% uptime mensuel
- **SLI** : (requetes reussies / requetes totales) x 100
- **Error budget** : 0.5% = ~3.6h/mois d'indisponibilite toleree

### Latence

| Endpoint | P50 cible | P95 cible | P99 max |
|----------|-----------|-----------|---------|
| POST /v1/recommend/engagement | < 100ms | < 800ms | < 2s |
| GET /v1/vitality/{city}/{zone} | < 50ms | < 500ms | < 1s |
| POST /v1/chat | < 500ms | < 3s | < 10s |

### Cache

- **Cache hit rate** : >= 70% sur /recommend/engagement
- **Embedding cache hit rate** : >= 80% sur Mistral embed

### Budget

- **Cout Mistral** : < 400€/mois a 10k users
- **Alerte a** : 300€/mois (75% du budget)

## Alerting (Railway)

- CPU > 80% pendant 5 min → Scale up
- Memory > 85% → Alert + Scale up
- Response time P95 > 1s → Alert critique
- Error rate > 1% → Alert critique

## Runbook incidents

### Latence elevee (P95 > 800ms)

1. Verifier GET /health → redis + qdrant status
2. Si Redis KO → redemarrer le service Redis Railway
3. Si Qdrant KO → app bascule en fallback automatique
4. Si Mistral timeout → le fallback business rules prend le relais

### Erreur rate > 1%

1. Verifier les logs Railway pour patterns d'erreur
2. Si 401 massive → probleme JWT cote Yunicity
3. Si 503 massive → Mistral + Qdrant tous les deux KO
4. Rollback si erreur liee au dernier deploiement
