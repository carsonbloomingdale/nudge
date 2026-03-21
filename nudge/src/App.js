import { useState, useCallback, useEffect } from "react";
import "./App.css";
import fetchTaskData from "./api/fetchTaskData";
import fetchSuggestion from "./api/fetchSuggestion";
import Suggestion from "./components/Suggestion";
import styled from "styled-components";
import debounce from "debounce";
import TaskList from "./components/TaskList";
import fetchTasks, { fetchTasksById } from "./api/fetchTasks";

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

function App() {
  const [didToday, setDidToday] = useState();
  const [submittedDid, setSubmittedDid] = useState();
  const [suggestion, setSuggestion] = useState();
  const [taskList, setTaskList] = useState();
  const [currentSubmitted, setCurrentSubmitted] = useState();
  const [userId, setUserId] = useState("");
  const [userName, setUserName] = useState("");
  const [draftUserName, setDraftUserName] = useState("");

  const handleSetTaskList = useCallback(
    (userData) => {
      const responseTaskList = userData.data.person_tasks;
      setTaskList(responseTaskList);
      setUserId(userData.data.user_id);
      localStorage.setItem("nudge_user_id", userData.data.user_id);
    },
    [setTaskList],
  );

  useEffect(() => {
    if (submittedDid && taskList && currentSubmitted !== submittedDid) {
      setTaskList([...taskList, { label: submittedDid }]);
      setCurrentSubmitted(submittedDid);
    }
    if (!userId) {
      const localUserId = localStorage.getItem("nudge_user_id");
      if (localUserId) {
        setUserId(localUserId);
      }
    }
    if (!taskList && userId) {
      fetchTasksById(userId).then(handleSetTaskList);
    }

    if (!taskList && userName) {
      fetchTasks(userName).then(handleSetTaskList);
    }
  }, [submittedDid, taskList, currentSubmitted, userName, userId]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setSubmittedDid(didToday);
      await fetchTaskData(didToday, taskList, userId);

      setDidToday();
    },
    [setSubmittedDid, didToday, taskList],
  );

  const handleUserFetchSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setUserName(draftUserName);
    },
    [draftUserName],
  );

  const handleGetSuggestion = useCallback(async () => {
    const suggestionData = await fetchSuggestion(taskList);
    if (!suggestionData) {
      return;
    }
    setSuggestion(suggestionData);
  }, [setSuggestion, taskList]);

  const handleChangeInput = useCallback(
    debounce(({ target: { value } }) => {
      setDidToday(value);
    }, 200),
    [setDidToday],
  );

  const handleChangeUserInput = useCallback(
    debounce(({ target: { value } }) => {
      setDraftUserName(value);
    }, 100),
    [setDraftUserName],
  );

  return (
    <div className="App">
      {userId && <TaskList taskList={taskList} submittedDid={submittedDid} />}
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
        ) : (
          <StyledMain>
            <StyledHeader>Username</StyledHeader>
            <StyledForm onSubmit={handleUserFetchSubmit}>
              <StyledInput
                key="userName"
                name="userName"
                onChange={handleChangeUserInput}
              />
              <StyledSubmitBtn type="submit">Submit</StyledSubmitBtn>
            </StyledForm>
          </StyledMain>
        )}
      </header>
    </div>
  );
}

export default App;
