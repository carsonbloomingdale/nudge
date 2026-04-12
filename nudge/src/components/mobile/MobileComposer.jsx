import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import JournalAttachmentPicker from "../journal/JournalAttachmentPicker";
import { useAppShell } from "../../context/AppShellContext";
import {
  stashJournalDraftPendingConfirm,
  takeJournalDraftForSessionRecovery,
} from "../../model/journalPendingDraft";

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
  width: 100%;
  min-height: 10rem;
  max-height: 55vh;
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

export default function MobileComposer() {
  const {
    composerOpen,
    closeComposer,
    submitJournalEntry,
    composerSubmitLabel,
    consumeComposerDraftBootstrap,
  } = useAppShell();
  const [text, setText] = useState("");
  const [attachFiles, setAttachFiles] = useState([]);
  const [promptIx, setPromptIx] = useState(0);
  const [saving, setSaving] = useState(false);
  const textAreaRef = useRef(null);

  useEffect(() => {
    if (!composerOpen) {
      return;
    }
    setPromptIx(Math.floor(Math.random() * PROMPTS.length));
    const boot = consumeComposerDraftBootstrap();
    const recovered =
      boot ?? takeJournalDraftForSessionRecovery();
    if (recovered) {
      setText(recovered);
    }
    setAttachFiles([]);
  }, [composerOpen, consumeComposerDraftBootstrap]);

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

  useEffect(() => {
    const el = textAreaRef.current;
    if (!el) {
      return;
    }
    el.style.height = "auto";
    el.style.height = `${Math.max(el.scrollHeight, 160)}px`;
  }, [text, composerOpen]);

  const handleClose = useCallback(() => {
    setText("");
    setAttachFiles([]);
    closeComposer();
  }, [closeComposer]);

  const handleSave = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || saving) {
      return;
    }
    const filesToSubmit = [...attachFiles];
    setSaving(true);
    stashJournalDraftPendingConfirm(trimmed);
    try {
      const opts =
        filesToSubmit.length > 0 ? { files: filesToSubmit } : undefined;
      const ok = await submitJournalEntry(trimmed, opts);
      if (!ok) {
        throw new Error("Could not save right now. Your entry is still here.");
      }
      setText("");
      setAttachFiles([]);
      closeComposer();
    } catch (e) {
      const msg =
        e && typeof e === "object" && "message" in e && typeof e.message === "string"
          ? e.message
          : "Couldn't save your entry. Your text is still here.";
      window.alert(msg);
    } finally {
      setSaving(false);
    }
  }, [
    text,
    attachFiles,
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
          disabled={!text.trim() || saving || Boolean(composerSubmitLabel)}
        >
          {composerSubmitLabel ||
            (saving ? "Saving…" : "Save")}
        </SaveBtn>
      </TopBar>
      <Body>
        <Inspire>{PROMPTS[promptIx]}</Inspire>
        <TextArea
          ref={textAreaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Let the page hold whatever you want to remember…"
          autoComplete="off"
          aria-label="Journal entry"
        />
        <JournalAttachmentPicker
          files={attachFiles}
          onFilesChange={setAttachFiles}
          tight
        />
      </Body>
    </Overlay>
  );
}
