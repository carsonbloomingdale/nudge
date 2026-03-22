# Nudge (frontend)

Create React App UI for Nudge. The API uses **HTTP-only cookies** (`access_token`, `refresh_token`) plus optional **`Authorization: Bearer`** on the server.

**Source of truth for auth behavior:** backend **`docs/AUTH.md`** (CORS + credentials, cookie domain, cold refresh, 401 → refresh → retry).

## Auth & routing

- **`/app`** — Tasks + suggestions (protected). All API calls use **`withCredentials: true`** (`src/api/httpClient.js`).
- **`/auth/login`** — `POST /auth/login` with `{ password, username | email }`.
- **`/auth/signup`** — `POST /auth/register` with `{ username, email, password }` (min **8** chars; aligned with BE `RegisterRequest`).
- **`/auth/magic`** — Placeholder until magic-link exists on the API.

**Session restore:** `POST /auth/refresh` (cold load, no interceptor loop) → **`GET /auth/me`** for profile. If `/auth/me` is unavailable (**503**) or missing (**404**), the UI falls back to **`nudge_display_profile`** in `localStorage` (display only, not authorization).

**Logout:** `POST /auth/logout` (BE **`clear_auth_cookies`** uses same path/domain/secure/httponly/samesite as Set-Cookie) → FE clears local display cache.

**401 handling:** Shared axios client retries once after **`POST /auth/refresh`** for normal API calls (not login/register/refresh).

### CORS + cookies (ops)

- Set **`CORS_ORIGINS`** to **real SPA origin(s)** — **not** `*` — when the browser must send cookies.
- Response must include **`Access-Control-Allow-Credentials: true`** and a **specific** `Access-Control-Allow-Origin` (the exact SPA origin, not `*`).
- **`http://localhost:3000` and `http://127.0.0.1:3000` are different origins** — include whichever you open in the browser (often both while testing).

#### “Still getting a CORS error” (local dev)

**Option A — bypass CORS in dev (recommended for CRA):**

1. Keep **`"proxy": "http://127.0.0.1:8000"`** in `package.json` (change port if your API differs).
2. In **`.env.local`** set:
   ```bash
   REACT_APP_USE_SAME_ORIGIN_API=true
   ```
   (Leave `REACT_APP_API_BASE_URL` unset or ignore it while this is on.)
3. Restart **`npm run dev`**. The browser only talks to `localhost:3000`; the dev server proxies `/auth/*`, `/tasks/`, etc. to the API.

**Option B — fix CORS on the API** (needed for production / direct API URL anyway):

- Add your SPA origin to **`CORS_ORIGINS`** (comma-separated).
- Allow **credentials** and the methods/headers you use (`POST`, `GET`, `Content-Type`, etc.).

BE may set **`AUTH_COOKIE_DOMAIN`** (e.g. `.example.com`) so API + SPA subdomains share cookies in deployed environments.

### Backend API (contract summary)

`REACT_APP_API_BASE_URL` — no trailing slash (`src/api/apiConfig.js`). Paths are joined as `` `${API_BASE_URL}/...` `` when not using the dev proxy.

| Method | Path | Role |
|--------|------|------|
| `POST` | `/auth/register` | `{ username, email, password }` (password min 8). |
| `POST` | `/auth/login` | Sets access + refresh cookies. |
| `POST` | `/auth/logout` | Clears auth cookies (matching attributes). |
| `POST` | `/auth/refresh` | Rotates tokens; used on cold load + axios 401 retry. |
| `GET` | `/auth/me` | Session user: `{ id, user_id, sub, username, user_name, email, … }`. Valid JWT required (**401** / **503** per BE). |
| `GET` | `/tasks`, `/tasks/` | Same handler; **JSON array** of tasks (`label`, `task_id`, `user_id`, …). |
| `POST` | `/tasks/` | **`TaskCreateBody`** — **no `user_id`**; server sets user from JWT. |
| `POST` | `/api/tasks/enrich` | Enrich task (OpenAI on server); response includes **`task`**. |
| `POST` | `/api/suggestions` | Suggestion + rationale; **`suggestion.reccomendedTask`** + **`context`**. |
| `POST` | `/users/` | Legacy create user; **409** if taken. |
| `GET` | `/user_by_username/:name` | Legacy; **404** if missing. |
| `GET` | `/user_by_id/:id` | Legacy; **404** if invalid. |

Client sends `Content-Type: application/json` only — **no OpenAI key** in the browser.

## Deploy (Heroku / Koyeb / production)

**`npm start` serves the production `build/` folder** (static `serve`), not webpack-dev-server — safe for **`nudgeweb.app`** and custom domains.

**Local coding** uses **`npm run dev`** (CRA dev server on port 3000).

| | |
|--|--|
| **Root directory** | `nudge` (if repo root is the monorepo) |
| **Build command** | `npm ci && npm run build` (Heroku’s Node buildpack runs **`npm run build`** automatically when the `build` script exists) |
| **Run command** | **`npm start`** (default on Heroku; serves `build/` on **`PORT`**) |

Set **`REACT_APP_*`** in the platform **environment** so **`npm run build`** bakes the right API URL into the bundle.

**Heroku build fails on `npm run build`?**

- Set the app **root** to the **`nudge`** folder (monorepo: [Project root / `PROJECT_PATH`](https://devcenter.heroku.com/articles/monorepos) or equivalent), so Heroku uses this `package.json` + `package-lock.json`.
- The `build` script uses **`GENERATE_SOURCEMAP=false`** to reduce memory; if you still see **JavaScript heap out of memory**, set a config var: **`NODE_OPTIONS=--max-old-space-size=4096`** (if your dyno has enough RAM).

## Environment variables

1. Copy the example file and edit locally (secrets stay gitignored):

   ```bash
   cd nudge
   cp .env.example .env.local
   ```

2. Set **`REACT_APP_API_BASE_URL`** to your API (e.g. `http://127.0.0.1:8000`) when **not** using the dev proxy.

3. **Local full stack:** API on port **8000** (typical); CRA dev server uses **`HOST` / `PORT`** in `.env.local` for the **frontend** (e.g. `0.0.0.0:3000`).

4. **Production:** set **`REACT_APP_API_BASE_URL`** on the build host (e.g. Koyeb). `npm run build` does not bundle `.env.local`.

Backend-only template (separate repo): **`docs/backend.env.example`** at repo root (if present).

## Available Scripts

### `npm run dev`

Runs the **development** server (hot reload). Open [http://localhost:3000](http://localhost:3000). Use this on your machine only.

### `npm start`

Serves the **production** **`build/`** folder with **`serve`** (binds **`0.0.0.0:$PORT`**). Used by **Heroku** and can be used by **Koyeb** as the run command. Run **`npm run build`** first (or deploy with a build step / **`heroku-postbuild`**).

### `npm test`

Runs tests.

### `npm run build`

Production build to `build/`.

### `npm run eject`

One-way eject from CRA defaults.

## Learn More

- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/)
