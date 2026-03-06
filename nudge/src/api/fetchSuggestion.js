import axios from "axios";
import moment from "moment";

const createPrompt = (taskHistory) => {
  return `
    You are my personal assistant, you have a record of my past tasks, based off that, and the time of day reccomend me something to do that fits with my personality traits, and based on past moods, determine the ideal task based on length of task

    I want you to output into the following json and only respond with the JSON nothing else
    Example Response: {
        "reccomendedTask": "I reccomend you go for a walk."
        "context": "You were working on programming recently late at night which can be a lot of sitting down"
    }

    My Past Task History: [${JSON.stringify(taskHistory.map((item) => ({ ...item, user_id: undefined })))}]

    Current time: ${moment().format("LLL")}
    `;
};

export const fetchSuggestion = async (taskHistory) => {
  const config = {
    headers: {
      Authorization: "Bearer " + process.env.REACT_APP_GPT_API_KEY,
      "Content-Type": "application/json",
      "OpenAI-Project": "proj_IH6HeTzJuYWc0JtxZOGCAXuP",
    },
  };

  console.log(config);

  return await axios.post(
    `https://api.openai.com/v1/chat/completions`,
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: createPrompt(taskHistory) }],
    },
    config,
  );
};

export default fetchSuggestion;
