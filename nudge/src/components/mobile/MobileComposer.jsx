import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import { useAppShell } from "../../context/AppShellContext";

const TRAITS = [
  { id: "creative", label: "Creative", varName: "--trait-creative" },
  { id: "social", label: "Social", varName: "--trait-social" },
  { id: "analytical", label: "Analytical", varName: "--trait-analytical" },
  { id: "adventurous", label: "Adventurous", varName: "--trait-adventurous" },
  { id: "nurturing", label: "Nurturing", varName: "--trait-nurturing" },
  { id: "disciplined", label: "Disciplined", varName: "--trait-disciplined" },
];

const PROMPTS = [
  "What felt meaningful, even if it was small?",
  "Where did you show up for yourself today?",
  "What would you tell a friend who did what you did?",
];

const Overlay = styled.div`
  display: none;

  @media (max-width: 1023px) {
    display: ${(p) => (p.$open ? "flex" : "none")};
    position: fixed;
    inset: 0;
    z-index: 60;
    flex-direction: column;
    background: hsl(var(--background));
    padding-top: env(safe-area-inset-top, 0px);
  }
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.65rem 1rem;
  border-bottom: 1px solid hsl(var(--border) / 0.55);
  background: hsl(var(--background) / 0.95);
  backdrop-filter: blur(8px);
  min-height: 52px;
`;

const TopBtn = styled.button`
  border: none;
  background: transparent;
  font-family: var(--font-sans), sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  padding: 0.35rem 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: color 200ms ease, transform 200ms ease;

  &:hover {
    color: hsl(var(--foreground));
  }

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 2px;
  }
`;

const SaveBtn = styled(TopBtn)`
  color: hsl(var(--primary));
`;

const Body = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 1rem 1rem 0;
`;

const Inspire = styled.p`
  margin: 0 0 0.75rem;
  font-family: var(--font-display), serif;
  font-size: 1rem;
  font-style: italic;
  line-height: 1.45;
  color: hsl(var(--muted-foreground));
  text-wrap: balance;
`;

const TextArea = styled.textarea`
  flex: 1;
  width: 100%;
  min-height: 12rem;
  resize: none;
  border: none;
  border-radius: var(--radius);
  padding: 1rem;
  font-family: var(--font-sans), sans-serif;
  font-size: 15px;
  line-height: 1.625;
  color: hsl(var(--foreground));
  background: hsl(var(--card) / 0.5);
  box-shadow: inset 0 0 0 1px hsl(var(--border) / 0.4);

  &::placeholder {
    color: hsl(var(--muted-foreground));
  }

  &:focus {
    outline: none;
    box-shadow: inset 0 0 0 1px hsl(var(--primary) / 0.35),
      0 0 0 3px hsl(var(--primary) / 0.15);
  }
`;

const TraitBar = styled.div`
  flex-shrink: 0;
  padding: 0.75rem 0
    calc(0.85rem + env(safe-area-inset-bottom, 0px));
  border-top: 1px solid hsl(var(--border) / 0.45);
  background: hsl(var(--muted) / 0.35);
`;

const TraitLabel = styled.div`
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: hsl(var(--muted-foreground));
  margin: 0 1rem 0.5rem;
`;

const TraitScroll = styled.div`
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0 1rem 0.15rem;
  scroll-snap-type: x proximity;
  -webkit-overflow-scrolling: touch;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const TraitPill = styled.button`
  flex: 0 0 auto;
  scroll-snap-align: start;
  border: 1px solid hsl(var(--border) / 0.55);
  border-radius: 9999px;
  padding: 0.45rem 0.9rem;
  font-family: var(--font-sans), sans-serif;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  background: ${(p) =>
    p.$active
      ? `hsl(var(${p.$traitVar}) / 0.18)`
      : "hsl(var(--card) / 0.85)"};
  color: ${(p) =>
    p.$active ? `hsl(var(${p.$traitVar}))` : "hsl(var(--foreground))"};
  box-shadow: ${(p) =>
    p.$active ? `0 0 0 2px hsl(var(${p.$traitVar}) / 0.25)` : "none"};
  transition: transform 200ms ease, background 200ms ease, color 200ms ease;

  &:active {
    transform: scale(0.97);
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 2px;
  }
`;

export default function MobileComposer() {
  const { composerOpen, closeComposer, submitJournalEntry } = useAppShell();
  const [text, setText] = useState("");
  const [traitId, setTraitId] = useState(null);
  const [promptIx, setPromptIx] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (composerOpen) {
      setPromptIx(Math.floor(Math.random() * PROMPTS.length));
      setTraitId(null);
    }
  }, [composerOpen]);

  useEffect(() => {
    if (!composerOpen) {
      return undefined;
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [composerOpen]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) {
        closeComposer();
      }
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [closeComposer]);

  const handleClose = useCallback(() => {
    setText("");
    closeComposer();
  }, [closeComposer]);

  const handleSave = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || saving) {
      return;
    }
    setSaving(true);
    try {
      const ok = await submitJournalEntry(trimmed);
      if (ok) {
        setText("");
        closeComposer();
      }
    } finally {
      setSaving(false);
    }
  }, [
    text,
    saving,
    submitJournalEntry,
    closeComposer,
  ]);

  return (
    <Overlay $open={composerOpen} role="dialog" aria-modal="true" aria-label="Write">
      <TopBar>
        <TopBtn type="button" onClick={handleClose}>
          Close
        </TopBtn>
        <SaveBtn
          type="button"
          onClick={handleSave}
          disabled={!text.trim() || saving}
        >
          {saving ? "Saving…" : "Save"}
        </SaveBtn>
      </TopBar>
      <Body>
        <Inspire>{PROMPTS[promptIx]}</Inspire>
        <TextArea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Let the page hold whatever you want to remember…"
          autoComplete="off"
          aria-label="Journal entry"
        />
      </Body>
      <TraitBar>
        <TraitLabel>Mood / lens (optional)</TraitLabel>
        <TraitScroll>
          {TRAITS.map((t) => (
            <TraitPill
              key={t.id}
              type="button"
              $active={traitId === t.id}
              $traitVar={t.varName}
              onClick={() =>
                setTraitId((cur) => (cur === t.id ? null : t.id))
              }
            >
              {t.label}
            </TraitPill>
          ))}
        </TraitScroll>
      </TraitBar>
    </Overlay>
  );
}
