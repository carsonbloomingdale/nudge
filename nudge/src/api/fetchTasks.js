import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

function encodePathSegment(value) {
  return encodeURIComponent(String(value));
}

/**
 * Legacy public lookups (no cookie). Prefer cookie auth + GET /tasks in the app.
 *
 * @returns {Promise<{ ok: true, response: import("axios").AxiosResponse } | { ok: false, notFound: true } | { ok: false, notFound: false, error: unknown }>}
 */
export async function loadUserByUsername(userName) {
  const trimmed = userName?.trim();
  if (!trimmed) {
    return { ok: false, notFound: false, error: new Error("Username is required") };
  }
  try {
    const response = await axios.get(
      `${API_BASE_URL}/user_by_username/${encodePathSegment(trimmed)}`,
      { headers: { "Content-Type": "application/json" } },
    );
    return { ok: true, response };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return { ok: false, notFound: true };
    }
    return { ok: false, notFound: false, error: e };
  }
}

/**
 * @returns {Promise<{ ok: true, response: import("axios").AxiosResponse } | { ok: false, notFound: true } | { ok: false, notFound: false, error: unknown }>}
 */
export async function loadUserById(userId) {
  if (!userId) {
    return { ok: false, notFound: false, error: new Error("User id is required") };
  }
  try {
    const response = await axios.get(
      `${API_BASE_URL}/user_by_id/${encodePathSegment(userId)}`,
      { headers: { "Content-Type": "application/json" } },
    );
    return { ok: true, response };
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 404) {
      return { ok: false, notFound: true };
    }
    return { ok: false, notFound: false, error: e };
  }
}
