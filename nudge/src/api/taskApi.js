import http from "./httpClient";
import {
  flattenJournalsToTasks,
  sortTasksChronologically,
} from "./journalApi";

/**
 * API may return `personality_traits` as string[] or { trait_id, label }[] (TaskLinePublic).
 * We normalize to trimmed label strings for the rest of the app.
 * @param {unknown} raw
 * @returns {string[]}
 */
export function normalizePersonalityTraits(raw) {
  if (raw == null) {
    return [];
  }
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((x) => {
      if (typeof x === "string") {
        return x.trim();
      }
      if (x && typeof x === "object" && "label" in x && x.label != null) {
        return String(x.label).trim();
      }
      return String(x ?? "").trim();
    })
    .filter(Boolean);
}

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
    personality_traits: normalizePersonalityTraits(
      t.personality_traits ?? t.personalityTraits,
    ),
  }));
}

/**
 * Task rows for enrich history, suggestions, Insights feed, and trait charts.
 * **GET /tasks/** is the source of truth — the Task model carries fields like
 * `personality_traits` that nested journal payloads may omit.
 * Sorted oldest → newest. If `/tasks/` fails, falls back to flattening GET /api/journals/.
 */
export async function fetchAuthenticatedTasks() {
  try {
    const { data } = await http.get("/tasks/");
    return sortTasksChronologically(mapTasksResponse(data));
  } catch (primary) {
    try {
      const { data } = await http.get("/api/journals/");
      const flat = sortTasksChronologically(flattenJournalsToTasks(data));
      return mapTasksResponse(flat);
    } catch {
      throw primary;
    }
  }
}

/**
 * Deletes one task row (and its personality_traits links). Journal row is kept if the task belonged to one.
 * `DELETE /tasks/{task_id}/` — trailing slash matches server routes.
 * @param {string|number} taskId
 */
export async function deleteTask(taskId) {
  if (taskId == null || taskId === "") {
    return;
  }
  const id = encodeURIComponent(String(taskId));
  await http.delete(`/tasks/${id}/`);
}
