import { useEffect, useMemo, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";

const Wrap = styled.section``;

const Card = styled.div`
  padding: 1rem 1rem 0.8rem;
  border-radius: 0.85rem;
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border) / 0.55);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
`;

const HeadRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const Title = styled.h2`
  margin: 0;
  font-family: var(--font-display), serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.3;
  color: hsl(var(--foreground));
`;

const Context = styled.p`
  margin: -0.7rem 0 0.75rem;
  font-size: 0.78rem;
  line-height: 1.4;
  color: hsl(var(--muted-foreground));
`;

const List = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
`;

const writeIn = keyframes`
  0% {
    opacity: 0;
    transform: translateY(8px) scale(0.99);
    background: hsl(var(--primary) / 0.16);
  }
  60% {
    opacity: 1;
    transform: translateY(0) scale(1);
    background: hsl(var(--primary) / 0.1);
  }
  100% {
    background: transparent;
  }
`;

const GoalInner = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.65rem;
  padding: 0.55rem 0.1rem;
  border-bottom: 1px solid hsl(var(--border) / 0.45);
  transition: background-color 200ms ease;

  &:hover {
    background: hsl(var(--muted) / 0.35);
  }
`;

const GoalRow = styled.li`
  border-radius: 0.5rem;
  animation: ${(p) => (p.$justPinned ? writeIn : "none")} 480ms ease;
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

const Rationale = styled.p`
  margin: 0.2rem 0 0.35rem;
  padding: 0 0.1rem;
  font-size: 0.72rem;
  color: hsl(var(--muted-foreground));
`;

const PinBtn = styled.button`
  border: 1px solid hsl(var(--primary) / 0.35);
  background: hsl(var(--primary) / 0.06);
  color: hsl(var(--primary));
  border-radius: 999px;
  height: 1.5rem;
  padding: 0 0.45rem;
  font-size: 0.68rem;
  font-weight: 600;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  line-height: 1;
  font-family: var(--font-sans), sans-serif;

  &:hover:not(:disabled) {
    border-color: hsl(var(--primary) / 0.6);
    background: hsl(var(--primary) / 0.12);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const DismissBtn = styled.button`
  border: none;
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  font-size: 0.7rem;
  height: 1.65rem;
  width: 1.65rem;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: hsl(var(--foreground));
    background: hsl(var(--foreground) / 0.06);
  }
`;

const RowActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
`;

const SubTitle = styled.h3`
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: hsl(var(--foreground));
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.55rem;
`;

const Empty = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: hsl(var(--muted-foreground));
`;

const Helper = styled.p`
  margin: 0;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
`;

const TitleLeft = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
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

function PinIcon({ filled = false }) {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3l2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.8 1-6.1L3.2 9.4l6.1-.9L12 3Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M18 6 6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * @param {{
 *   suggestions?: import("../../api/analyticsApi").GrowthGoalSuggestion[],
 *   pinnedGoals?: import("../../api/analyticsApi").PinnedGrowthGoal[],
 *   dismissedSuggestionIds?: string[],
 *   pinLimit?: number,
 *   busyGoalId?: string | null,
 *   loading?: boolean,
 *   error?: boolean,
 *   offline?: boolean,
 *   onPin?: (goal: import("../../api/analyticsApi").GrowthGoalSuggestion) => void,
 *   onUnpin?: (goal: import("../../api/analyticsApi").PinnedGrowthGoal) => void,
 *   onDismiss?: (goal: import("../../api/analyticsApi").GrowthGoalSuggestion) => void,
 * }} props
 */
export default function ActiveGoalsPanel({
  suggestions = [],
  pinnedGoals = [],
  dismissedSuggestionIds = [],
  pinLimit = 5,
  busyGoalId = null,
  loading = false,
  error = false,
  offline = false,
  onPin,
  onUnpin,
  onDismiss,
}) {
  const prevPinnedIdsRef = useRef([]);
  const [justPinnedId, setJustPinnedId] = useState("");

  const dismissedLookup = useMemo(() => new Set(dismissedSuggestionIds), [dismissedSuggestionIds]);
  const pinnedLookup = useMemo(
    () => new Set((pinnedGoals ?? []).map((x) => String(x.id))),
    [pinnedGoals],
  );
  const visibleSuggestions = useMemo(
    () =>
      (suggestions ?? [])
        .filter((s) => !dismissedLookup.has(String(s.id)))
        .filter((s) => !pinnedLookup.has(String(s.id)))
        .slice(0, 5),
    [suggestions, dismissedLookup, pinnedLookup],
  );
  const pinLimitReached = pinnedGoals.length >= pinLimit;

  useEffect(() => {
    const prev = prevPinnedIdsRef.current;
    const current = (pinnedGoals ?? []).map((x) => String(x.id));
    const added = current.find((id) => !prev.includes(id));
    prevPinnedIdsRef.current = current;
    if (!added) {
      return;
    }
    setJustPinnedId(added);
    const timer = setTimeout(() => setJustPinnedId(""), 700);
    return () => clearTimeout(timer);
  }, [pinnedGoals]);

  return (
    <Wrap className="animate-fade-up stagger-400">
      <Card>
        <HeadRow>
          <Title>
            <TitleLeft>
              <TargetIcon />
              <span>Growth goals</span>
            </TitleLeft>
          </Title>
        </HeadRow>
        <Context>
          Short-term targets from recent moments. Pin what you want to practice this week.
        </Context>
        {offline ? <Helper>You are offline. Showing your pinned goals only.</Helper> : null}
        {error ? <Helper>Could not load goal suggestions right now.</Helper> : null}
        {loading ? <Helper>Loading growth goals…</Helper> : null}
        <Section>
          <SubTitle>This week&apos;s focus</SubTitle>
          {pinnedGoals.length === 0 ? (
            <Empty>No weekly focus yet. Pin a goal to keep it top of mind.</Empty>
          ) : (
            <List>
              {pinnedGoals.map((goal) => (
                <GoalRow key={goal.id} $justPinned={justPinnedId === String(goal.id)}>
                  <GoalInner>
                    <GoalText title={goal.label}>{goal.label}</GoalText>
                    <RowActions>
                      <PinBtn
                        type="button"
                        disabled={busyGoalId === goal.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          onUnpin?.(goal);
                        }}
                        aria-label={`Unpin goal ${goal.label}`}
                      >
                        <PinIcon filled />
                        Unpin
                      </PinBtn>
                    </RowActions>
                  </GoalInner>
                </GoalRow>
              ))}
            </List>
          )}
        </Section>
        <Section>
          <SubTitle>Suggested next steps</SubTitle>
          {visibleSuggestions.length === 0 ? (
            <Empty>No new suggestions right now.</Empty>
          ) : (
            <List>
              {visibleSuggestions.map((goal) => (
                <GoalRow key={goal.id}>
                  <GoalInner>
                    <GoalText title={goal.label}>{goal.label}</GoalText>
                    <RowActions>
                      <PinBtn
                        type="button"
                        disabled={pinLimitReached || busyGoalId === goal.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          onPin?.(goal);
                        }}
                        aria-label={`Pin goal ${goal.label}`}
                      >
                        <PinIcon />
                        Pin
                      </PinBtn>
                      <DismissBtn
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDismiss?.(goal);
                        }}
                        aria-label={`Dismiss suggestion ${goal.label}`}
                      >
                        <CloseIcon />
                      </DismissBtn>
                    </RowActions>
                  </GoalInner>
                  {goal.rationale ? <Rationale>{goal.rationale}</Rationale> : null}
                </GoalRow>
              ))}
            </List>
          )}
          {pinLimitReached ? <Helper>Pin limit reached ({pinLimit}). Unpin one to add another.</Helper> : null}
        </Section>
      </Card>
    </Wrap>
  );
}
