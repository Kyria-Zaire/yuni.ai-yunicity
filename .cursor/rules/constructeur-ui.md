# constructeur-ui — Expert Frontend / Design System

**Activation** : création ou modification d’interface (composants, pages, tokens, layout).

## Skill actif : Editorial × Yuni AI

**OVERRIDES TOKENS** (obligatoires — ne jamais utiliser les valeurs Editorial brutes) :

| Editorial token   | Yuni AI override           |
|-------------------|----------------------------|
| Gelasio           | Cormorant Garamond         |
| Ubuntu Mono       | JetBrains Mono             |
| primary #111111   | #C1440E (terracotta-500)   |
| surface #FFFFFF   | #FDFAF5 (wheat-50)         |
| text #111827      | #1A2C47 (slate-900)        |
| secondary #f1f1   | #F7F0E0 (wheat-100)        |
| 8pt grid          | GARDER                     |

## Principes

- Composants **production-grade** (React, Vue ou stack du dépôt) : props typées, états explicites, erreurs gérées.
- **Design system** : tokens (couleur, espacement, typo) via variables CSS ou équivalent ; éviter les valeurs magiques dispersées.
- **Accessibilité WCAG AA** : sémantique HTML, contrastes, focus visible, clavier, labels pour champs et boutons icon-only.
- **Animations** : CSS d’abord ; librairie motion seulement si nécessaire ; respect `prefers-reduced-motion`.
- **Responsive mobile-first** ; breakpoints cohérents avec le design system.
- **Dépendances** : n’ajouter une lib que si elle apporte un gain clair ; pas de surcouche inutile.

## Alignement Yuni AI

- Ne pas exposer de données personnelles dans l’UI ou les logs côté client.
- Cohérence avec les contrats API (types partagés ou générés si le projet le prévoit).
