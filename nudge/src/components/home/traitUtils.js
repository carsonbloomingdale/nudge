/** Until BE sends trait per entry, derive a stable “flavor” from text for badges. */
export const TRAIT_DEFS = [
  { id: "creative", label: "Creative", cssVar: "--trait-creative" },
  { id: "social", label: "Social", cssVar: "--trait-social" },
  { id: "analytical", label: "Analytical", cssVar: "--trait-analytical" },
  { id: "adventurous", label: "Adventurous", cssVar: "--trait-adventurous" },
  { id: "nurturing", label: "Nurturing", cssVar: "--trait-nurturing" },
  { id: "disciplined", label: "Disciplined", cssVar: "--trait-disciplined" },
];

const TRAIT_BY_ID = Object.fromEntries(TRAIT_DEFS.map((d) => [d.id, d]));

/** Stable slug for counting (e.g. "Creative " → "creative"). */
export function normalizeTraitSlug(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function labelFromSlug(slug) {
  if (!slug) {
    return "";
  }
  return slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function stableIndexForTask(task, listIndex = 0) {
  const id = task?.task_id ?? task?.taskId ?? task?.id;
  if (id != null && Number.isFinite(Number(id))) {
    return Number(id);
  }
  return listIndex;
}

export function traitForEntry(label, index = 0) {
  const s = label ?? "";
  let h = index * 17;
  for (let i = 0; i < s.length; i += 1) {
    h += s.charCodeAt(i);
  }
  return TRAIT_DEFS[h % TRAIT_DEFS.length];
}

/**
 * Traits from the API when present; otherwise one derived trait from the label
 * so charts aren’t empty until the backend sends `personality_traits` on each task.
 *
 * @param {unknown} task
 * @param {number} [listIndex]
 * @returns {string[]}
 */
export function extractPersonalityTraits(task, listIndex = 0) {
  const raw =
    task?.personality_traits ?? task?.personalityTraits ?? [];
  const arr = Array.isArray(raw) ? raw : [];
  const slugs = [];
  for (const x of arr) {
    const slug = normalizeTraitSlug(
      typeof x === "string" ? x : String(x ?? ""),
    );
    if (slug) {
      slugs.push(slug);
    }
  }
  if (slugs.length > 0) {
    return slugs;
  }
  const label =
    task?.label ?? task?.title ?? task?.name ?? "";
  const idx = stableIndexForTask(task, listIndex);
  const derived = traitForEntry(label, idx);
  return [derived.id];
}

function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** HSL components for unknown dynamic traits (no theme token). */
export function hslForTraitSlug(slug) {
  const hue = hashString(slug) % 360;
  return `${hue} 42% 46%`;
}

/**
 * Display label + color: known traits use CSS vars; any other string uses a stable HSL.
 * @param {string} slug
 */
export function traitThemeForSlug(slug) {
  const def = TRAIT_BY_ID[slug];
  if (def) {
    return { label: def.label, cssVar: def.cssVar, hsl: null };
  }
  return {
    label: labelFromSlug(slug) || slug,
    cssVar: null,
    hsl: hslForTraitSlug(slug),
  };
}

export const DEFAULT_TRAIT_RADAR_CAP = 8;
export const DEFAULT_TRAIT_GROWTH_CAP = 12;

/**
 * Aggregate personality_traits across tasks by occurrence; scores are relative to the top trait.
 * @param {unknown[] | undefined} tasks
 * @param {number} [maxTraits]
 */
export function aggregateTraitStatsFromTasks(
  tasks,
  maxTraits = DEFAULT_TRAIT_RADAR_CAP,
) {
  const counts = new Map();
  (tasks ?? []).forEach((task, listIndex) => {
    for (const slug of extractPersonalityTraits(task, listIndex)) {
      counts.set(slug, (counts.get(slug) ?? 0) + 1);
    }
  });
  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const maxCount = sorted[0]?.[1] ?? 0;
  const cap = Math.max(1, maxTraits);
  const ordered = sorted.slice(0, cap).map(([slug, count]) => {
    const theme = traitThemeForSlug(slug);
    return {
      id: slug,
      label: theme.label,
      count,
      normalizedScore: maxCount > 0 ? count / maxCount : 0,
      cssVar: theme.cssVar,
      hsl: theme.hsl,
    };
  });
  return {
    orderedTraits: ordered,
    maxCount,
    hasData: ordered.length > 0,
    totalTraitMentions: sorted.reduce((s, [, c]) => s + c, 0),
  };
}

export function formatReflectionTime(task) {
  const raw =
    task?.submittedAt ??
    task?.submitted_at ??
    task?.created_at ??
    task?.createdAt ??
    task?.updated_at ??
    task?.timestamp;
  if (!raw) {
    return "Recently";
  }
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) {
    return "Recently";
  }
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) {
    return "Just now";
  }
  if (mins < 60) {
    return `${mins}m ago`;
  }
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) {
    return `${hrs}h ago`;
  }
  const days = Math.floor(hrs / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return d.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
