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
  fetchPinnedTraits,
  pinTrait,
  unpinTrait,
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

const NUDGE_PROMPTS = [
  "What would feel like a gentle nudge right now?",
  "What is one small step I can take today?",
  "Where should I place my energy next?",
  "What would future me thank me for today?",
];

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
  const [nudgePromptIndex, setNudgePromptIndex] = useState(
    () => new Date().getDate() % NUDGE_PROMPTS.length,
  );

  const reloadFeeds = useCallback(async () => {
    setTraitsChartReady(false);
    refreshStreak();
    const [tasksOutcome, journalsOutcome, chartOutcome, pinnedOutcome] =
      await Promise.allSettled([
      fetchAuthenticatedTasks(),
      fetchJournals(),
      fetchPersonalityTraitsChart(),
      fetchPinnedTraits(),
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
    setTraitsChartReady(true);
  }, [refreshStreak]);

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
      />

      <MobileStack>
        <MobileWriteHint>
          Tap the{" "}
          <strong style={{ color: "hsl(var(--primary))" }}>Write</strong>{" "}
          button below to capture your day — or open{" "}
          <InlineLink to="/app/identity">Identity</InlineLink> and{" "}
          <InlineLink to="/app/traits">Traits</InlineLink> from the tabs.
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
          <ActiveGoalsPanel />
        </DesktopRight>
      </DesktopMain>
    </PullToRefresh>
  );
}
