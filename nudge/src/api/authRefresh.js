import axios from "axios";
import { API_BASE_URL } from "./apiConfig";
import {
  mergeAuthTokensFromAxiosResponse,
  readAccessToken,
  readRefreshToken,
  syncCookieTokensToSessionStorage,
} from "../auth/tokenStorage";

const refreshClientConfig = {
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
};

/**
 * Try cookie-based refresh first; if that fails, POST { refresh_token } when stored (mobile / cross-site).
 */
export async function refreshTokensRequest() {
  syncCookieTokensToSessionStorage();
  try {
    const r = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      refreshClientConfig,
    );
    mergeAuthTokensFromAxiosResponse(r);
    const rt = readRefreshToken();
    if (!readAccessToken() && rt) {
      try {
        const r2 = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          { refresh_token: rt },
          refreshClientConfig,
        );
        mergeAuthTokensFromAxiosResponse(r2);
        return r2;
      } catch {
        /* keep cookie-based response if body refresh fails */
      }
    }
    return r;
  } catch (cookieErr) {
    const rt = readRefreshToken();
    if (!rt) {
      throw cookieErr;
    }
    const r2 = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: rt },
      refreshClientConfig,
    );
    mergeAuthTokensFromAxiosResponse(r2);
    return r2;
  }
}
