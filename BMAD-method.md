# BMAD Method — Yuni AI
## Breakthrough Method for Agile Development
> Colonne vertébrale opérationnelle du projet Yuni AI.
> Framework de travail entre le Dev Full Stack et le CTO AI (Claude Code / Cursor).
> **Version adaptée au Vibe Coding senior avec IA — 2026.**

---

## 🧠 Qu'est-ce que BMAD ?

BMAD est une méthode de développement agile pensée pour les équipes petites (1-3 devs) qui utilisent des outils IA comme copilotes de code. Elle structure le flux de travail pour éviter :

- ❌ Le **code spaghetti** généré sans contexte
- ❌ Le **scope creep** — feature qui grossit en cours de dev
- ❌ La **dette technique** accumulée à chaque sprint
- ❌ Les **failles de sécurité** introduites en vibe coding non encadré
- ❌ La **perte de cohérence** entre ce que l'IA génère et l'architecture réelle

BMAD = **4 phases obligatoires** avant, pendant et après chaque feature.

```
B — Backlog & Brief
M — Map & Model
A — Act & Assert
D — Deploy & Debrief
```

---

## 📐 Vue d'ensemble du cycle BMAD

```
┌─────────────────────────────────────────────────────────────────┐
│                    CYCLE BMAD — YUNI AI                         │
│                                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │    B     │───▶│    M     │───▶│    A     │───▶│    D     │  │
│  │ Backlog  │    │  Map &   │    │  Act &   │    │ Deploy & │  │
│  │ & Brief  │    │  Model   │    │  Assert  │    │ Debrief  │  │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘  │
│   1-2h max        2-4h max       1-5 jours        1-2h post     │
│                                                                 │
│  → PRD validé  → Archi + API  → Code + Tests  → Prod + Retro  │
└─────────────────────────────────────────────────────────────────┘
```

**Règle d'or :** On ne passe jamais à la phase suivante sans avoir complété la précédente.
Chaque phase a une **checklist de sortie** (exit criteria). Si un item n'est pas coché → on reste dans la phase.

---

## Phase B — Backlog & Brief
> *"Clarifier avant de coder"*
> **Durée : 1-2h maximum**
> **Output : PRD approuvé + ticket créé**

### Objectif
Transformer une idée vague en un brief technique précis et partagé.
Aucune ambiguïté ne doit subsister avant de passer à la phase M.

### Acteurs
| Rôle | Responsabilité |
|------|---------------|
| **Dev Full Stack** | Formule le besoin, valide la faisabilité technique |
| **CTO AI (Claude)** | Structure le PRD, identifie les risques, pose les bonnes questions |

### Étapes

#### B1 — Formulation du besoin (15 min)
Le dev exprime le besoin en langage naturel. Pas de contrainte de format.

**Prompt type pour Claude Code :**
```
@BMAD Phase B — Je veux implémenter [feature].
Contexte : [ce qu'on a déjà / ce qui existe].
Objectif : [ce qu'on veut obtenir].
Contrainte : [limites à respecter].
```

#### B2 — Structuration PRD (45 min)
Claude rempli le `PRD-template.md` en posant des questions de clarification.

**Questions de clarification obligatoires :**
1. Quel est le problème utilisateur exact ? (pas la solution)
2. Qui est l'utilisateur principal et secondaire ?
3. Quelles sont les contraintes non négociables ?
4. Quel est le critère de succès mesurable ?
5. Qu'est-ce qui est **hors scope** délibérément ?
6. Quels sont les vecteurs d'attaque à anticiper ?
7. Quel est l'impact si ce n'est pas fait ce mois-ci ?

#### B3 — Review PRD (30 min)
- Dev lit le PRD complet et valide ou corrige
- Focus sur : scope, sécurité, définition du done
- Sign-off explicite : *"PRD YAI-XXX approuvé"*

#### B4 — Création ticket (15 min)
```markdown
# Ticket YAI-XXX

## Titre
[Nom court de la feature]

## Lien PRD
[URL ou chemin vers le PRD rempli]

## Résumé technique (3 lignes max)
[Ce qui sera implémenté, en langage dev]

## Estimation
[ ] XS (< 2h) [ ] S (2-4h) [ ] M (1-2j) [ ] L (3-5j) [ ] XL (> 5j)

## Labels
`phase:B-done` `mois:X` `priority:PX`
```

### ✅ Exit Criteria Phase B
- [ ] PRD complet rempli (toutes les sections)
- [ ] Scope IN / OUT clairement défini
- [ ] Definition of Done (DoD) écrite
- [ ] Vecteurs d'attaque sécurité identifiés
- [ ] Ticket créé et estimé
- [ ] Sign-off dev : *"PRD YAI-XXX approuvé"*

---

## Phase M — Map & Model
> *"Architecturer avant d'implémenter"*
> **Durée : 2-4h maximum**
> **Output : Architecture validée + schemas définis + mocks prêts**

### Objectif
Dessiner la solution avant de la coder. Définir les contrats d'interface, les schemas de données, et préparer l'environnement de développement.

### Acteurs
| Rôle | Responsabilité |
|------|---------------|
| **Dev Full Stack** | Valide les choix archi, crée les fichiers de structure |
| **CTO AI (Claude)** | Propose l'architecture, génère les schemas, identifie les dépendances |

### Étapes

#### M1 — Architecture Decision (45 min)
Documenter les décisions techniques majeures au format ADR.

**Pour chaque décision non triviale :**
```markdown
## ADR-XXX : [Titre décision]
**Date :** YYYY-MM-DD
**Statut :** Proposed | Accepted | Deprecated

**Contexte :**
[Situation qui nécessite une décision]

**Options :**
- Option A : [description + trade-offs]
- Option B : [description + trade-offs]

**Décision :** Option X
**Raison :** [Pourquoi cette option > les autres pour Yuni AI]
**Conséquences :** [Ce que ça implique pour la suite]
```

#### M2 — Définition des Schemas (60 min)
Définir TOUS les schemas Pydantic avant d'écrire la logique.

**Skill activé : `@architecte-api`**

```python
# models/schemas.py — à créer EN PREMIER
# Structure exacte des inputs/outputs de la feature

class FeatureInput(BaseModel):
    model_config = ConfigDict(strict=True, extra="forbid")
    # ... champs typés et validés

class FeatureOutput(BaseModel):
    # ... structure de réponse stable

# Tests des schemas AVANT implémentation
def test_feature_input_validation():
    # Cas valide
    # Cas invalides
    pass
```

#### M3 — Séquençage des dépendances (30 min)
Identifier l'ordre d'implémentation pour éviter les blocages.

```
Ordre recommandé (du plus stable au plus dépendant) :
1. Schemas Pydantic (contrat — ne change plus)
2. Service de mock Yunicity API (données de dev)
3. Service Redis cache (infrastructure)
4. Service Mistral (logique IA)
5. Router FastAPI (expose le tout)
6. Tests d'intégration (valide le tout)
```

#### M4 — Setup environnement dev (45 min)
- Variables d'environnement documentées dans `.env.example`
- Mocks des APIs Yunicity pour la feature
- Seeds de données de test cohérentes

```python
# app/mocks/yunicity_[feature]_mock.py
MOCK_DATA = {
    "reims": {
        "actors": [...],
        "tribes": [...],
        "events": [...]
    }
}
```

#### M5 — Dessin du flux (30 min)
Schéma ASCII du flux de données (dans le PRD section 4.3).
Valider que le flux est cohérent avec l'architecture globale.

### ✅ Exit Criteria Phase M
- [ ] ADR rédigé pour chaque décision non triviale
- [ ] Schemas Pydantic définis et testés (validation seule)
- [ ] Ordre d'implémentation documenté
- [ ] Mocks Yunicity API prêts pour la feature
- [ ] `.env.example` mis à jour
- [ ] Flux de données dessiné et validé
- [ ] Pas d'ambiguïté technique restante

---

## Phase A — Act & Assert
> *"Coder proprement, tester immédiatement"*
> **Durée : 1 jour (XS/S) à 5 jours (L/XL)**
> **Output : Code propre + tests verts + review validée**

### Objectif
Implémenter la feature selon le PRD et l'architecture définis en phase M.
Chaque micro-incrément est testé avant de passer au suivant.

### Acteurs
| Rôle | Responsabilité |
|------|---------------|
| **Dev Full Stack** | Drive l'implémentation, valide le code généré |
| **CTO AI (Claude)** | Génère le code, propose les tests, fait la review sécurité |

### Le Cycle Act & Assert (micro-itération)

```
┌─────────────────────────────────────────────────┐
│              MICRO-CYCLE A&A                    │
│                                                 │
│  1. ACT ──────────────────────────────────────  │
│     Écrire le test (TDD si possible)            │
│     Implémenter la fonction / service           │
│     Activer le skill approprié                  │
│                                                 │
│  2. ASSERT ────────────────────────────────────  │
│     pytest → tests verts ?                      │
│     mypy → 0 erreur ?                           │
│     ruff → 0 warning ?                          │
│                                                 │
│  3. REVIEW ────────────────────────────────────  │
│     @reviewer-securite-code → audit du code     │
│     Checklist sécurité PRD section 5.3          │
│                                                 │
│  4. COMMIT ────────────────────────────────────  │
│     feat(YAI-XXX): description courte           │
│     Seulement si vert ✅                        │
└─────────────────────────────────────────────────┘
```

### Activation des Skills par tâche

| Tâche | Skill à activer | Fichier |
|-------|----------------|---------|
| Créer un endpoint | `@architecte-api` | `.cursor/rules/architecte-api.md` |
| Implémenter un service | `@ingenieur` | `.cursor/rules/ingenieur.md` |
| Review sécurité | `@reviewer-securite-code` | `.cursor/rules/reviewer-securite-code.md` |
| Créer un composant UI | `@constructeur-ui` | `.cursor/rules/constructeur-ui.md` |
| CI/CD pipeline | `@createur-workflow` | `.cursor/rules/createur-workflow.md` |

### Prompts types pour Claude Code / Cursor

```bash
# Implémentation service
@ingenieur Implémente le service Redis cache-aside pour YAI-XXX.
Schéma : [coller le schema Pydantic de la phase M]
Flux : [coller le flux de la phase M]
Contraintes : TTL 24h, clé déterministe, fallback si Redis KO

# Review sécurité
@reviewer-securite-code Audite ce service :
[coller le code]
Vérifie : anonymisation, guard webhook, pas de PII dans les logs,
input validation, vecteurs d'attaque identifiés dans PRD

# Test unitaire
@ingenieur Écris les tests unitaires pour ce service :
[coller le code]
Couvre : nominal, cache hit, mistral timeout, input invalide, JWT manquant
```

### Standards de commit

```bash
# Format Conventional Commits — OBLIGATOIRE
feat(YAI-XXX): ajouter endpoint recommend/engagement
fix(YAI-XXX): corriger TTL Redis pour les événements
test(YAI-XXX): ajouter tests fallback Mistral
security(YAI-XXX): ajouter guard webhook env
chore(YAI-XXX): mettre à jour .env.example
docs(YAI-XXX): documenter endpoint dans OpenAPI

# ❌ INTERDIT
git commit -m "fix"
git commit -m "wip"
git commit -m "update stuff"
```

### Gestion des blocages

Si bloqué > 30 min sur un point :
1. **Stop** — ne pas continuer à tâtonner
2. **Reformuler** le problème en 3 phrases
3. **Changer de skill** (peut-être un autre expert est plus adapté)
4. **Remonter** au PRD — est-ce que le problème était prévu ?
5. Si non prévu → **ouvrir une question** dans la section 10 du PRD

### ✅ Exit Criteria Phase A
- [ ] Tous les cas du plan de tests (PRD section 7) couverts
- [ ] `pytest --cov` ≥ 80% de couverture
- [ ] `mypy app/ --strict` : 0 erreur
- [ ] `ruff check app/` : 0 warning
- [ ] `pip-audit` : 0 CVE critique
- [ ] Review sécurité effectuée et validée
- [ ] Aucune PII dans les logs (vérification manuelle des logs dev)
- [ ] CI vert sur la PR
- [ ] PR créée avec description et lien PRD

---

## Phase D — Deploy & Debrief
> *"Livrer sans stress, apprendre de chaque cycle"*
> **Durée : 1-2h (deploy) + 1h (debrief)**
> **Output : Feature en prod + retro documentée**

### Objectif
Déployer la feature de façon sûre et systématique, puis capitaliser les apprentissages pour améliorer le prochain cycle.

### Acteurs
| Rôle | Responsabilité |
|------|---------------|
| **Dev Full Stack** | Déclenche et supervise le déploiement |
| **CTO AI (Claude)** | Vérifie les métriques, documente le debrief |

### Checklist Deploy

#### D1 — Pre-deploy (30 min)
```bash
# Vérifications obligatoires avant merge sur preprod/main
□ CI entièrement vert (lint + types + security + tests)
□ PR reviewée et approuvée
□ .env.example à jour dans la PR
□ Pas de clé/secret accidentel dans le diff
□ Changelog mis à jour dans le PRD
□ Feature flag configuré si rollout progressif
```

#### D2 — Deploy séquentiel
```
Recette ──── smoke tests ──── ✅ ──── Preprod ──── validation ──── ✅ ──── Prod
    │                                      │                                  │
  Auto                                   Auto                           Approbation
  (develop)                           (preprod                           manuelle
                                       branch)
```

#### D3 — Post-deploy monitoring (24h)
```
Métriques à surveiller pendant les 24h post-deploy prod :
□ Taux d'erreur 5xx < 1%
□ Latence P95 < 800ms
□ Cache hit rate ≥ 70%
□ Coût Mistral dans le budget
□ Aucune alerte sécurité

Si anomalie → rollback immédiat (< 5 min via Railway)
```

### D4 — Debrief (1h) — Le plus important

Le debrief est ce qui distingue une équipe qui progresse d'une qui stagne.
**Il est obligatoire après chaque cycle BMAD.**

#### Template Debrief
```markdown
## Debrief BMAD — YAI-XXX
**Date :** YYYY-MM-DD
**Feature :** [Titre]
**Durée réelle du cycle :** X jours
**Durée estimée :** Y jours

### Ce qui s'est bien passé ✅
- [Point positif 1]
- [Point positif 2]

### Ce qui a pris plus de temps que prévu ⏱️
- [Blocage 1] → Cause : [X] → Fix pour la prochaine fois : [Y]
- [Blocage 2] → Cause : [X] → Fix pour la prochaine fois : [Y]

### Ce qu'on ferait différemment 🔄
- [Amélioration 1 du processus]
- [Amélioration 1 technique]

### KPIs réels (J+7)
| KPI | Cible | Réel | Statut |
|-----|-------|------|--------|
| Cache hit rate | ≥ 70% | XX% | ✅/❌ |
| Latence P95 | < 800ms | XXXms | ✅/❌ |
| Taux d'erreur | < 1% | X% | ✅/❌ |

### Mises à jour des skills
> Si un skill a mal géré un cas → documenter ici pour l'améliorer.
- skill: [nom] → amélioration : [description]

### Actions pour le prochain cycle
- [ ] [Action concrète 1] → Responsable : [Nom]
- [ ] [Action concrète 2] → Responsable : [Nom]
```

### ✅ Exit Criteria Phase D
- [ ] Feature déployée en prod sans erreur
- [ ] Monitoring actif sur les KPIs 24h
- [ ] Aucune anomalie 24h post-deploy
- [ ] Debrief rédigé et archivé dans `docs/debriefs/`
- [ ] Actions du debrief créées comme tickets
- [ ] Skills mis à jour si amélioration identifiée
- [ ] PRD marqué `Status: Done`

---

## 🔁 Coordination CTO AI ↔ Dev Full Stack

### Règles de collaboration

#### Le dev dirige, l'IA exécute
```
Dev : "Je veux [résultat attendu]"
IA  : "Voici comment je propose de le faire : [architecture/code]"
Dev : "OK / Modifie X / Explique Y"
```
L'IA ne prend jamais de décision architecturale sans validation du dev.

#### Contexte à toujours fournir à l'IA
```bash
# En début de session Claude Code / Cursor
"On travaille sur YAI-XXX (lire .claude/CLAUDE.md).
Phase actuelle : [B/M/A/D].
Contexte : [résumé de l'état actuel en 3 lignes].
PRD : [coller les sections pertinentes].
Skill à activer : @[nom-du-skill]."
```

#### Ce que l'IA ne doit JAMAIS faire sans accord explicite
- ❌ Modifier un schema Pydantic existant (breaking change possible)
- ❌ Ajouter une dépendance npm/pip sans validation
- ❌ Modifier la configuration d'environnement prod
- ❌ Créer un endpoint sans PRD validé
- ❌ Supprimer des tests existants
- ❌ Merger ou déployer de façon autonome

#### Escalade
Si l'IA propose quelque chose qui semble trop complexe ou hors scope :
1. **Stop** — ne pas implémenter
2. **Questionner** : "Pourquoi cette complexité ? Est-ce dans le PRD ?"
3. **Simplifier** : "Quelle est la version la plus simple qui résout le problème ?"
4. **Revenir** à la phase M si nécessaire

---

## 📅 Cadence par Mois

### Mois 1 — Avril (Phase fondation)
```
Semaine 1 : BMAD cycle 1 → POST /v1/recommend/engagement
Semaine 2 : BMAD cycle 2 → Redis cache + pre-computation
Semaine 3 : BMAD cycle 3 → Monitoring + métriques + alerting
Semaine 4 : Buffer + debrief mois + préparation Mois 2
```

### Cérémonies légères (équipe 2 personnes)
| Cérémonie | Fréquence | Durée | Format |
|-----------|-----------|-------|--------|
| Daily standup | Chaque jour de dev | 15 min | Async (message) |
| BMAD Phase B | Début de chaque feature | 2h | Synchrone |
| BMAD Phase D Debrief | Fin de chaque feature | 1h | Synchrone |
| Revue mensuelle | Fin de mois | 2h | Synchrone |

### Daily standup format
```
Hier : [Ce que j'ai fait]
Aujourd'hui : [Ce que je vais faire]
Blocage : [Ce qui me bloque — ou RAS]
Phase BMAD actuelle : [B/M/A/D] sur [YAI-XXX]
```

---

## 🚦 Indicateurs de santé du projet

### Signaux d'alerte 🔴 (stopper et corriger)
- PRD non validé avant de coder → retour en phase B
- Tests non écrits → retour en phase A
- Review sécurité sautée → retour en phase A
- Deploy sans smoke tests → rollback immédiat
- Debrief non rédigé → feature considérée incomplète

### Signaux positifs 🟢 (on est dans le bon flow)
- CI vert systématiquement avant PR
- Cache hit rate ≥ 70% après déploiement
- Cycles BMAD qui raccourcissent au fil des mois
- Skills qui s'améliorent grâce aux debriefs
- Zéro incident sécurité

---

## 📚 Glossaire

| Terme | Définition |
|-------|-----------|
| **BMAD** | Backlog & Brief → Map & Model → Act & Assert → Deploy & Debrief |
| **PRD** | Product Requirements Document — contrat produit/tech d'une feature |
| **ADR** | Architecture Decision Record — trace d'une décision technique |
| **DoD** | Definition of Done — critères qui définissent une feature terminée |
| **Vibe Coding** | Développement assisté par IA (Claude Code/Cursor) avec supervision senior |
| **Skill** | Posture d'expert activée dans l'IA pour une tâche spécialisée |
| **Cache-aside** | Pattern : check cache → miss → compute → store |
| **Guard env** | Protection qui bloque une action dangereuse hors prod |
| **Breaking change** | Modification qui casse un contrat d'interface existant |
| **Fallback** | Solution de repli si un service externe est indisponible |

---

## 🔗 Références

| Document | Chemin | Utilité |
|----------|--------|---------|
| PRD Template | `PRD-template.md` | Template à remplir pour chaque feature |
| CLAUDE.md | `.claude/claude.md` | Instructions globales du projet |
| Skills catalogue | `.claude/skills/yuni-ai-competences/SKILL.md` | Catalogue des postures expertes |
| Eval & Benchmark | `.claude/skills/eval-benchmark-skills-yuni-ai/SKILL.md` | Évaluation qualité du code |
| Architecte API | `.cursor/rules/architecte-api.md` | Expert endpoints & schemas |
| Ingénieur | `.cursor/rules/ingenieur.md` | Expert performance & Redis |
| Reviewer Sécurité | `.cursor/rules/reviewer-securite-code.md` | Expert OWASP & RGPD |
| Constructeur UI | `.cursor/rules/constructeur-ui.md` | Expert frontend & design |
| Créateur Workflow | `.cursor/rules/createur-workflow.md` | Expert CI/CD & DevOps |
