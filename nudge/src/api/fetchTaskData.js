import http from "./httpClient";
import { patchJournal } from "./journalApi";
import {
  mergeRawTextIntoLineItem,
  persistEnrichedLineItems,
} from "./persistLogEntry";
import { uploadJournalAttachments } from "./uploadJournalAttachments";

/** Matches `POST /api/tasks/enrich` — single short note. */
const SINGLE_ENRICH_MAX_CHARS = 300;
/** Matches server `ENRICH_BATCH_MAX_TASKS` default. */
const ENRICH_BATCH_MAX_TASKS = 15;

/**
 * Long journal → short lines (≤300 chars each).
 * @param {string} journalText
 */
export async function splitJournalFromText(journalText) {
  const { data } = await http.post("/api/tasks/split-from-journal", {
    journal_text: journalText,
    journalText,
  });
  return data ?? {};
}

/**
 * @param {string[]} taskStrings — 1–15 entries, each ≤300 chars
 */
export async function enrichTaskBatch(taskStrings) {
  const { data } = await http.post("/api/tasks/enrich-batch", {
    tasks: taskStrings,
  });
  return data ?? {};
}

/**
 * @param {string} didToday
 * @returns {Promise<Record<string, unknown>|null|undefined>}
 */
export async function enrichTask(didToday) {
  if (!didToday) {
    return null;
  }

  const { data } = await http.post("/api/tasks/enrich", {
    task: didToday,
  });

  return data?.task ?? data ?? {};
}

/**
 * Single short line → enrich. Long text → split-from-journal → enrich-batch (chunked by 15).
 * @param {string} note
 * @returns {Promise<{ rows: Record<string, unknown>[], perLineFallbacks: string[] }|null>}
 */
export async function enrichJournalToRows(note, _taskHistory) {
  const trimmed = String(note ?? "").trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length <= SINGLE_ENRICH_MAX_CHARS) {
    const enriched = await enrichTask(trimmed);
    if (!enriched || typeof enriched !== "object") {
      return null;
    }
    const rows = Array.isArray(enriched) ? enriched : [enriched];
    return {
      rows,
      perLineFallbacks: rows.map(() => trimmed),
    };
  }

  const splitPayload = await splitJournalFromText(trimmed);
  const items = [...(splitPayload.items ?? [])].sort(
    (a, b) => (a.index ?? 0) - (b.index ?? 0),
  );
  const texts = items
    .map((it) => String(it.text ?? "").trim())
    .filter(Boolean);
  if (!texts.length) {
    return null;
  }

  const allRows = [];
  const allFallbacks = [];

  for (let i = 0; i < texts.length; i += ENRICH_BATCH_MAX_TASKS) {
    const chunk = texts.slice(i, i + ENRICH_BATCH_MAX_TASKS);
    const batchPayload = await enrichTaskBatch(chunk);
    const tasksOut = batchPayload.tasks;
    if (!Array.isArray(tasksOut) || tasksOut.length === 0) {
      return null;
    }
    const n = Math.min(chunk.length, tasksOut.length);
    if (tasksOut.length !== chunk.length) {
      console.warn(
        "enrich-batch length mismatch: expected",
        chunk.length,
        "got",
        tasksOut.length,
      );
    }
    for (let j = 0; j < n; j++) {
      allRows.push(tasksOut[j]);
      allFallbacks.push(chunk[j]);
    }
  }

  if (!allRows.length) {
    return null;
  }
  return { rows: allRows, perLineFallbacks: allFallbacks };
}

/**
 * Snapshots for temporary “insights” UI after enrich.
 * @param {unknown} enriched
 */
export function insightSnapshotsFromEnriched(enriched) {
  const rows = Array.isArray(enriched) ? enriched : [enriched];
  return rows
    .filter((row) => row && typeof row === "object")
    .map((row) => ({
      sentiment: row.sentiment,
      category: row.category,
      label: row.label,
      context: row.context,
      personality_traits: row.personality_traits ?? row.personalityTraits,
      time_of_day: row.time_of_day ?? row.timeOfDay,
    }));
}

/** Back-compat helper (first insight only). */
export function insightSnapshotFromEnriched(enriched) {
  return insightSnapshotsFromEnriched(enriched)[0] ?? null;
}

function asPersistResult(rows) {
  if (!rows?.length) {
    return null;
  }
  return rows.length === 1 ? rows[0] : rows;
}

/**
 * Re-run enrich and PATCH journal line items (split + batch when note is long).
 * @param {string|number} journalId
 * @param {string} note
 * @param {unknown[]} taskHistory
 */
export async function regenerateJournalInsights(journalId, note, taskHistory) {
  const trimmed = String(note ?? "").trim();
  if (!trimmed || journalId == null) {
    return null;
  }
  const bundle = await enrichJournalToRows(trimmed, taskHistory ?? []);
  if (!bundle?.rows?.length) {
    return null;
  }
  const { rows, perLineFallbacks } = bundle;
  const lineItems = rows.map((row, i) =>
    mergeRawTextIntoLineItem(row, perLineFallbacks[i] ?? trimmed),
  );
  await patchJournal(journalId, { items: lineItems, note: trimmed });
  return asPersistResult(rows);
}

/**
 * Split (if long) → enrich (-batch) → POST /api/journals/ — never create a journal before enrich.
 * @param {string} didToday
 * @param {unknown[]} taskHistory
 * @param {{
 *   files?: File[],
 *   onEnrichStart?: () => void,
 *   onPersistComplete?: (journalId: string|number|null, enriched: unknown, note: string) => void,
 * }} [options]
 */
export default async function fetchTaskData(didToday, taskHistory, options) {
  const trimmed = String(didToday ?? "").trim();
  if (!trimmed) {
    return null;
  }

  const files = options?.files?.filter((f) => f instanceof File) ?? [];
  const onEnrichStart = options?.onEnrichStart;
  const onPersistComplete = options?.onPersistComplete;

  if (typeof onEnrichStart === "function") {
    onEnrichStart();
  }

  const bundle = await enrichJournalToRows(trimmed, taskHistory);
  if (!bundle?.rows?.length) {
    throw new Error(
      "We couldn't process this entry (network or length limit). Your text was not saved — it's still in the editor.",
    );
  }

  const { rows, perLineFallbacks } = bundle;
  const persisted = await persistEnrichedLineItems(rows, trimmed, {
    perLineFallbacks,
  });
  const journalId = persisted.journalId ?? null;
  if (journalId == null) {
    throw new Error(
      "Your entry could not be saved. Check your connection and try again — your text is still in the editor.",
    );
  }

  if (files.length > 0 && journalId != null) {
    try {
      await uploadJournalAttachments(journalId, files);
    } catch (err) {
      console.warn("Journal saved but photo upload failed:", err);
    }
  }

  const enrichedPayload = asPersistResult(rows);

  if (typeof onPersistComplete === "function") {
    onPersistComplete(journalId, enrichedPayload, trimmed);
  }

  return enrichedPayload;
}
