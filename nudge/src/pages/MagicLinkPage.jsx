import { Link } from "react-router-dom";
import {
  StyledHeader,
  StyledMain,
  StyledMuted,
  AuthLinks,
} from "../components/auth/authStyles";

/**
 * Placeholder for future magic-link auth (email + token flow on the backend).
 */
export default function MagicLinkPage() {
  return (
    <div className="App">
      <header className="App-header">
        <StyledMain>
          <StyledHeader>Magic link</StyledHeader>
          <StyledMuted>
            Email-based magic link is not implemented on the API yet (see
            backend docs/AUTH.md). The live app uses password sign-in with
            HTTP-only cookies instead.
          </StyledMuted>
          <AuthLinks>
            <Link to="/auth/login">Back to sign in</Link>
            <Link to="/auth/signup">Create an account</Link>
          </AuthLinks>
        </StyledMain>
      </header>
    </div>
  );
}
