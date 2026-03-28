# Yuni AI Frontend

Monorepo **pnpm** + **Turborepo** : app web **Next.js 14**, mobile **Expo**, packages **UI**, **api-client**, **design-tokens**, **auth**.

## Prérequis

- Node.js **20+**
- **pnpm** 9+
- Backend **Yuni AI** v2 (`yuni.ai`) pour les appels API authentifiés

## Installation

```bash
pnpm install
```

## Développement

Lance le web (port **3000**) et Expo en parallèle :

```bash
pnpm dev
```

- Web : [http://localhost:3000](http://localhost:3000)
- Expo : QR code dans le terminal (app **mobile**)

Variables utiles (copier `apps/web/.env.example` vers `apps/web/.env.local`) :

- `NEXT_PUBLIC_YUNI_API_URL` — URL du backend (ex. `http://127.0.0.1:8000`)
- `NEXT_PUBLIC_MAPBOX_TOKEN` — jeton public Mapbox (`/map`)

### Routes web principales

| Route | Rôle |
|-------|------|
| `/` | Accueil + Hey Yuni (WebSocket voix) |
| `/map` | Carte Mapbox + heatmap démo |
| `/feed` | Feed recommandations (auth) |
| `/quests` | Quêtes + progression |
| `/profile` | XP, badges, leaderboard |
| `/dashboard` | Dashboard ville (`city_dashboard` JWT) |
| `/admin` | Token `X-Admin-Token` |
| `/merchant` | Générateur contenu commerçant |

## Scripts

| Commande        | Description                |
|-----------------|----------------------------|
| `pnpm dev`      | Web + mobile (Turbo)       |
| `pnpm build`    | Build de tous les packages |
| `pnpm lint`     | ESLint                     |
| `pnpm typecheck` | TypeScript strict       |
| `pnpm test`     | Vitest (api-client, etc.)  |
| `pnpm --filter @yuni/web test:e2e` | Playwright (E2E) |

## Structure

```
apps/web          Next.js 14 (App Router)
apps/mobile       Expo Router (tabs)
packages/ui       Composants partagés
packages/api-client  Client typé + hooks React Query
packages/design-tokens
packages/auth     JWT en mémoire + cookie session (middleware)
packages/tsconfig
```

## Storybook (web)

```bash
pnpm --filter @yuni/web storybook
```

## Vercel (web)

Dans le projet Vercel : répertoire racine du dépôt, **Root Directory** `apps/web`, ou build depuis la racine avec `pnpm turbo build --filter=@yuni/web` (voir `apps/web/vercel.json`).

## Mobile (EAS)

Build iOS/Android : configurer [EAS Build](https://docs.expo.dev/build/introduction/) avec les identifiants du projet Expo. Variables d’API : même `NEXT_PUBLIC_YUNI_API_URL` côté app via `expo-constants` / `.env` (à câbler).

## Documentation

- Audit / qualité : `docs/frontend/audit-final.md`
