import { useState, useCallback, useEffect, useMemo } from "react";
import debounce from "debounce";
import styled from "styled-components";
import { Link } from "react-router-dom";
import fetchTaskData from "../api/fetchTaskData";
import fetchSuggestion from "../api/fetchSuggestion";
import { fetchAuthenticatedTasks } from "../api/taskApi";
import PullToRefresh from "../components/PullToRefresh";
import WelcomeSection from "../components/home/WelcomeSection";
import StatsRow from "../components/home/StatsRow";
import ReflectionFeed from "../components/home/ReflectionFeed";
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

export default function NudgeHomePage() {
  const {
    registerJournalSubmit,
    recordStreakOnSubmit,
    refreshStreak,
    streakCount,
  } = useAppShell();

  const [didToday, setDidToday] = useState();
  const [submittedDid, setSubmittedDid] = useState();
  const [suggestion, setSuggestion] = useState();
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [taskList, setTaskList] = useState();
  const [currentSubmitted, setCurrentSubmitted] = useState();
  const [promptFieldKey, setPromptFieldKey] = useState(0);
  const [listRefreshing, setListRefreshing] = useState(false);

  const refreshFromBackend = useCallback(async () => {
    setListRefreshing(true);
    try {
      refreshStreak();
      try {
        const list = await fetchAuthenticatedTasks();
        setTaskList(list);
      } catch {
        setTaskList([]);
      }
    } finally {
      setListRefreshing(false);
    }
  }, [refreshStreak]);

  useEffect(() => {
    if (submittedDid && taskList && currentSubmitted !== submittedDid) {
      setTaskList([...taskList, { label: submittedDid }]);
      setCurrentSubmitted(submittedDid);
    }
  }, [submittedDid, taskList, currentSubmitted]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      refreshStreak();
      try {
        const list = await fetchAuthenticatedTasks();
        if (!cancelled) {
          setTaskList(list);
        }
      } catch {
        if (!cancelled) {
          setTaskList([]);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshStreak]);

  const submitEntry = useCallback(
    async (rawText) => {
      const trimmed = (rawText ?? "").trim();
      if (!trimmed) {
        return;
      }
      setSubmittedDid(trimmed);
      await fetchTaskData(trimmed, taskList);
      recordStreakOnSubmit();
    },
    [taskList, recordStreakOnSubmit],
  );

  useEffect(() => {
    return registerJournalSubmit(submitEntry);
  }, [registerJournalSubmit, submitEntry]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const trimmed = (didToday ?? "").trim();
      if (!trimmed) {
        return;
      }
      setSubmittedDid(trimmed);
      await fetchTaskData(trimmed, taskList);
      recordStreakOnSubmit();
      setDidToday();
      setPromptFieldKey((k) => k + 1);
    },
    [didToday, taskList, recordStreakOnSubmit],
  );

  const handleGetSuggestion = useCallback(async () => {
    setSuggestionLoading(true);
    setSuggestion(undefined);
    try {
      const suggestionData = await fetchSuggestion(taskList);
      if (suggestionData) {
        setSuggestion(suggestionData);
      }
    } finally {
      setSuggestionLoading(false);
    }
  }, [taskList]);

  const handleChangeInput = useMemo(
    () =>
      debounce(({ target: { value } }) => {
        setDidToday(value);
      }, 200),
    [],
  );

  const totalMoments = taskList?.length ?? 0;
  const weekSlice = Math.min(totalMoments, 7);

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
          Tap the terracotta{" "}
          <strong style={{ color: "hsl(var(--primary))" }}>Write</strong>{" "}
          button below to capture your day — or open{" "}
          <InlineLink to="/app/insights">Insights</InlineLink> and{" "}
          <InlineLink to="/app/goals">Goals</InlineLink> from the tabs.
        </MobileWriteHint>
        <MobileSuggestCard className="animate-fade-up stagger-150">
          <MobileSuggestLead>
            Stuck? Ask for a gentle nudge based on what you&apos;ve logged
            lately.
          </MobileSuggestLead>
          <MobileSuggestBtn
            type="button"
            onClick={handleGetSuggestion}
            disabled={suggestionLoading}
          >
            {suggestionLoading ? "Thinking…" : "What should I do?"}
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
        <ReflectionFeed taskList={taskList} title="Recent reflections" />
      </MobileStack>

      <DesktopMain>
        <DesktopLeft>
          <DesktopPromptCard
            fieldKey={promptFieldKey}
            onSubmit={handleSubmit}
            onChangeDebounced={handleChangeInput}
            onGetSuggestion={handleGetSuggestion}
            suggestion={suggestion}
            setSuggestion={setSuggestion}
            suggestionLoading={suggestionLoading}
          />
          <ReflectionFeed taskList={taskList} title="Recent reflections" />
        </DesktopLeft>
        <DesktopRight>
          <IdentityRadar tasks={taskList} />
          <TraitGrowthPanel tasks={taskList} />
          <ActiveGoalsPanel />
        </DesktopRight>
      </DesktopMain>
    </PullToRefresh>
  );
}
