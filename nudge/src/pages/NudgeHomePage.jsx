import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import debounce from "debounce";
import styled from "styled-components";
import { Link } from "react-router-dom";
import fetchTaskData, {
  insightSnapshotsFromEnriched,
  regenerateJournalInsights,
} from "../api/fetchTaskData";
import fetchSuggestion from "../api/fetchSuggestion";
import {
  fetchJournals,
  normalizeJournalsListPayload,
} from "../api/journalApi";
import {
  fetchPersonalityTraitsChart,
  fetchGrowthGoalSuggestions,
  fetchPinnedGrowthGoals,
  pinGrowthGoal,
  unpinGrowthGoal,
  fetchPinnedTraits,
  pinTrait,
  unpinTrait,
  fetchTraitsActivityTotals,
  fetchGrowthGoalsActivityTotals,
} from "../api/analyticsApi";
import { fetchAuthenticatedTasks } from "../api/taskApi";
import PullToRefresh from "../components/PullToRefresh";
import WelcomeSection from "../components/home/WelcomeSection";
import StatsRow from "../components/home/StatsRow";
import FeedModeToggle from "../components/home/FeedModeToggle";
import InsightsTaskFeed from "../components/home/InsightsTaskFeed";
import JournalFeed from "../components/home/JournalFeed";
import DesktopPromptCard from "../components/home/DesktopPromptCard";
import Suggestion from "../components/Suggestion";
import SuggestionLoading from "../components/SuggestionLoading";
import IdentityRadar from "../components/home/IdentityRadar";
import TraitGrowthPanel from "../components/home/TraitGrowthPanel";
import ActiveGoalsPanel from "../components/home/ActiveGoalsPanel";
import ActivityHeatmap from "../components/analytics/ActivityHeatmap";
import { useAppShell } from "../context/AppShellContext";

const LG = "1024px";

const MobileStack = styled.div`
  display: block;

  @media (min-width: ${LG}) {
    display: none;
  }
`;

const DesktopMain = styled.div`
  display: none;

  @media (min-width: ${LG}) {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1.5rem;
    align-items: start;
  }
`;

const DesktopLeft = styled.div`
  grid-column: span 3;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const DesktopRight = styled.div`
  grid-column: span 2;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const MobileWriteHint = styled.p`
  margin: 0 0 1rem;
  font-size: 14px;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
`;

const InlineLink = styled(Link)`
  color: hsl(var(--primary));
  font-weight: 600;
  text-underline-offset: 3px;
`;

const MobileSuggestCard = styled.section`
  border-radius: 0.75rem;
  padding: 1.25rem;
  margin-bottom: 1.25rem;
  background: hsl(var(--primary) / 0.06);
`;

const MobileSuggestLead = styled.p`
  margin: 0 0 0.85rem;
  font-size: 15px;
  line-height: 1.55;
  font-style: italic;
  color: hsl(var(--muted-foreground));
`;

const DesktopNudgeCard = styled.section`
  border-radius: 0.75rem;
  padding: 1.1rem 1.25rem;
  background: hsl(var(--primary) / 0.06);
  border: 1px solid hsl(var(--border) / 0.45);
`;

function journalKey(j) {
  return j.journal_id ?? j.journalId ?? j.id;
}

const MobileSuggestBtn = styled.button`
  width: 100%;
  height: 2.75rem;
  padding: 0 1.25rem;
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: 0.5rem;
  font-size: 15px;
  font-family: var(--font-sans), sans-serif;
  font-weight: 500;
  cursor: pointer;
  background: hsl(var(--card) / 0.9);
  color: hsl(var(--foreground));
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  transition: box-shadow 300ms ease, transform 200ms ease;

  &:hover {
    box-shadow: 0 4px 14px hsl(var(--foreground) / 0.08);
  }

  &:active {
    transform: scale(0.99);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
  }
`;

const TimelinePanel = styled.section`
  border-radius: 0.75rem;
  padding: 0.75rem;
  background: hsl(var(--card) / 0.72);
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
`;

const TopMapPanel = styled.section`
  margin: 0 0 1rem;
`;

const MapModeRow = styled.div`
  display: inline-flex;
  gap: 0.35rem;
  margin-bottom: 0.45rem;
`;

const MapModeBtn = styled.button`
  border: 1px solid ${(p) => (p.$active ? "hsl(var(--primary) / 0.45)" : "hsl(var(--border) / 0.7)")};
  background: ${(p) => (p.$active ? "hsl(var(--primary) / 0.14)" : "hsl(var(--card))")};
  color: ${(p) => (p.$active ? "hsl(var(--primary))" : "hsl(var(--foreground))")};
  border-radius: 999px;
  padding: 0.22rem 0.55rem;
  font-size: 0.72rem;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 180ms ease, background-color 180ms ease, color 180ms ease;

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 2px;
  }
`;

const NUDGE_PROMPTS = [
  "What would feel like a gentle nudge right now?",
  "What is one small step I can take today?",
  "Where should I place my energy next?",
  "What would future me thank me for today?",
];

const HOME_MAP_OPEN_STORAGE_KEY = "nudge_home_map_open";

export default function NudgeHomePage() {
  const {
    registerJournalSubmit,
    recordStreakOnSubmit,
    refreshStreak,
    streakCount,
    closeComposer,
  } = useAppShell();

  const mobileJournalTimelineRef = useRef(null);
  const desktopJournalTimelineRef = useRef(null);

  const scrollToJournalTimeline = useCallback(() => {
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia(`(min-width: ${LG})`).matches;
    const el = isDesktop
      ? desktopJournalTimelineRef.current
      : mobileJournalTimelineRef.current;
    requestAnimationFrame(() => {
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);
  const scrollToJournalCard = useCallback((journalId) => {
    if (journalId == null) {
      return;
    }
    const isDesktop =
      typeof window !== "undefined" &&
      window.matchMedia(`(min-width: ${LG})`).matches;
    const root = isDesktop
      ? desktopJournalTimelineRef.current
      : mobileJournalTimelineRef.current;
    const id = String(journalId);
    requestAnimationFrame(() => {
      const target = root?.querySelector?.(`[data-journal-id="${id}"]`);
      if (target instanceof HTMLElement) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        scrollToJournalTimeline();
      }
    });
  }, [scrollToJournalTimeline]);

  const [didToday, setDidToday] = useState();
  const [suggestion, setSuggestion] = useState();
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [taskList, setTaskList] = useState();
  const [journalRecords, setJournalRecords] = useState([]);
  const [feedMode, setFeedMode] = useState(
    /** @type {"journals" | "insights"} */ ("journals"),
  );
  const [desktopAttachFiles, setDesktopAttachFiles] = useState([]);
  const [promptFieldKey, setPromptFieldKey] = useState(0);
  const [listRefreshing, setListRefreshing] = useState(false);
  const [traitsChart, setTraitsChart] = useState(null);
  const [traitsChartReady, setTraitsChartReady] = useState(false);
  const [traitsChartError, setTraitsChartError] = useState(false);
  const [journalInsightSession, setJournalInsightSession] = useState(null);
  const [regeneratingInsightId, setRegeneratingInsightId] = useState(null);
  const [pinnedTraits, setPinnedTraits] = useState([]);
  const [pinBusyLabel, setPinBusyLabel] = useState(null);
  const [goalSuggestions, setGoalSuggestions] = useState([]);
  const [pinnedGoals, setPinnedGoals] = useState([]);
  const [goalDismissedIds, setGoalDismissedIds] = useState([]);
  const [goalBusyId, setGoalBusyId] = useState(null);
  const [goalsLoading, setGoalsLoading] = useState(false);
  const [goalsFailed, setGoalsFailed] = useState(false);
  const [isOffline, setIsOffline] = useState(
    typeof navigator !== "undefined" ? !navigator.onLine : false,
  );
  const [nudgePromptIndex, setNudgePromptIndex] = useState(
    () => new Date().getDate() % NUDGE_PROMPTS.length,
  );
  const [statsMode, setStatsMode] = useState("goals");
  const [topMapOpen, setTopMapOpen] = useState(() => {
    if (typeof window === "undefined") {
      return false;
    }
    try {
      return localStorage.getItem(HOME_MAP_OPEN_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [topMapGrain, setTopMapGrain] = useState("day");
  const [topMapBuckets, setTopMapBuckets] = useState([]);
  const [topMapLoading, setTopMapLoading] = useState(false);
  const [topMapError, setTopMapError] = useState(false);
  const topMapCacheRef = useRef(new Map());

  const rangeFor = useCallback((grain) => {
    const now = new Date();
    const toDate = now.toISOString().slice(0, 10);
    const days = grain === "month" ? 365 : grain === "week" ? 365 : 120;
    const from = new Date(now);
    from.setDate(now.getDate() - days);
    const fromDate = from.toISOString().slice(0, 10);
    return { fromDate, toDate };
  }, []);

  const dayRange = useMemo(() => rangeFor("day"), [rangeFor]);
  const topMapRange = useMemo(() => rangeFor(topMapGrain), [rangeFor, topMapGrain]);


  const reloadFeeds = useCallback(async () => {
    setTraitsChartReady(false);
    refreshStreak();
    setGoalsLoading(true);
    const [tasksOutcome, journalsOutcome] = await Promise.allSettled([
      fetchAuthenticatedTasks(),
      fetchJournals(),
    ]);
    if (tasksOutcome.status === "fulfilled") {
      setTaskList(tasksOutcome.value);
    } else {
      setTaskList([]);
    }
    if (journalsOutcome.status === "fulfilled") {
      setJournalRecords(normalizeJournalsListPayload(journalsOutcome.value));
    } else {
      setJournalRecords([]);
    }

    const lowerSectionResults = await Promise.allSettled([
      fetchPersonalityTraitsChart(),
      fetchPinnedTraits(),
      fetchGrowthGoalSuggestions(),
      fetchPinnedGrowthGoals(),
      fetchGrowthGoalsActivityTotals({ grain: "day", fromDate: dayRange.fromDate, toDate: dayRange.toDate }),
      fetchTraitsActivityTotals({ grain: "day", fromDate: dayRange.fromDate, toDate: dayRange.toDate }),
    ]);
    const [
      chartOutcome,
      pinnedOutcome,
      goalSuggestionsOutcome,
      pinnedGoalsOutcome,
      goalDayOutcome,
      traitDayOutcome,
    ] = lowerSectionResults;
    if (chartOutcome.status === "fulfilled") {
      setTraitsChart(chartOutcome.value);
      setTraitsChartError(false);
    } else {
      setTraitsChart(null);
      setTraitsChartError(true);
    }
    if (pinnedOutcome.status === "fulfilled") {
      setPinnedTraits(pinnedOutcome.value);
    } else {
      setPinnedTraits([]);
    }
    if (goalSuggestionsOutcome.status === "fulfilled") {
      setGoalSuggestions(goalSuggestionsOutcome.value);
      setGoalsFailed(false);
    } else {
      setGoalSuggestions([]);
      setGoalsFailed(true);
    }
    if (pinnedGoalsOutcome.status === "fulfilled") {
      setPinnedGoals(pinnedGoalsOutcome.value);
    } else {
      setPinnedGoals([]);
    }
    if (goalDayOutcome.status === "fulfilled") {
      topMapCacheRef.current.set(`goals|day|${dayRange.fromDate}|${dayRange.toDate}`, goalDayOutcome.value);
    }
    if (traitDayOutcome.status === "fulfilled") {
      topMapCacheRef.current.set(`traits|day|${dayRange.fromDate}|${dayRange.toDate}`, traitDayOutcome.value);
    }
    setGoalsLoading(false);
    setTraitsChartReady(true);
  }, [dayRange.fromDate, dayRange.toDate, refreshStreak]);

  useEffect(() => {
    if (!topMapOpen) {
      return;
    }
    const key = `${statsMode}|${topMapGrain}|${topMapRange.fromDate}|${topMapRange.toDate}`;
    const cached = topMapCacheRef.current.get(key);
    if (cached) {
      setTopMapBuckets(cached);
      setTopMapError(false);
      setTopMapLoading(false);
      return;
    }
    if ((topMapBuckets ?? []).length === 0) {
      setTopMapLoading(true);
    }
    const run = async () => {
      try {
        const data = statsMode === "goals"
          ? await fetchGrowthGoalsActivityTotals({
              grain: topMapGrain,
              fromDate: topMapRange.fromDate,
              toDate: topMapRange.toDate,
            })
          : await fetchTraitsActivityTotals({
              grain: topMapGrain,
              fromDate: topMapRange.fromDate,
              toDate: topMapRange.toDate,
            });
        topMapCacheRef.current.set(key, data);
        setTopMapBuckets(data);
        setTopMapError(false);
      } catch {
        setTopMapBuckets([]);
        setTopMapError(true);
      } finally {
        setTopMapLoading(false);
      }
    };
    run();
  }, [statsMode, topMapBuckets, topMapGrain, topMapOpen, topMapRange.fromDate, topMapRange.toDate]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      localStorage.setItem(HOME_MAP_OPEN_STORAGE_KEY, topMapOpen ? "1" : "0");
    } catch {
      // ignore storage write failures
    }
  }, [topMapOpen]);

  const pinnedTraitLookup = useMemo(() => {
    const s = new Set();
    for (const t of pinnedTraits ?? []) {
      const key = String(t?.label ?? "").trim().toLowerCase();
      if (key) {
        s.add(key);
      }
    }
    return s;
  }, [pinnedTraits]);

  const togglePinnedTrait = useCallback(
    async (label) => {
      const raw = String(label ?? "").trim();
      const key = raw.toLowerCase();
      if (!key || pinBusyLabel === key) {
        return;
      }
      const isPinned = pinnedTraitLookup.has(key);
      setPinBusyLabel(key);
      if (isPinned) {
        setPinnedTraits((prev) =>
          (prev ?? []).filter((x) => String(x?.label ?? "").trim().toLowerCase() !== key),
        );
      } else {
        setPinnedTraits((prev) => [
          ...(prev ?? []),
          { pin_id: 0, label: raw, created_at: "" },
        ]);
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
    [pinnedTraitLookup, pinBusyLabel],
  );

  const refreshFromBackend = useCallback(async () => {
    setListRefreshing(true);
    try {
      await reloadFeeds();
    } finally {
      setListRefreshing(false);
    }
  }, [reloadFeeds]);

  const handlePinGoal = useCallback(
    async (goal) => {
      const goalId = String(goal?.id ?? "").trim();
      if (!goalId || goalBusyId === goalId) {
        return;
      }
      setGoalBusyId(goalId);
      setPinnedGoals((prev) => {
        if ((prev ?? []).some((g) => String(g.id) === goalId)) {
          return prev ?? [];
        }
        return [
          ...(prev ?? []),
          { id: goalId, label: goal.label, created_at: "" },
        ];
      });
      try {
        const pinned = await pinGrowthGoal(goalId);
        if (pinned) {
          setPinnedGoals((prev) => {
            const rest = (prev ?? []).filter((g) => String(g.id) !== goalId);
            return [...rest, pinned];
          });
        } else {
          const all = await fetchPinnedGrowthGoals();
          setPinnedGoals(all);
        }
      } catch {
        const all = await fetchPinnedGrowthGoals().catch(() => []);
        setPinnedGoals(all);
      } finally {
        setGoalBusyId(null);
      }
    },
    [goalBusyId],
  );

  const handleUnpinGoal = useCallback(
    async (goal) => {
      const goalId = String(goal?.id ?? "").trim();
      if (!goalId || goalBusyId === goalId) {
        return;
      }
      setGoalBusyId(goalId);
      setPinnedGoals((prev) => (prev ?? []).filter((g) => String(g.id) !== goalId));
      try {
        const next = await unpinGrowthGoal(goalId);
        setPinnedGoals(next);
      } catch {
        const all = await fetchPinnedGrowthGoals().catch(() => []);
        setPinnedGoals(all);
      } finally {
        setGoalBusyId(null);
      }
    },
    [goalBusyId],
  );

  const handleDismissGoalSuggestion = useCallback((goal) => {
    const goalId = String(goal?.id ?? "").trim();
    if (!goalId) {
      return;
    }
    setGoalDismissedIds((prev) => {
      if ((prev ?? []).includes(goalId)) {
        return prev ?? [];
      }
      return [...(prev ?? []), goalId];
    });
  }, []);

  useEffect(() => {
    reloadFeeds();
  }, [reloadFeeds]);

  const submitEntry = useCallback(
    async (rawText, options) => {
      const trimmed = (rawText ?? "").trim();
      if (!trimmed) {
        return;
      }
      setFeedMode("journals");
      closeComposer();
      setJournalInsightSession({
        journalId: null,
        phase: "generating",
        pendingNote: trimmed,
      });
      scrollToJournalTimeline();
      let persistedJournalId = null;
      try {
        await fetchTaskData(trimmed, taskList, {
          ...options,
          onPersistComplete: (jid, enriched, note) => {
            if (jid != null && enriched != null) {
              persistedJournalId = jid;
              setJournalInsightSession({
                journalId: jid,
                phase: "complete",
                previews: insightSnapshotsFromEnriched(enriched),
                baselineNote: note,
              });
            } else {
              setJournalInsightSession(null);
            }
          },
        });
        recordStreakOnSubmit();
        try {
          await reloadFeeds();
          if (persistedJournalId != null) {
            scrollToJournalCard(persistedJournalId);
          }
        } catch {
          setTaskList((prev) => [...(prev ?? []), { label: trimmed }]);
        }
      } catch {
        setJournalInsightSession(null);
      }
    },
    [
      taskList,
      recordStreakOnSubmit,
      reloadFeeds,
      closeComposer,
      scrollToJournalTimeline,
      scrollToJournalCard,
      setFeedMode,
    ],
  );

  useEffect(() => {
    return registerJournalSubmit(submitEntry);
  }, [registerJournalSubmit, submitEntry]);

  const dismissInsightPreview = useCallback(() => {
    setJournalInsightSession(null);
  }, []);

  const regenerateInsightPreview = useCallback(
    async (journalId) => {
      const j = journalRecords.find(
        (x) => String(journalKey(x)) === String(journalId),
      );
      const note = j?.note != null ? String(j.note).trim() : "";
      if (!note) {
        return;
      }
      setRegeneratingInsightId(journalId);
      try {
        const enriched = await regenerateJournalInsights(
          journalId,
          note,
          taskList,
        );
        await reloadFeeds();
        setJournalInsightSession({
          journalId,
          phase: "complete",
          previews: insightSnapshotsFromEnriched(enriched),
          baselineNote: note,
        });
      } finally {
        setRegeneratingInsightId(null);
      }
    },
    [journalRecords, taskList, reloadFeeds],
  );

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const trimmed = (didToday ?? "").trim();
      if (!trimmed) {
        return;
      }
      const submitText = trimmed;
      setDidToday("");
      setPromptFieldKey((k) => k + 1);
      setDesktopAttachFiles([]);
      setFeedMode("journals");
      setJournalInsightSession({
        journalId: null,
        phase: "generating",
        pendingNote: submitText,
      });
      scrollToJournalTimeline();
      let persistedJournalId = null;
      try {
        await fetchTaskData(submitText, taskList, {
          files: desktopAttachFiles,
          onPersistComplete: (jid, enriched, note) => {
            if (jid != null && enriched != null) {
              persistedJournalId = jid;
              setJournalInsightSession({
                journalId: jid,
                phase: "complete",
                previews: insightSnapshotsFromEnriched(enriched),
                baselineNote: note,
              });
            } else {
              setJournalInsightSession(null);
            }
          },
        });
        recordStreakOnSubmit();
        try {
          await reloadFeeds();
          if (persistedJournalId != null) {
            scrollToJournalCard(persistedJournalId);
          }
        } catch {
          setTaskList((prev) => [...(prev ?? []), { label: submitText }]);
        }
      } catch {
        setJournalInsightSession(null);
      }
    },
    [
      didToday,
      taskList,
      desktopAttachFiles,
      recordStreakOnSubmit,
      reloadFeeds,
      scrollToJournalTimeline,
      scrollToJournalCard,
      setFeedMode,
    ],
  );

  const handleGetSuggestion = useCallback(async () => {
    setSuggestionLoading(true);
    setSuggestion(undefined);
    setNudgePromptIndex((i) => (i + 1) % NUDGE_PROMPTS.length);
    try {
      const suggestionData = await fetchSuggestion();
      if (suggestionData) {
        setSuggestion(suggestionData);
      }
    } finally {
      setSuggestionLoading(false);
    }
  }, []);

  const handleChangeInput = useMemo(
    () =>
      debounce(({ target: { value } }) => {
        setDidToday(value);
      }, 200),
    [],
  );

  const totalMoments = taskList?.length ?? 0;
  const weekSlice = Math.min(totalMoments, 7);
  const hasInsightSource = (taskList?.length ?? 0) > 0 || journalRecords.length > 0;

  return (
    <PullToRefresh
      onRefresh={refreshFromBackend}
      refreshing={listRefreshing}
      disabled={listRefreshing}
    >
      <WelcomeSection
        onRefresh={refreshFromBackend}
        refreshing={listRefreshing}
      />
      <StatsRow
        streakCount={streakCount}
        totalMoments={totalMoments}
        weekSlice={weekSlice}
        mapOpen={topMapOpen}
        onToggleMap={() => setTopMapOpen((v) => !v)}
      />
      {topMapOpen ? (
        <TopMapPanel className="animate-fade-up stagger-150">
          <MapModeRow role="tablist" aria-label="Main map source">
            <MapModeBtn
              type="button"
              role="tab"
              aria-selected={statsMode === "goals"}
              $active={statsMode === "goals"}
              onClick={() => setStatsMode("goals")}
            >
              Goals
            </MapModeBtn>
            <MapModeBtn
              type="button"
              role="tab"
              aria-selected={statsMode === "traits"}
              $active={statsMode === "traits"}
              onClick={() => setStatsMode("traits")}
            >
              Traits
            </MapModeBtn>
          </MapModeRow>
          <ActivityHeatmap
            title={statsMode === "goals" ? "Goals map" : "Traits map"}
            grain={topMapGrain}
            onGrainChange={setTopMapGrain}
            fromDate={topMapRange.fromDate}
            toDate={topMapRange.toDate}
            buckets={topMapBuckets}
            loading={topMapLoading}
            error={topMapError}
          />
        </TopMapPanel>
      ) : null}

      <MobileStack>
        <MobileWriteHint>
          Tap the{" "}
          <strong style={{ color: "hsl(var(--primary))" }}>Write</strong>{" "}
          button below to capture your day — or open{" "}
          <InlineLink to="/app/identity">Identity</InlineLink> and{" "}
          <InlineLink to="/app/traits">Traits</InlineLink> /{" "}
          <InlineLink to="/app/goals">Goals</InlineLink> from the tabs.
        </MobileWriteHint>
        <MobileSuggestCard className="animate-fade-up stagger-150">
          <MobileSuggestLead>
            Need a little nudge? I can generate one based on what you&apos;ve
            logged lately.
          </MobileSuggestLead>
          <MobileSuggestBtn
            type="button"
            onClick={handleGetSuggestion}
            disabled={suggestionLoading}
          >
            {suggestionLoading ? "Thinking…" : NUDGE_PROMPTS[nudgePromptIndex]}
          </MobileSuggestBtn>
          {suggestionLoading ? (
            <SuggestionLoading />
          ) : (
            <Suggestion
              setSuggestion={setSuggestion}
              suggestion={suggestion?.reccomendedTask}
              context={suggestion?.context}
              className="animate-fade-up stagger-100"
            />
          )}
        </MobileSuggestCard>
        <TimelinePanel ref={mobileJournalTimelineRef}>
          <FeedModeToggle mode={feedMode} onModeChange={setFeedMode} />
          {feedMode === "journals" ? (
            <JournalFeed
              journals={journalRecords}
              onRefresh={refreshFromBackend}
              title="Your log"
              insightSession={journalInsightSession}
              onDismissInsightPreview={dismissInsightPreview}
              onRegenerateInsightPreview={regenerateInsightPreview}
              insightRegeneratingId={regeneratingInsightId}
            />
          ) : (
            <InsightsTaskFeed
              tasks={taskList}
              journals={journalRecords}
              title="AI insights"
              onRefresh={refreshFromBackend}
            />
          )}
        </TimelinePanel>
      </MobileStack>

      <DesktopMain>
        <DesktopLeft>
          {hasInsightSource ? (
            <DesktopNudgeCard className="animate-fade-up stagger-150">
              <MobileSuggestLead>
                Need a little nudge? I can generate one based on what you&apos;ve
                logged lately.
              </MobileSuggestLead>
              <MobileSuggestBtn
                type="button"
                onClick={handleGetSuggestion}
                disabled={suggestionLoading}
              >
                {suggestionLoading ? "Thinking…" : NUDGE_PROMPTS[nudgePromptIndex]}
              </MobileSuggestBtn>
              {suggestionLoading ? (
                <SuggestionLoading />
              ) : (
                <Suggestion
                  setSuggestion={setSuggestion}
                  suggestion={suggestion?.reccomendedTask}
                  context={suggestion?.context}
                  className="animate-fade-up stagger-100"
                />
              )}
            </DesktopNudgeCard>
          ) : null}
          <DesktopPromptCard
            fieldKey={promptFieldKey}
            onSubmit={handleSubmit}
            onChangeDebounced={handleChangeInput}
            attachmentFiles={desktopAttachFiles}
            onAttachmentFilesChange={setDesktopAttachFiles}
          />
          <TimelinePanel ref={desktopJournalTimelineRef}>
            <FeedModeToggle mode={feedMode} onModeChange={setFeedMode} />
            {feedMode === "journals" ? (
              <JournalFeed
                journals={journalRecords}
                onRefresh={refreshFromBackend}
                title="Your log"
                insightSession={journalInsightSession}
                onDismissInsightPreview={dismissInsightPreview}
                onRegenerateInsightPreview={regenerateInsightPreview}
                insightRegeneratingId={regeneratingInsightId}
              />
            ) : (
              <InsightsTaskFeed
                tasks={taskList}
                journals={journalRecords}
                title="AI insights"
                onRefresh={refreshFromBackend}
              />
            )}
          </TimelinePanel>
        </DesktopLeft>
        <DesktopRight>
          <IdentityRadar
            tasks={taskList}
            analytics={traitsChart}
            analyticsLoading={!traitsChartReady}
            analyticsFailed={traitsChartError}
          />
          <TraitGrowthPanel
            tasks={taskList}
            analytics={traitsChart}
            analyticsLoading={!traitsChartReady}
            analyticsFailed={traitsChartError}
            pinnedTraitLabels={pinnedTraits.map((x) => x.label)}
            pinBusyLabel={pinBusyLabel}
            onTogglePinTrait={togglePinnedTrait}
          />
          <ActiveGoalsPanel
            suggestions={goalSuggestions}
            pinnedGoals={pinnedGoals}
            dismissedSuggestionIds={goalDismissedIds}
            pinLimit={5}
            busyGoalId={goalBusyId}
            loading={goalsLoading}
            error={goalsFailed}
            offline={isOffline}
            onPin={handlePinGoal}
            onUnpin={handleUnpinGoal}
            onDismiss={handleDismissGoalSuggestion}
          />
        </DesktopRight>
      </DesktopMain>
    </PullToRefresh>
  );
}
