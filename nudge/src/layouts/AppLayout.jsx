import { Link, Outlet } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import { useAuth } from "../auth/AuthContext";
import BottomNav from "../components/mobile/BottomNav";
import MobileComposer from "../components/mobile/MobileComposer";
import SupportMole from "../components/support/SupportMole";
import { AppShellProvider, useAppShell } from "../context/AppShellContext";
import {
  CUSTOM_UI_ACCENT_ID,
  getStoredUiAccentId,
  getStoredCustomUiAccentHex,
  setCustomUiAccentHex,
  setUiAccentById,
  UI_ACCENT_OPTIONS,
} from "../theme/uiAccent";
import { subscribeJournalReminderTap } from "../mobile/journalReminder";
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

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20h9" />
      <path d="m16.5 3.5 4 4L7 21l-4 1 1-4L16.5 3.5Z" />
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
  /* viewport-fit=cover: keep bar background to the top, but controls below notch/Dynamic Island */
  padding-top: env(safe-area-inset-top, 0px);
  padding-left: max(0.875rem, env(safe-area-inset-left, 0px));
  padding-right: max(0.875rem, env(safe-area-inset-right, 0px));
  padding-bottom: 0;
  min-height: calc(56px + env(safe-area-inset-top, 0px));
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  background: hsl(var(--background) / 0.8);
  border-bottom: 1px solid hsl(var(--border));

  @media (min-width: ${LG}) {
    min-height: calc(64px + env(safe-area-inset-top, 0px));
    gap: 1rem;
    padding-left: max(1.5rem, env(safe-area-inset-left, 0px));
    padding-right: max(1.5rem, env(safe-area-inset-right, 0px));
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

const AccentPickerWrap = styled.div`
  position: relative;
`;

const AccentTrigger = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.125rem;
  height: 2.125rem;
  border-radius: 9999px;
  border: 1px solid hsl(var(--border) / 0.65);
  background: hsl(var(--card) / 0.92);
  color: hsl(var(--foreground));
  padding: 0;
  cursor: pointer;
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 2px;
  }
`;

const AccentMenu = styled.div`
  position: absolute;
  top: calc(100% + 0.4rem);
  right: 0;
  z-index: 70;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.55rem;
  border-radius: 1rem;
  border: 1px solid hsl(var(--border) / 0.7);
  background: hsl(var(--card));
  box-shadow: 0 10px 24px hsl(var(--foreground) / 0.14);
`;

const AccentChoice = styled.button`
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 9999px;
  border: none;
  padding: 0;
  cursor: pointer;
  background: ${(p) =>
    p.$gradient
      ? "linear-gradient(145deg, #ff4fd8 0%, #7d6cff 22%, #35b1ff 45%, #29d7b0 68%, #ffe56c 100%)"
      : `hsl(${p.$hsl})`};
  box-shadow: ${(p) =>
    p.$active
      ? "0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--foreground) / 0.45)"
      : "0 1px 2px hsl(var(--foreground) / 0.2)"};
  transition: transform 180ms ease;

  &:active {
    transform: scale(0.94);
  }

  @media (max-width: 479px) {
    width: 2rem;
    height: 2rem;
  }
`;

const CustomAccentWrap = styled.div`
  position: relative;
`;

const CustomAccentMenu = styled.div`
  position: absolute;
  right: calc(100% + 0.45rem);
  top: 50%;
  transform: translateY(-50%);
  z-index: 80;
  padding: 0.55rem;
  border-radius: 0.8rem;
  border: 1px solid hsl(var(--border) / 0.75);
  background: hsl(var(--card));
  box-shadow: 0 10px 24px hsl(var(--foreground) / 0.14);
`;

const CustomHexForm = styled.form`
  display: flex;
  align-items: center;
  gap: 0.4rem;
`;

const CustomHexInput = styled.input`
  width: 5.8rem;
  height: 1.95rem;
  border-radius: 0.6rem;
  border: 1px solid hsl(var(--border) / 0.75);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 0 0.55rem;
  font-size: 0.75rem;
  font-family: var(--font-sans), sans-serif;

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 1px;
  }
`;

const CustomHexApply = styled.button`
  height: 1.95rem;
  border: 1px solid hsl(var(--border) / 0.75);
  border-radius: 0.6rem;
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  padding: 0 0.5rem;
  font-size: 0.7rem;
  font-weight: 600;
  font-family: var(--font-sans), sans-serif;
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
  const { streakCount, openComposer } = useAppShell();
  const [accentId, setAccentId] = useState(getStoredUiAccentId);
  const [customHex, setCustomHex] = useState(getStoredCustomUiAccentHex);
  const [accentMenuOpen, setAccentMenuOpen] = useState(false);
  const [customEditorOpen, setCustomEditorOpen] = useState(false);
  const accentWrapRef = useRef(null);
  const avatarLabel = displayUserAvatarLabel(user);
  const avatarCompact = avatarLabel.length > 1;
  const streakLabel =
    streakCount === 1 ? "day" : "days";
  const handleAccentPick = useCallback((id) => {
    const next = setUiAccentById(id);
    setAccentId(next.id);
    setCustomEditorOpen(false);
    setAccentMenuOpen(false);
  }, []);
  const handleCustomAccentApply = useCallback((event) => {
    event.preventDefault();
    const saved = setCustomUiAccentHex(customHex);
    if (saved) {
      setCustomHex(saved);
      setAccentId(CUSTOM_UI_ACCENT_ID);
      setCustomEditorOpen(false);
      setAccentMenuOpen(false);
    }
  }, [customHex]);
  useEffect(() => {
    if (!accentMenuOpen) {
      setCustomEditorOpen(false);
    }
  }, [accentMenuOpen]);

  useEffect(() => subscribeJournalReminderTap(openComposer), [openComposer]);

  useEffect(() => {
    if (!accentMenuOpen) {
      return undefined;
    }
    const onDocClick = (event) => {
      if (!accentWrapRef.current?.contains(event.target)) {
        setAccentMenuOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setAccentMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [accentMenuOpen]);

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
          <AccentPickerWrap ref={accentWrapRef}>
            <AccentTrigger
              type="button"
              aria-label="Edit accent color"
              aria-expanded={accentMenuOpen}
              aria-haspopup="menu"
              title="Edit accent color"
              onClick={() => setAccentMenuOpen((v) => !v)}
            >
              <PencilIcon />
            </AccentTrigger>
            {accentMenuOpen ? (
              <AccentMenu role="menu" aria-label="Accent colors">
                {UI_ACCENT_OPTIONS.map((option) => (
                  <AccentChoice
                    key={option.id}
                    type="button"
                    role="menuitemradio"
                    aria-label={`Use ${option.label} accent`}
                    aria-checked={accentId === option.id}
                    title={option.label}
                    $hsl={option.primary}
                    $active={accentId === option.id}
                    onClick={() => handleAccentPick(option.id)}
                  />
                ))}
                <CustomAccentWrap>
                  <AccentChoice
                    type="button"
                    role="menuitemradio"
                    aria-label="Use custom accent color"
                    aria-checked={accentId === CUSTOM_UI_ACCENT_ID}
                    title="Custom color"
                    $gradient
                    $active={accentId === CUSTOM_UI_ACCENT_ID}
                    onClick={() => setCustomEditorOpen((v) => !v)}
                  />
                  {customEditorOpen ? (
                    <CustomAccentMenu>
                      <CustomHexForm onSubmit={handleCustomAccentApply}>
                        <CustomHexInput
                          type="text"
                          inputMode="text"
                          aria-label="Custom hex color"
                          placeholder="#7c5cff"
                          value={customHex}
                          onChange={(event) => setCustomHex(event.target.value)}
                        />
                        <CustomHexApply type="submit">Apply</CustomHexApply>
                      </CustomHexForm>
                    </CustomAccentMenu>
                  ) : null}
                </CustomAccentWrap>
              </AccentMenu>
            ) : null}
          </AccentPickerWrap>
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
      <SupportMole />
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
