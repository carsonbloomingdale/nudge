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

/**
 * POST /auth/me/sms/test — send a one-off test SMS to the saved number (empty body).
 * @returns {Promise<import("axios").AxiosResponse<{ ok: boolean }>>}
 */
export function postSmsTest() {
  return http.post("/auth/me/sms/test", {});
}

/**
 * POST /auth/me/phone/send-verification-code — empty body.
 * Response: **AuthMeResponse** (full profile; use to refresh `phone_verified` / UI).
 */
export function postSendPhoneVerificationCode() {
  return http.post("/auth/me/phone/send-verification-code", {});
}

/**
 * POST /auth/me/phone/verify — body `{ code: "123456" }` (6-digit).
 * Response: **AuthMeResponse** with `phone_verified: true` when successful.
 * @param {string} code
 */
export function postVerifyPhoneCode(code) {
  const digits = String(code ?? "").replace(/\D/g, "").slice(0, 6);
  return http.post("/auth/me/phone/verify", { code: digits });
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
 * GET /auth/me with backoff when the server returns 401/403. Mobile Safari (and some
 * WebViews) can apply Set-Cookie from the login response slightly after the JS stack
 * continues, so the first /auth/me may not send cookies yet.
 *
 * Uses plain `axios` (not the shared `http` client) so a transient 401 does not run the
 * 401 interceptor: that path calls `POST /auth/refresh` and, if that fails, forces
 * logout—which would clear a brand-new session right after login.
 */
export async function fetchCurrentUserResilient() {
  const backoffMs = [0, 120, 300, 600];
  let lastError = null;
  for (let i = 0; i < backoffMs.length; i += 1) {
    if (backoffMs[i] > 0) {
      await new Promise((r) => setTimeout(r, backoffMs[i]));
    }
    try {
      const { data } = await axios.get(`${API_BASE_URL}/auth/me`, {
        withCredentials: true,
        headers: { Accept: "application/json" },
      });
      const user = normalizeUserPayload(data);
      return { user, error: null };
    } catch (e) {
      if (
        axios.isAxiosError(e) &&
        (e.response?.status === 404 || e.response?.status === 503)
      ) {
        return { user: null, error: null };
      }
      lastError = e;
      const status =
        e && typeof e === "object" && e.isAxiosError === true
          ? e.response?.status
          : undefined;
      if (status !== 401 && status !== 403) {
        return { user: null, error: e };
      }
    }
  }
  return { user: null, error: lastError };
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
 *   phoneVerified: boolean,
 *   phoneVerifiedAt: string | null,
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
  const pv = u.phone_verified_at ?? u.phoneVerifiedAt;
  const phoneVerifiedAt =
    pv != null && String(pv).trim() !== "" ? String(pv).trim() : null;
  const pvFlag = u.phone_verified ?? u.phoneVerified;
  let phoneVerified;
  if (pvFlag === true || pvFlag === "true" || pvFlag === 1) {
    phoneVerified = true;
  } else if (pvFlag === false || pvFlag === "false" || pvFlag === 0) {
    phoneVerified = false;
  } else {
    phoneVerified = Boolean(phoneVerifiedAt);
  }
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
    phone: (() => {
      const raw = u.phone ?? u.phone_e164;
      return raw != null && String(raw).trim() !== "" ? String(raw) : null;
    })(),
    timezone:
      u.timezone != null && String(u.timezone).trim() !== ""
        ? String(u.timezone)
        : null,
    smsOptIn,
    phoneVerified,
    phoneVerifiedAt,
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
    const d503 = data?.detail;
    if (typeof d503 === "string" && d503.trim()) {
      return d503.trim();
    }
    return "Service temporarily unavailable. Try again later.";
  }
  if (status === 401) {
    return "Not signed in or your session expired. Sign in again.";
  }
  if (status === 502) {
    const d502 = data?.detail;
    if (typeof d502 === "string" && d502.trim()) {
      return d502.trim();
    }
    return "Could not send the text message. Try again later.";
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
