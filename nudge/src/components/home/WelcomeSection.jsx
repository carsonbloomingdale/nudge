import styled from "styled-components";
import { useAuth } from "../../auth/AuthContext";
import { displayWelcomeName } from "../../utils/userDisplay";

const LG = "1024px";

const Section = styled.section`
  margin-bottom: 2rem;
  min-height: 4.5rem;
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
`;

const TextBlock = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h1`
  margin: 0;
  font-family: var(--font-display), serif;
  font-size: 1.875rem;
  line-height: 1.12;
  font-weight: 400;
  text-wrap: balance;
  color: hsl(var(--foreground));

  @media (min-width: ${LG}) {
    font-size: 2.25rem;
  }
`;

const Sub = styled.p`
  margin: 0.5rem 0 0;
  font-family: var(--font-sans), sans-serif;
  font-size: 1.125rem;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
  text-wrap: pretty;
  max-width: 42rem;
`;

const RefreshBtn = styled.button`
  flex-shrink: 0;
  display: none;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.15rem;
  padding: 0.45rem 0.75rem;
  border-radius: 0.5rem;
  border: 1px solid hsl(var(--border) / 0.55);
  background: hsl(var(--card) / 0.85);
  font-family: var(--font-sans), sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  cursor: pointer;
  transition: box-shadow 200ms ease, transform 200ms ease;

  @media (min-width: ${LG}) {
    display: inline-flex;
  }

  &:hover:not(:disabled) {
    box-shadow: 0 2px 10px hsl(var(--foreground) / 0.06);
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 2px;
  }
`;

function RefreshIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

export default function WelcomeSection({
  onRefresh,
  refreshing = false,
}) {
  const { user } = useAuth();
  const welcomeName = displayWelcomeName(user);
  const titleText = welcomeName
    ? `Welcome back, ${welcomeName}`
    : "Welcome back";

  return (
    <Section className="animate-fade-up stagger-0" aria-labelledby="home-welcome-title">
      <TopRow>
        <TextBlock>
          <Title id="home-welcome-title">{titleText}</Title>
          <Sub>
            A quiet corner to notice what you did — one line at a time, no
            pressure to perform.
          </Sub>
        </TextBlock>
        {onRefresh ? (
          <RefreshBtn
            type="button"
            onClick={() => void onRefresh()}
            disabled={refreshing}
            aria-label={refreshing ? "Refreshing data" : "Refresh data from server"}
          >
            <RefreshIcon />
            {refreshing ? "Refreshing…" : "Refresh"}
          </RefreshBtn>
        ) : null}
      </TopRow>
    </Section>
  );
}
