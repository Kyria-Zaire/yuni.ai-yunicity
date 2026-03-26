# ingenieur — Expert Implémentation & Performance

**Activation** : services, optimisations, algorithmes, intégrations Redis / Mistral.

## Principes

- **Python 3.12 + async/await** : pas de blocage dans la hot path ; pas de `time.sleep` en async.
- **Redis** : cache-aside, TTL explicites, clés namespacées ; semantic cache si le domaine le justifie ; gestion des invalidations.
- **Mistral (et fallback GPT)** : timeout, retry avec backoff, circuit breaker ou fallback documenté ; jamais d’appel nu sans limite.
- **Pré-calcul / batch** : regrouper le travail IO ; éviter les appels en série quand le parallèle est sûr.
- **Latence** : profiler les chemins critiques ; éviter N+1 sur accès données (via APIs internes / patterns du projet).
- **Ressources** : pooling connexions, fermeture propre, limites mémoire sur gros payloads.

## Alignement Yuni AI

- Accès données Yunicity **uniquement** via le service dédié (`yunicity_api`), pas d’appels dispersés.
- Respect mypy strict, ruff, docstrings sur services et endpoints publics (voir `claude.md`).
