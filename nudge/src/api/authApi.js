import axios from "axios";
import http from "./httpClient";
import { refreshTokensRequest } from "./authRefresh";

/** Cold start: cookie refresh, then body refresh_token if cookies fail (see authRefresh). */
export function refreshSession() {
  return refreshTokensRequest();
}

export function login(payload) {
  return http.post("/auth/login", payload, { skipAuthRefresh: true });
}

export function register(payload) {
  return http.post("/auth/register", payload, { skipAuthRefresh: true });
}

export function logoutApi() {
  return http.post("/auth/logout", {}, { skipAuthRefresh: true });
}

/**
 * GET /auth/me — valid access JWT required (401 if missing/expired, 503 if auth not configured).
 */
export async function fetchCurrentUser() {
  try {
    const { data } = await http.get("/auth/me");
    return normalizeUserPayload(data);
  } catch (e) {
    if (
      axios.isAxiosError(e) &&
      (e.response?.status === 404 || e.response?.status === 503)
    ) {
      return null;
    }
    throw e;
  }
}

/** @returns {{ userId: string, username: string | null, email: string | null } | null} */
export function normalizeUserPayload(data) {
  const u = data?.user ?? data?.person ?? data;
  if (!u || typeof u !== "object") {
    return null;
  }
  const userId = u.id ?? u.user_id ?? u.uuid ?? u.sub;
  if (userId == null || userId === "") {
    return null;
  }
  const displayName =
    u.username != null
      ? String(u.username)
      : u.user_name != null
        ? String(u.user_name)
        : null;
  return {
    userId: String(userId),
    username: displayName,
    email: u.email != null ? String(u.email) : null,
  };
}
