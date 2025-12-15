# LoadMaster Pro (B747-400F Load Master Simulator)

React + TypeScript + Vite app simulating a B747-400F loadmaster workflow (cargo positions, AI auto-load, weight & balance envelope, settings).

## Quick start (local dev)

### Prerequisites
- **Node.js**: 18+ recommended
- **npm**: comes with Node

### Install
```bash
npm install
```

### Run
```bash
npm run dev
```

Vite will print the local URL (typically `http://localhost:5173`).

### Build / preview production build
```bash
npm run build
npm run preview
```

Build output is written to `dist/`.

## Environment variables

This project uses Vite `VITE_*` environment variables (see `src/config/env.ts`).

Create a `.env.local` file in the repo root (recommended for local overrides). Common keys:
- **`VITE_APP_ENV`**: `development | staging | production` (default: `development`)
- **`VITE_DEBUG_MODE`**: `true | false` (default: `true`)
- **`VITE_API_BASE_URL`**: API base URL (default: `http://localhost:3001`)
- **`VITE_OFFLINE_ENABLED`**: `true | false` (default: `true`)

There are additional optional keys for sync/audit/db/feature flags defined in `src/config/env.ts`.

## Deployment

This is a static web app. Any static host that can serve the `dist/` folder works.

See **`docs/deployment.md`** for:
- Vercel
- Netlify
- GitHub Pages (with included workflow)

## Notes (iPad / offline-first)

- Current build runs fully in the browser.
- For iPad offline-first production, the recommended path is **Capacitor + on-device SQLite** with optional cloud sync when internet is available.


