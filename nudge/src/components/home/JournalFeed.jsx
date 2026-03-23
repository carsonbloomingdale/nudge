import { useCallback, useState } from "react";
import styled, { keyframes } from "styled-components";
import {
  deleteJournal,
  deleteJournalAttachment,
  patchJournalNote,
} from "../../api/journalApi";
import { uploadJournalAttachments } from "../../api/uploadJournalAttachments";
import JournalAttachmentPicker from "../journal/JournalAttachmentPicker";
import { journalLatestIso } from "../../model/journal";
import { formatReflectionTime } from "./traitUtils";

const SectionTitle = styled.h2`
  margin: 0 0 0.35rem;
  font-family: var(--font-display), serif;
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.25;
  color: hsl(var(--foreground));
`;

const Sub = styled.p`
  margin: 0 0 1rem;
  font-size: 13px;
  line-height: 1.45;
  color: hsl(var(--muted-foreground));
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Card = styled.article`
  border-radius: 0.5rem;
  padding: 1.1rem 1.25rem;
  background: hsl(var(--card) / 0.8);
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
`;

const Top = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
`;

const Time = styled.time`
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  font-variant-numeric: tabular-nums;
`;

const EntryBlock = styled.div`
  position: relative;
  margin: 0 0 0.65rem;

  @media (hover: hover) {
    &:hover .entry-hint {
      opacity: 1;
    }
  }
`;

const EntryHint = styled.span`
  position: absolute;
  top: 0;
  right: 0;
  font-size: 11px;
  font-weight: 500;
  color: hsl(var(--muted-foreground));
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms ease;

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/** Journal `note`: what you wrote — click to edit inline. */
const EntryTrigger = styled.button`
  display: block;
  width: 100%;
  margin: 0;
  padding: 0.45rem 0.65rem;
  text-align: left;
  font-size: 15px;
  line-height: 1.6;
  font-family: var(--font-sans), sans-serif;
  color: hsl(var(--foreground) / 0.9);
  white-space: pre-wrap;
  background: transparent;
  border: none;
  border-radius: 0.35rem;
  cursor: pointer;
  transition: background 150ms ease, box-shadow 150ms ease;

  &:hover:not(:disabled) {
    background: hsl(var(--muted) / 0.2);
    box-shadow: inset 0 0 0 1px hsl(var(--border) / 0.5);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.45);
    outline-offset: 2px;
  }
`;

/** Enriched line context (task) — secondary to journal note */
const InsightMeta = styled.p`
  margin: 0 0 0.65rem;
  font-size: 13px;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.65rem;
  border-top: 1px solid hsl(var(--border) / 0.45);
`;

const Btn = styled.button`
  height: 2rem;
  padding: 0 0.75rem;
  border-radius: 0.45rem;
  font-size: 0.8125rem;
  font-family: var(--font-sans), sans-serif;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid hsl(var(--border) / 0.55);
  background: hsl(var(--background) / 0.6);
  color: hsl(var(--foreground));
  transition: background 200ms ease;

  &:hover {
    background: hsl(var(--muted) / 0.35);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 2px;
  }
`;

const DangerBtn = styled(Btn)`
  border-color: hsl(var(--border));
  color: hsl(var(--muted-foreground));

  &:hover {
    color: hsl(var(--foreground));
    background: hsl(var(--foreground) / 0.06);
  }
`;

const EditShell = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0 0 0.75rem;
  padding: 0.85rem 1rem;
  border-radius: 0.55rem;
  border: 1px solid hsl(var(--primary) / 0.38);
  background: hsl(var(--primary) / 0.07);
  box-shadow:
    inset 0 0 0 1px hsl(var(--border) / 0.35),
    0 1px 3px hsl(var(--foreground) / 0.05);
  min-height: 10rem;
`;

const EditFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid hsl(var(--border) / 0.45);
`;

const EditPhotos = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.85rem;
  padding-top: 0.85rem;
  border-top: 1px dashed hsl(var(--border) / 0.5);
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 4rem;
  margin-bottom: 0.5rem;
  padding: 0.6rem 0.75rem;
  border-radius: 0.45rem;
  font-size: 14px;
  font-family: var(--font-sans), sans-serif;
  border: 1px solid hsl(var(--border) / 0.55);
  background: hsl(var(--background) / 0.7);
  color: hsl(var(--foreground));
  resize: vertical;

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px hsl(var(--primary) / 0.25);
  }
`;

const EditTextArea = styled(TextArea)`
  margin-bottom: 0;
  flex: 1;
  min-height: 10rem;
`;

const AttachRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.5rem;
`;

const AttachCell = styled.div`
  position: relative;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.35rem;
  overflow: visible;
  flex-shrink: 0;

  @media (hover: hover) {
    &:hover .photo-remove {
      opacity: 1;
    }
  }
`;

const AttachThumb = styled.a`
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 0.35rem;
  overflow: hidden;
  box-shadow: 0 0 0 1px hsl(var(--border) / 0.45);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const PhotoRemoveBtn = styled.button`
  position: absolute;
  top: -0.25rem;
  right: -0.25rem;
  z-index: 1;
  width: 1.35rem;
  height: 1.35rem;
  padding: 0;
  border: none;
  border-radius: 50%;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  color: hsl(var(--background));
  background: hsl(var(--foreground) / 0.82);
  box-shadow: 0 1px 3px hsl(var(--foreground) / 0.25);
  opacity: 0;
  transition: opacity 120ms ease, background 120ms ease;

  &:hover:not(:disabled) {
    background: hsl(0 55% 40%);
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    opacity: 1;
    outline: 2px solid hsl(var(--primary));
    outline-offset: 1px;
  }

  @media (hover: none) {
    opacity: 0.88;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const Empty = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const PendingCard = styled.article`
  position: relative;
  overflow: hidden;
  border-radius: 0.5rem;
  padding: 1.1rem 1.25rem;
  background: hsl(var(--card) / 0.88);
  border: 1px solid hsl(var(--primary) / 0.35);
  box-shadow: 0 3px 12px hsl(var(--foreground) / 0.06);
`;

const PendingNote = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: hsl(var(--foreground) / 0.92);
  white-space: pre-wrap;
`;

const PendingOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  background: hsl(var(--background) / 0.68);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
`;

const PendingSpinner = styled.span`
  width: 1.45rem;
  height: 1.45rem;
  border-radius: 9999px;
  border: 2px solid hsl(var(--primary) / 0.25);
  border-top-color: hsl(var(--primary));
  animation: ${spin} 0.9s linear infinite;
`;

const PendingLabel = styled.span`
  font-size: 0.8rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
`;

const InsightPreviewBox = styled.div`
  margin-top: 0.65rem;
  padding: 0.75rem;
  border-radius: 0.45rem;
  border: 1px dashed hsl(var(--primary) / 0.35);
  background: hsl(var(--primary) / 0.04);
`;

const InsightPreviewTitle = styled.p`
  margin: 0 0 0.5rem;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: hsl(var(--muted-foreground));
`;

const InsightPillRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-bottom: 0.45rem;
`;

const InsightPill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.12rem 0.45rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 600;
  text-transform: capitalize;
  background: hsl(var(--primary) / 0.12);
  color: hsl(var(--primary));
`;

const InsightContext = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: hsl(var(--foreground) / 0.88);
`;

const InsightTraitRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.45rem;
`;

const InsightTrait = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.65rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  border: 1px solid transparent;
  background: hsl(var(--muted) / 0.45);
  color: hsl(var(--foreground) / 0.85);
`;

const InsightFooter = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.65rem;
  padding-top: 0.55rem;
  border-top: 1px solid hsl(var(--border) / 0.4);
`;


const GhostBtn = styled.button`
  height: 1.85rem;
  padding: 0 0.65rem;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  font-family: var(--font-sans), sans-serif;
  cursor: pointer;
  border: 1px solid hsl(var(--border) / 0.55);
  background: hsl(var(--background) / 0.7);
  color: hsl(var(--foreground));

  &:hover:not(:disabled) {
    background: hsl(var(--muted) / 0.3);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

function journalKey(j) {
  return j.journal_id ?? j.journalId ?? j.id;
}

function lineItems(j) {
  return j.tasks ?? j.items ?? [];
}

function submittedIso(j) {
  const raw =
    j.submitted_at ?? j.submittedAt ?? journalLatestIso(lineItems(j));
  return raw || "";
}

function isImageType(att) {
  const ct = att.content_type ?? att.contentType ?? "";
  return String(ct).startsWith("image/");
}

/**
 * Enriched tasks store the narrative in `context` / `content`; `label` is often a short tag.
 */
function lineEntryText(line) {
  const raw =
    line.context ??
    line.content ??
    line.body ??
    line.label ??
    line.title ??
    "";
  const s = String(raw).trim();
  return s || "";
}

function hasJournalNoteField(j) {
  return j.note != null && String(j.note).trim() !== "";
}

/** Prefer journal note (user entry); else legacy fallbacks from line items */
function journalPrimaryText(j, items) {
  if (hasJournalNoteField(j)) {
    return String(j.note).trim();
  }
  if (items.length === 1) {
    return lineEntryText(items[0]) || "—";
  }
  if (items.length > 1) {
    const parts = items.map(lineEntryText).filter(Boolean);
    return parts.length ? parts.join("\n\n") : "—";
  }
  return "—";
}

function isSpecifiedInsightValue(v) {
  if (v == null || v === "") {
    return false;
  }
  return String(v).trim().toLowerCase() !== "unspecified";
}

function traitLabelsFromPreview(raw) {
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw
    .map((x) => {
      if (typeof x === "string") {
        return x.trim();
      }
      if (x && typeof x === "object" && x.label != null) {
        return String(x.label).trim();
      }
      return "";
    })
    .filter(Boolean);
}

export default function JournalFeed({
  journals,
  onRefresh,
  title = "Your log",
  insightSession = null,
  onDismissInsightPreview,
  onRegenerateInsightPreview,
  insightRegeneratingId = null,
}) {
  const [editingId, setEditingId] = useState(null);
  const [draftNote, setDraftNote] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [editShellMinHeight, setEditShellMinHeight] = useState(null);
  const [pendingAttachFiles, setPendingAttachFiles] = useState([]);

  const startEdit = useCallback((j, cardEl) => {
    const id = journalKey(j);
    const items = lineItems(j);
    setEditingId(id);
    setPendingAttachFiles([]);
    if (cardEl instanceof HTMLElement) {
      setEditShellMinHeight(cardEl.offsetHeight);
    } else {
      setEditShellMinHeight(null);
    }
    if (hasJournalNoteField(j)) {
      setDraftNote(String(j.note).trim());
    } else {
      const primary = journalPrimaryText(j, items);
      setDraftNote(primary === "—" ? "" : primary);
    }
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setDraftNote("");
    setEditShellMinHeight(null);
    setPendingAttachFiles([]);
  }, []);

  const saveNote = useCallback(async () => {
    if (editingId == null) {
      return;
    }
    setBusyId(editingId);
    try {
      const trimmed = draftNote.trim();
      await patchJournalNote(editingId, { note: trimmed ? trimmed : null });
      const uploads = pendingAttachFiles.filter((f) => f instanceof File);
      if (uploads.length > 0) {
        try {
          await uploadJournalAttachments(editingId, uploads);
        } catch {
          window.alert("Note saved, but one or more photos failed to upload.");
        }
      }
      cancelEdit();
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  }, [editingId, draftNote, pendingAttachFiles, cancelEdit, onRefresh]);

  const remove = useCallback(
    async (id) => {
      if (
        !window.confirm(
          "Delete this log and its entries? This cannot be undone.",
        )
      ) {
        return;
      }
      setBusyId(id);
      try {
        await deleteJournal(id);
        await onRefresh();
      } finally {
        setBusyId(null);
      }
    },
    [onRefresh],
  );

  const removeAttachment = useCallback(
    async (journalId, attachmentId) => {
      if (!window.confirm("Remove this photo from the entry?")) {
        return;
      }
      setBusyId(journalId);
      try {
        await deleteJournalAttachment(journalId, attachmentId);
        await onRefresh();
      } catch {
        window.alert("Could not remove the photo. Try again.");
      } finally {
        setBusyId(null);
      }
    },
    [onRefresh],
  );

  const rows = [...(journals ?? [])].slice(0, 24);
  const showPendingCard =
    insightSession?.phase === "generating" && insightSession?.journalId == null;
  const pendingNote = String(
    insightSession?.pendingNote ?? insightSession?.baselineNote ?? "",
  ).trim();

  if (!rows.length) {
    return (
      <section aria-label={title}>
        <SectionTitle>{title}</SectionTitle>
        <Sub>
          Hover your entry to see “Click to edit,” then click the text to change
          it. Hover a photo to remove it.
        </Sub>
        {showPendingCard ? (
          <Stack>
            <PendingCard className="animate-fade-up stagger-0">
              <PendingNote>{pendingNote || "Saving your entry…"}</PendingNote>
              <PendingOverlay role="status" aria-live="polite" aria-busy="true">
                <PendingSpinner aria-hidden />
                <PendingLabel>Generating insights…</PendingLabel>
              </PendingOverlay>
            </PendingCard>
          </Stack>
        ) : (
          <Empty className="animate-fade-up stagger-0">
            No journals yet. Write something with the Write button to create your
            first log.
          </Empty>
        )}
      </section>
    );
  }

  return (
    <section aria-label={title}>
      <SectionTitle>{title}</SectionTitle>
      <Sub>
        Hover your entry to see “Click to edit,” then click the text to change
        it. Hover a photo to remove it.
      </Sub>
      <Stack>
        {showPendingCard ? (
          <PendingCard className="animate-fade-up" style={{ animationDelay: "0ms" }}>
            <PendingNote>{pendingNote || "Saving your entry…"}</PendingNote>
            <PendingOverlay role="status" aria-live="polite" aria-busy="true">
              <PendingSpinner aria-hidden />
              <PendingLabel>Generating insights…</PendingLabel>
            </PendingOverlay>
          </PendingCard>
        ) : null}
        {rows.map((j, index) => {
          const id = journalKey(j);
          const items = lineItems(j);
          const iso = submittedIso(j);
          const ts = formatReflectionTime({ submittedAt: iso });
          const atts = j.attachments ?? [];
          const imageAtts = atts.filter(isImageType);
          const isEditing = editingId === id;
          const busy = busyId === id;
          const insightMatch =
            insightSession &&
            String(insightSession.journalId) === String(id);
          const regenBusy =
            insightRegeneratingId != null &&
            String(insightRegeneratingId) === String(id);
          const noteComparable = hasJournalNoteField(j)
            ? String(j.note).trim()
            : journalPrimaryText(j, items);
          const baseline = insightMatch ? insightSession.baselineNote ?? "" : "";
          const previewList = Array.isArray(insightSession?.previews)
            ? insightSession.previews
            : insightSession?.preview
              ? [insightSession.preview]
              : [];
          const noteChanged =
            insightMatch &&
            insightSession.phase === "complete" &&
            noteComparable !== baseline;

          return (
            <Card
              key={String(id)}
              data-journal-id={String(id)}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Top>
                <Time dateTime={iso}>{ts}</Time>
              </Top>
              {isEditing ? (
                <EditShell
                  style={
                    editShellMinHeight != null
                      ? { minHeight: `${editShellMinHeight}px` }
                      : undefined
                  }
                >
                  <EditTextArea
                    value={draftNote}
                    onChange={(e) => setDraftNote(e.target.value)}
                    placeholder="Your entry"
                    aria-label="Journal entry text"
                  />
                  <EditFooter>
                    <Btn type="button" onClick={saveNote} disabled={busy}>
                      {busy ? "Saving…" : "Save entry"}
                    </Btn>
                    <Btn type="button" onClick={cancelEdit} disabled={busy}>
                      Cancel
                    </Btn>
                  </EditFooter>
                  {imageAtts.length > 0 ? (
                    <EditPhotos>
                      {imageAtts.map((att) => {
                        const href =
                          att.download_url ??
                          att.downloadUrl ??
                          att.url ??
                          "#";
                        const aid = att.attachment_id ?? att.id ?? href;
                        return (
                          <AttachCell key={String(aid)}>
                            <PhotoRemoveBtn
                              type="button"
                              className="photo-remove"
                              aria-label="Remove photo"
                              disabled={busy}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeAttachment(id, aid);
                              }}
                            >
                              ×
                            </PhotoRemoveBtn>
                            <AttachThumb
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src={href} alt="" />
                            </AttachThumb>
                          </AttachCell>
                        );
                      })}
                    </EditPhotos>
                  ) : null}
                  <JournalAttachmentPicker
                    tight
                    files={pendingAttachFiles}
                    onFilesChange={setPendingAttachFiles}
                    maxFiles={Math.max(0, 8 - imageAtts.length)}
                  />
                </EditShell>
              ) : (
                <>
                  <EntryBlock>
                    <EntryHint className="entry-hint">Click to edit</EntryHint>
                    <EntryTrigger
                      type="button"
                      disabled={busy}
                      onClick={(e) => {
                        const card = e.currentTarget.closest("article");
                        startEdit(j, card);
                      }}
                    >
                      {(() => {
                        const primary = journalPrimaryText(j, items);
                        const empty =
                          (primary === "—" || primary === "") &&
                          items.length === 0 &&
                          !hasJournalNoteField(j);
                        return empty ? (
                          <span style={{ color: "hsl(var(--muted-foreground))" }}>
                            No entry text yet — click to add
                          </span>
                        ) : (
                          primary
                        );
                      })()}
                    </EntryTrigger>
                  </EntryBlock>
                  {hasJournalNoteField(j) && items.length > 0
                    ? items.map((line, i) => {
                        const ctx = lineEntryText(line);
                        if (!ctx || ctx.trim() === String(j.note).trim()) {
                          return null;
                        }
                        return (
                          <InsightMeta key={line.task_id ?? line.id ?? i}>
                            Insight: {ctx}
                          </InsightMeta>
                        );
                      })
                    : null}
                  {imageAtts.length > 0 ? (
                    <AttachRow>
                      {imageAtts.map((att) => {
                        const href =
                          att.download_url ??
                          att.downloadUrl ??
                          att.url ??
                          "#";
                        const aid = att.attachment_id ?? att.id ?? href;
                        return (
                          <AttachCell key={String(aid)}>
                            <PhotoRemoveBtn
                              type="button"
                              className="photo-remove"
                              aria-label="Remove photo"
                              disabled={busy}
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeAttachment(id, aid);
                              }}
                            >
                              ×
                            </PhotoRemoveBtn>
                            <AttachThumb
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <img src={href} alt="" />
                            </AttachThumb>
                          </AttachCell>
                        );
                      })}
                    </AttachRow>
                  ) : null}
                  <Actions>
                    <DangerBtn
                      type="button"
                      onClick={() => remove(id)}
                      disabled={busy}
                    >
                      {busy ? "…" : "Delete log"}
                    </DangerBtn>
                  </Actions>
                </>
              )}
              {insightMatch &&
              insightSession.phase === "complete" &&
              previewList.length > 0 &&
              !isEditing ? (
                <InsightPreviewBox>
                  <InsightPreviewTitle>
                    Fresh insights
                    {noteChanged
                      ? " — your entry changed; regenerate to update"
                      : ""}
                  </InsightPreviewTitle>
                  {previewList.map((preview, previewIndex) => (
                    <div key={`${id}-p-${previewIndex}`} style={{ marginBottom: "0.7rem" }}>
                      <InsightPillRow>
                        {isSpecifiedInsightValue(preview.sentiment) ? (
                          <InsightPill>{String(preview.sentiment)}</InsightPill>
                        ) : null}
                        {isSpecifiedInsightValue(preview.category) ? (
                          <InsightPill>{String(preview.category)}</InsightPill>
                        ) : null}
                        {isSpecifiedInsightValue(preview.time_of_day) ? (
                          <InsightPill>{String(preview.time_of_day)}</InsightPill>
                        ) : null}
                      </InsightPillRow>
                      {preview.label && isSpecifiedInsightValue(preview.label) ? (
                        <InsightContext style={{ fontWeight: 600, marginBottom: "0.35rem" }}>
                          {String(preview.label)}
                        </InsightContext>
                      ) : null}
                      {preview.context && String(preview.context).trim() !== "" ? (
                        <InsightContext>{String(preview.context)}</InsightContext>
                      ) : null}
                      {traitLabelsFromPreview(preview.personality_traits).length > 0 ? (
                        <InsightTraitRow>
                          {traitLabelsFromPreview(preview.personality_traits).map((t) => (
                            <InsightTrait key={`${previewIndex}-${t}`}>{t}</InsightTrait>
                          ))}
                        </InsightTraitRow>
                      ) : null}
                    </div>
                  ))}
                  <InsightFooter>
                    {typeof onRegenerateInsightPreview === "function" ? (
                      <GhostBtn
                        type="button"
                        disabled={regenBusy || busy}
                        onClick={() => onRegenerateInsightPreview(id)}
                      >
                        {regenBusy ? "Regenerating…" : "Regenerate"}
                      </GhostBtn>
                    ) : null}
                    {typeof onDismissInsightPreview === "function" ? (
                      <GhostBtn
                        type="button"
                        disabled={busy}
                        onClick={onDismissInsightPreview}
                      >
                        Dismiss
                      </GhostBtn>
                    ) : null}
                  </InsightFooter>
                </InsightPreviewBox>
              ) : null}
            </Card>
          );
        })}
      </Stack>
    </section>
  );
}
