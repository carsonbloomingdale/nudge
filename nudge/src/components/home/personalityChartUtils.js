import { normalizeTraitSlug, traitThemeForSlug } from "./traitUtils";

const MAX_RADAR_AXES = 8;

/**
 * Map analytics segments → radar rows (normalized to strongest segment).
 * @param {import("../../api/analyticsApi").PersonalityTraitsChartResponse["segments"]} segments
 */
export function segmentsToRadarTraits(segments) {
  const list = [...(segments ?? [])].sort((a, b) => b.count - a.count);
  const top = list.slice(0, MAX_RADAR_AXES);
  const maxCount = top[0]?.count ?? 1;
  return top.map((s) => {
    const slug = normalizeTraitSlug(s.id || s.display_label);
    const theme = traitThemeForSlug(slug);
    return {
      id: String(s.id ?? slug),
      label: s.display_label,
      count: s.count,
      normalizedScore: maxCount > 0 ? s.count / maxCount : 0,
      cssVar: theme.cssVar,
      hsl: theme.hsl,
    };
  });
}

/**
 * @param {import("../../api/analyticsApi").PersonalityTraitsChartResponse["segments"]} segments
 * @param {number} maxRows
 */
export function segmentsToGrowthRows(segments, maxRows = 12) {
  const list = [...(segments ?? [])].sort((a, b) => b.count - a.count);
  return list.slice(0, maxRows).map((s) => {
    const slug = normalizeTraitSlug(s.id || s.display_label);
    const theme = traitThemeForSlug(slug);
    return {
      id: String(s.id ?? slug),
      label: s.display_label,
      count: s.count,
      /** 0–100, share of all associations */
      sharePct: Math.min(100, Math.round(Number(s.percentage) || 0)),
      memberLabels: Array.isArray(s.member_labels) ? s.member_labels : [],
      cssVar: theme.cssVar,
      hsl: theme.hsl,
    };
  });
}
