import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../auth/AuthContext";

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
  margin: 0 0 1.25rem;
`;

const Row = styled.div`
  margin-bottom: 1rem;

  &:last-of-type {
    margin-bottom: 0;
  }
`;

const Label = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: hsl(var(--muted-foreground));
  margin-bottom: 0.25rem;
`;

const Value = styled.div`
  font-size: 15px;
  color: hsl(var(--foreground));
  overflow-wrap: break-word;
`;

const LogoutBtn = styled.button`
  margin-top: 1.5rem;
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

  &:hover {
    box-shadow: 0 6px 20px hsl(var(--primary) / 0.25);
  }

  &:active {
    transform: scale(0.97);
  }
`;

function displayName(user) {
  if (!user) {
    return null;
  }
  return user.username || user.email || null;
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const name = displayName(user);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/auth/login", { replace: true });
  }, [logout, navigate]);

  return (
    <Card className="animate-fade-up stagger-0">
      <Title>Account</Title>
      <Row>
        <Label>Display name</Label>
        <Value>{name || "—"}</Value>
      </Row>
      <Row>
        <Label>Username</Label>
        <Value>{user?.username || "—"}</Value>
      </Row>
      <Row>
        <Label>Email</Label>
        <Value>{user?.email || "—"}</Value>
      </Row>
      <LogoutBtn type="button" onClick={handleLogout}>
        Log out
      </LogoutBtn>
    </Card>
  );
}
