import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

/**
 * Creates a new user. Backend should return the same shape as GET user_by_username
 * (e.g. `{ user_id, person_tasks }` on `response.data`).
 *
 * Expected: `POST /users/` with JSON body `{ "username": "..." }`.
 */
export async function createUser(username) {
  const trimmed = String(username).trim();
  if (!trimmed) {
    throw new Error("Username is required");
  }
  return axios.post(
    `${API_BASE_URL}/users/`,
    { username: trimmed },
    { headers: { "Content-Type": "application/json" } },
  );
}
