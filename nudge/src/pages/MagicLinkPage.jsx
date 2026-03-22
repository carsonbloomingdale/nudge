import { Link } from "react-router-dom";
import {
  StyledHeader,
  StyledMain,
  StyledMuted,
  AuthLegalNote,
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
            Magic link sign-in isn&apos;t available yet. Use password sign-in
            instead.
          </StyledMuted>
          <AuthLinks>
            <Link to="/auth/login">Back to sign in</Link>
            <Link to="/auth/signup">Create an account</Link>
          </AuthLinks>
          <AuthLegalNote>
            <Link to="/terms">Terms &amp; Conditions</Link>
          </AuthLegalNote>
        </StyledMain>
      </header>
    </div>
  );
}
