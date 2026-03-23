import {
  createJournal,
  extractJournalId,
  isJournalRouteMissingError,
} from "./journalApi";
import saveUserData from "./saveUserData";

/**
 * Remove server-assigned ids so create payloads are accepted.
 * @param {Record<string, unknown>} taskLike
 */
export function stripServerIdsForCreate(taskLike) {
  const o = { ...taskLike };
  delete o.id;
  delete o.task_id;
  delete o.user_id;
  delete o.journal_id;
  delete o.journalId;
  return o;
}

function nonEmptyString(v) {
  if (v == null) {
    return "";
  }
  const s = String(v).trim();
  return s;
}

/**
 * `/api/tasks/enrich` may return fields under different keys or leave `label` null.
 * Journal create still needs a non-empty line text (often `label` on the task row).
 *
 * @param {Record<string, unknown>} enriched
 * @param {string} rawUserText — what the user actually typed this submit
 */
export function mergeRawTextIntoLineItem(enriched, rawUserText) {
  const text = nonEmptyString(rawUserText);
  const base = stripServerIdsForCreate(
    enriched && typeof enriched === "object" ? { ...enriched } : {},
  );

  const fromAlt =
    nonEmptyString(base.label) ||
    nonEmptyString(base.title) ||
    nonEmptyString(base.name) ||
    nonEmptyString(base.task) ||
    nonEmptyString(base.content) ||
    nonEmptyString(base.body);

  if (fromAlt) {
    if (!nonEmptyString(base.label)) {
      base.label = fromAlt;
    }
    return base;
  }

  if (text) {
    base.label = text;
  }

  /** POST /tasks/ and journal line items: up to 5 trimmed strings (max 80 chars). */
  if (Array.isArray(base.personality_traits)) {
    const traits = base.personality_traits
      .map((x) => {
        if (typeof x === "string") {
          return x.trim().slice(0, 80);
        }
        if (x && typeof x === "object" && x.label != null) {
          return String(x.label).trim().slice(0, 80);
        }
        return "";
      })
      .filter(Boolean)
      .slice(0, 5);
    if (traits.length > 0) {
      base.personality_traits = traits;
    } else {
      delete base.personality_traits;
    }
  }

  return base;
}

/**
 * Persist enriched line item(s): prefer POST /api/journals/; fallback to legacy POST /tasks/ per row.
 * @param {Record<string, unknown>|Record<string, unknown>[]} enriched — one or many enriched tasks
 * @param {string} [rawUserText] — full journal note (fallback when `perLineFallbacks` omitted)
 * @param {{ perLineFallbacks?: string[] }} [options] — one short string per row (split lines / batch order)
 */
export async function persistEnrichedLineItems(enriched, rawUserText, options) {
  const rows = Array.isArray(enriched) ? enriched : [enriched];
  const fallbacks = options?.perLineFallbacks;
  const lineItems = rows.map((row, i) =>
    mergeRawTextIntoLineItem(
      row,
      fallbacks && fallbacks[i] != null
        ? fallbacks[i]
        : rawUserText ?? "",
    ),
  );

  const trimmed = String(rawUserText ?? "").trim();

  try {
    const data = await createJournal({
      source: "app",
      items: lineItems,
      ...(trimmed ? { note: trimmed } : {}),
    });
    return {
      via: "journal",
      journalId: extractJournalId(data),
      createResponse: data,
    };
  } catch (e) {
    if (!isJournalRouteMissingError(e)) {
      throw e;
    }
    let lastData;
    for (const t of lineItems) {
      // eslint-disable-next-line no-await-in-loop
      const res = await saveUserData(t);
      lastData = res?.data;
    }
    return {
      via: "tasks",
      journalId: extractJournalId(lastData),
      createResponse: lastData,
    };
  }
}
