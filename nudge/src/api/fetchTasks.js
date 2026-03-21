import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

const fetchTasks = async (userName) => {
  if (!userName) {
    return;
  }

  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (userName) {
    return await axios.get(
      `${API_BASE_URL}/user_by_username/${userName}`,
      config,
    );
  }
};

export const fetchTasksById = async (userId) => {
  if (!userId) {
    return;
  }

  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  if (userId) {
    return await axios.get(
      `${API_BASE_URL}/user_by_id/${userId}`,
      config,
    );
  }
};

export default fetchTasks;
