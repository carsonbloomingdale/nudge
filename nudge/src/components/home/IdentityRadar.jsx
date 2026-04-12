import { useMemo, useState } from "react";
import styled from "styled-components";
import ChartLoadingPlaceholder from "./ChartLoadingPlaceholder";
import { aggregateTraitStatsFromTasks } from "./traitUtils";
import { segmentsToRadarTraits } from "./personalityChartUtils";

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

  @media (max-width: 1023px) {
    padding: 1rem 0.75rem;
  }
`;

const ChartWrap = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
`;

const Legend = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.5rem 1rem;
  max-width: 260px;

  @media (max-width: 1023px) {
    max-width: 100%;
  }
`;

const LegendItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));

  @media (max-width: 1023px) {
    font-size: 0.75rem;
  }
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background: ${(p) => p.$fill || "hsl(var(--primary))"};
`;

const Empty = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.55;
  color: hsl(var(--muted-foreground));
  text-align: center;
`;

const SingleTrait = styled.div`
  text-align: center;
  padding: 0.5rem 0;
`;

const SingleLabel = styled.p`
  margin: 0 0 0.35rem;
  font-size: 1rem;
  font-weight: 600;
  color: hsl(var(--foreground));
`;

const SingleMeta = styled.p`
  margin: 0;
  font-size: 0.8125rem;
  color: hsl(var(--muted-foreground));
`;

const ExpandToggle = styled.button`
  margin: -0.25rem 0 0;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  text-align: center;
  background: none;
  border: none;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  font: inherit;
  line-height: 1.35;
  width: 100%;

  &:hover {
    color: hsl(var(--foreground));
    text-decoration: underline;
  }
`;

const CX = 130;
const CY = 130;
const R_MAX = 82;
const LEVELS = [0.25, 0.5, 0.75, 1];
const MOBILE_CHART_SIZE = 330;
const DESKTOP_CHART_SIZE = 240;

function polar(angleRad, r) {
  return {
    x: CX + Math.cos(angleRad) * r,
    y: CY + Math.sin(angleRad) * r,
  };
}

function fillForTrait(t) {
  if (t.uiCssVar) {
    return `hsl(var(${t.uiCssVar}))`;
  }
  if (t.cssVar) {
    return `hsl(var(${t.cssVar}))`;
  }
  return `hsl(${t.hsl})`;
}

/**
 * @param {{
 *   tasks?: unknown[],
 *   analytics?: import("../../api/analyticsApi").PersonalityTraitsChartResponse | null,
 *   analyticsLoading?: boolean,
 *   analyticsFailed?: boolean,
 * }} props
 */
export default function IdentityRadar({
  tasks,
  analytics,
  analyticsLoading,
  analyticsFailed,
}) {
  const [radarExpanded, setRadarExpanded] = useState(false);
  const viz = useMemo(() => {
    if (analyticsLoading) {
      return { kind: "loading" };
    }
    if (analytics && !analyticsFailed) {
      const total = analytics.total_associations ?? 0;
      const segs = analytics.segments ?? [];
      if (total > 0 && segs.length > 0) {
        const radarTraits = segmentsToRadarTraits(segs);
        return {
          kind: "analytics",
          radarTraits,
          chartMode: analytics.chart_mode,
        };
      }
      return { kind: "empty_db" };
    }
    const fromTasks = aggregateTraitStatsFromTasks(tasks);
    if (fromTasks.hasData) {
      return {
        kind: "tasks",
        radarTraits: fromTasks.orderedTraits,
      };
    }
    return { kind: "empty" };
  }, [tasks, analytics, analyticsLoading, analyticsFailed]);

  const radarTraits = useMemo(() => {
    if (viz.kind === "analytics" || viz.kind === "tasks") {
      return viz.radarTraits;
    }
    return [];
  }, [viz]);
  const hiddenTraitsWhenCollapsed = Math.max(
    0,
    radarTraits.length - MAX_VISIBLE_TRAITS,
  );
  const displayedTraits = useMemo(
    () => {
      const slice = radarExpanded
        ? radarTraits
        : radarTraits.slice(0, MAX_VISIBLE_TRAITS);
      return slice.map((t, i) => ({
        ...t,
        uiCssVar: DISPLAY_TRAIT_VARS[i % DISPLAY_TRAIT_VARS.length],
      }));
    },
    [radarTraits, radarExpanded],
  );

  const axes = displayedTraits.length;

  const angles = useMemo(
    () =>
      Array.from(
        { length: Math.max(axes, 1) },
        (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / axes,
      ),
    [axes],
  );

  const hasData = viz.kind === "analytics" || viz.kind === "tasks";

  const polyPoints = useMemo(() => {
    if (axes < 2) {
      return "";
    }
    return angles
      .map((ang, i) => {
        const r = R_MAX * (displayedTraits[i]?.normalizedScore ?? 0);
        const { x, y } = polar(ang, r);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [angles, axes, displayedTraits]);

  const subtitle =
    viz.kind === "analytics"
      ? viz.chartMode === "ai"
        ? "From saved trait links — grouped with AI."
        : "From saved trait links — distinct labels."
      : viz.kind === "tasks" && analyticsFailed
        ? "Analytics unavailable — trait counts from your saved moments."
        : null;
  const chartPx =
    typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches
      ? MOBILE_CHART_SIZE
      : DESKTOP_CHART_SIZE;

  return (
    <Wrap className="animate-fade-up stagger-300">
      <TitleRow>
        <Title>Your identity map</Title>
      </TitleRow>
      {subtitle ? <Sub>{subtitle}</Sub> : null}
      <Card>
        <ChartWrap>
          {viz.kind === "loading" ? (
            <ChartLoadingPlaceholder minHeight="14rem" label="Loading identity map…" />
          ) : null}
          {viz.kind === "empty_db" ? (
            <Empty>
              No stored personality trait links yet. When enrich persists traits
              to the database, your map will fill in.
            </Empty>
          ) : null}
          {viz.kind === "empty" ? (
            <Empty>
              Personality traits from your logged moments will shape this map.
              Keep journaling — each entry adds to the picture.
            </Empty>
          ) : null}
          {hasData && axes < 2 ? (
            <SingleTrait>
              <SingleLabel>{displayedTraits[0].label}</SingleLabel>
              <SingleMeta>
                {displayedTraits[0].count}× · strongest signal
                {viz.kind === "analytics"
                  ? " — add more trait links to unlock the full map."
                  : " so far — log again to unlock the full map."}
              </SingleMeta>
            </SingleTrait>
          ) : null}
          {hasData && axes >= 2 ? (
            <svg
              width={chartPx}
              height={chartPx}
              viewBox="0 0 260 260"
              style={{ maxWidth: "100%", height: "auto" }}
              aria-hidden
            >
              {LEVELS.map((lvl) => (
                <circle
                  key={lvl}
                  cx={CX}
                  cy={CY}
                  r={R_MAX * lvl}
                  fill="none"
                  stroke="hsl(var(--border) / 0.55)"
                  strokeWidth="1"
                />
              ))}
              {angles.map((ang, i) => {
                const { x, y } = polar(ang, R_MAX);
                return (
                  <line
                    key={`axis-${displayedTraits[i]?.id ?? i}`}
                    x1={CX}
                    y1={CY}
                    x2={x}
                    y2={y}
                    stroke="hsl(var(--border) / 0.45)"
                    strokeWidth="1"
                  />
                );
              })}
              <polygon
                points={polyPoints}
                fill="hsl(var(--primary) / 0.12)"
                stroke="hsl(var(--primary))"
                strokeWidth="1.5"
                strokeLinejoin="round"
              />
              {angles.map((ang, i) => {
                const t = displayedTraits[i];
                const r = R_MAX * (t?.normalizedScore ?? 0);
                const { x, y } = polar(ang, r);
                return (
                  <circle
                    key={t?.id ?? i}
                    cx={x}
                    cy={y}
                    r="4.5"
                    fill={fillForTrait(t)}
                    stroke="hsl(var(--background))"
                    strokeWidth="1.5"
                  />
                );
              })}
              {angles.map((ang, i) => {
                const t = displayedTraits[i];
                const { x, y } = polar(ang, R_MAX + 18);
                const short =
                  String(t?.label ?? "").length > 14
                    ? `${String(t?.label).slice(0, 12)}…`
                    : t?.label;
                return (
                  <text
                    key={`l-${t?.id ?? i}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="hsl(var(--muted-foreground))"
                    fontSize="10"
                    fontWeight="600"
                    fontFamily="var(--font-sans), sans-serif"
                  >
                    {short}
                  </text>
                );
              })}
            </svg>
          ) : null}
          {hasData && axes >= 2 ? (
            <Legend>
              {displayedTraits.map((t) => (
                <LegendItem key={t.id}>
                  <Dot $fill={fillForTrait(t)} />
                  {t.label}
                </LegendItem>
              ))}
            </Legend>
          ) : null}
          {hasData && hiddenTraitsWhenCollapsed > 0 && !radarExpanded ? (
            <ExpandToggle
              type="button"
              onClick={() => setRadarExpanded(true)}
              aria-expanded={radarExpanded}
            >
              +{hiddenTraitsWhenCollapsed} more{" "}
              {hiddenTraitsWhenCollapsed === 1 ? "trait" : "traits"} — show all
            </ExpandToggle>
          ) : null}
          {hasData && radarExpanded && hiddenTraitsWhenCollapsed > 0 ? (
            <ExpandToggle
              type="button"
              onClick={() => setRadarExpanded(false)}
              aria-expanded={radarExpanded}
            >
              Show fewer traits
            </ExpandToggle>
          ) : null}
        </ChartWrap>
      </Card>
    </Wrap>
  );
}
