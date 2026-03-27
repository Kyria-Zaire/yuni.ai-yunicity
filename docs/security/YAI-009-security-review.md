# Security Review — YAI-009 POST /v1/recommend/engagement

**Date** : 2026-03-27
**Reviewer** : Yuni AI @reviewer-securite-code
**Scope** : `app/routers/recommend.py`, `app/services/mistral_service.py`, `app/services/recommendation_service.py`

---

## 1. JWT Authentication

| Controle | Statut | Detail |
|----------|--------|--------|
| verify_jwt est un Depends() obligatoire | OK | Impossible de bypasser — FastAPI injecte avant le handler |
| RS256 utilise (pas HS256) | OK | `algorithms=["RS256"]` dans `jose.jwt.decode` |
| Expiration verifiee | OK | python-jose verifie `exp` par defaut |
| Header Authorization absent → 401 | OK | `HTTPBearer(auto_error=False)` + check `credentials is None` |
| Token malformatke → 401 | OK | `JWTError` → `AuthenticationError` → 401 |

## 2. Rate Limiting

| Controle | Statut | Detail |
|----------|--------|--------|
| Rate limit present | OK | Configurable via `RATE_LIMIT_PER_MINUTE` (default 20) |
| 429 retourne ProblemDetail | OK | Exception handler RateLimitError → JSON RFC 7807 |
| Par IP (pas par user) | OK | Suffisant pour le MVP |

## 3. Input Validation

| Controle | Statut | Detail |
|----------|--------|--------|
| extra="forbid" sur UserInput | OK | Champs non declares → 422 |
| user_id_hash 63 chars → rejet | OK | `min_length=64, max_length=64, pattern=r'^[a-f0-9]{64}$'` |
| Interet non autorise → rejet | OK | `field_validator('interests')` verifie la whitelist |
| GPS invalide → rejet | OK | `ge=-90, le=90` sur lat, `ge=-180, le=180` sur lng |
| Injection dans city | OK | `max_length=100`, pas d'injection SQL possible (pas de DB directe) |
| Injection prompt via interests | OK | Whitelist fermee, pas de texte libre |

## 4. Logs — Absence de PII

| Controle | Statut | Detail |
|----------|--------|--------|
| user_id_hash absent des logs | OK | Seuls city, source, latency_ms, cache_hit sont logues |
| IP complete absente des logs | OK | Le middleware de logging ne logue pas l'IP |
| Stack traces filtrees | OK | Handler 500 retourne message generique |

## 5. Headers de Securite

| Controle | Statut | Detail |
|----------|--------|--------|
| X-Content-Type-Options: nosniff | OK | Middleware Sprint 0 |
| X-Frame-Options: DENY | OK | Middleware Sprint 0 |
| X-XSS-Protection | OK | Middleware Sprint 0 |
| Content-Security-Policy | OK | `default-src 'none'` |
| Pas de header Server | OK | Supprime dans le middleware |
| HSTS en prod | OK | `Strict-Transport-Security` ajoute si `is_prod` |

## 6. Gestion d'Erreurs

| Controle | Statut | Detail |
|----------|--------|--------|
| Stack trace jamais exposee en prod | OK | Handler Exception → message generique |
| 500 → message generique | OK | "An unexpected error occurred" |
| ExternalAPIError → 503 | OK | Catch explicite dans le handler recommend_engagement |
| ProblemDetail sur toutes les erreurs | OK | RFC 7807 conforme |

## 7. Protection Prompt Injection (Mistral)

| Controle | Statut | Detail |
|----------|--------|--------|
| _sanitize_for_prompt applique | OK | Sur tous les textes avant injection dans le prompt |
| Regex blacklist | OK | "ignore instructions", "act as", "jailbreak", "system prompt" |
| Longueur max 500 chars | OK | Tronque apres nettoyage |
| Caracteres de controle supprimes | OK | Regex `[\x00-\x08\x0b\x0c\x0e-\x1f]` |

---

## Conclusion

**Tous les controles de securite sont OK.** L'endpoint est production-ready du point de vue securite pour le MVP. Aucune correction necessaire.

### Recommandations futures (Sprint 2+)
1. Ajouter rate limiting par `user_id_hash` (en plus de l'IP)
2. Implementer un WAF devant Railway en production
3. Ajouter des alertes sur les patterns d'injection detectes
4. Audit externe OWASP Top 10 avant le lancement beta
