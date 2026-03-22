import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../auth/AuthContext";
import { fetchAuthenticatedTasks } from "../api/taskApi";
import { useAppShell } from "../context/AppShellContext";

const LG = "1024px";

const Card = styled.section`
  border-radius: var(--radius);
  padding: 1.5rem;
  background: hsl(var(--card) / 0.8);
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  max-width: 28rem;
  margin: 0 auto;

  @media (max-width: 1023px) {
    max-width: none;
    margin: 0;
    padding: 1.25rem;
  }
`;

const ProfileHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.25rem;
`;

const AvatarBig = styled.div`
  flex-shrink: 0;
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--primary) / 0.15);
  color: hsl(var(--primary));
  font-family: var(--font-sans), sans-serif;
  font-weight: 700;
  font-size: 1.25rem;

  @media (max-width: 1023px) {
    width: 3.75rem;
    height: 3.75rem;
    font-size: 1.4rem;
  }
`;

const ProfileText = styled.div`
  min-width: 0;
`;

const Title = styled.h1`
  margin: 0 0 0.2rem;
  font-size: 1.35rem;

  @media (min-width: ${LG}) {
    font-size: 1.5rem;
  }
`;

const Subtitle = styled.p`
  margin: 0;
  font-size: 14px;
  color: hsl(var(--muted-foreground));
  overflow-wrap: break-word;
`;

const StatsScroll = styled.div`
  display: flex;
  overflow-x: auto;
  gap: 0.65rem;
  margin-bottom: 1.25rem;
  padding-bottom: 0.25rem;
  scroll-snap-type: x mandatory;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: hsl(var(--border));
    border-radius: 4px;
  }
`;

const StatChip = styled.div`
  flex: 0 0 140px;
  width: 140px;
  scroll-snap-align: start;
  border-radius: var(--radius);
  padding: 0.85rem 0.9rem;
  background: hsl(var(--muted) / 0.4);
  border: 1px solid hsl(var(--border) / 0.45);
`;

const StatLabel = styled.div`
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: hsl(var(--muted-foreground));
  margin-bottom: 0.35rem;
`;

const StatValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  color: hsl(var(--foreground));
`;

const SettingsLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.85rem 1rem;
  margin-bottom: 1rem;
  border-radius: var(--radius);
  text-decoration: none;
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border) / 0.5);
  background: hsl(var(--background) / 0.5);
  font-size: 15px;
  font-weight: 600;
  transition: box-shadow 300ms ease, transform 200ms ease;

  @media (min-width: ${LG}) {
    display: none;
  }

  &:hover {
    box-shadow: 0 4px 14px hsl(var(--foreground) / 0.08);
  }

  &:active {
    transform: scale(0.99);
  }

  span:last-child {
    color: hsl(var(--muted-foreground));
    font-size: 1.1rem;
  }
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

function userInitial(user) {
  const raw = (user?.username || user?.email || "").trim();
  if (!raw) {
    return "?";
  }
  return raw[0].toUpperCase();
}

export default function AccountPage() {
  const { user, logout } = useAuth();
  const { streakCount } = useAppShell();
  const navigate = useNavigate();
  const name = displayName(user);
  const initial = userInitial(user);
  const [momentCount, setMomentCount] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchAuthenticatedTasks();
        if (!cancelled) {
          setMomentCount(list.length);
        }
      } catch {
        if (!cancelled) {
          setMomentCount(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/auth/login", { replace: true });
  }, [logout, navigate]);

  const moments = momentCount ?? "—";

  return (
    <Card className="animate-fade-up stagger-0">
      <ProfileHeader>
        <AvatarBig aria-hidden>{initial}</AvatarBig>
        <ProfileText>
          <Title>Profile</Title>
          <Subtitle>{name || "Signed in"}</Subtitle>
        </ProfileText>
      </ProfileHeader>

      <StatsScroll aria-label="Your stats">
        <StatChip>
          <StatLabel>Streak</StatLabel>
          <StatValue className="tabular-nums">{streakCount}</StatValue>
        </StatChip>
        <StatChip>
          <StatLabel>Moments</StatLabel>
          <StatValue className="tabular-nums">{moments}</StatValue>
        </StatChip>
        <StatChip>
          <StatLabel>Account</StatLabel>
          <StatValue style={{ fontSize: "0.95rem" }}>Active</StatValue>
        </StatChip>
      </StatsScroll>

      <SettingsLink to="/app/settings">
        Settings
        <span aria-hidden>→</span>
      </SettingsLink>

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
