import axios from "axios";

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
    `https://urgent-maria-nudge-9f4b7e98.koyeb.app/tasks/`,
    { user_id: userId, ...newTask },
    config,
  );
};

export default saveUserData;
