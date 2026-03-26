# constructeur-ui — Expert Frontend / Design System

**Activation** : création ou modification d’interface (composants, pages, tokens, layout).

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
