/**
 * Client-side journal model. Server may still expose Task rows; we treat them as
 * line items under a journal once `journal_id` exists, or as one synthetic journal
 * per legacy row.
 *
 * @typedef {Object} JournalLineItem
 * API task row / future line-item payload (sentiment, category, etc.).
 * @property {string|number} [id]
 * @property {string|number} [task_id]
 * @property {string} label
 * @property {string} [created_at]
 * @property {string} [createdAt]
 * @property {string} [updated_at]
 * @property {string} [timestamp]
 * @property {string} [photo_url]
 * @property {string} [photoUrl]
 * @property {boolean} [has_photo]
 * @property {string} [image]
 * @property {string|number} [journal_id]
 * @property {string|number} [journalId]
 */

/**
 * @typedef {Object} Journal
 * @property {string} id Stable id for React keys (server journal id or synthetic).
 * @property {string} submittedAt ISO when possible; used for sorting and time display.
 * @property {JournalLineItem[]} items Line items for this log (newest-last sort optional).
 */

function lineItemTimeMs(t) {
  const raw =
    t?.created_at ??
    t?.createdAt ??
    t?.updated_at ??
    t?.timestamp;
  if (!raw) {
    return 0;
  }
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

/**
 * Latest activity among line items (for journal-level timestamp / feed ordering).
 * @param {JournalLineItem[]} items
 */
export function journalLatestIso(items) {
  if (!items?.length) {
    return "";
  }
  const times = items.map(lineItemTimeMs).filter((n) => n > 0);
  if (!times.length) {
    return "";
  }
  return new Date(Math.max(...times)).toISOString();
}

/**
 * Sort line items oldest → newest within a journal.
 * @param {JournalLineItem[]} items
 */
export function sortLineItemsChronologically(items) {
  return [...items].sort((a, b) => lineItemTimeMs(a) - lineItemTimeMs(b));
}

/**
 * Turn a flat task list into journals: merge rows that share `journal_id` /
 * `journalId`; otherwise one synthetic journal per row (legacy).
 * Preserves first-seen journal order in the original array (same as before grouping).
 *
 * @param {JournalLineItem[]|null|undefined} tasks
 * @returns {Journal[]}
 */
export function legacyTasksToJournals(tasks) {
  if (!tasks?.length) {
    return [];
  }

  const byKey = new Map();
  /** @type {string[]} */
  const order = [];

  for (let i = 0; i < tasks.length; i += 1) {
    const t = tasks[i];
    const jid = t.journal_id ?? t.journalId;
    const key =
      jid != null
        ? `j:${jid}`
        : `legacy:${t.task_id ?? t.id ?? `idx-${i}`}`;

    if (!byKey.has(key)) {
      byKey.set(key, []);
      order.push(key);
    }
    byKey.get(key).push(t);
  }

  return order.map((key) => {
    const rawItems = byKey.get(key) ?? [];
    const items = sortLineItemsChronologically(rawItems);
    const first = items[0] ?? {};
    const jid = first.journal_id ?? first.journalId;
    const id =
      jid != null
        ? `journal:${jid}`
        : String(first.task_id ?? first.id ?? key);

    return {
      id,
      submittedAt: journalLatestIso(items) || "",
      items,
    };
  });
}
