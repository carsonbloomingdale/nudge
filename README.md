# Nudge

Monorepo for **Nudge**: the web SPA (Create React App + Capacitor) and shared **docs** for backend and ops.

## Repository layout

| Path | Purpose |
|------|---------|
| **[`nudge/`](nudge/)** | Frontend app — **install dependencies and run scripts from this directory.** See **[`nudge/README.md`](nudge/README.md)** for auth, API, deploy, Capacitor, and testing. |
| **[`docs/`](docs/)** | Backend environment examples (`backend.env.example`), API notes, and other guides. |

## Quick start (local frontend)

Use **[Bun](https://bun.sh/)** (version pinned in **`nudge/package.json`** → **`packageManager`**).

```bash
cd nudge
bun install
bun run dev
```

Then open [http://localhost:3000](http://localhost:3000). Copy **`nudge/.env.example`** to **`nudge/.env.local`** and adjust API URLs as needed.

## Tests (from `nudge/`)

| Command | Runner |
|---------|--------|
| **`bun run test:bun`** | Bun — **`tests/bun/`** (Happy DOM, page smoke tests). See **`nudge/README.md`**. |
| **`bun run test`** | Jest via CRA — e.g. **`nudge/src/App.test.js`**. |

## More documentation

- **Frontend (deep dive):** [`nudge/README.md`](nudge/README.md)  
- **Backend env template:** [`docs/backend.env.example`](docs/backend.env.example) (when present)
