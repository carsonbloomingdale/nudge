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
  const nested =
    d.tokens && typeof d.tokens === "object" ? d.tokens : null;
  const access =
    pickToken(d, "access_token", "accessToken", "token") ||
    pickToken(nested, "access_token", "accessToken", "token");
  const refresh =
    pickToken(d, "refresh_token", "refreshToken") ||
    pickToken(nested, "refresh_token", "refreshToken");
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
