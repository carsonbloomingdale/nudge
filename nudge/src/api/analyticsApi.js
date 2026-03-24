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

/**
 * @typedef {{
 *   id: string;
 *   label: string;
 *   rationale: string;
 *   sourceTasks: string[];
 * }} GrowthGoalSuggestion
 */

function asTrimmedString(value) {
  if (value == null) {
    return "";
  }
  return String(value).trim();
}

function normalizeSourceTasks(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((x) => {
      if (typeof x === "string") {
        return x.trim();
      }
      if (x && typeof x === "object") {
        return asTrimmedString(x.snippet ?? x.task ?? x.text ?? x.label);
      }
      return "";
    })
    .filter(Boolean);
}

function normalizeGoalSuggestion(item, index) {
  if (!item || typeof item !== "object") {
    return null;
  }
  const label = asTrimmedString(item.label ?? item.goal_label ?? item.goal);
  if (!label) {
    return null;
  }
  const sourceTasks = normalizeSourceTasks(item.source_tasks ?? item.sources);
  const rationale = asTrimmedString(item.rationale ?? item.reason)
    || (sourceTasks.length > 0 ? `Based on tasks: ${sourceTasks.slice(0, 2).join(" | ")}` : "");
  const id = asTrimmedString(item.goal_id ?? item.id) || `${label.toLowerCase()}-${index}`;
  return { id, label, rationale, sourceTasks };
}

/**
 * @returns {Promise<GrowthGoalSuggestion[]>}
 */
export async function fetchGrowthGoalSuggestions() {
  const { data } = await http.get("/api/growth-goals/suggestions");
  const list = Array.isArray(data?.suggestions)
    ? data.suggestions
    : Array.isArray(data)
      ? data
      : [];
  return list.map(normalizeGoalSuggestion).filter(Boolean);
}

/**
 * @typedef {{ id: string; label: string; created_at: string }} PinnedGrowthGoal
 */

function normalizePinnedGoal(item, index) {
  if (!item || typeof item !== "object") {
    return null;
  }
  const label = asTrimmedString(item.label ?? item.goal_label ?? item.goal);
  if (!label) {
    return null;
  }
  const id = asTrimmedString(item.goal_id ?? item.id) || `${label.toLowerCase()}-${index}`;
  return {
    id,
    label,
    created_at: asTrimmedString(item.created_at ?? item.createdAt),
  };
}

/**
 * @returns {Promise<PinnedGrowthGoal[]>}
 */
export async function fetchPinnedGrowthGoals() {
  const { data } = await http.get("/api/growth-goals/pinned");
  const list = Array.isArray(data?.goals) ? data.goals : Array.isArray(data) ? data : [];
  return list.map(normalizePinnedGoal).filter(Boolean);
}

/**
 * @param {string} goalId
 * @returns {Promise<PinnedGrowthGoal | null>}
 */
export async function pinGrowthGoal(goalId) {
  const normalizedGoalId = asTrimmedString(goalId);
  const safe = encodeURIComponent(normalizedGoalId);
  const { data } = await http.post(`/api/growth-goals/${safe}/pin`);
  if (Array.isArray(data?.goals) || Array.isArray(data)) {
    const list = Array.isArray(data?.goals) ? data.goals : data;
    const normalized = list.map(normalizePinnedGoal).filter(Boolean);
    return normalized.find((x) => String(x.id) === normalizedGoalId) ?? null;
  }
  return normalizePinnedGoal(data, 0);
}

/**
 * @param {string} goalId
 * @returns {Promise<PinnedGrowthGoal[]>}
 */
export async function unpinGrowthGoal(goalId) {
  const safe = encodeURIComponent(asTrimmedString(goalId));
  const { data } = await http.delete(`/api/growth-goals/${safe}/pin`);
  const list = Array.isArray(data?.goals) ? data.goals : Array.isArray(data) ? data : [];
  return list.map(normalizePinnedGoal).filter(Boolean);
}

/**
 * @typedef {{ bucketStart: string; bucketEnd: string; total: number }} ActivityBucket
 */

function normalizeActivityBuckets(data) {
  const list = Array.isArray(data?.activity)
    ? data.activity
    : Array.isArray(data?.buckets)
      ? data.buckets
      : Array.isArray(data)
        ? data
        : [];
  return list
    .map((x) => {
      if (!x || typeof x !== "object") {
        return null;
      }
      const bucketStart = asTrimmedString(
        x.bucket_start ?? x.date ?? x.period_start ?? x.start_date,
      );
      if (!bucketStart) {
        return null;
      }
      const bucketEnd = asTrimmedString(x.bucket_end ?? x.period_end ?? x.end_date) || bucketStart;
      const total = Number(x.total ?? x.count ?? x.value ?? 0) || 0;
      return { bucketStart, bucketEnd, total };
    })
    .filter(Boolean);
}

function toQueryParams({ grain = "day", fromDate, toDate }) {
  return {
    grain,
    from_date: asTrimmedString(fromDate),
    to_date: asTrimmedString(toDate),
  };
}

/**
 * @param {{ grain?: "day" | "week" | "month", fromDate: string, toDate: string }} options
 * @returns {Promise<ActivityBucket[]>}
 */
export async function fetchGrowthGoalsActivityTotals(options) {
  const { data } = await http.get("/api/analytics/growth-goals/activity/totals", {
    params: toQueryParams(options),
  });
  return normalizeActivityBuckets(data);
}

/**
 * @param {string} goalId
 * @param {{ grain?: "day" | "week" | "month", fromDate: string, toDate: string }} options
 * @returns {Promise<ActivityBucket[]>}
 */
export async function fetchGrowthGoalActivity(goalId, options) {
  const safe = encodeURIComponent(asTrimmedString(goalId));
  const { data } = await http.get(`/api/analytics/growth-goals/${safe}/activity`, {
    params: toQueryParams(options),
  });
  return normalizeActivityBuckets(data);
}

/**
 * @param {{ grain?: "day" | "week" | "month", fromDate: string, toDate: string }} options
 * @returns {Promise<ActivityBucket[]>}
 */
export async function fetchTraitsActivityTotals(options) {
  const { data } = await http.get("/api/analytics/traits/activity/totals", {
    params: toQueryParams(options),
  });
  return normalizeActivityBuckets(data);
}

/**
 * @param {string} traitLabel
 * @param {{ grain?: "day" | "week" | "month", fromDate: string, toDate: string }} options
 * @returns {Promise<ActivityBucket[]>}
 */
export async function fetchTraitActivity(traitLabel, options) {
  const safe = encodeURIComponent(asTrimmedString(traitLabel));
  const { data } = await http.get(`/api/analytics/traits/${safe}/activity`, {
    params: toQueryParams(options),
  });
  return normalizeActivityBuckets(data);
}
