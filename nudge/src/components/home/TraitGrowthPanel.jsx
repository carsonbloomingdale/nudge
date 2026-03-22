import styled from "styled-components";
import { FeaturePreviewBadge } from "../ui/FeaturePreviewBadge";

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
`;

const Meta = styled.span`
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--muted-foreground));
`;

const Change = styled.span`
  margin-left: 0.35rem;
  font-weight: 600;
  color: ${(p) =>
    p.$dir === "up" ? "hsl(145 40% 32%)" : "hsl(var(--primary))"};
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
  background: hsl(var(${(p) => p.$var}));
`;

/** Illustrative growth row until API lands. */
const ROWS = [
  { label: "Creative", varName: "--trait-creative", pct: 62, delta: 2 },
  { label: "Social", varName: "--trait-social", pct: 78, delta: 4 },
  { label: "Analytical", varName: "--trait-analytical", pct: 54, delta: -1 },
  { label: "Adventurous", varName: "--trait-adventurous", pct: 71, delta: 3 },
  { label: "Nurturing", varName: "--trait-nurturing", pct: 66, delta: -2 },
  { label: "Disciplined", varName: "--trait-disciplined", pct: 59, delta: 1 },
];

export default function TraitGrowthPanel() {
  return (
    <Wrap className="animate-fade-up stagger-350">
      <TitleRow>
        <Title>Trait growth</Title>
        <FeaturePreviewBadge compact />
      </TitleRow>
      <Card>
        <Stack>
          {ROWS.map((r) => (
            <Row key={r.label}>
              <RowTop>
                <Label>{r.label}</Label>
                <Meta className="tabular-nums">
                  {r.pct}%
                  <Change $dir={r.delta >= 0 ? "up" : "down"}>
                    {r.delta >= 0 ? `+${r.delta}%` : `${r.delta}%`}
                  </Change>
                </Meta>
              </RowTop>
              <Track>
                <Fill $pct={r.pct} $var={r.varName} />
              </Track>
            </Row>
          ))}
        </Stack>
      </Card>
    </Wrap>
  );
}
