import { useState, useCallback, useEffect, useMemo } from "react";
import debounce from "debounce";
import styled from "styled-components";
import fetchTaskData from "../api/fetchTaskData";
import fetchSuggestion from "../api/fetchSuggestion";
import { fetchAuthenticatedTasks } from "../api/taskApi";
import Suggestion from "../components/Suggestion";
import SuggestionLoading from "../components/SuggestionLoading";
import TaskList from "../components/TaskList";

const PageGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: repeat(5, minmax(0, 1fr));
    gap: 1.5rem;
    align-items: start;
  }
`;

const FeedColumn = styled.div`
  order: 2;

  @media (min-width: 1024px) {
    order: 0;
    grid-column: span 3;
  }
`;

const SideColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  order: 1;

  @media (min-width: 1024px) {
    order: 0;
    grid-column: span 2;
  }
`;

const PromptCard = styled.section`
  border-radius: var(--radius);
  padding: 1.5rem;
  background: hsl(var(--primary) / 0.06);
`;

const SectionTitle = styled.h1`
  margin: 0 0 1rem;
`;

const StyledForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const StyledInput = styled.input`
  flex: 1 1 12rem;
  min-width: 0;
  height: 2.75rem;
  padding: 0 1rem;
  border-radius: var(--radius);
  font-size: 15px;
  font-family: var(--font-sans), sans-serif;
  border: 1px solid hsl(var(--border) / 0.5);
  background: hsl(var(--background) / 0.6);
  color: hsl(var(--foreground));

  &::placeholder {
    color: hsl(var(--muted-foreground));
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.3);
    border-color: hsl(var(--primary) / 0.35);
  }
`;

const PrimaryBtn = styled.button`
  height: 2.75rem;
  padding: 0 1.25rem;
  border: none;
  border-radius: var(--radius);
  font-size: 15px;
  font-family: var(--font-sans), sans-serif;
  font-weight: 600;
  cursor: pointer;
  background: hsl(var(--primary));
  color: white;
  box-shadow: 0 4px 14px hsl(var(--primary) / 0.2);
  transition: box-shadow 200ms ease, transform 200ms ease;

  &:hover {
    box-shadow: 0 6px 20px hsl(var(--primary) / 0.25);
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryBtn = styled.button`
  height: 2.75rem;
  padding: 0 1.25rem;
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: var(--radius);
  font-size: 15px;
  font-family: var(--font-sans), sans-serif;
  font-weight: 500;
  cursor: pointer;
  background: hsl(var(--card) / 0.8);
  color: hsl(var(--foreground));
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  transition: box-shadow 300ms ease, transform 200ms ease;

  &:hover {
    box-shadow: 0 4px 14px hsl(var(--foreground) / 0.08);
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
  }
`;

const FeedHeading = styled.h2`
  margin: 0 0 0.75rem;
`;

export default function NudgeHomePage() {
  const [didToday, setDidToday] = useState();
  const [submittedDid, setSubmittedDid] = useState();
  const [suggestion, setSuggestion] = useState();
  const [suggestionLoading, setSuggestionLoading] = useState(false);
  const [taskList, setTaskList] = useState();
  const [currentSubmitted, setCurrentSubmitted] = useState();

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

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSubmittedDid(didToday);
      await fetchTaskData(didToday, taskList);
      setDidToday();
    },
    [didToday, taskList],
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

  return (
    <PageGrid>
      <FeedColumn>
        <div className="animate-fade-up stagger-200">
          <FeedHeading>Activity</FeedHeading>
          <TaskList taskList={taskList} />
        </div>
      </FeedColumn>
      <SideColumn>
        <PromptCard className="animate-fade-up stagger-0">
          <SectionTitle>What did you do today?</SectionTitle>
          <StyledForm onSubmit={handleSubmit}>
            <StyledInput
              key="didToday"
              name="didToday"
              onChange={handleChangeInput}
              placeholder="Describe what you accomplished…"
              aria-label="What you did today"
            />
            <PrimaryBtn type="submit">Submit</PrimaryBtn>
          </StyledForm>
          <SecondaryBtn
            type="button"
            onClick={handleGetSuggestion}
            disabled={suggestionLoading}
          >
            {suggestionLoading ? "Thinking…" : "What should I do?"}
          </SecondaryBtn>
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
        </PromptCard>
      </SideColumn>
    </PageGrid>
  );
}
