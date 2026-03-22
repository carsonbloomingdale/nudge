import { useState, useCallback, useEffect, useMemo } from "react";
import debounce from "debounce";
import styled from "styled-components";
import { Link } from "react-router-dom";
import fetchTaskData from "../api/fetchTaskData";
import fetchSuggestion from "../api/fetchSuggestion";
import { fetchAuthenticatedTasks } from "../api/taskApi";
import WelcomeSection from "../components/home/WelcomeSection";
import StatsRow from "../components/home/StatsRow";
import ReflectionFeed from "../components/home/ReflectionFeed";
import DesktopPromptCard from "../components/home/DesktopPromptCard";
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

  useEffect(() => {
    if (submittedDid && taskList && currentSubmitted !== submittedDid) {
      setTaskList([...taskList, { label: submittedDid }]);
      setCurrentSubmitted(submittedDid);
    }
  }, [submittedDid, taskList, currentSubmitted]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
  }, []);

  useEffect(() => {
    refreshStreak();
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
    <>
      <WelcomeSection />
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
          <IdentityRadar />
          <TraitGrowthPanel />
          <ActiveGoalsPanel />
        </DesktopRight>
      </DesktopMain>
    </>
  );
}
