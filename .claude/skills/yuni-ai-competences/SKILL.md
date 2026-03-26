---
name: yuni-ai-competences
description: >-
  Catalogue les cinq postures expertes Yuni AI (constructeur-ui, architecte-api,
  ingenieur, reviewer-securite-code, createur-workflow), indique comment les
  activer en Claude Code (@posture) et renvoie vers les règles sous .claude/rules.
  Utiliser lorsque l’utilisateur cite une posture, demande le catalogue des
  skills Yuni AI, une évaluation claude eval, ou les métriques qualité cibles.
---

# Compétences Yuni AI (Claude Code)

Catalogue des postures spécialisées pour ce dépôt. **Avant toute action**, respecter aussi [`.claude/claude.md`](../../claude.md) (identité projet, envs, sécurité, Stripe, stack).

## Comment activer une posture

Dans Claude Code, l’utilisateur peut préfixer sa demande par le nom de la posture, par exemple :

```
@constructeur-ui Crée le composant dashboard vitalité
@architecte-api Conçois l'endpoint /recommend/engagement
@reviewer-securite-code Audite ce service Redis
```

1. **Si une posture est nommée explicitement** : adopter ce rôle et **lire le fichier rule associé** ci-dessous.
2. **Sinon** : déduire la posture (UI → constructeur-ui, endpoint/schéma → architecte-api, perf/async/Redis/Mistral → ingenieur, audit/review auth → reviewer-securite-code, CI/CD/Docker/Railway → createur-workflow).

## Postures et fichiers

| Posture | Rôle | Fichier rule |
|---------|------|----------------|
| `constructeur-ui` | Frontend / design system | [`.claude/rules/constructeur-ui.md`](../../rules/constructeur-ui.md) |
| `architecte-api` | Architecture & design d’API | [`.claude/rules/architecte-api.md`](../../rules/architecte-api.md) |
| `ingenieur` | Implémentation & performance | [`.claude/rules/ingenieur.md`](../../rules/ingenieur.md) |
| `reviewer-securite-code` | Cybersécurité & RGPD | [`.claude/rules/reviewer-securite-code.md`](../../rules/reviewer-securite-code.md) |
| `createur-workflow` | CI/CD, DevOps, qualité | [`.claude/rules/createur-workflow.md`](../../rules/createur-workflow.md) |

## Skills detailles par posture

Pour chaque posture, utiliser en priorite le skill specialise correspondant :

- `constructeur-ui` : [`.claude/skills/constructeur-ui/SKILL.md`](../constructeur-ui/SKILL.md)
- `architecte-api` : [`.claude/skills/architecte-api/SKILL.md`](../architecte-api/SKILL.md)
- `reviewer-securite-code` : [`.claude/skills/reviewer-securite-code/SKILL.md`](../reviewer-securite-code/SKILL.md)
- `createur-workflow` : [`.claude/skills/createur-workflow/SKILL.md`](../createur-workflow/SKILL.md)

## Eval et benchmark

```bash
claude eval --skill reviewer-securite-code \
  --input "app/services/mistral.py" \
  --criteria "OWASP compliance, secrets management, error handling" \
  --output eval-results/mistral-security-audit.md
```

Adapter `--skill`, `--input` et `--criteria` au contexte. Les noms de skill côté CLI correspondent aux postures (`constructeur-ui`, `architecte-api`, `ingenieur`, `reviewer-securite-code`, `createur-workflow`) si le projet les enregistre ainsi ; sinon utiliser le fichier `SKILL.md` de ce dossier comme référence de critères.

### Skill dédié d'évaluation

Pour une évaluation complète avec grille pondérée, benchmarks par posture, template de rapport et amélioration continue, utiliser aussi :

- [`.claude/skills/eval-benchmark-skills-yuni-ai/SKILL.md`](../eval-benchmark-skills-yuni-ai/SKILL.md)

### Critères d’évaluation standards

| Critère | Poids | Description |
|---------|-------|-------------|
| Correctness | 30 % | Le code fait ce qu’il doit faire |
| Security | 25 % | Pas de vulnérabilité OWASP évitable |
| Maintainability | 20 % | Lisible, découplé, cohérent avec le projet |
| Performance | 15 % | Async, cache, pas de N+1 |
| RGPD | 10 % | Anonymisation, consentement, minimisation |

## Métriques qualité cibles (projet)

```yaml
test_coverage: ">= 80%"
mypy_errors: 0
ruff_warnings: 0
cve_critical: 0
api_latency_p95: "< 800ms"
cache_hit_rate: ">= 70%"
```

En cas de conflit entre une demande ponctuelle et `claude.md` (webhooks, secrets, RGPD), **signaler le risque** plutôt que contourner silencieusement.

## Parité avec Cursor

Les mêmes intitulés de règles existent sous `.cursor/rules/` pour l’agent Cursor. Après modification d’une règle, **aligner l’autre copie** pour éviter la dérive.
