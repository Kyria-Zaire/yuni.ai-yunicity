# Sprint 3 Debrief — Embeddings + Qdrant + Indice de Vitalite

## Periode
Juin 2026 — Semaines 6-8

## Tickets livres

| Ticket | Titre | Statut |
|--------|-------|--------|
| YAI-016 | Qdrant setup + embeddings pipeline | Done |
| YAI-017 | Semantic search service | Done |
| YAI-018 | Indice de Vitalite Locale | Done |
| YAI-019 | Upgrade /recommend avec semantique | Done |
| YAI-020 | Tests + indexation Reims + benchmark | Done |

## Architecture ajoutee

```
User interests -> EmbeddingService (mistral-embed)
              -> Qdrant search (cosine similarity)
              -> Top-5 actors + Top-3 tribes
              -> Mistral (presélection réduite)
              -> Response
```

## KPIs a mesurer (48h post-deploy)

| Metrique | Cible | A mesurer |
|----------|-------|-----------|
| Cache hit rate | >= 70% | GET /health |
| P95 latence /recommend | < 800ms | GET /health |
| Cout Mistral / requete | < 0.01 EUR | Metriques tokens |
| Recall benchmark | >= 50% | make benchmark |
| Score vitalite Reims Centre | Reference | GET /v1/vitality/reims/centre |

## Gains attendus

- Tokens Mistral reduits : 5 acteurs au lieu de 20+ dans le prompt
- Pertinence amelioree : recherche semantique vs filtrage par categorie
- Nouvelle fonctionnalite monetisable : Indice de Vitalite (dashboards villes)

## Risques identifies

- Qdrant en dev Docker : migration vers Qdrant Cloud a planifier pour prod
- Embeddings Mistral : cout faible mais a surveiller si volume augmente
- VitalityInputData : depends du nouvel endpoint Yunicity (a coordonner)

## Next Sprint

Sprint 4 : Chat memoire + Agent territorial + Dashboards villes (Juillet)
