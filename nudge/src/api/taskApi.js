import http from "./httpClient";

/** Normalize list from GET /tasks (shape may vary). */
export function mapTasksResponse(data) {
  const raw = Array.isArray(data)
    ? data
    : data?.tasks ?? data?.person_tasks ?? data?.results ?? [];
  return raw.map((t) => ({
    ...t,
    label:
      t.label ??
      t.title ??
      t.name ??
      (t.id != null ? String(t.id) : ""),
  }));
}

export async function fetchAuthenticatedTasks() {
  const { data } = await http.get("/tasks/");
  return mapTasksResponse(data);
}
