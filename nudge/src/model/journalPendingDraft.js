const LS_KEY = "nudge_journal_pending_draft_v1";
const SS_PRESENTED_KEY = "nudge_journal_draft_presented_session";

function readRaw() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) {
      return null;
    }
    const o = JSON.parse(raw);
    if (o && typeof o === "object" && typeof o.text === "string") {
      return o;
    }
    return null;
  } catch {
    return null;
  }
}

/** Call when a journal submit starts (before BE has confirmed persistence). */
export function stashJournalDraftPendingConfirm(text) {
  const t = String(text ?? "");
  if (!t.trim()) {
    return;
  }
  try {
    localStorage.setItem(
      LS_KEY,
      JSON.stringify({
        v: 1,
        text: t,
        unconfirmed: true,
        savedAt: Date.now(),
      }),
    );
    sessionStorage.removeItem(SS_PRESENTED_KEY);
  } catch {
    // ignore quota / private mode
  }
}

/** Call when POST / journal persist succeeded and enrichment payload is stored. */
export function clearJournalDraftStash() {
  try {
    localStorage.removeItem(LS_KEY);
    sessionStorage.removeItem(SS_PRESENTED_KEY);
  } catch {
    // ignore
  }
}

/**
 * One automatic prefill per browser session: recover after crash/reload while a submit was in flight.
 * @returns {string|null}
 */
export function takeJournalDraftForSessionRecovery() {
  const o = readRaw();
  if (!o?.unconfirmed || !String(o.text ?? "").trim()) {
    return null;
  }
  try {
    if (sessionStorage.getItem(SS_PRESENTED_KEY)) {
      return null;
    }
    sessionStorage.setItem(SS_PRESENTED_KEY, "1");
  } catch {
    return null;
  }
  return o.text;
}
