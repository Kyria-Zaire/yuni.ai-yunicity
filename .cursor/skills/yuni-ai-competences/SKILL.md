---
name: yuni-ai-competences
description: >-
  Catalogue les cinq postures expertes Yuni AI (constructeur-ui, architecte-api,
  ingenieur, reviewer-securite-code, createur-workflow), indique comment les
  activer et renvoie vers les règles dédiées sous .cursor/rules. Utiliser
  lorsque l’utilisateur cite une de ces postures, demande le catalogue des
  skills Yuni AI, une évaluation/benchmark de skill, ou les métriques qualité
  cibles du projet.
---

# Compétences Yuni AI (Cursor)

Catalogue des postures spécialisées pour ce dépôt. **Avant toute action**, respecter aussi [`.cursor/claude.md`](../../claude.md) (identité projet, envs, sécurité, Stripe, stack).

## Comment activer une posture

1. **Si l’utilisateur nomme explicitement une posture** (ex. « en mode architecte-api », « @constructeur-ui ») : adopter ce rôle et **lire le fichier rule associé** listé ci-dessous.
2. **Sinon** : déduire la posture la plus pertinente (UI → constructeur-ui, endpoint/schéma → architecte-api, perf/async/Redis/Mistral → ingenieur, audit/review auth → reviewer-securite-code, CI/CD/Docker/Railway → createur-workflow).

## Postures et fichiers

| Posture | Rôle | Fichier rule |
|---------|------|----------------|
| `constructeur-ui` | Frontend / design system | [`.cursor/rules/constructeur-ui.md`](../../rules/constructeur-ui.md) |
| `architecte-api` | Architecture & design d’API | [`.cursor/rules/architecte-api.md`](../../rules/architecte-api.md) |
| `ingenieur` | Implémentation & performance | [`.cursor/rules/ingenieur.md`](../../rules/ingenieur.md) |
| `reviewer-securite-code` | Cybersécurité & RGPD | [`.cursor/rules/reviewer-securite-code.md`](../../rules/reviewer-securite-code.md) |
| `createur-workflow` | CI/CD, DevOps, qualité | [`.cursor/rules/createur-workflow.md`](../../rules/createur-workflow.md) |

## Skills detailles par posture

Pour chaque posture, utiliser en priorite le skill specialise correspondant :

- `constructeur-ui` : [`.cursor/skills/constructeur-ui/SKILL.md`](../constructeur-ui/SKILL.md)
- `architecte-api` : [`.cursor/skills/architecte-api/SKILL.md`](../architecte-api/SKILL.md)
- `reviewer-securite-code` : [`.cursor/skills/reviewer-securite-code/SKILL.md`](../reviewer-securite-code/SKILL.md)
- `createur-workflow` : [`.cursor/skills/createur-workflow/SKILL.md`](../createur-workflow/SKILL.md)

## Eval et benchmark (référence Claude Code)

Pour une évaluation structurée d’une posture (ex. reviewer sécurité), le dépôt peut utiliser un flux du type :

```bash
claude eval --skill reviewer-securite-code \
  --input "app/services/mistral.py" \
  --criteria "OWASP compliance, secrets management, error handling" \
  --output eval-results/mistral-security-audit.md
```

Adapter `--skill` et `--input` au contexte. Si la CLI n’est pas disponible dans l’environnement Cursor, reproduire la même logique : critères explicites, sortie markdown, preuves dans le code.

### Skill dédié d'évaluation

Pour une évaluation complète avec grille pondérée, benchmarks par posture, template de rapport et amélioration continue, utiliser aussi :

- [`.cursor/skills/eval-benchmark-skills-yuni-ai/SKILL.md`](../eval-benchmark-skills-yuni-ai/SKILL.md)

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

## Parité avec Claude Code

Le même catalogue existe sous `.claude/skills/yuni-ai-competences/` et `.claude/rules/`. Après modification d’une règle, **aligner l’autre copie** pour éviter la dérive.
