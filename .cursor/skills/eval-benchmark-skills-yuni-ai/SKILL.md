---
name: eval-benchmark-skills-yuni-ai
description: >-
  Evalue et benchmarke la qualite du code genere par les skills Yuni AI selon
  une grille ponderee (Correctness, Security, Maintainability, Performance,
  Compliance), avec seuils, references par posture et plan d'amelioration
  continue. Utiliser quand l'utilisateur demande une evaluation de skill, un
  benchmark, un score qualite, une comparaison de postures, ou la creation d'un
  rapport d'evaluation.
---

# Eval & Benchmark - Skills Yuni AI

Systeme d'evaluation de la qualite du code genere par skill pour Yuni AI.

Avant toute evaluation, respecter aussi [`.cursor/claude.md`](../../claude.md).

## Objectif

- Mesurer la qualite des livrables produits par posture.
- Comparer les scores a des benchmarks de reference.
- Identifier des actions correctives concretes en cas d'ecart.

## Grille d'evaluation globale (100 points)

Score global = somme ponderee des 5 criteres:

| Critere | Poids | Description |
|---------|-------|-------------|
| **Correctness** | 30% | Le code fait ce qu'il doit faire sans bugs |
| **Security** | 25% | Aucune vulnerabilite OWASP, RGPD respecte |
| **Maintainability** | 20% | Lisible, documente, decouple, testable |
| **Performance** | 15% | Async, cache, timeouts, pas de N+1 |
| **Compliance** | 10% | Respect des conventions du projet |

- **Seuil minimal acceptable**: `75/100`
- **Objectif qualite**: `90/100`

## Benchmarks par skill

### `architecte-api`

Tache type: Concevoir l'endpoint `POST /v1/recommend/engagement`

| Critere specifique | Points |
|---|---|
| Schema Pydantic v2 strict | /20 |
| Gestion erreurs RFC 7807 | /20 |
| Versioning correct (`/v1/`) | /10 |
| Documentation OpenAPI | /15 |
| Contrat stable (backward compat) | /20 |
| Tests d'integration | /15 |

Benchmark reference: **92/100**

### `ingenieur`

Tache type: Implementer le service Redis cache-aside

| Critere specifique | Points |
|---|---|
| Cache-aside pattern correct | /25 |
| Cle de cache deterministe | /15 |
| TTL configure par type | /15 |
| Retry/timeout sur Mistral | /20 |
| Fallback business rules | /15 |
| Zero code bloquant | /10 |

Benchmark reference: **88/100**

### `reviewer-securite-code`

Tache type: Auditer `app/services/mistral.py`

| Critere specifique | Points |
|---|---|
| Detection secrets hardcodes | /20 |
| Validation JWT correcte | /20 |
| Guard webhook env present | /20 |
| Anonymisation verifiee | /20 |
| Rate limiting present | /10 |
| CVE identifies | /10 |

Benchmark reference: **95/100**

### `constructeur-ui`

Tache type: Creer le composant `VitalityIndex`

| Critere specifique | Points |
|---|---|
| Design non-generique | /20 |
| Tokens CSS respectes | /20 |
| WCAG AA (contraste, focus) | /20 |
| Mobile-first | /15 |
| `prefers-reduced-motion` | /10 |
| Props TypeScript strictes | /15 |

Benchmark reference: **85/100**

### `createur-workflow`

Tache type: Creer le pipeline CI/CD complet

| Critere specifique | Points |
|---|---|
| Tests dans CI (lint + mypy + audit + pytest) | /25 |
| Multi-env correctement isoles | /25 |
| Docker multi-stage | /15 |
| Health check post-deploy | /15 |
| Secrets jamais en clair | /20 |

Benchmark reference: **90/100**

## Procedure d'evaluation

### 1) Cadrer l'evaluation

- Skill evalue
- Tache precise
- Portee du code (fichiers et comportements)
- Contraintes projet (securite, RGPD, conventions)

### 2) Noter la grille globale

Attribuer un score a chaque critere global:

- Correctness: `/30`
- Security: `/25`
- Maintainability: `/20`
- Performance: `/15`
- Compliance: `/10`

Calculer ensuite le total `/100`.

### 3) Noter les criteres specifiques du skill

Pour la posture evaluee, remplir aussi les 6 sous-criteres de benchmark.
Comparer le resultat au benchmark de reference.

### 4) Classer le resultat

- `>= 90`: Excellent (objectif atteint)
- `75-89`: Acceptable avec ameliorations
- `< 75`: Non acceptable, correction obligatoire

## Lancer une evaluation

### Evaluation manuelle (peer review)

```bash
cat .claude/eval-results/YYYY-MM-DD-skill-task.md
```

### Template de rapport

```markdown
# Eval Report
Date : 2026-04-15
Skill : ingenieur
Tache : Implementer Redis cache-aside pour /recommend/engagement
Genere par : Cursor

## Scores
- Correctness : 27/30
- Security : 23/25
- Maintainability : 18/20
- Performance : 14/15
- Compliance : 9/10

**Total : 91/100** ✅

## Points positifs
- Cache-aside pattern correctement implemente
- Cle de cache deterministe et anonyme
- Fallback business rules present

## Points d'amelioration
- TTL pourrait etre externalise dans la config
- Manque un test sur le cas de timeout Redis

## Action items
- [ ] Deplacer TTL dans Settings
- [ ] Ajouter test unitaire timeout Redis
```

## Historique des benchmarks

Mettre a jour ce tableau apres chaque evaluation:

| Date | Skill | Score | Statut |
|------|-------|-------|--------|
| - | - | - | *A remplir au fil du projet* |

## Amelioration continue

Si un score `< 75`, mettre a jour le fichier `.md` du skill concerne avec:

1. Le pattern qui a failli
2. La correction a apporter
3. Un exemple de code correct a ajouter

Le skill doit s'ameliorer a chaque iteration.
