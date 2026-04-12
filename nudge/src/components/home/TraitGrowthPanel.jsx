import { useMemo, useState } from "react";
import styled from "styled-components";
import ChartLoadingPlaceholder from "./ChartLoadingPlaceholder";
import {
  aggregateTraitStatsFromTasks,
  DEFAULT_TRAIT_GROWTH_CAP,
} from "./traitUtils";
import { segmentsToGrowthRows } from "./personalityChartUtils";

const MAX_VISIBLE_TRAITS = 6;
const DISPLAY_TRAIT_VARS = [
  "--trait-creative",
  "--trait-social",
  "--trait-analytical",
  "--trait-adventurous",
  "--trait-nurturing",
  "--trait-disciplined",
];

const Wrap = styled.section``;

const TitleRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const Title = styled.h2`
  margin: 0;
  font-family: var(--font-display), serif;
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.25;
  color: hsl(var(--foreground));
`;

const Context = styled.p`
  margin: -0.45rem 0 0.85rem;
  font-size: 0.78rem;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
`;

const Sub = styled.p`
  margin: 0 0 1rem;
  font-size: 12px;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));

  @media (max-width: 1023px) {
    font-size: 13px;
  }
`;

const Card = styled.div`
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Row = styled.div``;

const RowTop = styled.div`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 0.35rem;
`;

const Label = styled.span`
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--foreground));

  @media (max-width: 1023px) {
    font-size: 0.95rem;
  }
`;

const Meta = styled.span`
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--muted-foreground));

  @media (max-width: 1023px) {
    font-size: 0.8125rem;
  }
`;

const LabelRow = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
`;

const PinBtn = styled.button`
  width: 1.35rem;
  height: 1.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 0.3rem;
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;

  &:hover:not(:disabled) {
    color: hsl(var(--foreground));
    background: hsl(var(--foreground) / 0.06);
  }

  &[data-pinned="true"] {
    color: hsl(var(--primary));
    background: hsl(var(--primary) / 0.12);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Track = styled.div`
  height: 8px;
  border-radius: 9999px;
  background: hsl(var(--muted));
  overflow: hidden;
`;

const Fill = styled.div`
  height: 100%;
  width: ${(p) => p.$pct}%;
  border-radius: 9999px;
  background: ${(p) =>
    p.$hsl
      ? `hsl(${p.$hsl})`
      : p.$cssVar
        ? `hsl(var(${p.$cssVar}))`
        : "hsl(var(--primary))"};
`;

const Empty = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: hsl(var(--muted-foreground));
`;

const ExpandToggle = styled.button`
  margin: 0;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  background: none;
  border: none;
  padding: 0.35rem 0;
  cursor: pointer;
  text-align: left;
  font: inherit;
  line-height: 1.35;

  &:hover {
    color: hsl(var(--foreground));
    text-decoration: underline;
  }
`;

function normalizeTraitLabel(s) {
  return String(s ?? "").trim().toLowerCase();
}

function PinIcon({ pinned }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9L12 3Z"
        fill={pinned ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * @param {{
 *   tasks?: unknown[],
 *   analytics?: import("../../api/analyticsApi").PersonalityTraitsChartResponse | null,
 *   analyticsLoading?: boolean,
 *   analyticsFailed?: boolean,
 *   pinnedTraitLabels?: string[],
 *   pinBusyLabel?: string | null,
 *   onTogglePinTrait?: (label: string) => void,
 * }} props
 */
export default function TraitGrowthPanel({
  tasks,
  analytics,
  analyticsLoading,
  analyticsFailed,
  pinnedTraitLabels = [],
  pinBusyLabel = null,
  onTogglePinTrait,
}) {
  const [traitsExpanded, setTraitsExpanded] = useState(false);
  const viz = useMemo(() => {
    if (analyticsLoading) {
      return { kind: "loading" };
    }
    if (analytics && !analyticsFailed) {
      const total = analytics.total_associations ?? 0;
      const segs = analytics.segments ?? [];
      if (total > 0 && segs.length > 0) {
        return {
          kind: "analytics",
          rows: segmentsToGrowthRows(segs, DEFAULT_TRAIT_GROWTH_CAP),
          chartMode: analytics.chart_mode,
        };
      }
      return { kind: "empty_db" };
    }
    const agg = aggregateTraitStatsFromTasks(tasks, DEFAULT_TRAIT_GROWTH_CAP);
    if (agg.hasData) {
      const maxCount = agg.maxCount || 1;
      return {
        kind: "tasks",
        rows: agg.orderedTraits.map((t) => ({
          id: t.id,
          label: t.label,
          count: t.count,
          sharePct:
            agg.totalTraitMentions > 0
              ? Math.round((t.count / agg.totalTraitMentions) * 100)
              : 0,
          barPct: Math.round((t.count / maxCount) * 100),
          memberLabels: [],
          cssVar: t.cssVar,
          hsl: t.hsl,
        })),
      };
    }
    return { kind: "empty" };
  }, [tasks, analytics, analyticsLoading, analyticsFailed]);

  const subtitle =
    viz.kind === "analytics"
      ? viz.chartMode === "ai"
        ? "From saved trait links — grouped with AI."
        : "From saved trait links — one bar per distinct label."
      : viz.kind === "tasks" && analyticsFailed
        ? "Analytics unavailable — trait counts from your saved moments."
        : null;
  const allRows = useMemo(
    () => (viz.kind === "analytics" || viz.kind === "tasks" ? viz.rows : []),
    [viz],
  );
  const { rows, hiddenTraitsWhenCollapsed } = useMemo(() => {
    const pinned = [];
    const others = [];
    const pinnedSet = new Set((pinnedTraitLabels ?? []).map(normalizeTraitLabel));
    const seenPinned = new Set();
    for (const r of allRows) {
      const key = normalizeTraitLabel(r.label);
      if (pinnedSet.has(key)) {
        pinned.push(r);
        seenPinned.add(key);
      } else {
        others.push(r);
      }
    }
    for (const label of pinnedTraitLabels ?? []) {
      const key = normalizeTraitLabel(label);
      if (!key || seenPinned.has(key)) {
        continue;
      }
      pinned.push({
        id: `pinned-missing-${key}`,
        label: String(label).trim(),
        count: 0,
        sharePct: 0,
        barPct: 0,
        memberLabels: [],
      });
    }
    const othersCap = Math.max(0, MAX_VISIBLE_TRAITS - pinned.length);
    const collapsedOthers = others.slice(0, othersCap);
    const hiddenTraitsWhenCollapsed = Math.max(0, others.length - collapsedOthers.length);
    const rest = traitsExpanded ? others : collapsedOthers;
    const visible = [...pinned, ...rest];
    const rowsOut = visible.map((r, i) => ({
      ...r,
      uiCssVar: DISPLAY_TRAIT_VARS[i % DISPLAY_TRAIT_VARS.length],
    }));
    return { rows: rowsOut, hiddenTraitsWhenCollapsed };
  }, [allRows, pinnedTraitLabels, traitsExpanded]);
  const pinnedLookup = useMemo(
    () => new Set((pinnedTraitLabels ?? []).map(normalizeTraitLabel)),
    [pinnedTraitLabels],
  );

  return (
    <Wrap className="animate-fade-up stagger-350">
      <TitleRow>
        <Title>Trait growth</Title>
      </TitleRow>
      <Context>
        Longer-term personality patterns that emerge over months of logged moments.
      </Context>
      {subtitle ? <Sub>{subtitle}</Sub> : null}
      <Card>
        {viz.kind === "loading" ? (
          <ChartLoadingPlaceholder minHeight="10rem" label="Loading trait growth…" />
        ) : null}
        {viz.kind === "empty_db" ? (
          <Empty>
            No personality trait links stored yet. When enrich persists traits to
            the database, they&apos;ll appear here.
          </Empty>
        ) : null}
        {viz.kind === "empty" ? (
          <Empty>
            As you log moments, we tally how often each personality trait shows
            up — bars grow with repetition.
          </Empty>
        ) : null}
        {viz.kind === "analytics" || viz.kind === "tasks" ? (
          <Stack>
            {rows.map((r) => {
              const pct =
                viz.kind === "analytics" ? r.sharePct : r.barPct ?? r.sharePct;
              const tooltip =
                r.memberLabels?.length > 0
                  ? `Includes: ${r.memberLabels.join(", ")}`
                  : undefined;
              return (
                <Row key={r.id} title={tooltip}>
                  <RowTop>
                    <LabelRow>
                      <Label>{r.label}</Label>
                      {typeof onTogglePinTrait === "function" ? (
                        <PinBtn
                          type="button"
                          data-pinned={pinnedLookup.has(normalizeTraitLabel(r.label))}
                          disabled={
                            pinBusyLabel != null &&
                            normalizeTraitLabel(pinBusyLabel) ===
                              normalizeTraitLabel(r.label)
                          }
                          onClick={() => onTogglePinTrait(r.label)}
                        >
                          <PinIcon
                            pinned={pinnedLookup.has(normalizeTraitLabel(r.label))}
                          />
                        </PinBtn>
                      ) : null}
                    </LabelRow>
                    <Meta className="tabular-nums">
                      {r.count}× · {r.sharePct}% of total
                    </Meta>
                  </RowTop>
                  <Track>
                    <Fill
                      $pct={Math.min(100, pct)}
                      $cssVar={r.uiCssVar ?? r.cssVar}
                      $hsl={r.hsl}
                    />
                  </Track>
                </Row>
              );
            })}
            {hiddenTraitsWhenCollapsed > 0 && !traitsExpanded ? (
              <ExpandToggle
                type="button"
                onClick={() => setTraitsExpanded(true)}
                aria-expanded={traitsExpanded}
              >
                +{hiddenTraitsWhenCollapsed} more{" "}
                {hiddenTraitsWhenCollapsed === 1 ? "trait" : "traits"} — show all
              </ExpandToggle>
            ) : null}
            {traitsExpanded && hiddenTraitsWhenCollapsed > 0 ? (
              <ExpandToggle
                type="button"
                onClick={() => setTraitsExpanded(false)}
                aria-expanded={traitsExpanded}
              >
                Show fewer traits
              </ExpandToggle>
            ) : null}
          </Stack>
        ) : null}
      </Card>
    </Wrap>
  );
}
