import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styled from "styled-components";
import {
  messageFromAuthError,
  patchCurrentUser,
  postSendPhoneVerificationCode,
  postSmsTest,
  postVerifyPhoneCode,
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
import {
  hasSavedSmsPhone,
  isSmsFullyEnabled,
  needsPhoneVerification,
} from "../utils/smsVerification";

/** One auto-send per user id while the signup redirect effect is resolving (Strict Mode safe). */
const signupAutoSendInflight = new Map();

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

const InfoBox = styled.p`
  margin: 0;
  padding: 0.65rem 0.75rem;
  border-radius: var(--radius);
  font-size: 14px;
  line-height: 1.45;
  color: hsl(220 35% 30%);
  background: hsl(220 45% 96% / 0.75);
  border: 1px solid hsl(220 30% 88%);
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

const SmsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.75rem 0 0;
  border-top: 1px solid hsl(var(--border) / 0.45);
  margin-top: 0.15rem;
`;

const SmsSectionTitle = styled.p`
  margin: 0;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: hsl(var(--muted-foreground));
`;

const CodeInput = styled(StyledInput)`
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.12em;
  max-width: 11rem;
`;

const SmsTestBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  padding-top: 0.35rem;
`;

/** Avoid nested <form> inside settings save form (invalid HTML; can cause full-page submit). */
const VerifyCodeStack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  margin-top: 0.35rem;
`;

const TestSmsBtn = styled.button`
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
  transition: background 200ms ease, border-color 200ms ease;

  &:hover:not(:disabled) {
    background: hsl(var(--muted) / 0.35);
    border-color: hsl(var(--border));
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

export default function SettingsPage() {
  const { user, refreshUser, applyMeResponse } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const clearVerifySignupNav = useCallback(() => {
    const rest = { ...(location.state ?? {}) };
    delete rest.verifySmsAfterSignup;
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: Object.keys(rest).length ? rest : undefined,
    });
  }, [navigate, location.pathname, location.search, location.state]);

  const [form, setForm] = useState(() =>
    profileToFormStateWithDetectedTimeZone(user),
  );
  const [loadError, setLoadError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [smsTestPending, setSmsTestPending] = useState(false);
  const [smsTestError, setSmsTestError] = useState(null);
  const [smsTestOk, setSmsTestOk] = useState(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifySendPending, setVerifySendPending] = useState(false);
  const [verifySubmitPending, setVerifySubmitPending] = useState(false);
  const [verifyError, setVerifyError] = useState(null);
  const [verifySuccess, setVerifySuccess] = useState(null);

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

  useEffect(() => {
    if (loadingProfile || !location.state?.verifySmsAfterSignup) {
      return;
    }
    const uid = user?.userId;
    if (!uid || !needsPhoneVerification(user)) {
      clearVerifySignupNav();
      return;
    }
    const existing = signupAutoSendInflight.get(uid);
    if (existing) {
      void existing.finally(() => clearVerifySignupNav());
      return;
    }
    setVerifyError(null);
    const p = (async () => {
      try {
        const { data } = await postSendPhoneVerificationCode();
        applyMeResponse(data);
        setVerifySuccess(
          "We texted a verification code to your number. Enter the 6-digit code below.",
        );
      } catch (err) {
        setVerifyError(messageFromAuthError(err, { forRegister: false }));
      }
    })();
    signupAutoSendInflight.set(uid, p);
    void p.finally(() => {
      signupAutoSendInflight.delete(uid);
      clearVerifySignupNav();
    });
  }, [loadingProfile, user, location.state, clearVerifySignupNav, applyMeResponse]);

  const onSendVerifyCode = useCallback(async () => {
    setVerifyError(null);
    setVerifySuccess(null);
    setVerifySendPending(true);
    try {
      const { data } = await postSendPhoneVerificationCode();
      applyMeResponse(data);
      setVerifySuccess(
        "Code sent. Enter the 6-digit code from your text message.",
      );
    } catch (err) {
      setVerifyError(messageFromAuthError(err, { forRegister: false }));
    } finally {
      setVerifySendPending(false);
    }
  }, [applyMeResponse]);

  const runVerifyCode = useCallback(async () => {
    setVerifyError(null);
    const digits = verifyCode.replace(/\D/g, "");
    if (digits.length !== 6) {
      setVerifyError("Enter the 6-digit code from your text message.");
      return;
    }
    setVerifySubmitPending(true);
    try {
      const { data } = await postVerifyPhoneCode(digits);
      const applied = applyMeResponse(data);
      if (!applied) {
        await refreshUser();
      }
      setVerifyCode("");
      setVerifySuccess("Phone verified. SMS reminders are fully enabled.");
    } catch (err) {
      setVerifyError(messageFromAuthError(err, { forRegister: false }));
    } finally {
      setVerifySubmitPending(false);
    }
  }, [verifyCode, applyMeResponse, refreshUser]);

  const onSmsTest = useCallback(async () => {
    setSmsTestError(null);
    setSmsTestOk(null);
    setSmsTestPending(true);
    try {
      await postSmsTest();
      setSmsTestOk("Test message sent. Check your phone.");
    } catch (err) {
      setSmsTestError(messageFromAuthError(err, { forRegister: false }));
    } finally {
      setSmsTestPending(false);
    }
  }, []);

  const onSave = useCallback(
    async (e) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);
      setSmsTestError(null);
      setSmsTestOk(null);
      setVerifyError(null);
      setVerifySuccess(null);
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
        const res = await patchCurrentUser(payload);
        if (!applyMeResponse(res.data)) {
          await refreshUser();
        }
        setSuccess("Saved.");
      } catch (err) {
        setError(messageFromAuthError(err, { forRegister: false }));
      } finally {
        setSaving(false);
      }
    },
    [form, refreshUser, applyMeResponse],
  );

  return (
    <Card className="animate-fade-up stagger-0">
      <Title>Settings</Title>
      <Lead>
        Update your name, phone, timezone, and SMS preferences. With SMS on, you
        verify your number once; if you change the number, you verify again.
        Toll-free sending in Twilio can still block delivery until your number is
        approved in Twilio Console.
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
          {user?.smsOptIn ? (
            <SmsSection>
              <SmsSectionTitle>SMS status</SmsSectionTitle>
              {!hasSavedSmsPhone(user) ? (
                <InfoBox>
                  Add a valid E.164 phone number above and save to use SMS, or turn
                  SMS reminders off.
                </InfoBox>
              ) : null}
              {needsPhoneVerification(user) ? (
                <>
                  <InfoBox>
                    Verify your number — we will text you a code. After Twilio
                    approves your toll-free sending number, test messages and daily
                    check-ins can deliver.
                  </InfoBox>
                  {verifyError ? <ErrorBox>{verifyError}</ErrorBox> : null}
                  {verifySuccess ? <SuccessBox>{verifySuccess}</SuccessBox> : null}
                  <TestSmsBtn
                    type="button"
                    onClick={onSendVerifyCode}
                    disabled={
                      saving || verifySendPending || verifySubmitPending
                    }
                  >
                    {verifySendPending ? "Sending…" : "Send verification code"}
                  </TestSmsBtn>
                  <VerifyCodeStack>
                    <Field>
                      <FieldLabel htmlFor="settings-sms-code">
                        Verification code
                      </FieldLabel>
                      <CodeInput
                        id="settings-sms-code"
                        name="sms_code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        maxLength={6}
                        placeholder="000000"
                        value={verifyCode}
                        onChange={(ev) =>
                          setVerifyCode(
                            ev.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        onKeyDown={(ev) => {
                          if (ev.key === "Enter") {
                            ev.preventDefault();
                            const ok =
                              verifyCode.replace(/\D/g, "").length === 6 &&
                              !saving &&
                              !verifySubmitPending;
                            if (ok) {
                              void runVerifyCode();
                            }
                          }
                        }}
                        disabled={saving || verifySubmitPending}
                      />
                    </Field>
                    <TestSmsBtn
                      type="button"
                      onClick={() => void runVerifyCode()}
                      disabled={
                        saving ||
                        verifySubmitPending ||
                        verifyCode.replace(/\D/g, "").length !== 6
                      }
                    >
                      {verifySubmitPending ? "Verifying…" : "Verify code"}
                    </TestSmsBtn>
                  </VerifyCodeStack>
                </>
              ) : null}
              {isSmsFullyEnabled(user) ? (
                <SmsTestBlock>
                  {smsTestError ? <ErrorBox>{smsTestError}</ErrorBox> : null}
                  {smsTestOk ? <SuccessBox>{smsTestOk}</SuccessBox> : null}
                  <TestSmsBtn
                    type="button"
                    onClick={onSmsTest}
                    disabled={saving || smsTestPending}
                  >
                    {smsTestPending ? "Sending…" : "Send test SMS"}
                  </TestSmsBtn>
                  <StyledFieldHint style={{ marginTop: 0 }}>
                    Uses the saved number on your profile. If sending fails, check
                    the error from the server — Twilio toll-free verification can
                    still block delivery until approved in Twilio Console.
                  </StyledFieldHint>
                </SmsTestBlock>
              ) : null}
            </SmsSection>
          ) : null}
          <SaveBtn type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </SaveBtn>
        </FormStack>
      )}
    </Card>
  );
}
