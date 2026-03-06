import axios from "axios";
import moment from "moment";
import saveUserData from "./saveUserData";

const createPrompt = (task, cookies) => {
  return `
    You are my personal assistant, I am telling you about a task I did today.
    I want you to record data of the following, based off the task, my previous history of tasks and things you can assume about the task. Label(Un-serialized name of task) , Sentiment (Unprepared, Upset, Excited), Category (Work, School, Relaxation), Personality Trait (Creative, Innovative), Task Time of Day (Morning, Evening), Task Amount of Time (30 minutes, 5 minutes), Task Day of Week (Weekdays, Monday, Sundays), Context
    
    I want you to output into the following json and only respond with the JSON nothing else
    Example Response: {
        "sentiment": "nervous",
        "category": "Work",
        "label": "Presenting slides for my project",
        "personality_traits": ["hardworking", "self-conscious"],
        "time_of_day": "Afternoon",
        "amount_of_time": "30 minutes",
        "day_of_week": "Weekdays",
        "context": "This task shows you are hard-working because presenting goes above and beyond your job role."
    }


    My Past Task History: [${cookies}]

    The task I am about to do: ${task}
    Current time ${moment().format("LLL")}
    `;
};

export const fetchTaskData = async (didToday, cookies, userId) => {
  if (!didToday) {
    return;
  }

  const config = {
    headers: {
      Authorization: "Bearer " + process.env.REACT_APP_GPT_API_KEY,
      "Content-Type": "application/json",
      "OpenAI-Project": "proj_IH6HeTzJuYWc0JtxZOGCAXuP",
    },
  };

  const response = await axios.post(
    `https://api.openai.com/v1/chat/completions`,
    {
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: createPrompt(didToday, cookies) }],
    },
    config,
  );
  const responseFromGPT = response.data?.choices[0]?.message?.content;
  let parsedResponse = {};
  try {
    parsedResponse = JSON.parse(responseFromGPT);
  } catch (e) {
    console.log(e);
  }
  await saveUserData(userId, parsedResponse);
  console.log(parsedResponse);

  return parsedResponse;
};

export default fetchTaskData;
