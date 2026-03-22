import styled from "styled-components";

const Card = styled.section`
  border-radius: var(--radius);
  padding: 1.5rem;
  background: hsl(var(--card) / 0.8);
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  max-width: 28rem;
  margin: 0 auto;
`;

const Title = styled.h1`
  margin: 0 0 0.75rem;
`;

const Muted = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.625;
  color: hsl(var(--muted-foreground));
  overflow-wrap: break-word;
`;

export default function SettingsPage() {
  return (
    <Card className="animate-fade-up stagger-0">
      <Title>Settings</Title>
      <Muted>
        Preferences and notifications will live here. For now, use the account
        page for your profile and sign out.
      </Muted>
    </Card>
  );
}
