import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import ActiveGoalsPanel from "../components/home/ActiveGoalsPanel";
import ActivityHeatmap from "../components/analytics/ActivityHeatmap";
import ExpandableSection from "../components/ui/ExpandableSection";
import {
  fetchGrowthGoalSuggestions,
  fetchPinnedGrowthGoals,
  pinGrowthGoal,
  unpinGrowthGoal,
  fetchGrowthGoalsActivityTotals,
  fetchGrowthGoalActivity,
} from "../api/analyticsApi";

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const RuleRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
`;

const RuleBtn = styled.button`
  border: 1px solid ${(p) => (p.$active ? "hsl(var(--primary) / 0.45)" : "hsl(var(--border) / 0.7)")};
  background: ${(p) => (p.$active ? "hsl(var(--primary) / 0.16)" : "hsl(var(--background))")};
  color: ${(p) => (p.$active ? "hsl(var(--primary))" : "hsl(var(--foreground))")};
  border-radius: 999px;
  padding: 0.28rem 0.6rem;
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
`;

function rangeFor(grain) {
  const now = new Date();
  const toDate = now.toISOString().slice(0, 10);
  const days = grain === "month" ? 365 : grain === "week" ? 365 : 120;
  const from = new Date(now);
  from.setDate(now.getDate() - days);
  const fromDate = from.toISOString().slice(0, 10);
  return { fromDate, toDate };
}

export default function GoalsPage() {
  const [suggestions, setSuggestions] = useState([]);
  const [pinnedGoals, setPinnedGoals] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [busyGoalId, setBusyGoalId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [offline, setOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [grain, setGrain] = useState("day");
  const [activity, setActivity] = useState([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [selectedGoalLabel, setSelectedGoalLabel] = useState("");
  const activityCacheRef = useRef(new Map());

  const queryRange = useMemo(() => rangeFor(grain), [grain]);

  const load = useCallback(async () => {
    setLoading(true);
    const [suggOutcome, pinnedOutcome] = await Promise.allSettled([
      fetchGrowthGoalSuggestions(),
      fetchPinnedGrowthGoals(),
    ]);
    if (suggOutcome.status === "fulfilled") {
      setSuggestions(suggOutcome.value);
      setError(false);
    } else {
      setSuggestions([]);
      setError(true);
    }
    if (pinnedOutcome.status === "fulfilled") {
      setPinnedGoals(pinnedOutcome.value);
    } else {
      setPinnedGoals([]);
    }
    setLoading(false);
  }, []);

  const loadActivity = useCallback(async () => {
    const cacheKey = `${selectedGoalId || "__all__"}|${grain}|${queryRange.fromDate}|${queryRange.toDate}`;
    const cached = activityCacheRef.current.get(cacheKey);
    if (cached) {
      setActivity(cached);
      setActivityError(false);
      setActivityLoading(false);
      return;
    }
    if (!activity.length) {
      setActivityLoading(true);
    }
    try {
      if (selectedGoalId) {
        const points = await fetchGrowthGoalActivity(selectedGoalId, {
          grain,
          fromDate: queryRange.fromDate,
          toDate: queryRange.toDate,
        });
        activityCacheRef.current.set(cacheKey, points);
        setActivity(points);
      } else {
        const totals = await fetchGrowthGoalsActivityTotals({
          grain,
          fromDate: queryRange.fromDate,
          toDate: queryRange.toDate,
        });
        activityCacheRef.current.set(cacheKey, totals);
        setActivity(totals);
      }
      setActivityError(false);
    } catch {
      setActivity([]);
      setActivityError(true);
    } finally {
      setActivityLoading(false);
    }
  }, [activity.length, grain, queryRange.fromDate, queryRange.toDate, selectedGoalId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadActivity();
  }, [loadActivity]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  const onPin = useCallback(
    async (goal) => {
      const goalId = String(goal?.id ?? "").trim();
      if (!goalId || busyGoalId === goalId) {
        return;
      }
      setBusyGoalId(goalId);
      setPinnedGoals((prev) => [...(prev ?? []), { id: goalId, label: goal.label, created_at: "" }]);
      try {
        const next = await pinGrowthGoal(goalId);
        if (next) {
          setPinnedGoals((prev) => {
            const rest = (prev ?? []).filter((g) => String(g.id) !== goalId);
            return [...rest, next];
          });
        }
      } catch {
        setPinnedGoals((prev) =>
          (prev ?? []).filter((g) => String(g.id) !== goalId),
        );
      } finally {
        setBusyGoalId(null);
      }
    },
    [busyGoalId],
  );

  const onUnpin = useCallback(
    async (goal) => {
      const goalId = String(goal?.id ?? "").trim();
      if (!goalId || busyGoalId === goalId) {
        return;
      }
      setBusyGoalId(goalId);
      setPinnedGoals((prev) => (prev ?? []).filter((g) => String(g.id) !== goalId));
      try {
        const next = await unpinGrowthGoal(goalId);
        setPinnedGoals(next);
      } catch {
        const all = await fetchPinnedGrowthGoals().catch(() => []);
        setPinnedGoals(all);
      } finally {
        setBusyGoalId(null);
      }
    },
    [busyGoalId],
  );

  const onDismiss = useCallback((goal) => {
    const id = String(goal?.id ?? "").trim();
    if (!id) {
      return;
    }
    setDismissedIds((prev) => [...new Set([...(prev ?? []), id])]);
  }, []);

  return (
    <Wrap>
      <ActiveGoalsPanel
        suggestions={suggestions}
        pinnedGoals={pinnedGoals}
        dismissedSuggestionIds={dismissedIds}
        pinLimit={5}
        busyGoalId={busyGoalId}
        loading={loading}
        error={error}
        offline={offline}
        onPin={onPin}
        onUnpin={onUnpin}
        onDismiss={onDismiss}
      />
      <ExpandableSection title="Trends" defaultOpen>
        <RuleRow>
          <RuleBtn
            type="button"
            $active={!selectedGoalId}
            onClick={() => {
              setSelectedGoalId("");
              setSelectedGoalLabel("");
            }}
          >
            All goals
          </RuleBtn>
          {pinnedGoals.map((goal) => (
            <RuleBtn
              key={goal.id}
              type="button"
              $active={selectedGoalId === goal.id}
              onClick={() => {
                setSelectedGoalId(goal.id);
                setSelectedGoalLabel(goal.label);
              }}
            >
              {goal.label}
            </RuleBtn>
          ))}
        </RuleRow>
        <ActivityHeatmap
          title={selectedGoalId ? `Goal activity: ${selectedGoalLabel}` : "Growth goals activity"}
          grain={grain}
          onGrainChange={setGrain}
          fromDate={queryRange.fromDate}
          toDate={queryRange.toDate}
          buckets={activity}
          loading={activityLoading}
          error={activityError}
        />
      </ExpandableSection>
    </Wrap>
  );
}
