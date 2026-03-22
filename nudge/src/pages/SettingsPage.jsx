import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import {
  messageFromAuthError,
  patchCurrentUser,
} from "../api/authApi";
import { useAuth } from "../auth/AuthContext";
import { readDisplayProfile } from "../auth/sessionKeys";
import {
  StyledCheckboxRow,
  StyledFieldHint,
  StyledInput,
} from "../components/auth/authStyles";
import TimeZoneInput from "../components/profile/TimeZoneInput";
import {
  buildProfilePatchPayload,
  isE164Phone,
  profileToFormStateWithDetectedTimeZone,
  stripPhoneForSubmit,
} from "../utils/profileFields";

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

const FormStack = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
`;

const FieldLabel = styled.label`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: hsl(var(--muted-foreground));
`;

const ErrorBox = styled.p`
  margin: 0;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius);
  font-size: 14px;
  line-height: 1.45;
  color: hsl(0 45% 38%);
  background: hsl(0 40% 96% / 0.6);
  border: 1px solid hsl(0 35% 88%);
`;

const SuccessBox = styled.p`
  margin: 0;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius);
  font-size: 14px;
  line-height: 1.45;
  color: hsl(140 35% 28%);
  background: hsl(140 40% 94% / 0.7);
  border: 1px solid hsl(140 30% 82%);
`;

const SaveBtn = styled.button`
  margin-top: 0.35rem;
  width: 100%;
  height: 2.75rem;
  border: none;
  border-radius: var(--radius);
  font-size: 15px;
  font-family: var(--font-sans), sans-serif;
  font-weight: 600;
  cursor: pointer;
  background: hsl(var(--primary));
  color: white;
  box-shadow: 0 4px 14px hsl(var(--primary) / 0.2);
  transition: box-shadow 200ms ease, transform 200ms ease;

  &:hover:not(:disabled) {
    box-shadow: 0 6px 20px hsl(var(--primary) / 0.25);
  }

  &:active:not(:disabled) {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
    transform: none;
  }
`;

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState(() =>
    profileToFormStateWithDetectedTimeZone(user),
  );
  const [loadError, setLoadError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingProfile(true);
    setLoadError(null);
    (async () => {
      try {
        const next = await refreshUser();
        if (cancelled) {
          return;
        }
        if (next) {
          setForm(profileToFormStateWithDetectedTimeZone(next));
        }
      } catch {
        if (!cancelled) {
          setLoadError("Could not load your profile. You can still edit and try saving.");
          setForm(profileToFormStateWithDetectedTimeZone(readDisplayProfile()));
        }
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const onSave = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      const phoneStripped = stripPhoneForSubmit(form.phone);
      if (phoneStripped && !isE164Phone(form.phone)) {
        setError(
          "Phone must be in E.164 format: + and country code, then digits (for example +15551234567).",
        );
        return;
      }
      if (form.smsOptIn && !isE164Phone(form.phone)) {
        setError("To keep SMS on, enter a valid E.164 phone number.");
        return;
      }
      setSaving(true);
      try {
        const payload = buildProfilePatchPayload(form);
        await patchCurrentUser(payload);
        await refreshUser();
        setSuccess("Saved.");
      } catch (err) {
        setError(messageFromAuthError(err, { forRegister: false }));
      } finally {
        setSaving(false);
      }
    },
    [form, refreshUser],
  );

  return (
    <Card className="animate-fade-up stagger-0">
      <Title>Settings</Title>
      <Lead>
        Update your name, phone, timezone, and SMS preferences. Turning off SMS
        keeps your number on file but stops messages until you opt in again.
      </Lead>
      {loadError ? <ErrorBox style={{ marginBottom: "0.75rem" }}>{loadError}</ErrorBox> : null}
      {loadingProfile ? (
        <p style={{ margin: 0, color: "hsl(var(--muted-foreground))" }}>Loading profile…</p>
      ) : (
        <FormStack onSubmit={onSave} noValidate>
          {error ? <ErrorBox>{error}</ErrorBox> : null}
          {success ? <SuccessBox>{success}</SuccessBox> : null}
          <Field>
            <FieldLabel htmlFor="settings-first">First name</FieldLabel>
            <StyledInput
              id="settings-first"
              name="first_name"
              value={form.firstName}
              onChange={(ev) =>
                setForm((f) => ({ ...f, firstName: ev.target.value }))
              }
              autoComplete="given-name"
              placeholder="First name"
              disabled={saving}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="settings-last">Last name</FieldLabel>
            <StyledInput
              id="settings-last"
              name="last_name"
              value={form.lastName}
              onChange={(ev) =>
                setForm((f) => ({ ...f, lastName: ev.target.value }))
              }
              autoComplete="family-name"
              placeholder="Last name"
              disabled={saving}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="settings-phone">Phone</FieldLabel>
            <StyledInput
              id="settings-phone"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={(ev) =>
                setForm((f) => ({ ...f, phone: ev.target.value }))
              }
              autoComplete="tel"
              placeholder="+15551234567"
              disabled={saving}
            />
            <StyledFieldHint style={{ marginTop: 0 }}>
              E.164 format. Clear the field and save to remove your number from
              your profile.
            </StyledFieldHint>
          </Field>
          <Field>
            <FieldLabel htmlFor="settings-tz">Timezone</FieldLabel>
            <TimeZoneInput
              value={form.timezone}
              onChange={(v) => setForm((f) => ({ ...f, timezone: v }))}
              disabled={saving}
            />
            <StyledFieldHint style={{ marginTop: 0 }}>
              If you don’t have one saved yet, we suggest your device’s timezone
              — change it if needed. Otherwise search suggestions or type an IANA
              zone.
            </StyledFieldHint>
          </Field>
          <StyledCheckboxRow style={{ maxWidth: "none" }}>
            <input
              type="checkbox"
              name="sms_opt_in"
              checked={form.smsOptIn}
              onChange={(ev) =>
                setForm((f) => ({ ...f, smsOptIn: ev.target.checked }))
              }
              disabled={saving}
            />
            <span>
              <strong>SMS reminders</strong> — I agree to receive automated
              texts from Nudge about my account and tasks. Frequency varies;
              message and data rates may apply. Opt out anytime here. Number is
              used only for these messages.
            </span>
          </StyledCheckboxRow>
          <SaveBtn type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </SaveBtn>
        </FormStack>
      )}
    </Card>
  );
}
