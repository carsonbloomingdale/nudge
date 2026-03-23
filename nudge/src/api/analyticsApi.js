import http from "./httpClient";

/**
 * @typedef {{ label: string; count: number }} RawAggregate
 * @typedef {{
 *   id: string;
 *   display_label: string;
 *   count: number;
 *   percentage: number;
 *   member_labels?: string[];
 * }} PersonalitySegment
 * @typedef {{
 *   total_associations: number;
 *   raw_aggregates?: RawAggregate[];
 *   segments: PersonalitySegment[];
 *   chart_mode: "ai" | "raw_only";
 *   meta?: Record<string, unknown>;
 * }} PersonalityTraitsChartResponse
 */

/**
 * Aggregated personality trait links for charts (persisted DB rows).
 * @param {{ useAi?: boolean }} [options] — default use_ai=true on the server
 * @returns {Promise<PersonalityTraitsChartResponse>}
 */
export async function fetchPersonalityTraitsChart(options = {}) {
  const useAi = options.useAi !== false;
  const { data } = await http.get("/api/analytics/personality-traits-chart", {
    params: { use_ai: useAi },
  });
  return data;
}

/**
 * @typedef {{ pin_id: number; label: string; created_at: string }} PinnedTrait
 */

function normalizePinnedTraitsPayload(data) {
  const list = Array.isArray(data?.traits) ? data.traits : [];
  return list
    .filter((x) => x && typeof x === "object" && x.label != null)
    .map((x) => ({
      pin_id: x.pin_id ?? x.pinId ?? 0,
      label: String(x.label).trim(),
      created_at: x.created_at ?? x.createdAt ?? "",
    }))
    .filter((x) => x.label);
}

/** @returns {Promise<PinnedTrait[]>} */
export async function fetchPinnedTraits() {
  const { data } = await http.get("/api/analytics/pinned-traits");
  return normalizePinnedTraitsPayload(data);
}

/**
 * Idempotent: backend returns existing pin when already present.
 * @param {string} label
 * @returns {Promise<PinnedTrait | null>}
 */
export async function pinTrait(label) {
  const { data } = await http.post("/api/analytics/pinned-traits", { label });
  if (!data || typeof data !== "object" || data.label == null) {
    return null;
  }
  return {
    pin_id: data.pin_id ?? data.pinId ?? 0,
    label: String(data.label).trim(),
    created_at: data.created_at ?? data.createdAt ?? "",
  };
}

/**
 * @param {string} label
 * @returns {Promise<PinnedTrait[]>} updated list
 */
export async function unpinTrait(label) {
  const safe = encodeURIComponent(String(label ?? "").trim());
  const { data } = await http.delete(`/api/analytics/pinned-traits/${safe}`);
  return normalizePinnedTraitsPayload(data);
}

/**
 * Replace-all sync.
 * @param {string[]} labels
 * @returns {Promise<PinnedTrait[]>}
 */
export async function replacePinnedTraits(labels) {
  const { data } = await http.put("/api/analytics/pinned-traits", {
    labels: Array.isArray(labels) ? labels : [],
  });
  return normalizePinnedTraitsPayload(data);
}
