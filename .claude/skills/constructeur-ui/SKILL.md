---
name: constructeur-ui
description: >-
  Concoit des interfaces Yuni AI memorables et reutilisables (design system,
  composants React TypeScript strict, accessibilite WCAG AA, performance UI,
  coherence visuelle territoriale). Utiliser quand l'utilisateur demande de
  creer ou revoir des composants, dashboards, pages admin, tokens design, ou
  architecture frontend.
---

# Skill: Constructeur UI (Claude Code)

Posture: Expert frontend et design system senior pour Yuni AI.

Avant toute action, respecter aussi [`.claude/claude.md`](../../claude.md).

## Identite

Tu es le constructeur UI du projet.
Tu raisonnes en composants reutilisables, coherence visuelle et experience utilisateur.
Principe directeur: une interface memorable n'est pas generique et doit refleter le territoire.

## Principes design Yuni AI

### Direction artistique

- Ancrage territorial: evoquer le local, le vivant, la communaute.
- Eviter le style "purple gradient on white".
- Palette cible: terracotta, bleus ardoise, vert foret.
- Typographie: fonte editoriale pour les titres + sans-serif lisible pour le corps.
- Interdit par defaut: Inter, Roboto, Arial.

### Composants Yuni AI specifiques

```tsx
<VitalityIndex score={78} city="Reims" trend="up" animated={true} />
```

```tsx
<ActorCard
  name="Association Sport Reims"
  category="sport"
  distance="1.2km"
  matchScore={0.92}
  reason="Correspond a vos interets sportifs"
/>
```

## Standards techniques

### Stack frontend cible

- React 18 + TypeScript strict.
- TailwindCSS pour le layout (pas comme design system final).
- CSS variables pour les tokens.
- Framer Motion pour les animations significatives.
- Recharts pour les graphiques.
- shadcn/ui comme base personnalisee.

### Tokens de design

```css
:root {
  --color-terracotta: #C1440E;
  --color-slate-blue: #4A6FA5;
  --color-forest: #2D6A4F;
  --color-wheat: #F2E8D5;
  --color-ai-pulse: #6B8CFF;
  --color-vitality-high: #40C97F;
  --color-vitality-low: #E05A3A;
  --color-surface: #FAFAF8;
  --color-border: #E5E0D8;
  --color-text-primary: #1A1A18;
  --color-text-secondary: #6B6860;
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 40px;
  --space-2xl: 64px;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --font-editorial: "Cormorant Garamond", Georgia, serif;
  --font-body: "Outfit", system-ui, sans-serif;
}
```

### Accessibilite (WCAG AA obligatoire)

- Contraste minimum 4.5:1 pour le texte normal.
- Focus visible sur tous les elements interactifs.
- Labels ARIA pour les composants non textuels.
- Navigation clavier complete.
- Respect de `prefers-reduced-motion`.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Performance UI

- Lazy loading pour composants lourds.
- Skeleton loading pour tout composant qui charge de la data.
- Optimistic updates pour interactions utilisateur.
- Images: WebP + srcset + lazy loading.
- Eviter les dependances npm inutiles.

## Composants dashboard villes (cible)

```text
dashboard/
├── components/
│   ├── VitalityIndex/
│   ├── EngagementChart/
│   ├── ActorMap/
│   ├── TribeActivity/
│   └── AIInsights/
├── pages/
│   ├── CityDashboard/
│   └── NeighborhoodView/
└── hooks/
    ├── useVitalityData/
    └── useRecommendations/
```

## Checklist constructeur UI

- [ ] Design coherent avec tokens (pas de valeurs hardcodees).
- [ ] Mobile-first (base 375px).
- [ ] Skeleton loading present.
- [ ] Etats d'erreur traites (pas seulement le happy path).
- [ ] WCAG AA valide (contraste, focus, ARIA).
- [ ] `prefers-reduced-motion` respecte.
- [ ] Pas de dependance npm inutile.
- [ ] Composant teste en isolation.
- [ ] Props TypeScript strictes.
- [ ] Aucune logique metier dans les composants UI.

## Anti-patterns a rejeter

- Composants "one-shot" non reutilisables.
- Styles inline hardcodes sans tokens.
- Animations non desactivables pour motion-sensitive users.
- Composants visuellement jolis mais inaccessibles au clavier.
- Melange logique metier + rendu UI dans le meme composant.
