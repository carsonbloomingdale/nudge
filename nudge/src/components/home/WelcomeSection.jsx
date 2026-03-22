import styled from "styled-components";

const LG = "1024px";

const Section = styled.section`
  margin-bottom: 2rem;
  min-height: 4.5rem;
`;

const Title = styled.h1`
  margin: 0;
  font-family: var(--font-display), serif;
  font-size: 1.875rem;
  line-height: 1.12;
  font-weight: 400;
  text-wrap: balance;
  color: hsl(var(--foreground));

  @media (min-width: ${LG}) {
    font-size: 2.25rem;
  }
`;

const Sub = styled.p`
  margin: 0.5rem 0 0;
  font-family: var(--font-sans), sans-serif;
  font-size: 1.125rem;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
  text-wrap: pretty;
  max-width: 42rem;
`;

export default function WelcomeSection() {
  return (
    <Section className="animate-fade-up stagger-0" aria-labelledby="home-welcome-title">
      <Title id="home-welcome-title">Welcome back</Title>
      <Sub>
        A quiet corner to notice what you did — one line at a time, no pressure
        to perform.
      </Sub>
    </Section>
  );
}
