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

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
`;

const GoalItem = styled.li`
  animation: ${fadeUp} 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  animation-delay: ${(p) => p.$delay}ms;
  opacity: 0;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 1;
  }
`;

const GoalLink = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem 1.1rem;
  border-radius: var(--radius);
  background: hsl(var(--card) / 0.8);
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  transition: box-shadow 300ms ease;
  cursor: default;

  &:hover {
    box-shadow: 0 4px 14px hsl(var(--foreground) / 0.08);
  }
`;

const GoalText = styled.span`
  font-size: 15px;
  line-height: 1.45;
  color: hsl(var(--foreground));
`;

const Arrow = styled.span`
  flex-shrink: 0;
  font-size: 1.15rem;
  line-height: 1;
  color: hsl(var(--primary));
  opacity: 0;
  transform: translateX(-4px);
  transition: opacity 200ms ease, transform 200ms ease;

  ${GoalLink}:hover & {
    opacity: 1;
    transform: translateX(0);
  }

  @media (prefers-reduced-motion: reduce) {
    opacity: 0.5;
    transform: none;
  }
`;

export const GOALS = [
  "Name one kind thing you did for your future self this week.",
  "Block 20 minutes for unstructured play or curiosity.",
  "Tell someone you appreciate them — out loud or in writing.",
  "Move your body in a way that feels good, not productive.",
  "Clear one small pocket of clutter that drains you.",
];

const PreviewList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`;

const PreviewLi = styled.li`
  font-size: 0.8125rem;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
  padding-left: 0.65rem;
  border-left: 2px solid hsl(var(--primary) / 0.35);
`;

/** Compact lines for book cover (desktop home only). */
export function GoalsPreview() {
  return (
    <PreviewList>
      {GOALS.slice(0, 2).map((text) => (
        <PreviewLi key={text}>{text}</PreviewLi>
      ))}
      <PreviewLi
        style={{
          borderLeftColor: "hsl(var(--border))",
          color: "hsl(var(--muted-foreground))",
        }}
      >
        +{GOALS.length - 2} more inside…
      </PreviewLi>
    </PreviewList>
  );
}

export function GoalsContent() {
  return (
    <Wrap>
      <header className="animate-fade-up stagger-0">
        <Title>Goals</Title>
        <Lead>
          Soft nudges you can revisit — tap nothing to complete; this is a
          space to dream in short sentences.
        </Lead>
      </header>
      <List>
        {GOALS.map((text, i) => (
          <GoalItem key={text} $delay={80 + i * 100}>
            <GoalLink>
              <GoalText>{text}</GoalText>
              <Arrow aria-hidden>→</Arrow>
            </GoalLink>
          </GoalItem>
        ))}
      </List>
    </Wrap>
  );
}
