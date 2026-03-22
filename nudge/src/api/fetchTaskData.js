import http from "./httpClient";
import saveUserData from "./saveUserData";

export default async function fetchTaskData(didToday, taskHistory) {
  if (!didToday) {
    return;
  }

  const { data } = await http.post("/api/tasks/enrich", {
    task: didToday,
    taskHistory: taskHistory ?? [],
  });

  const parsedResponse = data?.task ?? data ?? {};
  await saveUserData(parsedResponse);
  return parsedResponse;
}
