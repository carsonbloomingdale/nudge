import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "nudge_activity_streak";

function readStreakFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { lastDate: null, count: 0 };
    }
    const parsed = JSON.parse(raw);
    return {
      lastDate: typeof parsed.lastDate === "string" ? parsed.lastDate : null,
      count: Number.isFinite(parsed.count) ? parsed.count : 0,
    };
  } catch {
    return { lastDate: null, count: 0 };
  }
}

function writeStreak(lastDate, count) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ lastDate, count: Math.max(0, count) }),
  );
}

/** Returns new streak count after logging activity for "today" (local calendar). */
export function bumpStreakCount() {
  const today = new Date().toISOString().slice(0, 10);
  const { lastDate, count } = readStreakFromStorage();
  if (lastDate === today) {
    return count;
  }
  const y = new Date();
  y.setDate(y.getDate() - 1);
  const yesterday = y.toISOString().slice(0, 10);
  const next = lastDate === yesterday ? count + 1 : 1;
  writeStreak(today, next);
  return next;
}

const AppShellContext = createContext(null);

export function AppShellProvider({ children }) {
  const [composerOpen, setComposerOpen] = useState(false);
  const [streakCount, setStreakCount] = useState(() => {
    return readStreakFromStorage().count;
  });

  const journalSubmitRef = useRef(null);

  const registerJournalSubmit = useCallback((fn) => {
    journalSubmitRef.current = fn;
    return () => {
      journalSubmitRef.current = null;
    };
  }, []);

  const submitJournalEntry = useCallback(async (text, options) => {
    const fn = journalSubmitRef.current;
    if (!fn) {
      return false;
    }
    await fn(text, options);
    return true;
  }, []);

  const openComposer = useCallback(() => setComposerOpen(true), []);

  const closeComposer = useCallback(() => setComposerOpen(false), []);

  const recordStreakOnSubmit = useCallback(() => {
    const next = bumpStreakCount();
    setStreakCount(next);
    return next;
  }, []);

  const refreshStreak = useCallback(() => {
    setStreakCount(readStreakFromStorage().count);
  }, []);

  const value = useMemo(
    () => ({
      composerOpen,
      openComposer,
      closeComposer,
      streakCount,
      recordStreakOnSubmit,
      refreshStreak,
      registerJournalSubmit,
      submitJournalEntry,
    }),
    [
      composerOpen,
      openComposer,
      closeComposer,
      streakCount,
      recordStreakOnSubmit,
      refreshStreak,
      registerJournalSubmit,
      submitJournalEntry,
    ],
  );

  return (
    <AppShellContext.Provider value={value}>{children}</AppShellContext.Provider>
  );
}

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) {
    throw new Error("useAppShell must be used within AppShellProvider");
  }
  return ctx;
}
