import { NavLink } from "react-router-dom";
import styled from "styled-components";
import { useAppShell } from "../../context/AppShellContext";
import { FeaturePreviewBadge } from "../ui/FeaturePreviewBadge";

const LG = "1024px";

const NavRoot = styled.nav`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.25rem;
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 40;
  padding: 0.35rem 0.75rem
    calc(0.5rem + env(safe-area-inset-bottom, 0px));
  background: hsl(var(--background) / 0.92);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-top: 1px solid hsl(var(--border) / 0.6);
  box-shadow: 0 -4px 24px hsl(var(--foreground) / 0.06);

  @media (min-width: ${LG}) {
    display: none;
  }
`;

const SidePair = styled.div`
  display: flex;
  flex: 1;
  justify-content: space-around;
  align-items: flex-end;
  min-width: 0;
`;

const TabLink = styled(NavLink)`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 0.2rem;
  min-width: 0;
  padding: 0.35rem 0.2rem 0.15rem;
  text-decoration: none;
  color: hsl(var(--muted-foreground));
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: color 200ms ease, transform 200ms ease;

  svg {
    width: 22px;
    height: 22px;
    stroke-width: 2;
    flex-shrink: 0;
  }

  &.active {
    color: hsl(var(--foreground));
    transform: scale(1.04);
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.4);
    outline-offset: 2px;
    border-radius: 8px;
  }
`;

const Dot = styled.span`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: hsl(var(--primary));
  opacity: 0;
  transform: scale(0.5);
  transition: opacity 200ms ease, transform 200ms ease;
  margin-bottom: 1px;

  ${TabLink}.active & {
    opacity: 1;
    transform: scale(1);
  }
`;

const TabLabel = styled.span`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.12rem;
  min-width: 0;
  line-height: 1.1;
`;

const FabWrap = styled.div`
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: -1rem;
  padding: 0 0.25rem;
`;

const FabButton = styled.button`
  width: 56px;
  height: 56px;
  border-radius: 1rem;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--primary));
  color: white;
  box-shadow: 0 6px 20px hsl(var(--primary) / 0.35);
  transition: box-shadow 200ms ease, transform 200ms ease;

  svg {
    width: 26px;
    height: 26px;
    stroke-width: 2.2;
  }

  &:hover {
    box-shadow: 0 8px 26px hsl(var(--primary) / 0.4);
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.45);
    outline-offset: 3px;
  }
`;

function IconHome() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 10v10h14V10" />
    </svg>
  );
}

function IconSpark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="M12 3v3M12 18v3M4.2 12H7M17 12h2.8M6.3 6.3l2.1 2.1M15.6 15.6l2.1 2.1M6.3 17.7l2.1-2.1M15.6 8.4l2.1-2.1" />
      <circle cx="12" cy="12" r="3.5" />
    </svg>
  );
}

function IconTarget() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IconPen() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export default function BottomNav() {
  const { openComposer } = useAppShell();

  return (
    <NavRoot aria-label="Primary">
      <SidePair>
        <TabLink to="/app" end>
          <IconHome />
          Home
          <Dot aria-hidden />
        </TabLink>
        <TabLink to="/app/insights">
          <IconSpark />
          <TabLabel>
            <span>Insights</span>
            <FeaturePreviewBadge compact />
          </TabLabel>
          <Dot aria-hidden />
        </TabLink>
      </SidePair>
      <FabWrap>
        <FabButton
          type="button"
          onClick={openComposer}
          aria-label="Write — open journal"
        >
          <IconPen />
        </FabButton>
      </FabWrap>
      <SidePair>
        <TabLink to="/app/goals">
          <IconTarget />
          <TabLabel>
            <span>Goals</span>
            <FeaturePreviewBadge compact />
          </TabLabel>
          <Dot aria-hidden />
        </TabLink>
        <TabLink to="/app/account">
          <IconUser />
          Profile
          <Dot aria-hidden />
        </TabLink>
      </SidePair>
    </NavRoot>
  );
}
