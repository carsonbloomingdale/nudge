import { useMemo } from "react";
import styled from "styled-components";
import {
  aggregateTraitStatsFromTasks,
  DEFAULT_TRAIT_GROWTH_CAP,
} from "./traitUtils";

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

/**
 * @param {{ tasks?: unknown[] }} props
 */
export default function TraitGrowthPanel({ tasks }) {
  const { orderedTraits, hasData, maxCount, totalTraitMentions } = useMemo(
    () => aggregateTraitStatsFromTasks(tasks, DEFAULT_TRAIT_GROWTH_CAP),
    [tasks],
  );

  return (
    <Wrap className="animate-fade-up stagger-350">
      <Title>Trait growth</Title>
      <Card>
        {!hasData ? (
          <Empty>
            As you log moments, we tally how often each personality trait shows
            up — bars grow with repetition.
          </Empty>
        ) : (
          <Stack>
            {orderedTraits.map((t) => {
              const pct =
                maxCount > 0 ? Math.round((t.count / maxCount) * 100) : 0;
              const share =
                totalTraitMentions > 0
                  ? Math.round((t.count / totalTraitMentions) * 100)
                  : 0;
              return (
                <Row key={t.id}>
                  <RowTop>
                    <Label>{t.label}</Label>
                    <Meta className="tabular-nums">
                      {t.count}× · {share}% of traits
                    </Meta>
                  </RowTop>
                  <Track>
                    <Fill $pct={pct} $cssVar={t.cssVar} $hsl={t.hsl} />
                  </Track>
                </Row>
              );
            })}
          </Stack>
        )}
      </Card>
    </Wrap>
  );
}
