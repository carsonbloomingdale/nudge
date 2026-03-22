import axios from "axios";
import { API_BASE_URL } from "./apiConfig";
import {
  mergeTokensFromResponse,
  readRefreshToken,
} from "../auth/tokenStorage";

const refreshClientConfig = {
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
};

/**
 * Try cookie-based refresh first; if that fails, POST { refresh_token } when stored (mobile / cross-site).
 */
export async function refreshTokensRequest() {
  try {
    const r = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      refreshClientConfig,
    );
    mergeTokensFromResponse(r.data);
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
    mergeTokensFromResponse(r2.data);
    return r2;
  }
}
