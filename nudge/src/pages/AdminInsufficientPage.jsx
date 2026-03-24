import styled from "styled-components";

const Card = styled.section`
  max-width: 36rem;
  margin: 0 auto;
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border) / 0.6);
  background: hsl(var(--card) / 0.85);
  padding: 1.25rem;
`;

export default function AdminInsufficientPage() {
  return (
    <Card>
      <h1 style={{ margin: "0 0 0.5rem" }}>Insufficient permissions</h1>
      <p style={{ margin: 0, color: "hsl(var(--muted-foreground))" }}>
        You do not have access to admin tools on this account.
      </p>
    </Card>
  );
}
