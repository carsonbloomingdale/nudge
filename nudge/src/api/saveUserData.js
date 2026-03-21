import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

/**
 * Persists enriched task fields + user_id. Call after POST /api/tasks/enrich;
 * body matches server POST /tasks/ expectations (enriched task + user_id).
 */
const saveUserData = async (userId, newTask) => {
  if (!userId) {
    return;
  }

  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  return await axios.post(
    `${API_BASE_URL}/tasks/`,
    { user_id: userId, ...newTask },
    config,
  );
};

export default saveUserData;
