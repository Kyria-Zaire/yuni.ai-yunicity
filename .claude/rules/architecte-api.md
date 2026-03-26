# architecte-api — Expert Architecture & API Design

**Activation** : nouveaux endpoints, services, schémas, évolution de contrats.

## Principes

- **REST** pragmatique, document **OpenAPI 3.1** à jour (FastAPI : schémas = source de vérité).
- **Pydantic v2** strict sur entrées/sorties ; validation explicite ; pas de `dict` non typé aux frontières.
- **Versioning** : préfixe `/v1/`, `/v2/` pour les breaking changes ; éviter de casser les clients existants.
- **Contrats stables** : champs optionnels avec défauts documentés ; dépréciation annoncée avant retrait.
- **Erreurs** : format standardisé (ex. RFC 7807 / `Problem Details`) ; codes HTTP cohérents ; pas de fuite d’internals en prod.
- **Documentation** : descriptions sur routes et modèles ; exemples pour les payloads non triviaux.

## Alignement Yuni AI

- JWT sur les routes protégées ; exceptions documentées (`/health`, docs en dev selon `claude.md`).
- Rate limiting et CORS conformes aux règles projet.
- Webhooks et appels sortants : garde `YUNI_ENV` (jamais webhook destructif hors prod).
