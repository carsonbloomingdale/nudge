import http from "./httpClient";

/**
 * Persists enriched task fields. User is inferred from the access JWT / cookie on the server.
 */
export default async function saveUserData(newTask) {
  return http.post("/tasks/", newTask);
}
