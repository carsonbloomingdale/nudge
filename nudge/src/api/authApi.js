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

/**
 * PATCH /auth/me — update profile (optional fields). Caller sends snake_case body.
 * @param {Record<string, unknown>} patch
 */
export function patchCurrentUser(patch) {
  return http.patch("/auth/me", patch);
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

/**
 * @typedef {{
 *   userId: string,
 *   username: string | null,
 *   email: string | null,
 *   firstName: string | null,
 *   lastName: string | null,
 *   phone: string | null,
 *   timezone: string | null,
 *   smsOptIn: boolean,
 * }} AuthUser
 */

/** @param {unknown} data @returns {AuthUser | null} */
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
  const smsRaw = u.sms_opt_in ?? u.smsOptIn;
  const smsOptIn = smsRaw === true || smsRaw === "true" || smsRaw === 1;
  return {
    userId: String(userId),
    username: displayName,
    email: u.email != null ? String(u.email) : null,
    firstName:
      u.first_name != null
        ? String(u.first_name)
        : u.firstName != null
          ? String(u.firstName)
          : null,
    lastName:
      u.last_name != null
        ? String(u.last_name)
        : u.lastName != null
          ? String(u.lastName)
          : null,
    phone: u.phone != null && String(u.phone).trim() !== "" ? String(u.phone) : null,
    timezone:
      u.timezone != null && String(u.timezone).trim() !== ""
        ? String(u.timezone)
        : null,
    smsOptIn,
  };
}

/**
 * @param {unknown} err
 * @param {{ forRegister?: boolean }} [opts]
 * @returns {string}
 */
export function messageFromAuthError(err, opts = {}) {
  if (!axios.isAxiosError(err)) {
    return "Something went wrong. Try again.";
  }
  const status = err.response?.status;
  const data = err.response?.data;
  if (status === 409) {
    return opts.forRegister
      ? "That username or email is already registered."
      : "This update could not be applied (for example, that phone may already be in use).";
  }
  if (status === 503) {
    return "Service temporarily unavailable. Try again later.";
  }
  const detail = data?.detail;
  if (typeof detail === "string" && detail.trim()) {
    return detail.trim();
  }
  if (Array.isArray(detail) && detail.length) {
    const parts = detail.map((d) => {
      if (typeof d === "string") {
        return d;
      }
      if (d && typeof d === "object") {
        const loc = Array.isArray(d.loc)
          ? d.loc.filter((x) => x !== "body" && typeof x === "string").join(".")
          : "";
        const msg = d.msg ?? d.message;
        if (typeof msg === "string") {
          return loc ? `${loc}: ${msg}` : msg;
        }
      }
      return null;
    });
    const joined = parts.filter(Boolean).join(" ");
    if (joined) {
      return joined;
    }
  }
  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message.trim();
  }
  if (status === 422) {
    return "Invalid details. Check the form and try again.";
  }
  return "Request failed. Try again.";
}
