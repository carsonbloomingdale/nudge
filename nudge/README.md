# Nudge (frontend)

**Package manager: [Bun](https://bun.sh/).** From this folder run **`bun install`**, then the scripts below (`bun run dev`, etc.).

Create React App UI for Nudge. The API may use **HTTP-only cookies** (`access_token`, `refresh_token`). For reliable SPA auth (cross-origin, Safari, Bearer-only APIs), **`POST /auth/login`**, **`POST /auth/register`**, and **`POST /auth/refresh`** should **also** return **`access_token` and `refresh_token` in the JSON body**; the client saves them in **`sessionStorage`** (`nudge_access_token` / `nudge_refresh_token`) and sends **`Authorization: Bearer`** on API calls. Cookies alone are optional for authorization once JSON tokens are present. On **`POST /auth/refresh`**, the client tries **cookies first**, then **`{ "refresh_token": "..." }`** if the cookie refresh fails.

**Backend JSON contract (recommended fields):** see **`docs/backend-auth-json.md`** in this repo.

## Auth & routing

- **`/app`** — Tasks + suggestions (protected). All API calls use **`withCredentials: true`** + optional Bearer (`src/api/httpClient.js`, `src/auth/tokenStorage.js`).
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

#### Capacitor / iOS Android (Eruda shows **status 0**)

XHR/fetch that never get a readable response often show **status 0**. This project enables **`CapacitorHttp`** and **`CapacitorCookies`** in **`capacitor.config.ts`** so native iOS/Android perform API requests (axios uses XHR under the hood) and normal **HTTP status codes** appear—**run `bunx cap sync` after changing config**, then rebuild the app.

If problems persist, check:

1. **CORS** (browser / if native HTTP is off) — The WebView origin is **not** your CRA URL. Add these to **`CORS_ORIGINS`** on the API (exact strings; with **`withCredentials: true`** you cannot use `*`):
   - `capacitor://localhost` (typical iOS)
   - `ionic://localhost` (older Ionic/Capacitor)
   - `https://localhost` (Android when `server.androidScheme` is `https` in `capacitor.config`)
   Keep your existing `http://localhost:3000` / `http://127.0.0.1:3000` for browser dev. See **`docs/backend.env.example`** for a combined example.
2. **ATS / HTTP** — Plain `http://` to a host that iOS blocks shows up the same way. **`Info.plist`** in this repo allows **localhost / 127.0.0.1** HTTP and **`NSAllowsLocalNetworking`** for LAN IPs; rebuild the iOS app after changes.
3. **Unreachable host** — On a **physical device**, `http://127.0.0.1:8000` is the phone, not your Mac. Use your Mac’s LAN IP in **`REACT_APP_API_BASE_URL`** and ensure the API listens on `0.0.0.0`.

#### “Still getting a CORS error” (local dev)

**Option A — bypass CORS in dev (recommended for CRA):**

1. Keep **`"proxy": "http://127.0.0.1:8000"`** in `package.json` (change port if your API differs).
2. In **`.env.local`** set:
   ```bash
   REACT_APP_USE_SAME_ORIGIN_API=true
   ```
   (Leave `REACT_APP_API_BASE_URL` unset or ignore it while this is on.)
3. Restart **`bun run dev`**. The browser only talks to `localhost:3000`; the dev server proxies `/auth/*`, `/tasks/`, etc. to the API.

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
| `GET` | `/auth/me` | Session user: `{ id, user_id, sub, username, user_name, email, … }`. Includes **`sms_opt_in`**, **`phone` / `phone_e164`**, **`phone_verified`** (bool), **`phone_verified_at`** when the API exposes them. Valid JWT required (**401** / **503** per BE). |
| `PATCH` | `/auth/me` | Profile update (JSON). FE sends `phone` + `phone_e164`, `sms_opt_in`, etc. Returns **AuthMeResponse**; server may clear verification when the number changes (**`phone_verified`** false, **`phone_verified_at`** null). |
| `POST` | `/auth/me/phone/send-verification-code` | SMS verification: send code to saved number (empty body). Response: **AuthMeResponse**. |
| `POST` | `/auth/me/phone/verify` | `{ "code": "123456" }` — response **AuthMeResponse** with **`phone_verified: true`** and **`phone_verified_at`** set when valid. |
| `POST` | `/auth/me/sms/test` | One-off test SMS after SMS is on and the number is verified. |
| `GET` | `/tasks`, `/tasks/` | Same handler; **JSON array** of tasks (`label`, `task_id`, `user_id`, …). |
| `POST` | `/tasks/` | **`TaskCreateBody`** — **no `user_id`**; server sets user from JWT. |
| `POST` | `/api/tasks/enrich` | Enrich task (OpenAI on server); response includes **`task`**. |
| `POST` | `/api/suggestions` | Suggestion + rationale; **`suggestion.reccomendedTask`** + **`context`**. |
| `POST` | `/users/` | Legacy create user; **409** if taken. |
| `GET` | `/user_by_username/:name` | Legacy; **404** if missing. |
| `GET` | `/user_by_id/:id` | Legacy; **404** if invalid. |

Client sends `Content-Type: application/json` only — **no OpenAI key** in the browser.

**SMS + toll-free verification (UI flow):** see **[`docs/frontend-sms-verification.md`](../docs/frontend-sms-verification.md)** — register/settings, send code, verify, then test SMS; Twilio toll-free approval is separate from in-app verification.

## Deploy (Heroku / Koyeb / production)

**`bun start` serves the production `build/` folder** (static `serve`), not webpack-dev-server — safe for **`nudgeweb.app`** and custom domains.

**Local coding** uses **`bun run dev`** (CRA dev server on port 3000).

| | |
|--|--|
| **Root directory** | `nudge` (if repo root is the monorepo) |
| **Build command** | **`bun install --frozen-lockfile && bun run build`** (commit **`bun.lock`**) |
| **Run command** | **`bun start`** (serves `build/` on **`PORT`**) |

Set **`REACT_APP_*`** in the platform **environment** so **`bun run build`** bakes the right API URL into the bundle.

**Heroku / default Node buildpack:** those expect npm and a lockfile from npm. Use a **Bun-capable** setup ([Oven’s Bun buildpack](https://github.com/oven-sh/heroku-buildpack-bun), a Dockerfile with Bun, or another host that installs from **`bun.lock`**), or keep using npm only on that host.

**Heroku build fails on `bun run build`?**

- Set the app **root** to the **`nudge`** folder (monorepo: [Project root / `PROJECT_PATH`](https://devcenter.heroku.com/articles/monorepos) or equivalent), so Heroku uses this `package.json` + **`bun.lock`**.
- The `build` script uses **`GENERATE_SOURCEMAP=false`** to reduce memory; if you still see **JavaScript heap out of memory**, set a config var: **`NODE_OPTIONS=--max-old-space-size=4096`** (if your dyno has enough RAM).

## Environment variables

1. Copy the example file and edit locally (secrets stay gitignored):

   ```bash
   cd nudge
   cp .env.example .env.local
   ```

2. Set **`REACT_APP_API_BASE_URL`** to your API (e.g. `http://127.0.0.1:8000`) when **not** using the dev proxy.

3. **Local full stack:** API on port **8000** (typical); CRA dev server uses **`HOST` / `PORT`** in `.env.local` for the **frontend** (e.g. `0.0.0.0:3000`).

4. **Production:** set **`REACT_APP_API_BASE_URL`** on the build host (e.g. Koyeb). `bun run build` does not bundle `.env.local`.

Backend-only template (separate repo): **`docs/backend.env.example`** at repo root (if present).

## Available Scripts

Install deps once: **`bun install`** (from the **`nudge`** directory).

### `bun run dev`

Runs the **development** server (hot reload). Open [http://localhost:3000](http://localhost:3000). Use this on your machine only.

### `bun start`

Serves the **production** **`build/`** folder with **`serve`** (binds **`0.0.0.0:$PORT`**). Used in production deploys as the run command. Run **`bun run build`** first (or deploy with a build step / **`heroku-postbuild`**).

### `bun run test`

Runs **Jest** via CRA (`react-scripts test`), e.g. **`src/App.test.js`**.

### `bun run test:bun`

Runs **Bun’s test runner** on **`tests/bun/`** (Happy DOM + Testing Library): runner smoke test plus **page smoke tests** (`pages.smoke.test.tsx`). Uses **`bunfig.toml`** preloads (`tests/bun/happydom.ts`, `tests/bun/testing-library.ts`, **`src/test/bunPageMocks.ts`**).

### `bun run build`

Production build to `build/`.

### `bun run eject`

One-way eject from CRA defaults.

## Learn More

- [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started)
- [React documentation](https://reactjs.org/)
