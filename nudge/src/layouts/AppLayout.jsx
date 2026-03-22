import { Link, Outlet } from "react-router-dom";
import styled from "styled-components";
import { useAuth } from "../auth/AuthContext";
import BottomNav from "../components/mobile/BottomNav";
import MobileComposer from "../components/mobile/MobileComposer";
import { AppShellProvider, useAppShell } from "../context/AppShellContext";
import { displayUserAvatarLabel } from "../utils/userDisplay";

const LG = "1024px";

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
  gap: 0.65rem;
  min-height: 56px;
  padding: 0 0.875rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: hsl(var(--background) / 0.8);
  border-bottom: 1px solid hsl(var(--border));

  @media (min-width: ${LG}) {
    min-height: 64px;
    gap: 1rem;
    padding: 0 1.5rem;
  }
`;

const Brand = styled(Link)`
  flex-shrink: 0;
  font-family: var(--font-display), serif;
  font-size: 1.2rem;
  font-weight: 400;
  text-decoration: none;
  color: hsl(var(--foreground));
  letter-spacing: -0.02em;
  line-height: 1;

  @media (min-width: ${LG}) {
    font-size: 1.35rem;
  }

  &:hover {
    color: hsl(var(--primary));
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.45);
    outline-offset: 4px;
    border-radius: 4px;
  }
`;

const Spacer = styled.div`
  flex: 1;
  min-width: 0.5rem;
`;

const StreakPill = styled.div`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
  padding: 0.35rem 0.65rem;
  border-radius: 9999px;
  background: hsl(var(--accent) / 0.45);
  border: 1px solid hsl(var(--border) / 0.45);
  font-size: 0.75rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  line-height: 1;
  max-width: 42vw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  @media (min-width: ${LG}) {
    font-size: 0.8125rem;
    padding: 0.4rem 0.75rem;
    max-width: none;
  }
`;

const StreakNum = styled.span`
  font-variant-numeric: tabular-nums;
  color: hsl(var(--primary));
`;

const NavActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;

  @media (min-width: ${LG}) {
    gap: 0.5rem;
  }
`;

const AvatarLink = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.125rem;
  height: 2.125rem;
  border-radius: 9999px;
  background: hsl(var(--primary) / 0.15);
  color: hsl(var(--primary));
  font-family: var(--font-sans), sans-serif;
  font-weight: 600;
  font-size: ${(p) => (p.$compact ? "0.6875rem" : "0.8125rem")};
  letter-spacing: ${(p) => (p.$compact ? "-0.03em" : "normal")};
  text-decoration: none;
  transition: transform 200ms ease, box-shadow 200ms ease;

  @media (min-width: ${LG}) {
    width: 2.25rem;
    height: 2.25rem;
    font-size: ${(p) => (p.$compact ? "0.75rem" : "0.875rem")};
  }

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
  display: none;
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

  @media (min-width: ${LG}) {
    display: flex;
  }

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
  padding: 1.25rem 1rem 2rem;

  @media (max-width: 1023px) {
    padding-bottom: calc(5.25rem + env(safe-area-inset-bottom, 0px));
  }

  @media (min-width: 640px) {
    padding-left: 1.5rem;
    padding-right: 1.5rem;
  }

  @media (min-width: ${LG}) {
    padding: 2rem 1.5rem 3rem;
  }
`;

const FooterNote = styled.p`
  margin: 2rem 0 0;
  font-size: 0.8125rem;
  color: hsl(var(--muted-foreground));
  text-align: center;

  @media (max-width: 1023px) {
    display: none;
  }
`;

function AppLayoutInner() {
  const { user } = useAuth();
  const { streakCount } = useAppShell();
  const avatarLabel = displayUserAvatarLabel(user);
  const avatarCompact = avatarLabel.length > 1;
  const streakLabel =
    streakCount === 1 ? "day" : "days";

  return (
    <Shell>
      <Header>
        <Brand to="/app">nudge</Brand>
        <Spacer aria-hidden />
        <StreakPill title="Consecutive days you’ve logged something">
          <span aria-hidden>✦</span>
          <span>
            <StreakNum className="tabular-nums">{streakCount}</StreakNum>{" "}
            {streakLabel}
          </span>
        </StreakPill>
        <NavActions>
          <AvatarLink
            to="/app/account"
            aria-label="Profile and account"
            title="Profile"
            $compact={avatarCompact}
          >
            {avatarLabel}
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
      <BottomNav />
      <MobileComposer />
    </Shell>
  );
}

export default function AppLayout() {
  return (
    <AppShellProvider>
      <AppLayoutInner />
    </AppShellProvider>
  );
}
