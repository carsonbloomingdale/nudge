import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";
import { Capacitor } from "@capacitor/core";
import {
  StyledInput,
  StyledAuthSubmitBtn,
} from "../components/auth/authStyles";
import {
  applyJournalReminderSchedule,
  loadJournalReminderSettings,
  parseTimeInput,
  persistJournalReminderSettings,
  scheduleTestJournalReminderNotification,
  timeToInputValue,
} from "../mobile/journalReminder";

const Card = styled.section`
  border-radius: var(--radius);
  padding: 1.5rem;
  background: hsl(var(--card) / 0.8);
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  max-width: 32rem;
  margin: 0 auto;
`;

const Title = styled.h1`
  margin: 0 0 0.35rem;
`;

const Lead = styled.p`
  margin: 0 0 1.25rem;
  font-size: 15px;
  line-height: 1.625;
  color: hsl(var(--muted-foreground));
`;

const BackLink = styled(Link)`
  display: inline-block;
  margin-bottom: 1rem;
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--primary));
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  margin-bottom: 0.9rem;
`;

const FieldLabel = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: hsl(var(--muted-foreground));
`;

const CheckboxRow = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin-bottom: 1rem;
  font-size: 15px;
  line-height: 1.45;
  cursor: pointer;

  input {
    margin-top: 0.2rem;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 5rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border) / 0.75);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-sans), sans-serif;
  font-size: 15px;
  line-height: 1.5;
  resize: vertical;

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 1px;
  }
`;

const ErrorBox = styled.p`
  margin: 0 0 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius);
  font-size: 14px;
  line-height: 1.45;
  color: hsl(0 45% 38%);
  background: hsl(0 40% 96% / 0.6);
  border: 1px solid hsl(0 35% 88%);
`;

const SuccessBox = styled.p`
  margin: 0 0 0.75rem;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius);
  font-size: 14px;
  line-height: 1.45;
  color: hsl(140 35% 28%);
  background: hsl(140 40% 94% / 0.7);
  border: 1px solid hsl(140 30% 82%);
`;

const TestBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding-top: 1rem;
  margin-top: 0.5rem;
  border-top: 1px solid hsl(var(--border) / 0.45);
`;

const TestSectionTitle = styled.p`
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: hsl(var(--muted-foreground));
`;

const TestBtn = styled.button`
  align-self: flex-start;
  height: 2.25rem;
  padding: 0 0.9rem;
  border-radius: var(--radius);
  font-size: 14px;
  font-family: var(--font-sans), sans-serif;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid hsl(var(--border));
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  transition: background 160ms ease, border-color 160ms ease;

  &:hover:not(:disabled) {
    background: hsl(var(--muted) / 0.35);
    border-color: hsl(var(--border));
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export default function JournalReminderPage() {
  const native = Capacitor.isNativePlatform();
  const [enabled, setEnabled] = useState(false);
  const [timeValue, setTimeValue] = useState("20:00");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [testPending, setTestPending] = useState(false);
  const [testError, setTestError] = useState(null);
  const [testOk, setTestOk] = useState(null);

  useEffect(() => {
    const s = loadJournalReminderSettings();
    setEnabled(s.enabled);
    setTimeValue(timeToInputValue(s.hour, s.minute));
    setTitle(s.title);
    setBody(s.body);
  }, []);

  const onSave = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);

      const { hour, minute } = parseTimeInput(timeValue);
      const settings = {
        enabled,
        hour,
        minute,
        title: title.trim() || loadJournalReminderSettings().title,
        body: body.trim() || loadJournalReminderSettings().body,
      };

      if (!native) {
        persistJournalReminderSettings(settings);
        setSuccess("Preferences saved (open the app on a phone to get reminders).");
        return;
      }

      setSaving(true);
      try {
        persistJournalReminderSettings(settings);
        const r = await applyJournalReminderSchedule(settings);
        if (!r.ok && r.reason === "permission-denied") {
          const rolled = { ...settings, enabled: false };
          persistJournalReminderSettings(rolled);
          setEnabled(false);
          setError(
            "Notifications are off for Nudge. Enable them in system Settings, then try again.",
          );
          return;
        }
        if (!r.ok) {
          setError("Could not update the reminder. Try again.");
          return;
        }
        setSuccess(
          settings.enabled
            ? "Daily reminder scheduled. Tapping the notification opens your journal."
            : "Reminder turned off.",
        );
      } catch {
        setError("Something went wrong. Try again.");
      } finally {
        setSaving(false);
      }
    },
    [native, enabled, timeValue, title, body],
  );

  const onTestNotification = useCallback(async () => {
    setTestError(null);
    setTestOk(null);
    const stored = loadJournalReminderSettings();
    const t = title.trim() || stored.title;
    const b = body.trim() || stored.body;
    setTestPending(true);
    try {
      const r = await scheduleTestJournalReminderNotification({
        title: t,
        body: b,
      });
      if (!r.ok && r.reason === "permission-denied") {
        setTestError(
          "Turn on notifications for Nudge in system Settings, then try again.",
        );
        return;
      }
      if (!r.ok) {
        setTestError("Could not schedule the test. Try again.");
        return;
      }
      setTestOk(
        "Test scheduled — you should see a notification in about 8 seconds. Tap it to open the journal.",
      );
    } catch {
      setTestError("Something went wrong. Try again.");
    } finally {
      setTestPending(false);
    }
  }, [title, body]);

  if (!native) {
    return (
      <Card className="animate-fade-up stagger-0">
        <BackLink to="/app/settings">← Settings</BackLink>
        <Title>Journal reminder</Title>
        <Lead>
          Daily journal nudges with a time you pick are available in the{" "}
          <strong>iOS and Android app</strong>. Install the app to schedule local
          notifications that open the journal writer when you tap them.
        </Lead>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-up stagger-0">
      <BackLink to="/app/settings">← Settings</BackLink>
      <Title>Journal reminder</Title>
      <Lead>
        Pick a time for a gentle nudge to slow down and journal. Tapping the
        notification opens Nudge with the journal editor.
      </Lead>
      <form onSubmit={(ev) => void onSave(ev)}>
        {error ? <ErrorBox>{error}</ErrorBox> : null}
        {success ? <SuccessBox>{success}</SuccessBox> : null}
        <CheckboxRow>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(ev) => setEnabled(ev.target.checked)}
            disabled={saving}
          />
          <span>Daily reminder at the time below</span>
        </CheckboxRow>
        <Field>
          <FieldLabel htmlFor="jr-time">Time</FieldLabel>
          <StyledInput
            id="jr-time"
            type="time"
            value={timeValue}
            onChange={(ev) => setTimeValue(ev.target.value)}
            disabled={saving || !enabled}
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="jr-title">Title</FieldLabel>
          <StyledInput
            id="jr-title"
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
            placeholder="Time to reflect"
            disabled={saving}
            autoComplete="off"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="jr-body">Message</FieldLabel>
          <TextArea
            id="jr-body"
            value={body}
            onChange={(ev) => setBody(ev.target.value)}
            disabled={saving}
          />
        </Field>
        <StyledAuthSubmitBtn type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save reminder"}
        </StyledAuthSubmitBtn>
      </form>
      <TestBlock>
        <TestSectionTitle>Try it</TestSectionTitle>
        {testError ? <ErrorBox>{testError}</ErrorBox> : null}
        {testOk ? <SuccessBox>{testOk}</SuccessBox> : null}
        <TestBtn
          type="button"
          onClick={() => void onTestNotification()}
          disabled={saving || testPending}
        >
          {testPending ? "Scheduling…" : "Send test notification"}
        </TestBtn>
        <Lead style={{ margin: 0, fontSize: "14px" }}>
          Uses the title and message above (appends “(test)” to the body). You can
          leave the daily reminder off — this only fires once, in about eight
          seconds. Put the app in the background if you don’t see a banner while
          Nudge is open.
        </Lead>
      </TestBlock>
    </Card>
  );
}
