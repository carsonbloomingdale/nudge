/** Until BE sends trait per entry, derive a stable “flavor” from text for badges. */
export const TRAIT_DEFS = [
  { id: "creative", label: "Creative", cssVar: "--trait-creative" },
  { id: "social", label: "Social", cssVar: "--trait-social" },
  { id: "analytical", label: "Analytical", cssVar: "--trait-analytical" },
  { id: "adventurous", label: "Adventurous", cssVar: "--trait-adventurous" },
  { id: "nurturing", label: "Nurturing", cssVar: "--trait-nurturing" },
  { id: "disciplined", label: "Disciplined", cssVar: "--trait-disciplined" },
];

export function traitForEntry(label, index = 0) {
  const s = label ?? "";
  let h = index * 17;
  for (let i = 0; i < s.length; i += 1) {
    h += s.charCodeAt(i);
  }
  return TRAIT_DEFS[h % TRAIT_DEFS.length];
}

export function formatReflectionTime(task) {
  const raw =
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
