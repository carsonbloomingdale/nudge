import http from "./httpClient";

function normalizePersonalityTraits(raw) {
  if (raw == null) {
    return [];
  }
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((x) =>
      typeof x === "string" ? x.trim() : String(x ?? "").trim(),
    )
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

export async function fetchAuthenticatedTasks() {
  const { data } = await http.get("/tasks/");
  return mapTasksResponse(data);
}
