/**
 * Optional bearer + refresh fallback when HTTP-only cookies are blocked (e.g. some mobile browsers).
 * Refresh token is stored in sessionStorage (tab-scoped); access token same — cleared on tab close.
 */

const ACCESS_KEY = "nudge_access_token";
const REFRESH_KEY = "nudge_refresh_token";

function pickToken(obj, ...keys) {
  if (!obj || typeof obj !== "object") {
    return null;
  }
  for (const k of keys) {
    const v = obj[k];
    if (v != null && v !== "") {
      return String(v);
    }
  }
  return null;
}

/**
 * @param {unknown} data - JSON body from login / register / refresh
 * @returns {{ access: string | null, refresh: string | null }}
 */
export function extractAuthTokens(data) {
  if (!data || typeof data !== "object") {
    return { access: null, refresh: null };
  }
  const d = data;
  const nestedTokens =
    d.tokens && typeof d.tokens === "object" ? d.tokens : null;
  const nestedToken =
    d.token && typeof d.token === "object" ? d.token : null;
  const nestedData =
    d.data && typeof d.data === "object" ? d.data : null;
  const nestedOauth =
    d.oauth && typeof d.oauth === "object" ? d.oauth : null;
  const access =
    pickToken(d, "access_token", "accessToken", "access", "token") ||
    pickToken(nestedTokens, "access_token", "accessToken", "access", "token") ||
    pickToken(nestedToken, "access_token", "accessToken", "access", "token") ||
    pickToken(nestedData, "access_token", "accessToken", "access", "token") ||
    pickToken(nestedOauth, "access_token", "accessToken", "access", "token");
  const refresh =
    pickToken(d, "refresh_token", "refreshToken") ||
    pickToken(nestedTokens, "refresh_token", "refreshToken") ||
    pickToken(nestedToken, "refresh_token", "refreshToken") ||
    pickToken(nestedData, "refresh_token", "refreshToken");
  return { access, refresh };
}

/** Persist any tokens present in an auth response (partial updates allowed). */
export function mergeTokensFromResponse(data) {
  if (typeof window === "undefined") {
    return;
  }
  const { access, refresh } = extractAuthTokens(data);
  try {
    if (refresh) {
      sessionStorage.setItem(REFRESH_KEY, refresh);
    }
    if (access) {
      sessionStorage.setItem(ACCESS_KEY, access);
    }
  } catch {
    /* quota / private mode */
  }
}

function readCookieValue(name) {
  if (typeof document === "undefined" || !document.cookie) {
    return null;
  }
  const parts = document.cookie.split("; ");
  for (const p of parts) {
    const i = p.indexOf("=");
    if (i === -1) {
      continue;
    }
    const k = p.slice(0, i).trim();
    if (k !== name) {
      continue;
    }
    try {
      return decodeURIComponent(p.slice(i + 1));
    } catch {
      return p.slice(i + 1);
    }
  }
  return null;
}

/**
 * Copy `access_token` / `refresh_token` from **non-HttpOnly** `document.cookie` into
 * sessionStorage so the axios client can send `Authorization: Bearer`.
 *
 * Safari often omits `Cookie` on cross-origin XHR (e.g. :3000 → :8000) while Chrome
 * sends them; mirroring avoids 401 when cookies are JS-readable. **HttpOnly** cookies
 * are invisible here — use same-origin proxy (`REACT_APP_USE_SAME_ORIGIN_API`) or tokens
 * in JSON from the API.
 */
export function syncCookieTokensToSessionStorage() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (!sessionStorage.getItem(ACCESS_KEY)) {
      const a = readCookieValue("access_token");
      if (a) {
        sessionStorage.setItem(ACCESS_KEY, a);
      }
    }
    if (!sessionStorage.getItem(REFRESH_KEY)) {
      const r = readCookieValue("refresh_token");
      if (r) {
        sessionStorage.setItem(REFRESH_KEY, r);
      }
    }
  } catch {
    /* quota / private mode */
  }
}

function getHeaderString(headers, name) {
  if (!headers || typeof headers !== "object") {
    return null;
  }
  const low = name.toLowerCase();
  const key = Object.keys(headers).find((k) => k.toLowerCase() === low);
  const v = key != null ? headers[key] : null;
  if (typeof v !== "string" || !v.trim()) {
    return null;
  }
  return v.trim();
}

/**
 * Persist tokens from a full axios response: JSON body, then non-HttpOnly cookies, then
 * optional `X-Access-Token` / `Authorization` response headers (some APIs issue access
 * only via headers).
 * @param {import("axios").AxiosResponse | null | undefined} response
 */
export function mergeAuthTokensFromAxiosResponse(response) {
  if (!response) {
    return;
  }
  mergeTokensFromResponse(response.data);
  syncCookieTokensToSessionStorage();
  const h = response.headers;
  const xa = getHeaderString(h, "x-access-token");
  if (xa) {
    mergeTokensFromResponse({ access_token: xa });
  }
  const auth = getHeaderString(h, "authorization");
  if (auth && /^Bearer\s+/i.test(auth)) {
    mergeTokensFromResponse({
      access_token: auth.replace(/^Bearer\s+/i, "").trim(),
    });
  }
}

export function readAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return sessionStorage.getItem(ACCESS_KEY);
  } catch {
    return null;
  }
}

export function readRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return sessionStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function clearAuthTokens() {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.removeItem(ACCESS_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}
