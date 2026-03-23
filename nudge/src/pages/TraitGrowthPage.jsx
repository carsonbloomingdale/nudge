import { useCallback, useEffect, useState } from "react";
import TraitGrowthPanel from "../components/home/TraitGrowthPanel";
import {
  fetchPersonalityTraitsChart,
  fetchPinnedTraits,
  pinTrait,
  unpinTrait,
} from "../api/analyticsApi";
import { fetchAuthenticatedTasks } from "../api/taskApi";

export default function TraitGrowthPage() {
  const [tasks, setTasks] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsFailed, setAnalyticsFailed] = useState(false);
  const [pinnedTraits, setPinnedTraits] = useState([]);
  const [pinBusyLabel, setPinBusyLabel] = useState(null);

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

  return (
    <TraitGrowthPanel
      tasks={tasks}
      analytics={analytics}
      analyticsLoading={analyticsLoading}
      analyticsFailed={analyticsFailed}
      pinnedTraitLabels={pinnedTraits.map((x) => x.label)}
      pinBusyLabel={pinBusyLabel}
      onTogglePinTrait={togglePinnedTrait}
    />
  );
}
