import { useState, useCallback, useEffect, useMemo } from "react";
import axios from "axios";
import "./App.css";
import fetchTaskData from "./api/fetchTaskData";
import fetchSuggestion from "./api/fetchSuggestion";
import Suggestion from "./components/Suggestion";
import styled from "styled-components";
import debounce from "debounce";
import TaskList from "./components/TaskList";
import { loadUserByUsername, loadUserById } from "./api/fetchTasks";
import { createUser } from "./api/createUser";

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

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

/** Wider label for auth actions (Create user / Loading…) */
const StyledAuthSubmitBtn = styled(StyledSubmitBtn)`
  width: auto;
  min-width: 120px;
  padding: 0 16px;
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

const StyledMuted = styled.p`
  margin: 0 20px 16px;
  max-width: 70vw;
  text-align: center;
  color: #133926;
  opacity: 0.85;
  line-height: 1.4;
  font-size: 15px;
`;

const StyledError = styled.p`
  margin: 0 20px 12px;
  max-width: 70vw;
  text-align: center;
  color: #8b2c2c;
  font-size: 14px;
`;

const StyledSecondaryBtn = styled.button`
  background: transparent;
  color: #133926;
  border: 1px solid #133926;
  width: fit-content;
  padding: 8px 20px;
  height: auto;
  min-height: 36px;
  font-size: 15px;
  border-radius: 15px;
  margin-top: 8px;
  cursor: pointer;
  font-family: "Varela Round", sans-serif;

  &:hover {
    background: hsla(150, 30%, 95%, 0.9);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

function App() {
  const [didToday, setDidToday] = useState();
  const [submittedDid, setSubmittedDid] = useState();
  const [suggestion, setSuggestion] = useState();
  const [taskList, setTaskList] = useState();
  const [currentSubmitted, setCurrentSubmitted] = useState();
  const [userId, setUserId] = useState("");
  const [draftUserName, setDraftUserName] = useState("");
  /** `lookup` = sign in by username; `create` = username 404, offer create */
  const [authView, setAuthView] = useState("lookup");
  const [usernameToCreate, setUsernameToCreate] = useState("");
  const [authError, setAuthError] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const handleSetTaskList = useCallback((userData) => {
    const responseTaskList = userData.data.person_tasks ?? [];
    setTaskList(responseTaskList);
    setUserId(userData.data.user_id);
    localStorage.setItem("nudge_user_id", userData.data.user_id);
  }, []);

  useEffect(() => {
    if (submittedDid && taskList && currentSubmitted !== submittedDid) {
      setTaskList([...taskList, { label: submittedDid }]);
      setCurrentSubmitted(submittedDid);
    }
  }, [submittedDid, taskList, currentSubmitted]);

  useEffect(() => {
    if (userId) {
      return;
    }
    const localUserId = localStorage.getItem("nudge_user_id");
    if (localUserId) {
      setUserId(localUserId);
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || taskList !== undefined) {
      return;
    }
    let cancelled = false;
    (async () => {
      const result = await loadUserById(userId);
      if (cancelled) {
        return;
      }
      if (result.ok) {
        handleSetTaskList(result.response);
        return;
      }
      if (result.notFound) {
        localStorage.removeItem("nudge_user_id");
        setUserId("");
        setAuthError(
          "Your saved session is no longer valid. Sign in with your username.",
        );
        return;
      }
      localStorage.removeItem("nudge_user_id");
      setUserId("");
      setAuthError("Could not restore your session. Please sign in again.");
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, taskList, handleSetTaskList]);

  const handleUserFetchSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const name = draftUserName.trim();
      if (!name) {
        setAuthError("Enter a username.");
        return;
      }
      setAuthError(null);
      setIsAuthLoading(true);
      const result = await loadUserByUsername(name);
      setIsAuthLoading(false);
      if (result.ok) {
        setAuthView("lookup");
        setUsernameToCreate("");
        handleSetTaskList(result.response);
        return;
      }
      if (result.notFound) {
        setUsernameToCreate(name);
        setDraftUserName(name);
        setAuthView("create");
        return;
      }
      setAuthError("Could not look up that user. Check your connection and try again.");
    },
    [draftUserName, handleSetTaskList],
  );

  const handleCreateUserSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!usernameToCreate.trim()) {
        return;
      }
      setAuthError(null);
      setIsAuthLoading(true);
      try {
        const res = await createUser(usernameToCreate);
        handleSetTaskList(res);
        setAuthView("lookup");
        setUsernameToCreate("");
        setDraftUserName("");
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          setAuthError("That username is already taken. Try another.");
        } else {
          setAuthError("Could not create this user. Try again or pick a different name.");
        }
      } finally {
        setIsAuthLoading(false);
      }
    },
    [usernameToCreate, handleSetTaskList],
  );

  const handleBackToLookup = useCallback(() => {
    setAuthView("lookup");
    setUsernameToCreate("");
    setDraftUserName("");
    setAuthError(null);
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSubmittedDid(didToday);
      await fetchTaskData(didToday, taskList, userId);

      setDidToday();
    },
    [didToday, taskList, userId],
  );

  const handleGetSuggestion = useCallback(async () => {
    const suggestionData = await fetchSuggestion(taskList);
    if (!suggestionData) {
      return;
    }
    setSuggestion(suggestionData);
  }, [setSuggestion, taskList]);

  const handleChangeInput = useMemo(
    () =>
      debounce(({ target: { value } }) => {
        setDidToday(value);
      }, 200),
    [setDidToday],
  );

  const handleChangeUserName = useCallback((e) => {
    setDraftUserName(e.target.value);
  }, []);

  return (
    <div className="App">
      {userId && <TaskList taskList={taskList} />}
      <header className="App-header">
        {userId ? (
          <>
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

              <StyledHelpBtn onClick={handleGetSuggestion}>
                What should I do?
              </StyledHelpBtn>
              <Suggestion
                setSuggestion={setSuggestion}
                suggestion={suggestion?.reccomendedTask}
                context={suggestion?.context}
              />
            </StyledMain>
            <StyledCopyright>&copy; Carson Bloomingdale 2024</StyledCopyright>
          </>
        ) : authView === "create" ? (
          <StyledMain>
            <StyledHeader>Create account</StyledHeader>
            <StyledMuted>
              There is no user named <strong>{usernameToCreate}</strong>. Create
              this account to start logging tasks?
            </StyledMuted>
            {authError ? <StyledError>{authError}</StyledError> : null}
            <StyledForm onSubmit={handleCreateUserSubmit}>
              <StyledAuthSubmitBtn type="submit" disabled={isAuthLoading}>
                {isAuthLoading ? "Creating…" : "Create user"}
              </StyledAuthSubmitBtn>
            </StyledForm>
            <StyledSecondaryBtn
              type="button"
              disabled={isAuthLoading}
              onClick={handleBackToLookup}
            >
              Use a different username
            </StyledSecondaryBtn>
          </StyledMain>
        ) : (
          <StyledMain>
            <StyledHeader>Username</StyledHeader>
            {authError ? <StyledError>{authError}</StyledError> : null}
            <StyledForm onSubmit={handleUserFetchSubmit}>
              <StyledInput
                key="userName"
                name="userName"
                value={draftUserName}
                onChange={handleChangeUserName}
                autoComplete="username"
              />
              <StyledAuthSubmitBtn type="submit" disabled={isAuthLoading}>
                {isAuthLoading ? "Loading…" : "Submit"}
              </StyledAuthSubmitBtn>
            </StyledForm>
          </StyledMain>
        )}
      </header>
    </div>
  );
}

export default App;
