import styled, { keyframes } from "styled-components";

const LG = "1024px";

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
    filter: blur(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
`;

export const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.25rem;

  @media (min-width: ${LG}) {
    gap: 1.5rem;
  }
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;

  @media (min-width: ${LG}) {
    font-size: 2.25rem;
  }
`;

export const Lead = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));

  @media (min-width: ${LG}) {
    font-size: 15px;
  }
`;

const WheelCard = styled.section`
  border-radius: var(--radius);
  padding: 1.25rem;
  background: hsl(var(--card) / 0.8);
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  animation: ${fadeUp} 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 0ms;
  opacity: 0;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }
`;

const WheelTitle = styled.h2`
  margin: 0 0 1rem;
  font-size: 1.05rem;
`;

const WheelVisual = styled.div`
  position: relative;
  width: min(220px, 70vw);
  aspect-ratio: 1;
  margin: 0 auto 0.5rem;
  border-radius: 50%;
  background: conic-gradient(
    hsl(var(--trait-creative) / 0.55) 0deg 60deg,
    hsl(var(--trait-social) / 0.55) 60deg 120deg,
    hsl(var(--trait-analytical) / 0.55) 120deg 180deg,
    hsl(var(--trait-adventurous) / 0.55) 180deg 240deg,
    hsl(var(--trait-nurturing) / 0.55) 240deg 300deg,
    hsl(var(--trait-disciplined) / 0.55) 300deg 360deg
  );
  box-shadow: inset 0 0 0 10px hsl(var(--background) / 0.92),
    0 4px 20px hsl(var(--foreground) / 0.08);
`;

const WheelCenter = styled.div`
  position: absolute;
  inset: 28%;
  border-radius: 50%;
  background: hsl(var(--background));
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-display), serif;
  font-size: 0.85rem;
  text-align: center;
  line-height: 1.25;
  padding: 0.5rem;
  color: hsl(var(--foreground));
  box-shadow: 0 2px 12px hsl(var(--foreground) / 0.06);
`;

const BarsCard = styled.section`
  border-radius: var(--radius);
  padding: 1.25rem;
  background: hsl(var(--card) / 0.8);
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  animation: ${fadeUp} 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: 100ms;
  opacity: 0;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }
`;

const BarsTitle = styled.h2`
  margin: 0 0 1rem;
  font-size: 1.05rem;
`;

const BarRow = styled.div`
  margin-bottom: 0.85rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const BarLabel = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  font-size: 0.8125rem;
  font-weight: 600;
  margin-bottom: 0.35rem;
  color: hsl(var(--foreground));
`;

const BarPct = styled.span`
  font-variant-numeric: tabular-nums;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
`;

const BarTrack = styled.div`
  height: 8px;
  border-radius: 9999px;
  background: hsl(var(--muted) / 0.7);
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  width: ${(p) => p.$pct}%;
  border-radius: 9999px;
  background: hsl(var(${(p) => p.$traitVar}) / 0.85);
  animation: ${fadeUp} 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: ${(p) => p.$delay}ms;
  transform-origin: left center;
  opacity: 0;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }
`;

export const MOCK_BARS = [
  { label: "Creative", varName: "--trait-creative", pct: 62 },
  { label: "Social", varName: "--trait-social", pct: 78 },
  { label: "Analytical", varName: "--trait-analytical", pct: 54 },
  { label: "Adventurous", varName: "--trait-adventurous", pct: 71 },
  { label: "Nurturing", varName: "--trait-nurturing", pct: 66 },
  { label: "Disciplined", varName: "--trait-disciplined", pct: 59 },
];

const PreviewWheel = styled.div`
  position: relative;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  flex-shrink: 0;
  background: conic-gradient(
    hsl(var(--trait-creative) / 0.5) 0deg 60deg,
    hsl(var(--trait-social) / 0.5) 60deg 120deg,
    hsl(var(--trait-analytical) / 0.5) 120deg 180deg,
    hsl(var(--trait-adventurous) / 0.5) 180deg 240deg,
    hsl(var(--trait-nurturing) / 0.5) 240deg 300deg,
    hsl(var(--trait-disciplined) / 0.5) 300deg 360deg
  );
  box-shadow: inset 0 0 0 4px hsl(var(--background) / 0.9),
    0 2px 10px hsl(var(--foreground) / 0.06);
`;

const PreviewCenter = styled.div`
  position: absolute;
  inset: 30%;
  border-radius: 50%;
  background: hsl(var(--background));
`;

const PreviewBarTrack = styled.div`
  height: 5px;
  border-radius: 9999px;
  background: hsl(var(--muted) / 0.7);
  overflow: hidden;
  margin-top: 0.35rem;
`;

const PreviewBarFill = styled.div`
  height: 100%;
  width: 72%;
  border-radius: 9999px;
  background: hsl(var(--primary) / 0.75);
`;

const PreviewRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
`;

const PreviewCopy = styled.div`
  flex: 1;
  min-width: 0;
`;

const PreviewMeta = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
`;

/** Compact preview for book cover (no animation). */
export function InsightsPreview() {
  return (
    <PreviewRow>
      <PreviewWheel aria-hidden>
        <PreviewCenter />
      </PreviewWheel>
      <PreviewCopy>
        <PreviewMeta>
          Trait wheel + six-dimension balance — illustrative until live data
          lands.
        </PreviewMeta>
        <PreviewBarTrack aria-hidden>
          <PreviewBarFill />
        </PreviewBarTrack>
      </PreviewCopy>
    </PreviewRow>
  );
}

/** Full insights body (takeover or standalone). */
export function InsightsContent() {
  return (
    <Wrap>
      <header>
        <Title>Insights</Title>
        <Lead>
          A gentle snapshot of how you&apos;re showing up — illustrative for
          now; real scoring can plug in later.
        </Lead>
      </header>
      <WheelCard>
        <WheelTitle>Trait wheel</WheelTitle>
        <WheelVisual aria-hidden>
          <WheelCenter>You</WheelCenter>
        </WheelVisual>
      </WheelCard>
      <BarsCard>
        <BarsTitle>Trait balance</BarsTitle>
        {MOCK_BARS.map((b, i) => (
          <BarRow key={b.label}>
            <BarLabel>
              {b.label}
              <BarPct className="tabular-nums">{b.pct}%</BarPct>
            </BarLabel>
            <BarTrack>
              <BarFill
                $pct={b.pct}
                $traitVar={b.varName}
                $delay={120 + i * 60}
              />
            </BarTrack>
          </BarRow>
        ))}
      </BarsCard>
    </Wrap>
  );
}
