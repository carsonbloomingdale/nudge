import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import TraitGrowthPanel from "../components/home/TraitGrowthPanel";
import ActivityHeatmap from "../components/analytics/ActivityHeatmap";
import ExpandableSection from "../components/ui/ExpandableSection";
import {
  fetchPersonalityTraitsChart,
  fetchPinnedTraits,
  pinTrait,
  unpinTrait,
  fetchTraitsActivityTotals,
  fetchTraitActivity,
} from "../api/analyticsApi";
import { fetchAuthenticatedTasks } from "../api/taskApi";

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
  background: ${(p) => (p.$active ? "hsl(var(--primary) / 0.14)" : "hsl(var(--background))")};
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

export default function TraitGrowthPage() {
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsFailed, setAnalyticsFailed] = useState(false);
  const [pinnedTraits, setPinnedTraits] = useState([]);
  const [pinBusyLabel, setPinBusyLabel] = useState(null);
  const [grain, setGrain] = useState("day");
  const [traitTotals, setTraitTotals] = useState([]);
  const [traitTotalsLoading, setTraitTotalsLoading] = useState(true);
  const [traitTotalsError, setTraitTotalsError] = useState(false);
  const [selectedTrait, setSelectedTrait] = useState("");
  const [selectedActivity, setSelectedActivity] = useState([]);
  const [selectedActivityLoading, setSelectedActivityLoading] = useState(false);
  const [selectedActivityError, setSelectedActivityError] = useState(false);
  const queryRange = useMemo(() => rangeFor(grain), [grain]);
  const totalsCacheRef = useRef(new Map());
  const traitCacheRef = useRef(new Map());

  const load = useCallback(async () => {
    setAnalyticsLoading(true);
    const [tasksOutcome, chartOutcome, pinnedOutcome] = await Promise.allSettled([
      fetchAuthenticatedTasks(),
      fetchPersonalityTraitsChart(),
      fetchPinnedTraits(),
    ]);
    if (tasksOutcome.status === "fulfilled") {
      setTasks(tasksOutcome.value);
    } else {
      setTasks([]);
    }
    if (chartOutcome.status === "fulfilled") {
      setAnalytics(chartOutcome.value);
      setAnalyticsFailed(false);
    } else {
      setAnalytics(null);
      setAnalyticsFailed(true);
    }
    if (pinnedOutcome.status === "fulfilled") {
      setPinnedTraits(pinnedOutcome.value);
    } else {
      setPinnedTraits([]);
    }
    setAnalyticsLoading(false);
  }, []);

  const togglePinnedTrait = useCallback(
    async (label) => {
      const raw = String(label ?? "").trim();
      const key = raw.toLowerCase();
      if (!key || pinBusyLabel === key) {
        return;
      }
      const isPinned = (pinnedTraits ?? []).some(
        (x) => String(x?.label ?? "").trim().toLowerCase() === key,
      );
      setPinBusyLabel(key);
      if (isPinned) {
        setPinnedTraits((prev) =>
          (prev ?? []).filter((x) => String(x?.label ?? "").trim().toLowerCase() !== key),
        );
      } else {
        setPinnedTraits((prev) => [...(prev ?? []), { pin_id: 0, label: raw, created_at: "" }]);
      }
      try {
        if (isPinned) {
          const next = await unpinTrait(raw);
          setPinnedTraits(next);
        } else {
          const pinned = await pinTrait(raw);
          if (pinned) {
            setPinnedTraits((prev) => {
              const rest = (prev ?? []).filter(
                (x) =>
                  String(x?.label ?? "").trim().toLowerCase() !==
                  pinned.label.trim().toLowerCase(),
              );
              return [...rest, pinned];
            });
          } else {
            const all = await fetchPinnedTraits();
            setPinnedTraits(all);
          }
        }
      } catch {
        const all = await fetchPinnedTraits().catch(() => []);
        setPinnedTraits(all);
      } finally {
        setPinBusyLabel(null);
      }
    },
    [pinnedTraits, pinBusyLabel],
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const key = `${grain}|${queryRange.fromDate}|${queryRange.toDate}`;
      const cached = totalsCacheRef.current.get(key);
      if (cached) {
        setTraitTotals(cached);
        setTraitTotalsLoading(false);
        setTraitTotalsError(false);
        return;
      }
      if (!traitTotals.length) {
        setTraitTotalsLoading(true);
      }
      try {
        const totals = await fetchTraitsActivityTotals({
          grain,
          fromDate: queryRange.fromDate,
          toDate: queryRange.toDate,
        });
        if (!cancelled) {
          totalsCacheRef.current.set(key, totals);
          setTraitTotals(totals);
          setTraitTotalsError(false);
        }
      } catch {
        if (!cancelled) {
          setTraitTotals([]);
          setTraitTotalsError(true);
        }
      } finally {
        if (!cancelled) {
          setTraitTotalsLoading(false);
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [grain, queryRange.fromDate, queryRange.toDate, traitTotals.length]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!selectedTrait) {
        setSelectedActivity([]);
        setSelectedActivityLoading(false);
        setSelectedActivityError(false);
        return;
      }
      const key = `${selectedTrait.toLowerCase()}|${grain}|${queryRange.fromDate}|${queryRange.toDate}`;
      const cached = traitCacheRef.current.get(key);
      if (cached) {
        setSelectedActivity(cached);
        setSelectedActivityLoading(false);
        setSelectedActivityError(false);
        return;
      }
      if (!selectedActivity.length) {
        setSelectedActivityLoading(true);
      }
      try {
        const activity = await fetchTraitActivity(selectedTrait, {
          grain,
          fromDate: queryRange.fromDate,
          toDate: queryRange.toDate,
        });
        if (!cancelled) {
          traitCacheRef.current.set(key, activity);
          setSelectedActivity(activity);
          setSelectedActivityError(false);
        }
      } catch {
        if (!cancelled) {
          setSelectedActivity([]);
          setSelectedActivityError(true);
        }
      } finally {
        if (!cancelled) {
          setSelectedActivityLoading(false);
        }
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedActivity.length, selectedTrait, grain, queryRange.fromDate, queryRange.toDate]);

  return (
    <Wrap>
      <TraitGrowthPanel
        tasks={tasks}
        analytics={analytics}
        analyticsLoading={analyticsLoading}
        analyticsFailed={analyticsFailed}
        pinnedTraitLabels={pinnedTraits.map((x) => x.label)}
        pinBusyLabel={pinBusyLabel}
        onTogglePinTrait={togglePinnedTrait}
      />
      <ExpandableSection title="Trends" defaultOpen>
        <RuleRow>
          <RuleBtn
            type="button"
            $active={!selectedTrait}
            onClick={() => setSelectedTrait("")}
          >
            All traits
          </RuleBtn>
          {pinnedTraits.map((item) => {
            const label = String(item.label ?? "");
            const isActive = selectedTrait.toLowerCase() === label.toLowerCase();
            return (
              <RuleBtn
                key={item.pin_id || item.label}
                type="button"
                $active={isActive}
                onClick={() => setSelectedTrait(label)}
              >
                {label}
              </RuleBtn>
            );
          })}
        </RuleRow>
        <ActivityHeatmap
          title={selectedTrait ? `Trait activity: ${selectedTrait}` : "Trait activity totals"}
          grain={grain}
          onGrainChange={setGrain}
          fromDate={queryRange.fromDate}
          toDate={queryRange.toDate}
          buckets={selectedTrait ? selectedActivity : traitTotals}
          loading={selectedTrait ? selectedActivityLoading : traitTotalsLoading}
          error={selectedTrait ? selectedActivityError : traitTotalsError}
        />
      </ExpandableSection>
    </Wrap>
  );
}
