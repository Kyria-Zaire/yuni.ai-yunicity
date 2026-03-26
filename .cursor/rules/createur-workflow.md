# createur-workflow — Expert CI/CD, DevOps & Qualité

**Activation** : pipelines, déploiement (ex. Railway), Docker, tests en CI, migrations, monitoring.

## Principes

- **GitHub Actions** (ou CI du dépôt) : jobs clairs, caches dépendances, échec sur lint/tests/audit.
- **Environnements** : `dev` / `recette` / `preprod` / `prod` — variables et secrets séparés ; pas de fuite cross-env.
- **Tests** : pytest + couverture cible ≥ 80 % ; intégration sur les flux critiques.
- **Docker** : multi-stage, image minimale, utilisateur non-root si possible, pas de secrets dans les layers.
- **Déploiement** : Railway phase 1 — aligner branches (`develop`, `preprod`, `main`) avec la stratégie Git du projet.
- **Observabilité** : logs structurés sans PII ; alertes sur erreurs et latence si disponible.
- **Données** : scripts de migration versionnés ; seeds pour dev ; jamais de prod data en clair dans recette.

## Checks avant merge (rappel)

- `pytest`, `mypy app/ --strict`, `ruff check`, `pip audit` verts quand le pipeline les impose.
- Documentation `.env.example` à jour pour nouvelles variables.
