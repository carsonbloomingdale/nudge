import { useCallback, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import { login } from "../api/authApi";
import AuthLoginPitch from "../components/auth/AuthLoginPitch";
import {
  StyledAuthFormTitle,
  StyledAuthSubmitBtn,
  StyledColumnForm,
  StyledError,
  StyledInput,
  StyledMain,
  AuthLinks,
} from "../components/auth/authStyles";

export default function LoginPage() {
  const { establishSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const notice = searchParams.get("notice");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(notice || null);
  const [loading, setLoading] = useState(false);

  const onSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      const id = identifier.trim();
      if (!id) {
        setError("Enter your username or email.");
        return;
      }
      if (!password) {
        setError("Enter your password.");
        return;
      }
      setError(null);
      setLoading(true);
      try {
        const body = { password };
        if (id.includes("@")) {
          body.email = id;
        } else {
          body.username = id;
        }
        const res = await login(body);
        await establishSession(res);
        const to = location.state?.from ?? "/app";
        navigate(to, { replace: true });
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          setError("Invalid username/email or password.");
        } else if (axios.isAxiosError(err) && err.response?.status === 503) {
          setError("Sign-in is temporarily unavailable. Try again later.");
        } else {
          setError("Could not sign in. Check your connection and try again.");
        }
      } finally {
        setLoading(false);
      }
    },
    [identifier, password, establishSession, navigate, location],
  );

  return (
    <div className="App">
      <header className="App-header">
        <StyledMain>
          <AuthLoginPitch />
          <StyledAuthFormTitle id="login-form-heading">Sign in</StyledAuthFormTitle>
          {error ? <StyledError>{error}</StyledError> : null}
          <StyledColumnForm
            aria-labelledby="login-form-heading"
            onSubmit={onSubmit}
          >
            <StyledInput
              name="identifier"
              value={identifier}
              onChange={(ev) => setIdentifier(ev.target.value)}
              autoComplete="username"
              placeholder="Username or email"
            />
            <StyledInput
              type="password"
              name="password"
              value={password}
              onChange={(ev) => setPassword(ev.target.value)}
              autoComplete="current-password"
              placeholder="Password"
            />
            <StyledAuthSubmitBtn type="submit" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </StyledAuthSubmitBtn>
          </StyledColumnForm>
          <AuthLinks>
            <Link to="/auth/signup">Create an account</Link>
            <Link to="/auth/magic">Sign in with magic link</Link>
          </AuthLinks>
        </StyledMain>
      </header>
    </div>
  );
}
