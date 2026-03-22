/**
 * Public API origin (no trailing slash). Used for axios baseURL + cookie auth.
 *
 * **Local CORS workaround:** In development, set `REACT_APP_USE_SAME_ORIGIN_API=true`
 * and add `"proxy"` in `package.json` pointing at your API. Requests then go to
 * `http://localhost:3000/...` and CRA proxies to the API — same origin, no browser CORS.
 */
const isDev = process.env.NODE_ENV === "development";
const useSameOriginProxy =
  isDev && process.env.REACT_APP_USE_SAME_ORIGIN_API === "true";

const raw = useSameOriginProxy
  ? ""
  : process.env.REACT_APP_API_BASE_URL ||
    "https://urgent-maria-nudge-9f4b7e98.koyeb.app";

export const API_BASE_URL = String(raw).replace(/\/+$/, "");
