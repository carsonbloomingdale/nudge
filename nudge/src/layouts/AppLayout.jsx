import { Link, Outlet } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../auth/AuthContext";

function userInitial(user) {
  const raw = (user?.username || user?.email || "").trim();
  if (!raw) {
    return "?";
  }
  return raw[0].toUpperCase();
}

function GearIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: hsl(var(--background));
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.75rem 1rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: hsl(var(--background) / 0.8);
  border-bottom: 1px solid hsl(var(--border));

  @media (min-width: 640px) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
`;

const Brand = styled(Link)`
  font-family: var(--font-display), serif;
  font-size: 1.35rem;
  font-weight: 400;
  text-decoration: none;
  color: hsl(var(--foreground));
  letter-spacing: -0.02em;
  line-height: 1;

  &:hover {
    color: hsl(var(--primary));
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.45);
    outline-offset: 4px;
    border-radius: 4px;
  }
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AvatarLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 9999px;
  background: hsl(var(--primary) / 0.15);
  color: hsl(var(--primary));
  font-family: var(--font-sans), sans-serif;
  font-weight: 600;
  font-size: 0.875rem;
  text-decoration: none;
  transition: transform 200ms ease, box-shadow 200ms ease;

  &:hover {
    box-shadow: 0 4px 14px hsl(var(--primary) / 0.2);
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 2px;
  }
`;

const IconButton = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border) / 0.5);
  background: hsl(var(--card) / 0.8);
  color: hsl(var(--foreground));
  text-decoration: none;
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  transition: box-shadow 300ms ease, transform 200ms ease;

  &:hover {
    box-shadow: 0 4px 14px hsl(var(--foreground) / 0.08);
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.3);
    outline-offset: 2px;
  }
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
  max-width: 64rem;
  margin-left: auto;
  margin-right: auto;
  padding: 2rem 1rem 3rem;

  @media (min-width: 640px) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }
`;

const FooterNote = styled.p`
  margin: 2rem 0 0;
  font-size: 0.8125rem;
  color: hsl(var(--muted-foreground));
  text-align: center;
`;

export default function AppLayout() {
  const { user } = useAuth();
  const initial = userInitial(user);

  return (
    <Shell>
      <Header>
        <Brand to="/app">nudge</Brand>
        <NavActions>
          <AvatarLink
            to="/app/account"
            aria-label="Account information"
            title="Account"
          >
            {initial}
          </AvatarLink>
          <IconButton
            to="/app/settings"
            aria-label="Settings"
            title="Settings"
          >
            <GearIcon />
          </IconButton>
        </NavActions>
      </Header>
      <Main>
        <Outlet />
        <FooterNote>&copy; Carson Bloomingdale 2024</FooterNote>
      </Main>
    </Shell>
  );
}
