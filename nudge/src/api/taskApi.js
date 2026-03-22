import http from "./httpClient";
import {
  flattenJournalsToTasks,
  isJournalRouteMissingError,
  sortTasksChronologically,
} from "./journalApi";

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

/**
 * Prefer GET /api/journals/ (nested tasks + journal_id); fallback to GET /tasks/.
 * Tasks are sorted oldest → newest for enrich / suggestion history.
 */
export async function fetchAuthenticatedTasks() {
  try {
    const { data } = await http.get("/api/journals/");
    const flat = sortTasksChronologically(flattenJournalsToTasks(data));
    return mapTasksResponse(flat);
  } catch (e) {
    if (isJournalRouteMissingError(e)) {
      const { data } = await http.get("/tasks/");
      return mapTasksResponse(data);
    }
    throw e;
  }
}
