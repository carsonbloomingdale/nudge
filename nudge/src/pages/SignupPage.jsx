import { useCallback, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { SessionVerificationError } from "../auth/sessionErrors";
import { messageFromAuthError, register } from "../api/authApi";
import AuthLoginPitch from "../components/auth/AuthLoginPitch";
import TimeZoneInput from "../components/profile/TimeZoneInput";
import {
  StyledAuthFormTitle,
  StyledAuthSubmitBtn,
  StyledCheckboxRow,
  StyledColumnForm,
  StyledError,
  StyledFieldHint,
  StyledInput,
  StyledMain,
  StyledMuted,
  StyledOptionalHeading,
  StyledSecondaryBtn,
  AuthLinks,
} from "../components/auth/authStyles";
import {
  buildRegisterOptionalPayload,
  getBrowserTimeZone,
  isE164Phone,
  stripPhoneForSubmit,
} from "../utils/profileFields";

const MIN_PASSWORD = 8;

export default function SignupPage() {
  const { establishSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const paramUsername = searchParams.get("username") ?? "";

  const [username, setUsername] = useState(paramUsername);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [timezone, setTimezone] = useState(() => getBrowserTimeZone() ?? "");
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const u = username.trim();
      const em = email.trim();
      if (!u) {
        setError("Choose a username.");
        return;
      }
      if (!em) {
        setError("Enter your email.");
        return;
      }
      if (password.length < MIN_PASSWORD) {
        setError(`Password must be at least ${MIN_PASSWORD} characters.`);
        return;
      }
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
      if (!agreeTerms) {
        setError("Agree to the Terms & Conditions to create an account.");
        return;
      }
      const phoneStripped = stripPhoneForSubmit(phone);
      if (phoneStripped && !isE164Phone(phone)) {
        setError(
          "Phone must be in E.164 format: + and country code, then digits only (for example +15551234567).",
        );
        return;
      }
      if (smsOptIn && !isE164Phone(phone)) {
        setError("To receive SMS, enter a valid E.164 phone number (for example +15551234567).");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const optional = buildRegisterOptionalPayload({
          firstName,
          lastName,
          phone,
          timezone,
          smsOptIn,
        });
        const res = await register({
          username: u,
          email: em,
          password,
          ...optional,
        });
        await establishSession(res);
        const wantsSmsVerify = smsOptIn && isE164Phone(phone);
        if (wantsSmsVerify) {
          navigate("/app/settings", {
            replace: true,
            state: { verifySmsAfterSignup: true },
          });
        } else {
          const to = location.state?.from ?? "/app";
          navigate(to, { replace: true });
        }
      } catch (err) {
        if (err instanceof SessionVerificationError) {
          setError(err.message);
        } else {
          setError(messageFromAuthError(err, { forRegister: true }));
        }
      } finally {
        setLoading(false);
      }
    },
    [
      username,
      email,
      password,
      confirm,
      firstName,
      lastName,
      phone,
      timezone,
      smsOptIn,
      agreeTerms,
      establishSession,
      navigate,
      location,
    ],
  );

  return (
    <div className="App">
      <header className="App-header">
        <StyledMain>
          <AuthLoginPitch showIcons={false} />
          <StyledAuthFormTitle id="signup-form-heading">
            Create account
          </StyledAuthFormTitle>
          <StyledMuted>
            Choose a username, your email, and a password (at least{" "}
            {MIN_PASSWORD} characters). Everything below is optional.
          </StyledMuted>
          {error ? <StyledError>{error}</StyledError> : null}
          <StyledColumnForm
            aria-labelledby="signup-form-heading"
            onSubmit={onSubmit}
          >
            <StyledInput
              name="username"
              value={username}
              onChange={(ev) => setUsername(ev.target.value)}
              autoComplete="username"
              placeholder="Username"
            />
            <StyledInput
              type="email"
              name="email"
              value={email}
              onChange={(ev) => setEmail(ev.target.value)}
              autoComplete="email"
              placeholder="Email"
            />
            <StyledInput
              type="password"
              name="password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              autoComplete="new-password"
              placeholder="Password"
            />
            <StyledInput
              type="password"
              name="confirm"
              value={confirm}
              onChange={(ev) => setConfirm(ev.target.value)}
              autoComplete="new-password"
              placeholder="Confirm password"
            />
            <StyledCheckboxRow>
              <input
                type="checkbox"
                name="accept_terms"
                checked={agreeTerms}
                onChange={(ev) => setAgreeTerms(ev.target.checked)}
                required
              />
              <span>
                I agree to the{" "}
                <Link to="/terms" onClick={(e) => e.stopPropagation()}>
                  Terms &amp; Conditions
                </Link>
              </span>
            </StyledCheckboxRow>
            <StyledOptionalHeading id="signup-optional-heading">
              Profile &amp; SMS (optional)
            </StyledOptionalHeading>
            <StyledInput
              name="first_name"
              value={firstName}
              onChange={(ev) => setFirstName(ev.target.value)}
              autoComplete="given-name"
              placeholder="First name"
              aria-describedby="signup-optional-heading"
            />
            <StyledInput
              name="last_name"
              value={lastName}
              onChange={(ev) => setLastName(ev.target.value)}
              autoComplete="family-name"
              placeholder="Last name"
            />
            <div style={{ width: "100%", maxWidth: 320 }}>
              <StyledInput
                type="tel"
                name="phone"
                value={phone}
                onChange={(ev) => setPhone(ev.target.value)}
                autoComplete="tel"
                placeholder="Phone (E.164, e.g. +15551234567)"
              />
              <StyledFieldHint>
                Include country code with +. Used only for SMS if you opt in.
              </StyledFieldHint>
            </div>
            <TimeZoneInput
              value={timezone}
              onChange={setTimezone}
              disabled={loading}
            />
            <StyledFieldHint style={{ marginTop: 0 }}>
              Prefilled from your device when possible — change it if that’s not
              your usual timezone. You can also pick from suggestions or type a
              valid IANA name.
            </StyledFieldHint>
            <StyledCheckboxRow>
              <input
                type="checkbox"
                name="sms_opt_in"
                checked={smsOptIn}
                onChange={(ev) => setSmsOptIn(ev.target.checked)}
              />
              <span>
                <strong>SMS reminders</strong> — I agree to receive automated
                text messages from Nudge about my account and tasks. Message
                frequency varies. Message and data rates may apply. I can opt
                out anytime in settings. Phone number is stored securely and
                used only for these messages. After you create your account,
                you will verify your number with a one-time code before SMS is
                fully on.
              </span>
            </StyledCheckboxRow>
            <StyledAuthSubmitBtn type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </StyledAuthSubmitBtn>
          </StyledColumnForm>
          <StyledSecondaryBtn
            type="button"
            disabled={loading}
            onClick={() => navigate("/auth/login")}
          >
            Back to sign in
          </StyledSecondaryBtn>
          <AuthLinks>
            <Link to="/auth/magic">Magic link (coming soon)</Link>
          </AuthLinks>
        </StyledMain>
      </header>
    </div>
  );
}
