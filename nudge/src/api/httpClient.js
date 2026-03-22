import axios from "axios";
import { notifySessionExpired } from "../auth/authSessionBridge";
import { API_BASE_URL } from "./apiConfig";
import { readAccessToken, syncCookieTokensToSessionStorage } from "../auth/tokenStorage";
import { refreshTokensRequest } from "./authRefresh";

/**
 * Browser client: cookies (withCredentials) + optional Authorization: Bearer when the API returns tokens.
 * On 401: POST /auth/refresh (cookies first, then { refresh_token } from sessionStorage if needed), then retry once.
 */
const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

http.interceptors.request.use((config) => {
  syncCookieTokensToSessionStorage();
  const url = String(config.url ?? "");
  const skipBearer =
    url.includes("/auth/login") ||
    url.includes("/auth/register") ||
    url.includes("/auth/refresh");
  if (!skipBearer) {
    const token = readAccessToken();
    if (token) {
      const headers = axios.AxiosHeaders.from(config.headers ?? {});
      headers.set("Authorization", `Bearer ${token}`);
      config.headers = headers;
    }
  }
  return config;
});

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const cfg = error.config;
    if (!axios.isAxiosError(error) || !cfg) {
      return Promise.reject(error);
    }
    if (cfg.skipAuthRefresh) {
      return Promise.reject(error);
    }
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }
    if (cfg._retriedAfterRefresh) {
      if (error.response?.status === 401) {
        notifySessionExpired();
      }
      return Promise.reject(error);
    }
    const url = cfg.url ?? "";
    if (
      url.includes("/auth/refresh") ||
      url.includes("/auth/login") ||
      url.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }
    cfg._retriedAfterRefresh = true;
    try {
      if (!refreshPromise) {
        refreshPromise = refreshTokensRequest().finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      return http(cfg);
    } catch (refreshErr) {
      notifySessionExpired();
      return Promise.reject(refreshErr);
    }
  },
);

export default http;
