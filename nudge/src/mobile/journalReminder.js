import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";

export const JOURNAL_REMINDER_NOTIFICATION_ID = 8842001;
/** One-off test notification (few seconds); separate id so it never clashes with the daily schedule. */
export const JOURNAL_REMINDER_TEST_NOTIFICATION_ID = 8842002;
export const JOURNAL_REMINDER_CHANNEL_ID = "journal-reminder";

const STORAGE_KEY = "nudge_journal_reminder_v1";

function defaults() {
  return {
    enabled: false,
    hour: 20,
    minute: 0,
    title: "Time to reflect",
    body: "Pause for a mindful moment — open your journal and jot down what’s on your mind.",
  };
}

function clampHour(h) {
  const n = Number(h);
  if (!Number.isFinite(n)) {
    return 20;
  }
  return Math.min(23, Math.max(0, Math.floor(n)));
}

function clampMinute(m) {
  const n = Number(m);
  if (!Number.isFinite(n)) {
    return 0;
  }
  return Math.min(59, Math.max(0, Math.floor(n)));
}

export function loadJournalReminderSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaults();
    }
    const p = JSON.parse(raw);
    const d = defaults();
    return {
      enabled: Boolean(p.enabled),
      hour: clampHour(p.hour),
      minute: clampMinute(p.minute),
      title:
        typeof p.title === "string" && p.title.trim()
          ? p.title.trim()
          : d.title,
      body:
        typeof p.body === "string" && p.body.trim()
          ? p.body.trim()
          : d.body,
    };
  } catch {
    return defaults();
  }
}

export function persistJournalReminderSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

async function ensureAndroidChannel() {
  if (Capacitor.getPlatform() !== "android") {
    return;
  }
  await LocalNotifications.createChannel({
    id: JOURNAL_REMINDER_CHANNEL_ID,
    name: "Journal reminders",
    importance: 4,
    description: "Daily nudge to journal and be mindful",
  });
}

export async function requestJournalReminderPermissions() {
  const cur = await LocalNotifications.checkPermissions();
  if (cur.display === "granted") {
    return true;
  }
  const next = await LocalNotifications.requestPermissions();
  return next.display === "granted";
}

/**
 * Cancel any prior journal reminder, then schedule if enabled.
 * @param {ReturnType<typeof loadJournalReminderSettings>} settings
 */
export async function applyJournalReminderSchedule(settings) {
  if (!Capacitor.isNativePlatform()) {
    return { ok: false, reason: "not-native" };
  }

  await LocalNotifications.cancel({
    notifications: [{ id: JOURNAL_REMINDER_NOTIFICATION_ID }],
  });

  if (!settings.enabled) {
    return { ok: true };
  }

  const granted = await requestJournalReminderPermissions();
  if (!granted) {
    return { ok: false, reason: "permission-denied" };
  }

  await ensureAndroidChannel();

  const notification = {
    title: settings.title,
    body: settings.body,
    id: JOURNAL_REMINDER_NOTIFICATION_ID,
    extra: { nudgeKind: "openJournal" },
    schedule: {
      on: {
        hour: settings.hour,
        minute: settings.minute,
      },
      repeats: true,
      allowWhileIdle: true,
    },
  };

  if (Capacitor.getPlatform() === "android") {
    notification.channelId = JOURNAL_REMINDER_CHANNEL_ID;
  }

  await LocalNotifications.schedule({
    notifications: [notification],
  });

  return { ok: true };
}

/** Re-apply from storage on app launch (native only). */
export async function refreshJournalReminderSchedule() {
  if (!Capacitor.isNativePlatform()) {
    return;
  }
  const s = loadJournalReminderSettings();
  if (!s.enabled) {
    return;
  }
  await applyJournalReminderSchedule(s);
}

const TEST_FIRE_DELAY_MS = 8000;

/**
 * Schedule a single notification in ~8s using the same title/body tap behavior as the daily reminder.
 * @param {{ title: string, body: string }} payload
 */
export async function scheduleTestJournalReminderNotification(payload) {
  if (!Capacitor.isNativePlatform()) {
    return { ok: false, reason: "not-native" };
  }

  const granted = await requestJournalReminderPermissions();
  if (!granted) {
    return { ok: false, reason: "permission-denied" };
  }

  await ensureAndroidChannel();

  await LocalNotifications.cancel({
    notifications: [{ id: JOURNAL_REMINDER_TEST_NOTIFICATION_ID }],
  });

  const at = new Date(Date.now() + TEST_FIRE_DELAY_MS);
  const notification = {
    title: payload.title,
    body: `${payload.body} (test)`,
    id: JOURNAL_REMINDER_TEST_NOTIFICATION_ID,
    extra: { nudgeKind: "openJournal" },
    schedule: { at },
  };

  if (Capacitor.getPlatform() === "android") {
    notification.channelId = JOURNAL_REMINDER_CHANNEL_ID;
  }

  await LocalNotifications.schedule({
    notifications: [notification],
  });

  return { ok: true };
}

/**
 * @param {() => void} openComposer
 * @returns {() => void} cleanup
 */
export function subscribeJournalReminderTap(openComposer) {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  const pending = LocalNotifications.addListener(
    "localNotificationActionPerformed",
    (action) => {
      const n = action.notification;
      if (!n) {
        return;
      }
      if (
        n.id === JOURNAL_REMINDER_NOTIFICATION_ID
        || n.id === JOURNAL_REMINDER_TEST_NOTIFICATION_ID
        || n.extra?.nudgeKind === "openJournal"
      ) {
        openComposer();
      }
    },
  );

  return () => {
    void pending.then((h) => h.remove());
  };
}

export function timeToInputValue(hour, minute) {
  const h = String(clampHour(hour)).padStart(2, "0");
  const m = String(clampMinute(minute)).padStart(2, "0");
  return `${h}:${m}`;
}

export function parseTimeInput(value) {
  const parts = String(value ?? "").split(":");
  const h = clampHour(parts[0]);
  const m = clampMinute(parts[1]);
  return { hour: h, minute: m };
}
