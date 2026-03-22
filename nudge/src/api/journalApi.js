import http from "./httpClient";

/**
 * Normalize list payload from GET /api/journals/.
 * @param {unknown} data
 * @returns {unknown[]}
 */
export function normalizeJournalsListPayload(data) {
  if (Array.isArray(data)) {
    return data;
  }
  return data?.journals ?? data?.results ?? [];
}

/**
 * Flatten nested journals → task rows with journal_id for grouping / suggestions.
 * @param {unknown} journalsPayload — raw GET /api/journals/ body
 * @returns {Record<string, unknown>[]}
 */
export function flattenJournalsToTasks(journalsPayload) {
  const list = normalizeJournalsListPayload(journalsPayload);
  const out = [];
  for (const j of list) {
    const jid = j.journal_id ?? j.journalId ?? j.id;
    const rows = j.tasks ?? j.items ?? [];
    for (const t of rows) {
      out.push({
        ...t,
        journal_id: t.journal_id ?? t.journalId ?? jid,
      });
    }
  }
  return out;
}

function taskTimeMs(t) {
  const raw =
    t?.created_at ??
    t?.createdAt ??
    t?.updated_at ??
    t?.timestamp ??
    0;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/**
 * Match legacy GET /tasks/ ordering for enrich + suggestions (oldest → newest).
 * @param {Record<string, unknown>[]} tasks
 */
export function sortTasksChronologically(tasks) {
  return [...tasks].sort((a, b) => taskTimeMs(a) - taskTimeMs(b));
}

/**
 * @param {unknown} data — POST /api/journals/ JSON body
 * @returns {string|number|null}
 */
export function extractJournalId(data) {
  if (data == null || typeof data !== "object") {
    return null;
  }
  return (
    data.journal_id ??
    data.journalId ??
    data.id ??
    null
  );
}

/**
 * Enrich payloads often include `note: null` on task rows; omit so we do not send nulls.
 * @param {Record<string, unknown>[]} items
 */
export function sanitizeJournalLineItemsForCreate(items) {
  return items.map((row) => {
    if (!row || typeof row !== "object") {
      return row;
    }
    const o = { ...row };
    if ("note" in o && (o.note === null || o.note === undefined)) {
      delete o.note;
    }
    return o;
  });
}

/**
 * Create a journal with 1–50 embedded line items (BE field name: `items`).
 * @param {{ source?: string, note?: string|null, submittedAt?: string, submitted_at?: string, items?: Record<string, unknown>[], tasks?: Record<string, unknown>[] }} body
 */
export async function createJournal(body) {
  const rawItems = body.items ?? body.tasks ?? [];
  const items = sanitizeJournalLineItemsForCreate(rawItems);
  const payload = {
    source: body.source ?? "app",
    submitted_at:
      body.submittedAt ??
      body.submitted_at ??
      new Date().toISOString(),
    items,
  };
  if (body.note != null && String(body.note).trim() !== "") {
    payload.note = body.note;
  }
  const { data } = await http.post("/api/journals/", payload);
  return data;
}

export async function fetchJournals() {
  const { data } = await http.get("/api/journals/");
  return data;
}

export async function fetchJournal(journalId) {
  const { data } = await http.get(`/api/journals/${encodeURIComponent(String(journalId))}`);
  return data;
}

/**
 * @param {string|number} journalId
 * @param {{ note: string|null }} body — use `note: null` to clear
 */
export async function patchJournalNote(journalId, body) {
  const { data } = await http.patch(
    `/api/journals/${encodeURIComponent(String(journalId))}`,
    body,
  );
  return data;
}

export async function deleteJournal(journalId) {
  await http.delete(`/api/journals/${encodeURIComponent(String(journalId))}`);
}

/**
 * @param {string|number} journalId
 * @param {Record<string, unknown>} body — filename, content_type, byte_size (required by BE), etc.
 */
export async function presignJournalAttachment(journalId, body) {
  const { data } = await http.post(
    `/api/journals/${encodeURIComponent(String(journalId))}/attachments/presign`,
    body ?? {},
  );
  return data;
}

/**
 * @param {string|number} journalId
 * @param {string|number} attachmentId
 */
export async function completeJournalAttachment(journalId, attachmentId, body) {
  const { data } = await http.post(
    `/api/journals/${encodeURIComponent(String(journalId))}/attachments/${encodeURIComponent(String(attachmentId))}/complete`,
    body ?? {},
  );
  return data;
}

/**
 * Old API or route not mounted (avoid importing axios in modules Jest loads without ESM).
 * @param {unknown} err
 * @returns {boolean}
 */
export function isJournalRouteMissingError(err) {
  const s = err?.response?.status;
  return s === 404 || s === 405 || s === 501;
}
