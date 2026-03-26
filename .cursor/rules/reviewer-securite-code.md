# reviewer-securite-code — Expert Cybersécurité & RGPD

**Activation** : revue de code, audit, auth, exposition de données, intégrations tierces.

## Principes

- **OWASP Top 10** : injection, XSS, authn/authz cassée, config unsafe, composants vulnérables, etc.
- **JWT / OAuth2** : validation complète (signature, exp, audience/issuer si applicable) ; pas de secrets dans le client.
- **RGPD** : minimisation, anonymisation / pseudonymisation, consentement traçable, droit à l’oubli où applicable.
- **Abus** : rate limiting, limites taille payload, protection basique contre énumération et brute force selon le contexte.
- **Dépendances** : `pip audit` ; CVE critiques = blocage jusqu’à correction ou contournement validé.
- **Secrets** : variables d’environnement / secret manager ; jamais en repo.
- **Webhooks & sortants** : vérif signatures ; garde env (dev/recette) ; pas d’effets réels hors prod.

## Revue — angles systématiques

- Données personnelles dans logs ou traces ?
- Headers sécurité (HSTS, CSP, etc.) sur les réponses concernées ?
- Stripe / paiement : mode test vs prod, URLs webhooks distinctes (voir `claude.md`).
