import styled from "styled-components";

const Bar = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 1rem;
  margin-top: 0.25rem;
  padding: 0.25rem;
  border-radius: 0.65rem;
  background: hsl(var(--muted) / 0.45);
  border: 1px solid hsl(var(--border) / 0.4);
`;

const Btn = styled.button`
  flex: 1;
  min-height: 2.5rem;
  padding: 0.4rem 0.5rem;
  border: none;
  border-radius: 0.5rem;
  font-family: var(--font-sans), sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 200ms ease, color 200ms ease, box-shadow 200ms ease;

  ${(p) =>
    p.$active
      ? `
    background: hsl(var(--card));
    color: hsl(var(--foreground));
    box-shadow: 0 1px 3px hsl(var(--foreground) / 0.08);
  `
      : `
    background: transparent;
    color: hsl(var(--muted-foreground));
  `}

  &:hover {
    color: hsl(var(--foreground));
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 2px;
  }
`;

/**
 * Mobile: switch between identity radar and trait growth (same data as desktop sidebar).
 * @param {{ mode: 'identity' | 'growth', onModeChange: (m: 'identity' | 'growth') => void }} props
 */
export default function PersonalityChartsToggle({ mode, onModeChange }) {
  return (
    <Bar role="tablist" aria-label="Personality charts">
      <Btn
        type="button"
        role="tab"
        aria-selected={mode === "identity"}
        $active={mode === "identity"}
        onClick={() => onModeChange("identity")}
      >
        Identity map
      </Btn>
      <Btn
        type="button"
        role="tab"
        aria-selected={mode === "growth"}
        $active={mode === "growth"}
        onClick={() => onModeChange("growth")}
      >
        Trait growth
      </Btn>
    </Bar>
  );
}
