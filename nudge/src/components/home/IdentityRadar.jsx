import { useMemo } from "react";
import styled from "styled-components";
import { aggregateTraitStatsFromTasks } from "./traitUtils";

const Wrap = styled.section``;

const Title = styled.h2`
  margin: 0 0 1rem;
  font-family: var(--font-display), serif;
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.25;
  color: hsl(var(--foreground));
`;

const Card = styled.div`
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
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
`;

const LegendItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.6875rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
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

const CX = 130;
const CY = 130;
const R_MAX = 82;
const LEVELS = [0.25, 0.5, 0.75, 1];

function polar(angleRad, r) {
  return {
    x: CX + Math.cos(angleRad) * r,
    y: CY + Math.sin(angleRad) * r,
  };
}

function fillForTrait(t) {
  if (t.cssVar) {
    return `hsl(var(${t.cssVar}))`;
  }
  return `hsl(${t.hsl})`;
}

/**
 * @param {{ tasks?: unknown[] }} props
 */
export default function IdentityRadar({ tasks }) {
  const { orderedTraits, hasData } = useMemo(
    () => aggregateTraitStatsFromTasks(tasks),
    [tasks],
  );

  const radarTraits = orderedTraits;
  const axes = radarTraits.length;

  const angles = useMemo(
    () =>
      Array.from(
        { length: Math.max(axes, 1) },
        (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / axes,
      ),
    [axes],
  );

  const polyPoints = useMemo(() => {
    if (axes < 2) {
      return "";
    }
    return angles
      .map((ang, i) => {
        const r = R_MAX * (radarTraits[i]?.normalizedScore ?? 0);
        const { x, y } = polar(ang, r);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [angles, axes, radarTraits]);

  return (
    <Wrap className="animate-fade-up stagger-300">
      <Title>Your identity map</Title>
      <Card>
        <ChartWrap>
          {!hasData ? (
            <Empty>
              Personality traits from your logged moments will shape this map.
              Keep journaling — each entry adds to the picture.
            </Empty>
          ) : null}
          {hasData && axes < 2 ? (
            <SingleTrait>
              <SingleLabel>{radarTraits[0].label}</SingleLabel>
              <SingleMeta>
                {radarTraits[0].count}× · strongest signal so far — log again to
                unlock the full map.
              </SingleMeta>
            </SingleTrait>
          ) : null}
          {hasData && axes >= 2 ? (
            <svg
              width="240"
              height="240"
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
                    key={`axis-${radarTraits[i]?.id ?? i}`}
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
                const t = radarTraits[i];
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
                const t = radarTraits[i];
                const { x, y } = polar(ang, R_MAX + 18);
                return (
                  <text
                    key={`l-${t?.id ?? i}`}
                    x={x}
                    y={y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="hsl(var(--muted-foreground))"
                    fontSize="9"
                    fontWeight="600"
                    fontFamily="var(--font-sans), sans-serif"
                  >
                    {t?.label}
                  </text>
                );
              })}
            </svg>
          ) : null}
          {hasData && axes >= 2 ? (
            <Legend>
              {radarTraits.map((t) => (
                <LegendItem key={t.id}>
                  <Dot $cssVar={t.cssVar} $hsl={t.hsl} />
                  {t.label}
                </LegendItem>
              ))}
            </Legend>
          ) : null}
        </ChartWrap>
      </Card>
    </Wrap>
  );
}
