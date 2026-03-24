import styled from "styled-components";

const Root = styled.details`
  border: 1px solid hsl(var(--border) / 0.6);
  background: hsl(var(--card) / 0.7);
  border-radius: 0.85rem;
  padding: 0.15rem 0.75rem 0.75rem;
`;

const Summary = styled.summary`
  list-style: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.65rem 0.15rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: hsl(var(--foreground));

  &::-webkit-details-marker {
    display: none;
  }
`;

const Chevron = styled.span`
  color: hsl(var(--muted-foreground));
  transition: transform 180ms ease;

  ${Root}[open] & {
    transform: rotate(90deg);
  }
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding-top: 0.2rem;
`;

export default function ExpandableSection({ title, defaultOpen = false, children }) {
  return (
    <Root open={defaultOpen}>
      <Summary>
        <span>{title}</span>
        <Chevron aria-hidden>›</Chevron>
      </Summary>
      <Content>{children}</Content>
    </Root>
  );
}
