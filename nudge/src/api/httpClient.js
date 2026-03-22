import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

/**
 * Browser client for your API. Sends cookies (access + refresh) on every request.
 * On 401, attempts one POST /auth/refresh and retries the original request.
 */
const http = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let refreshPromise = null;

function refreshAccessCookie() {
  return axios.post(
    `${API_BASE_URL}/auth/refresh`,
    {},
    {
      withCredentials: true,
      headers: { "Content-Type": "application/json" },
    },
  );
}

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
        refreshPromise = refreshAccessCookie().finally(() => {
          refreshPromise = null;
        });
      }
      await refreshPromise;
      return http(cfg);
    } catch (refreshErr) {
      return Promise.reject(refreshErr);
    }
  },
);

export default http;
