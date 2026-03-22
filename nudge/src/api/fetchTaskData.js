import axios from "axios";
import { API_BASE_URL } from "./apiConfig";
import saveUserData from "./saveUserData";

export const fetchTaskData = async (didToday, cookies, userId) => {
  if (!didToday) {
    return;
  }

  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await axios.post(
    `${API_BASE_URL}/api/tasks/enrich`,
    {
      task: didToday,
      taskHistory: cookies ?? [],
    },
    config,
  );
  const parsedResponse = response.data?.task ?? {};
  await saveUserData(userId, parsedResponse);

  return parsedResponse;
};

export default fetchTaskData;
