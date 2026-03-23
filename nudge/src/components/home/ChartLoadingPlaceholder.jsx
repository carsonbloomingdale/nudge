import styled, { keyframes } from "styled-components";

const shimmer = keyframes`
  0% {
    background-position: 100% 0;
  }
  100% {
    background-position: -100% 0;
  }
`;

const Shell = styled.div`
  width: 100%;
  min-height: ${(p) => p.$minHeight ?? "12rem"};
  border-radius: 0.65rem;
  background: linear-gradient(
    90deg,
    hsl(var(--muted) / 0.35) 0%,
    hsl(var(--primary) / 0.12) 45%,
    hsl(var(--muted) / 0.35) 90%
  );
  background-size: 220% 100%;
  animation: ${shimmer} 1.4s ease-in-out infinite;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: hsl(var(--muted) / 0.25);
  }
`;

const Label = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
`;

/**
 * @param {{ minHeight?: string, label?: string }} props
 */
export default function ChartLoadingPlaceholder({
  minHeight = "12rem",
  label = "Loading chart…",
}) {
  return (
    <Shell $minHeight={minHeight} role="status" aria-live="polite" aria-busy="true">
      <Label>{label}</Label>
    </Shell>
  );
}
