import styled from "styled-components";
import { TRAIT_DEFS } from "./traitUtils";

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
  max-width: 240px;
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
  background: hsl(var(${(p) => p.$var}));
  flex-shrink: 0;
`;

/** Illustrative scores until API provides dimensions (0–1 per axis). */
const MOCK_SCORES = [0.72, 0.82, 0.56, 0.68, 0.64, 0.58];

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

export default function IdentityRadar() {
  const n = TRAIT_DEFS.length;
  const angles = Array.from({ length: n }, (_, i) => -Math.PI / 2 + (i * 2 * Math.PI) / n);

  const polyPoints = angles
    .map((ang, i) => {
      const r = R_MAX * MOCK_SCORES[i];
      const { x, y } = polar(ang, r);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <Wrap className="animate-fade-up stagger-300">
      <Title>Your identity map</Title>
      <Card>
        <ChartWrap>
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
                  key={`axis-${TRAIT_DEFS[i].id}`}
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
              const r = R_MAX * MOCK_SCORES[i];
              const { x, y } = polar(ang, r);
              return (
                <circle
                  key={TRAIT_DEFS[i].id}
                  cx={x}
                  cy={y}
                  r="4.5"
                  fill={`hsl(var(${TRAIT_DEFS[i].cssVar}))`}
                  stroke="hsl(var(--background))"
                  strokeWidth="1.5"
                />
              );
            })}
            {angles.map((ang, i) => {
              const { x, y } = polar(ang, R_MAX + 18);
              return (
                <text
                  key={`l-${TRAIT_DEFS[i].id}`}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fill="hsl(var(--muted-foreground))"
                  fontSize="9"
                  fontWeight="600"
                  fontFamily="var(--font-sans), sans-serif"
                >
                  {TRAIT_DEFS[i].label}
                </text>
              );
            })}
          </svg>
          <Legend>
            {TRAIT_DEFS.map((t) => (
              <LegendItem key={t.id}>
                <Dot $var={t.cssVar} />
                {t.label}
              </LegendItem>
            ))}
          </Legend>
        </ChartWrap>
      </Card>
    </Wrap>
  );
}
