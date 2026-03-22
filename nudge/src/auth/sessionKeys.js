import { clearAuthTokens } from "./tokenStorage";

/**
 * UI-only cache (not used to authorize API calls). Auth is HTTP-only cookies + optional bearer tokens.
 * Written after successful login/register when the response includes a user payload,
 * or after GET /auth/me when that route exists.
 */
export const DISPLAY_PROFILE_KEY = "nudge_display_profile";

/** @deprecated removed after migration */
export const SESSION_USER_ID_KEY = "nudge_session_user_id";
export const SESSION_USERNAME_KEY = "nudge_session_username";
export const LEGACY_USER_ID_KEY = "nudge_user_id";

export function readDisplayProfile() {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = localStorage.getItem(DISPLAY_PROFILE_KEY);
    if (!raw) {
      return null;
    }
    const o = JSON.parse(raw);
    if (!o?.userId) {
      return null;
    }
    return {
      userId: String(o.userId),
      username: o.username != null ? String(o.username) : null,
      email: o.email != null ? String(o.email) : null,
    };
  } catch {
    return null;
  }
}

export function writeDisplayProfile(profile) {
  if (!profile?.userId) {
    return;
  }
  localStorage.setItem(
    DISPLAY_PROFILE_KEY,
    JSON.stringify({
      userId: profile.userId,
      username: profile.username ?? null,
      email: profile.email ?? null,
    }),
  );
}

export function clearDisplayProfileOnly() {
  localStorage.removeItem(DISPLAY_PROFILE_KEY);
}

export function clearSessionStorage() {
  clearAuthTokens();
  localStorage.removeItem(DISPLAY_PROFILE_KEY);
  localStorage.removeItem(SESSION_USER_ID_KEY);
  localStorage.removeItem(SESSION_USERNAME_KEY);
  localStorage.removeItem(LEGACY_USER_ID_KEY);
}
