# Resultats Load Test — Sprint 4

## Configuration

- Outil : k6
- Cible : Railway recette
- Profil : 0 → 50 → 200 → 500 → 0 VUs sur 12 minutes
- Endpoint : POST /v1/recommend/engagement

## Resultats attendus (seuils SLO)

| Metrique | Seuil | Resultat | Statut |
|----------|-------|----------|--------|
| P95 latence | < 800ms | [a mesurer] | |
| Error rate | < 1% | [a mesurer] | |
| Cache hit rate | > 70% | [a mesurer] | |

## Commande

```bash
make load-test TEST_JWT=<jwt_token>
```
