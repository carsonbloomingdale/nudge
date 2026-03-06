import axios from "axios";

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
      `https://urgent-maria-nudge-9f4b7e98.koyeb.app/user_by_username/${userName}`,
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
      `https://urgent-maria-nudge-9f4b7e98.koyeb.app/user_by_id/${userId}`,
      config,
    );
  }
};

export default fetchTasks;
