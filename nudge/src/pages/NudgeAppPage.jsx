import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import debounce from "debounce";
import { useAuth } from "../auth/AuthContext";
import fetchTaskData from "../api/fetchTaskData";
import fetchSuggestion from "../api/fetchSuggestion";
import { fetchAuthenticatedTasks } from "../api/taskApi";
import Suggestion from "../components/Suggestion";
import TaskList from "../components/TaskList";

const StyledHeader = styled.div`
  font-size: 24px;
  margin: 20px;
  z-index: 2;
  color: #133926;
  font-weight: bold;
`;

const StyledInput = styled.input`
  max-width: 60vw;
  height: 30px;
  border-radius: 15px;
  font-size: 14px;
  border: none;
  margin: 10px;
  font-size: 16px;

  font-family: "Varela Round", sans-serif;
  font-weight: 400;
  font-style: normal;
`;

const StyledSubmitBtn = styled.button`
  background-color: #133926;
  color: white;
  border: none;
  width: 60px;
  height: 30px;
  border-radius: 15px;
  transition: all 1s ease-out;

  font-family: "Varela Round", sans-serif;
  font-weight: 400;
  font-style: normal;

  &:hover {
    background-color: #1f4f37;
    cursor: pointer;
  }
`;

const StyledHelpBtn = styled.button`
  background-color: #133926;
  color: white;
  border: none;
  width: fit-content;
  padding: 0px 20px;
  height: 30px;
  font-size: 16px;
  border-radius: 15px;
  transition: all 0.3s ease-out;

  font-family: "Varela Round", sans-serif;
  font-weight: 400;
  font-style: normal;
  z-index: 2;

  &:hover {
    background-color: #1f4f37;
    cursor: pointer;
  }
`;

const StyledForm = styled.form`
  padding-bottom: 40px;
  z-index: 2;
  display: flex;
  align-items: center;
`;

const StyledMain = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: hsla(120, 100%, 100%, 0.5);
  padding: 40px;
  border-radius: 15px;
  z-index: 20000;

  @media (max-width: 750px) {
    margin: 20px;
    background-color: #74aa8de8;
  }

  @media (max-height: 750px) and (min-width: 800px) {
    margin: 20px;
    background-color: #74aa8de8;
  }
`;

const StyledCopyright = styled.div`
  position: fixed;
  bottom: 10px;
  right: 10px;
  font-size: 14px;
`;

const TopBar = styled.div`
  position: fixed;
  top: 12px;
  right: 12px;
  left: 12px;
  z-index: 30000;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  font-family: "Varela Round", sans-serif;
  font-size: 14px;
  color: #133926;
`;

const LogoutBtn = styled.button`
  background: #133926;
  color: white;
  border: none;
  padding: 8px 14px;
  border-radius: 12px;
  cursor: pointer;
  font-family: "Varela Round", sans-serif;
  font-size: 13px;

  &:hover {
    background: #1f4f37;
  }
`;

function displayName(user) {
  if (!user) {
    return null;
  }
  return user.username || user.email || null;
}

export default function NudgeAppPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [didToday, setDidToday] = useState();
  const [submittedDid, setSubmittedDid] = useState();
  const [suggestion, setSuggestion] = useState();
  const [taskList, setTaskList] = useState();
  const [currentSubmitted, setCurrentSubmitted] = useState();

  const handleLogout = useCallback(async () => {
    setSuggestion(undefined);
    setTaskList(undefined);
    setSubmittedDid(undefined);
    setCurrentSubmitted(undefined);
    setDidToday(undefined);
    await logout();
    navigate("/auth/login", { replace: true });
  }, [logout, navigate]);

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
    const suggestionData = await fetchSuggestion(taskList);
    if (!suggestionData) {
      return;
    }
    setSuggestion(suggestionData);
  }, [taskList]);

  const handleChangeInput = useMemo(
    () =>
      debounce(({ target: { value } }) => {
        setDidToday(value);
      }, 200),
    [setDidToday],
  );

  const name = displayName(user);

  return (
    <div className="App">
      <TopBar>
        {name ? (
          <span>
            Signed in as <strong>{name}</strong>
          </span>
        ) : (
          <span>Signed in</span>
        )}
        <LogoutBtn type="button" onClick={handleLogout}>
          Log out
        </LogoutBtn>
      </TopBar>
      <TaskList taskList={taskList} />
      <header className="App-header">
        <StyledMain>
          <StyledHeader>What did you do today?</StyledHeader>
          <StyledForm onSubmit={handleSubmit}>
            <StyledInput
              key="didToday"
              name="didToday"
              onChange={handleChangeInput}
            />
            <StyledSubmitBtn type="submit">Submit</StyledSubmitBtn>
          </StyledForm>

          <StyledHelpBtn type="button" onClick={handleGetSuggestion}>
            What should I do?
          </StyledHelpBtn>
          <Suggestion
            setSuggestion={setSuggestion}
            suggestion={suggestion?.reccomendedTask}
            context={suggestion?.context}
          />
        </StyledMain>
        <StyledCopyright>&copy; Carson Bloomingdale 2024</StyledCopyright>
      </header>
    </div>
  );
}
