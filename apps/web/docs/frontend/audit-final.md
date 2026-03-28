# Audit Final — Yuni AI Frontend v1.0.0

## Qualité code

- TypeScript strict : 0 erreur (`pnpm exec turbo typecheck --filter=@yuni/web`)
- ESLint : 0 warning (`pnpm exec turbo lint --filter=@yuni/web` — à valider en CI)
- Build Next.js : 0 warning (`pnpm exec turbo build --filter=@yuni/web`)
- Turbo typecheck : OK

## Performance (Lighthouse)

| Page                  | Perf      | A11y      | Best Practices | SEO       | PWA |
| --------------------- | --------- | --------- | -------------- | --------- | --- |
| / (accueil)           | [mesurer] | [mesurer] | [mesurer]      | [mesurer] | [mesurer] |
| /dashboard/overview   | [mesurer] | [mesurer] | —              | —         | —   |

**Commande locale (accessibilité)** :

```bash
npx lighthouse http://localhost:3000 --only-categories=accessibility --output=json --output-path=./lighthouse-a11y.json
```

Cibles : Perf ≥ 80, A11y ≥ 90, SEO ≥ 90, PWA installable

## Tests E2E (Playwright)

- Chromium : 9 tests verts (`pnpm exec playwright test --project=chromium`, dernière exécution locale)
- Firefox : 9 tests (installer les binaires : `pnpm exec playwright install firefox`)
- Mobile (WebKit / iPhone 14) : 9 tests (`pnpm exec playwright install webkit`)

En CI (`CI=true`), seul Chromium est exécuté (voir `playwright.config.ts`).

```bash
pnpm --filter @yuni/web test:e2e
```

**Note** : avec `src/app`, le fichier middleware doit être `src/middleware.ts` (pas à la racine `apps/web/`), sinon le manifeste middleware reste vide et les gardes de session (login) ne s’appliquent pas.

## Bundle sizes (`ANALYZE=true`)

```bash
cd apps/web && ANALYZE=true pnpm build
```

| Route                 | Size   | First Load JS |
| --------------------- | ------ | ------------- |
| /                     | 7.1 kB | 155 kB        |
| /dashboard/overview   | 6.6 kB | 155 kB        |

Middleware Edge : ~26.7 kB (build production Next.js 14.2).

## Accessibilité

- WCAG AA : axe en dev (`@axe-core/react`) + tests E2E `@axe-core/playwright` (0 violation **critical** sur home et login)
- Focus visible : `globals.css` (`*:focus-visible`)
- ARIA : `VitalityGauge` (`role="meter"`), `VoiceButton`, `XPBar` (`role="progressbar"`)

## PWA

- Service Worker : `@ducanh2912/next-pwa` (désactivé en `development`)
- Manifest : `/public/manifest.json`
- Icônes : `pnpm --filter @yuni/web generate-icons`
- Page offline : `/offline` + fallback document Workbox

## Actions avant prod

- [ ] Remplacer JWT mock par vrai IdP Yunicity
- [ ] Configurer `NEXT_PUBLIC_YUNI_API_URL` en prod (Vercel)
- [ ] Mapbox token prod dans Railway/Vercel secrets
- [ ] EAS Build configuré pour le mobile (expo.dev)
- [ ] Icônes finales (design graphique)
- [ ] Screenshots PWA réelles (`/screenshots/home.png`)
