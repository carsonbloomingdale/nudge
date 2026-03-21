/**
 * Single origin for all backend calls. Set REACT_APP_API_BASE_URL in .env
 * to your deployed API (no trailing slash — paths are joined as `${API_BASE_URL}/...`).
 */
const raw =
  process.env.REACT_APP_API_BASE_URL ||
  "https://urgent-maria-nudge-9f4b7e98.koyeb.app";

export const API_BASE_URL = String(raw).replace(/\/+$/, "");
