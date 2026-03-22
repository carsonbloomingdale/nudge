import http from "./httpClient";
import { persistEnrichedLineItems } from "./persistLogEntry";
import { uploadJournalAttachments } from "./uploadJournalAttachments";

/**
 * @param {string} didToday
 * @param {unknown[]} taskHistory
 * @returns {Promise<Record<string, unknown>|null|undefined>}
 */
export async function enrichTask(didToday, taskHistory) {
  if (!didToday) {
    return null;
  }

  const { data } = await http.post("/api/tasks/enrich", {
    task: didToday,
    taskHistory: taskHistory ?? [],
  });

  return data?.task ?? data ?? {};
}

/**
 * Enrich then persist via POST /api/journals/ (preferred) or legacy POST /tasks/.
 * @param {string} didToday
 * @param {unknown[]} taskHistory
 * @param {{ files?: File[] }} [options]
 */
export default async function fetchTaskData(didToday, taskHistory, options) {
  const parsedResponse = await enrichTask(didToday, taskHistory);
  if (!parsedResponse || typeof parsedResponse !== "object") {
    return parsedResponse;
  }
  const trimmed = String(didToday ?? "").trim();
  const persisted = await persistEnrichedLineItems(parsedResponse, trimmed);

  const files = options?.files?.filter((f) => f instanceof File) ?? [];
  if (files.length > 0 && persisted.journalId != null) {
    try {
      await uploadJournalAttachments(persisted.journalId, files);
    } catch (err) {
      console.warn("Journal saved but photo upload failed:", err);
    }
  }

  return parsedResponse;
}
