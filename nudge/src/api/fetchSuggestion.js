import http from "./httpClient";

export default async function fetchSuggestion(taskHistory) {
  const { data } = await http.post("/api/suggestions", {
    taskHistory: taskHistory ?? [],
  });
  return data?.suggestion ?? data;
}
