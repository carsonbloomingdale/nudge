import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

export const fetchSuggestion = async (taskHistory) => {
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };

  const response = await axios.post(
    `${API_BASE_URL}/api/suggestions`,
    {
      taskHistory: taskHistory ?? [],
    },
    config,
  );

  return response.data?.suggestion;
};

export default fetchSuggestion;
