# PRD — Product Requirements Document
# Yuni AI — Template v1.0
> Colonne vertébrale produit. À remplir pour chaque feature avant toute ligne de code.
> Inspiré des PRD Google/Amazon, adapté à Yuni AI (microservice IA hyperlocal).
> **Règle d'or : Si ce n'est pas dans le PRD, ça ne se code pas.**

---

## ⚡ Metadata

| Champ | Valeur |
|-------|--------|
| **Feature ID** | `YAI-XXX` |
| **Titre** | *[Nom court de la feature]* |
| **Auteur** | *[Nom]* |
| **Relecteurs** | *[Tech lead, Sécurité, PM]* |
| **Statut** | `Draft` / `Review` / `Approved` / `In Progress` / `Done` |
| **Priorité** | `P0-Critique` / `P1-High` / `P2-Medium` / `P3-Low` |
| **Mois Roadmap** | `Mois 1` / `Mois 2` / `Mois 3` / `Mois 4` |
| **Environnement cible** | `dev` → `recette` → `preprod` → `prod` |
| **Date création** | *YYYY-MM-DD* |
| **Dernière mise à jour** | *YYYY-MM-DD* |
| **Lien Figma** | *[URL ou N/A]* |
| **Lien Epic** | *[GitHub Issue / Linear / N/A]* |

---

## 1. 🎯 Problème & Contexte

### 1.1 Problème utilisateur
> *Quel problème concret résout cette feature ? Pour qui ? Avec quelle fréquence ?*

```
En tant que [type d'utilisateur],
Je rencontre [problème / frustration / besoin],
Ce qui m'empêche de [objectif ou valeur attendue].
```

**Exemple :**
> En tant qu'habitant de Reims, je reçois des recommandations de contenu générique qui ne correspondent pas à ma vie locale, ce qui m'empêche de découvrir les acteurs et événements de mon quartier.

### 1.2 Contexte business
> *Pourquoi maintenant ? Quelle urgence stratégique ?*

- Lien avec la roadmap : Mois X
- Impact sur le CA estimé : *(abonnement Pro, dashboard villes, sponsoring)*
- Risque si on ne fait pas : *(churn, désengagement, perte de différenciation)*

### 1.3 Contraintes existantes
> *Ce qu'on NE peut PAS changer.*

- [ ] Interface stable côté Yunicity (zéro breaking change)
- [ ] Pas d'accès direct PostgreSQL depuis Yuni AI
- [ ] RGPD : consentement explicite requis avant activation IA
- [ ] Budget IA Mois 1 : 400-800 €/mois
- [ ] *[Autres contraintes spécifiques à la feature]*

---

## 2. 👤 Utilisateurs & Personas

### Persona principal
| Attribut | Description |
|----------|-------------|
| **Nom fictif** | *ex: Marie, 34 ans, Reims* |
| **Profil** | *ex: Active, intéressée sport + culture locale* |
| **Points citoyens** | *ex: 340 — utilisatrice régulière* |
| **Comportement actuel** | *Comment résout-elle son problème aujourd'hui ?* |
| **Frustration** | *Ce qui l'énerve avec la solution actuelle* |
| **Succès attendu** | *À quoi ressemble une belle expérience pour elle ?* |

### Persona secondaire *(si applicable)*
| Attribut | Description |
|----------|-------------|
| **Nom fictif** | *ex: Service Communication Ville de Reims* |
| **Profil** | *ex: Acheteur dashboard IA — 2 000 €/mois* |
| **Besoin** | *Comprendre l'engagement citoyen de leur territoire* |

---

## 3. 📐 Scope — Ce qu'on fait / ne fait pas

### ✅ In Scope (Mois actuel)
- *[Feature principale — ce qui sera livré]*
- *[Fonctionnalité 2]*
- *[Fonctionnalité 3]*

### ❌ Out of Scope (délibérément exclus)
- *[Ce qu'on pourrait faire mais qu'on reporte]*
- *[Fonctionnalité tentante mais hors périmètre]*
- *(Raison : scope creep, pas assez de données, Mois 3+)*

### 🔮 Future Scope (roadmap future)
- *[Ce qui arrivera en Mois 3 ou 4]*

---

## 4. 🏗️ Solution Technique

### 4.1 Vue d'ensemble
> *Description en 3-5 phrases de l'approche technique choisie.*

### 4.2 Endpoint(s) concerné(s)

#### `POST /v1/[route]`

**Request Body :**
```json
{
  "champ_1": "type et description",
  "champ_2": "type et description",
  "champ_optionnel?": "type et description"
}
```

**Response 200 :**
```json
{
  "data": {
    "champ_1": "...",
    "champ_2": "..."
  },
  "meta": {
    "request_id": "uuid",
    "timestamp": "ISO8601",
    "source": "cache | mistral | fallback",
    "latency_ms": 120
  }
}
```

**Erreurs possibles :**
| Code | Type | Description |
|------|------|-------------|
| 400 | `validation_error` | Input invalide |
| 401 | `unauthorized` | JWT manquant ou expiré |
| 422 | `unprocessable_entity` | Données cohérentes mais non traitables |
| 429 | `rate_limit_exceeded` | Trop de requêtes |
| 503 | `service_unavailable` | Mistral + fallback indisponibles |

### 4.3 Architecture & flux de données

```
[Yunicity Backend]
       │
       │ JWT + POST /v1/[route]
       ▼
[Rate Limiter] ──── 429 si dépassé
       │
[JWT Validator] ──── 401 si invalide
       │
[Redis Cache] ──── HIT → retour < 5ms
       │ MISS
       ▼
[Yunicity API Service] ── appel APIs internes
       │                   (mockées en dev/recette)
       ▼
[Mistral Service] ──── timeout 10s → fallback
       │
[Business Rules Fallback] ── si Mistral KO
       │
[Redis SET] ── TTL selon type de donnée
       │
[Response] ──── retour à Yunicity
```

### 4.4 Stratégie Cache

| Clé de cache | TTL | Invalidation |
|-------------|-----|--------------|
| `rec:v1:{city}:{zone}:{interests_hash}:{points_bucket}` | 24h | Pre-computation nocturne |
| *[autre clé]* | *TTL* | *[déclencheur]* |

**Cache hit rate cible : ≥ 70%**

### 4.5 Prompt Mistral *(si applicable)*

```
Système :
[Rôle de l'IA, contexte territorial, règles de réponse]

User :
[Template du prompt avec variables {city}, {interests}, {data}]

Contraintes :
- Format de réponse : JSON strict
- Longueur max : X tokens
- Température : 0.3 (déterministe pour cache)
```

### 4.6 Dépendances

| Dépendance | Type | Impact si KO | Fallback |
|-----------|------|-------------|---------|
| Redis | Interne | Performance dégradée | Appel Mistral direct |
| Mistral Large 2 | Externe | Latence +10s | Business rules fallback |
| APIs Yunicity | Interne | Feature KO | Mock data (dev) |
| GPT-4o | Externe | Fallback Mistral KO | Business rules |

---

## 5. 🔐 Sécurité & RGPD

### 5.1 Données personnelles traitées

| Donnée | Type | Stockée où | TTL | Justification légale |
|--------|------|-----------|-----|---------------------|
| `user_id_hash` | SHA-256 anonymisé | Redis uniquement | 30 jours | Intérêt légitime / Consentement |
| `geo` | Tronquée 2 décimales (~1km) | Redis uniquement | 30 jours | Intérêt légitime |
| `interests` | Catégories larges | Redis uniquement | 30 jours | Consentement explicite |

### 5.2 Consentement
- [ ] Consentement capturé dans l'onboarding Yunicity avant activation
- [ ] Wording validé avec DPO : *"J'accepte que mes données soient utilisées pour les recommandations IA"*
- [ ] Possibilité de retrait de consentement → DELETE /v1/ai/user-data/:hash

### 5.3 Checklist sécurité feature
- [ ] JWT RS256 validé sur l'endpoint
- [ ] Rate limiting configuré (req/min par IP et par user)
- [ ] Input Pydantic v2 strict (extra="forbid")
- [ ] Sanitization des inputs allant dans le prompt Mistral
- [ ] Guard webhook env si paiement impliqué
- [ ] Aucune PII dans les logs
- [ ] Anonymisation des données avant stockage Redis
- [ ] Headers sécurité présents sur la réponse

### 5.4 Vecteurs d'attaque identifiés

| Vecteur | Risque | Mitigation |
|---------|--------|-----------|
| Prompt injection | Medium | Sanitization regex + longueur max |
| DDoS endpoint | High | Rate limiting + Redis cache |
| JWT forgé | High | RS256 + validation expiration |
| Data leak Redis | Medium | TTL strict + user_id hashé |
| *[Autre]* | *Niveau* | *Mitigation* |

---

## 6. 📊 Métriques & KPIs

### KPIs de succès (à mesurer J+7 après déploiement prod)

| KPI | Cible | Méthode de mesure |
|-----|-------|-------------------|
| Cache hit rate | ≥ 70% | Métrique Redis `keyspace_hits` |
| Latence P95 | < 800ms | Logs structurés + Railway metrics |
| Latence P50 | < 200ms | Logs structurés |
| Taux d'erreur | < 1% | 5xx / total requests |
| Coût Mistral | < budget × 0.5 | Dashboard Mistral |
| *[KPI produit]* | *cible* | *mesure* |

### Métriques d'engagement *(si applicable)*
| Métrique | Baseline | Cible | Délai |
|----------|----------|-------|-------|
| CTR recommandations | - | +X% | J+30 |
| Temps passé app | - | +X% | J+30 |

---

## 7. 🧪 Plan de Tests

### 7.1 Tests unitaires *(obligatoires)*
```python
# Exemples de cas à couvrir
test_[feature]_nominal_case()          # Happy path
test_[feature]_cache_hit()             # Cache servie < 5ms
test_[feature]_mistral_timeout()       # Fallback activé
test_[feature]_invalid_input()         # Pydantic validation
test_[feature]_missing_jwt()           # 401 retourné
test_[feature]_rate_limit_exceeded()   # 429 retourné
test_anonymization_applied()           # user_id hashé
```

### 7.2 Tests d'intégration *(obligatoires)*
- [ ] Endpoint complet avec Redis mock
- [ ] Endpoint complet avec Mistral mock
- [ ] Endpoint complet avec Yunicity API mock
- [ ] Cycle complet : cache miss → Mistral → cache set → cache hit

### 7.3 Tests de charge *(recette)*
- Scénario : 100 req/s pendant 60s
- Cible : 0 erreur 5xx, P95 < 800ms
- Outil : `locust` ou `k6`

### 7.4 Tests de sécurité *(obligatoires)*
- [ ] Requête sans JWT → 401
- [ ] JWT expiré → 401
- [ ] Input avec prompt injection → 422
- [ ] Rate limit → 429 après seuil
- [ ] Vérifier logs : aucune PII

---

## 8. 📦 Plan de Livraison

### 8.1 Phases de déploiement

```
Phase 1 : DEV (Jour 1-5)
├── Implémentation + tests unitaires
├── Review code (sécurité + qualité)
└── CI vert ✅

Phase 2 : RECETTE (Jour 6-8)
├── Deploy automatique depuis develop
├── Tests d'intégration + charge
├── Validation fonctionnelle
└── Sign-off QA ✅

Phase 3 : PREPROD (Jour 9-10)
├── Deploy avec données anonymisées prod
├── Smoke tests
├── Validation performance réelle
└── Sign-off Tech Lead ✅

Phase 4 : PROD (Jour 11)
├── Deploy avec approbation manuelle
├── Rollout 10% utilisateurs (si applicable)
├── Monitoring 24h
└── Rollout 100% ✅
```

### 8.2 Rollback plan
- Trigger : taux d'erreur > 5% ou latence P95 > 2s pendant 5 min
- Action : Railway instant rollback vers version précédente
- Délai max : 5 minutes
- Responsable : *[Nom]*

### 8.3 Feature flags *(si applicable)*
```python
# Pour un rollout progressif
FEATURE_FLAGS = {
    "recommend_engagement_v2": {
        "enabled": True,
        "rollout_percentage": 10,  # 10% des users en phase beta
        "cities": ["reims"]        # Ville pilote
    }
}
```

---

## 9. 📝 Décisions & Alternatives Rejetées

### Format : ADR (Architecture Decision Record)

#### Décision 1 : *[Titre de la décision]*
- **Contexte :** *Pourquoi cette décision était nécessaire*
- **Options envisagées :**
  - Option A : *[description]* → *[avantages / inconvénients]*
  - Option B : *[description]* → *[avantages / inconvénients]*
  - **Option retenue : Option X** → *[raison principale]*
- **Conséquences :** *Ce que cette décision implique pour la suite*

---

## 10. ❓ Questions Ouvertes

| # | Question | Responsable | Deadline | Statut |
|---|---------|-------------|----------|--------|
| 1 | *[Question bloquante]* | *[Nom]* | *date* | ⏳ En attente |
| 2 | *[Question non-bloquante]* | *[Nom]* | *date* | ✅ Résolue |

---

## 11. ✅ Definition of Done (DoD)

La feature est considérée **DONE** quand :

### Code
- [ ] Implémentation complète et conforme au PRD
- [ ] Typage mypy strict sans erreur
- [ ] Ruff sans warning
- [ ] Couverture tests ≥ 80%
- [ ] Pip audit clean (zéro CVE critique)

### Sécurité
- [ ] Review sécurité effectuée (skill `reviewer-securite-code`)
- [ ] Checklist sécurité section 5.3 complète
- [ ] Aucune PII dans les logs (vérifié en recette)
- [ ] Guard webhook env présent si applicable

### Performance
- [ ] Cache hit rate ≥ 70% (testé en recette)
- [ ] Latence P95 < 800ms (testé en recette)
- [ ] Fallback Mistral testé et fonctionnel

### Documentation
- [ ] OpenAPI auto-générée à jour
- [ ] `.env.example` mis à jour avec les nouvelles variables
- [ ] README technique mis à jour si nouveau service

### Déploiement
- [ ] Deploy recette réussi + smoke tests verts
- [ ] Deploy preprod réussi + validation données réelles
- [ ] Deploy prod avec approbation
- [ ] Monitoring actif sur les KPIs section 6

---

## Changelog

| Date | Version | Auteur | Changement |
|------|---------|--------|-----------|
| *YYYY-MM-DD* | 1.0 | *Nom* | Création initiale |
| *YYYY-MM-DD* | 1.1 | *Nom* | *[Modification]* |
