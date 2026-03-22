import { useEffect, useState } from "react";
import styled, { keyframes } from "styled-components";

const MESSAGES = [
  "Ruffling through ideas…",
  "Brewing a gentle nudge…",
  "Connecting the dots…",
  "Almost there…",
];

const bounce = keyframes`
  0%,
  80%,
  100% {
    transform: translateY(0) scale(0.75);
    opacity: 0.45;
  }
  40% {
    transform: translateY(-10px) scale(1);
    opacity: 1;
  }
`;

const wobble = keyframes`
  0%,
  100% {
    transform: rotate(-2deg);
  }
  50% {
    transform: rotate(2deg);
  }
`;

const shimmer = keyframes`
  0% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
`;

const Panel = styled.div`
  margin-top: 1.25rem;
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  background: hsl(var(--card) / 0.65);
  border: 1px dashed hsl(var(--border) / 0.65);
  text-align: center;
`;

const Message = styled.p`
  margin: 0 0 1rem;
  font-size: 15px;
  line-height: 1.5;
  color: hsl(var(--foreground));
  font-family: var(--font-display), serif;
  font-style: italic;
  min-height: 1.5em;
  transition: opacity 280ms ease;
`;

const DotsRow = styled.div`
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.45rem;
  height: 28px;
`;

const Dot = styled.span`
  display: block;
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: hsl(var(--primary));
  animation: ${bounce} 1.05s ease-in-out infinite;

  &:nth-child(1) {
    animation-delay: 0ms;
    background: hsl(var(--primary));
  }
  &:nth-child(2) {
    animation-delay: 120ms;
    background: hsl(var(--accent));
    opacity: 0.95;
  }
  &:nth-child(3) {
    animation-delay: 240ms;
    background: hsl(var(--secondary));
    filter: saturate(1.1);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    opacity: 0.88;
    transform: none;
  }
`;

const BookStack = styled.div`
  margin-top: 0.75rem;
  display: flex;
  justify-content: center;
  gap: 6px;
  animation: ${wobble} 2.8s ease-in-out infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Book = styled.span`
  display: block;
  width: 22px;
  height: 8px;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    hsl(var(--primary) / 0.35),
    hsl(var(--primary) / 0.12)
  );
  background-size: 200% 100%;
  animation: ${shimmer} 2.2s ease-in-out infinite;

  &:nth-child(2) {
    animation-delay: 0.35s;
    width: 26px;
    background: linear-gradient(
      90deg,
      hsl(var(--muted-foreground) / 0.25),
      hsl(var(--muted) / 0.5)
    );
    background-size: 200% 100%;
  }

  &:nth-child(3) {
    animation-delay: 0.7s;
    width: 20px;
    background: linear-gradient(
      90deg,
      hsl(var(--accent) / 0.45),
      hsl(var(--accent) / 0.15)
    );
    background-size: 200% 100%;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    background: hsl(var(--primary) / 0.2);
  }
`;

const Sub = styled.p`
  margin: 0.65rem 0 0;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
`;

export default function SuggestionLoading() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % MESSAGES.length);
    }, 2400);
    return () => window.clearInterval(id);
  }, []);

  return (
    <Panel
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading suggestion"
    >
      <Message key={index}>{MESSAGES[index]}</Message>
      <DotsRow aria-hidden>
        <Dot />
        <Dot />
        <Dot />
      </DotsRow>
      <BookStack aria-hidden>
        <Book />
        <Book />
        <Book />
      </BookStack>
      <Sub>Your nudge is on its way</Sub>
    </Panel>
  );
}
