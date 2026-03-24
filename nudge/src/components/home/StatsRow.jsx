import styled from "styled-components";

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.45rem;
  margin-bottom: 1rem;

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin-bottom: 2rem;
  }
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-bottom: 0.55rem;
`;

const ToggleMapBtn = styled.button`
  border: 1px solid hsl(var(--primary) / 0.4);
  background: linear-gradient(
    180deg,
    hsl(var(--primary) / 0.2) 0%,
    hsl(var(--primary) / 0.1) 100%
  );
  color: hsl(var(--foreground));
  border-radius: 999px;
  padding: 0.28rem 0.7rem;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  cursor: pointer;
  box-shadow: 0 2px 8px hsl(var(--primary) / 0.2);
  transition: transform 150ms ease, box-shadow 180ms ease, background-color 180ms ease;

  &:hover {
    box-shadow: 0 4px 12px hsl(var(--primary) / 0.24);
    background: linear-gradient(
      180deg,
      hsl(var(--primary) / 0.26) 0%,
      hsl(var(--primary) / 0.14) 100%
    );
  }

  &:active {
    transform: scale(0.98);
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 2px;
  }
`;

const Card = styled.div`
  border-radius: 0.75rem;
  padding: 0.6rem 0.5rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  min-height: 0;

  @media (min-width: 640px) {
    padding: 1rem;
    min-height: 4.5rem;
  }
`;

const IconRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-bottom: 0.2rem;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: hsl(var(--muted-foreground));

  @media (min-width: 640px) {
    margin-bottom: 0.35rem;
    font-size: 0.75rem;
  }
`;

const Value = styled.div`
  font-family: var(--font-display), serif;
  font-size: 1.12rem;
  line-height: 1.1;
  font-weight: 400;
  color: hsl(var(--foreground));
  font-variant-numeric: tabular-nums;

  @media (min-width: 640px) {
    font-size: 1.5rem;
  }
`;

function IconFlame() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3s3 4 3 8a3 3 0 1 1-6 0c0-4 3-8 3-8Z"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconList() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

function IconCalendar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.75" />
      <path d="M16 3v4M8 3v4M3 11h18" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export default function StatsRow({
  streakCount,
  totalMoments,
  weekSlice,
  mapOpen = false,
  onToggleMap,
}) {
  return (
    <>
      <Controls className="animate-fade-up stagger-100">
        <ToggleMapBtn type="button" onClick={() => onToggleMap?.()}>
          {mapOpen ? "Hide map" : "Show map"} ✦
        </ToggleMapBtn>
      </Controls>
      <Grid className="animate-fade-up stagger-100" aria-label="Summary stats">
      <Card>
        <IconRow>
          <IconFlame />
          Streak
        </IconRow>
        <Value className="tabular-nums">{streakCount}</Value>
      </Card>
      <Card>
        <IconRow>
          <IconList />
          Logged
        </IconRow>
        <Value className="tabular-nums">{totalMoments}</Value>
      </Card>
      <Card>
        <IconRow>
          <IconCalendar />
          This week
        </IconRow>
        <Value className="tabular-nums">{weekSlice}</Value>
      </Card>
      </Grid>
    </>
  );
}
