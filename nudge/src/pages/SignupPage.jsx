import { useCallback, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import { register } from "../api/authApi";
import AuthLoginPitch from "../components/auth/AuthLoginPitch";
import {
  StyledAuthFormTitle,
  StyledAuthSubmitBtn,
  StyledColumnForm,
  StyledError,
  StyledInput,
  StyledMain,
  StyledMuted,
  StyledSecondaryBtn,
  AuthLinks,
} from "../components/auth/authStyles";

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
      setError(null);
      setLoading(true);
      try {
        const res = await register({
          username: u,
          email: em,
          password,
        });
        await establishSession(res);
        const to = location.state?.from ?? "/app";
        navigate(to, { replace: true });
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 409) {
          setError("That username or email is already registered.");
        } else if (axios.isAxiosError(err) && err.response?.status === 422) {
          setError("Invalid details. Check username, email, and password.");
        } else if (axios.isAxiosError(err) && err.response?.status === 503) {
          setError("Registration is temporarily unavailable. Try again later.");
        } else {
          setError("Could not create your account. Try again.");
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
            {MIN_PASSWORD} characters).
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
