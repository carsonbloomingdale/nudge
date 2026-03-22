import styled from "styled-components";
import { GOALS } from "../books/GoalsContent";

const Wrap = styled.section``;

const Card = styled.div`
  padding: 1.25rem;
  border-radius: 0.75rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
`;

const HeadRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
`;

const Title = styled.h2`
  margin: 0;
  font-family: var(--font-display), serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.3;
  color: hsl(var(--foreground));
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const GoalRow = styled.li`
  position: relative;
`;

const GoalInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  background: hsl(var(--muted) / 0.5);
  transition: background-color 200ms ease;

  &:hover {
    background: hsl(var(--muted) / 0.75);
  }
`;

const GoalText = styled.span`
  flex: 1;
  min-width: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: hsl(var(--foreground));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Arrow = styled.span`
  flex-shrink: 0;
  font-size: 1rem;
  color: hsl(var(--primary));
  opacity: 0;
  transform: translateX(-3px);
  transition: opacity 200ms ease, transform 200ms ease;

  ${GoalInner}:hover & {
    opacity: 1;
    transform: translateX(0);
  }

  @media (prefers-reduced-motion: reduce) {
    opacity: 0.45;
    transform: none;
  }
`;

const BarTrack = styled.div`
  margin-top: 0.45rem;
  height: 6px;
  border-radius: 9999px;
  background: hsl(var(--border) / 0.7);
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  width: ${(p) => p.$pct}%;
  border-radius: 9999px;
  background: hsl(var(${(p) => p.$var}));
`;

function TargetIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="hsl(var(--primary))" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="6" stroke="hsl(var(--primary))" strokeWidth="1.5" opacity="0.6" />
      <circle cx="12" cy="12" r="2" fill="hsl(var(--primary))" opacity="0.5" />
    </svg>
  );
}

const PREVIEW = GOALS.slice(0, 3);
const TRAITS = [
  "--trait-creative",
  "--trait-nurturing",
  "--trait-adventurous",
];
const PCTS = [0.45, 0.62, 0.28];

export default function ActiveGoalsPanel() {
  return (
    <Wrap className="animate-fade-up stagger-400">
      <Card>
        <HeadRow>
          <TargetIcon />
          <Title>Active goals</Title>
        </HeadRow>
        <List>
          {PREVIEW.map((text, i) => (
            <GoalRow key={text}>
              <GoalInner className="group">
                <GoalText title={text}>{text}</GoalText>
                <Arrow aria-hidden>→</Arrow>
              </GoalInner>
              <BarTrack aria-hidden>
                <BarFill $pct={PCTS[i] * 100} $var={TRAITS[i]} />
              </BarTrack>
            </GoalRow>
          ))}
        </List>
      </Card>
    </Wrap>
  );
}
