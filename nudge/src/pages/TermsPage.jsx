import { Link } from "react-router-dom";
import styled from "styled-components";
import { AuthLinks, StyledMain } from "../components/auth/authStyles";

const TermsMain = styled(StyledMain)`
  max-width: min(42rem, 100%);
  align-items: stretch;
  text-align: left;
`;

const TermsTitle = styled.h1`
  margin: 0 0 0.35rem;
  font-family: var(--font-sans), sans-serif;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
  width: 100%;
`;

const Effective = styled.p`
  margin: 0 0 0.75rem;
  text-align: center;
  font-size: 13px;
  color: hsl(var(--muted-foreground));
`;

const Section = styled.section`
  margin-top: 1.25rem;

  &:first-of-type {
    margin-top: 0.5rem;
  }
`;

const SectionHeading = styled.h2`
  margin: 0 0 0.45rem;
  font-size: 1rem;
  font-weight: 600;
`;

const SectionBody = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.65;
  color: hsl(var(--foreground));
  text-wrap: pretty;
`;

export default function TermsPage() {
  return (
    <div className="App">
      <header className="App-header">
        <TermsMain>
          <TermsTitle>Terms &amp; Conditions</TermsTitle>
          <Effective>Effective as of March 22, 2025</Effective>

          <Section>
            <SectionHeading>Agreement</SectionHeading>
            <SectionBody>
              By accessing or using Nudge, you agree to these terms. If you do
              not agree, do not use the service.
            </SectionBody>
          </Section>

          <Section>
            <SectionHeading>Use of the service</SectionHeading>
            <SectionBody>
              You may use Nudge only in compliance with applicable laws and
              these terms. You are responsible for activity under your account
              and for keeping your login credentials secure.
            </SectionBody>
          </Section>

          <Section>
            <SectionHeading>Accounts</SectionHeading>
            <SectionBody>
              You must provide accurate information when you register. We may
              suspend or terminate accounts that violate these terms or that we
              reasonably believe pose a risk to the service or other users.
            </SectionBody>
          </Section>

          <Section>
            <SectionHeading>Disclaimer</SectionHeading>
            <SectionBody>
              Nudge is provided &quot;as is&quot; without warranties of any
              kind, express or implied, to the fullest extent permitted by law.
              We do not guarantee uninterrupted or error-free operation.
            </SectionBody>
          </Section>

          <Section>
            <SectionHeading>Limitation of liability</SectionHeading>
            <SectionBody>
              To the maximum extent permitted by law, we are not liable for any
              indirect, incidental, special, consequential, or punitive
              damages, or any loss of profits or data, arising from your use of
              Nudge.
            </SectionBody>
          </Section>

          <Section>
            <SectionHeading>Changes</SectionHeading>
            <SectionBody>
              We may update these terms from time to time. Continued use after
              changes means you accept the revised terms. Material changes may
              be communicated through the app or by email where appropriate.
            </SectionBody>
          </Section>

          <Section>
            <SectionHeading>Contact</SectionHeading>
            <SectionBody>
              For questions about these terms, contact us through the support
              channel listed in the app or on our website.
            </SectionBody>
          </Section>

          <AuthLinks style={{ marginTop: "1.25rem" }}>
            <Link to="/">Home</Link>
            <Link to="/auth/login">Sign in</Link>
          </AuthLinks>
        </TermsMain>
      </header>
    </div>
  );
}
