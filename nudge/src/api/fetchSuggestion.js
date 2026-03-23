import http from "./httpClient";

export default async function fetchSuggestion() {
  const { data } = await http.post("/api/suggestions");
  return data?.suggestion ?? data;
}
