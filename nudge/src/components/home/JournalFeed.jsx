import { useCallback, useState } from "react";
import styled from "styled-components";
import {
  deleteJournal,
  patchJournalNote,
} from "../../api/journalApi";
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

/** Journal `note`: what you wrote (posted on create). */
const Entry = styled.p`
  margin: 0 0 0.65rem;
  font-size: 15px;
  line-height: 1.6;
  color: hsl(var(--foreground) / 0.9);
  white-space: pre-wrap;
`;

/** Enriched line context (task) — secondary to journal note */
const InsightMeta = styled.p`
  margin: 0 0 0.65rem;
  font-size: 13px;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
`;

const LineList = styled.ul`
  margin: 0;
  padding-left: 1.1rem;
  font-size: 15px;
  line-height: 1.55;
  color: hsl(var(--foreground) / 0.88);
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

const AttachRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.5rem;
`;

const AttachThumb = styled.a`
  display: block;
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.35rem;
  overflow: hidden;
  box-shadow: 0 0 0 1px hsl(var(--border) / 0.45);

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const Empty = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));
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

export default function JournalFeed({ journals, onRefresh, title = "Your log" }) {
  const [editingId, setEditingId] = useState(null);
  const [draftNote, setDraftNote] = useState("");
  const [busyId, setBusyId] = useState(null);

  const startEdit = useCallback((j) => {
    const id = journalKey(j);
    setEditingId(id);
    setDraftNote(j.note != null ? String(j.note) : "");
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setDraftNote("");
  }, []);

  const saveNote = useCallback(async () => {
    if (editingId == null) {
      return;
    }
    setBusyId(editingId);
    try {
      const trimmed = draftNote.trim();
      await patchJournalNote(editingId, { note: trimmed ? trimmed : null });
      cancelEdit();
      await onRefresh();
    } finally {
      setBusyId(null);
    }
  }, [editingId, draftNote, cancelEdit, onRefresh]);

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

  const rows = [...(journals ?? [])].slice(0, 24);

  if (!rows.length) {
    return (
      <section aria-label={title}>
        <SectionTitle>{title}</SectionTitle>
        <Sub>
          What you write is saved as the journal note; AI fills line context on
          tasks.
        </Sub>
        <Empty className="animate-fade-up stagger-0">
          No journals yet. Write something with the Write button to create your
          first log.
        </Empty>
      </section>
    );
  }

  return (
    <section aria-label={title}>
      <SectionTitle>{title}</SectionTitle>
      <Sub>
        What you write is saved as the journal note; AI fills line context on
        tasks.
      </Sub>
      <Stack>
        {rows.map((j, index) => {
          const id = journalKey(j);
          const items = lineItems(j);
          const iso = submittedIso(j);
          const ts = formatReflectionTime({ submittedAt: iso });
          const atts = j.attachments ?? [];
          const imageAtts = atts.filter(isImageType);
          const isEditing = editingId === id;
          const busy = busyId === id;

          return (
            <Card
              key={String(id)}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <Top>
                <Time dateTime={iso}>{ts}</Time>
              </Top>
              {isEditing ? (
                <>
                  <TextArea
                    value={draftNote}
                    onChange={(e) => setDraftNote(e.target.value)}
                    placeholder="Your entry"
                    aria-label="Journal entry text"
                  />
                  <Actions style={{ marginTop: 0, paddingTop: 0, border: "none" }}>
                    <Btn type="button" onClick={saveNote} disabled={busy}>
                      {busy ? "Saving…" : "Save entry"}
                    </Btn>
                    <Btn type="button" onClick={cancelEdit} disabled={busy}>
                      Cancel
                    </Btn>
                  </Actions>
                </>
              ) : (
                <>
                  <Entry>{journalPrimaryText(j, items)}</Entry>
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
                  {!hasJournalNoteField(j) && items.length > 1 ? (
                    <LineList>
                      {items.map((line, i) => (
                        <li key={line.task_id ?? line.id ?? i}>
                          {lineEntryText(line) || "—"}
                        </li>
                      ))}
                    </LineList>
                  ) : null}
                  {items.length === 0 && !hasJournalNoteField(j) ? (
                    <Entry style={{ color: "hsl(var(--muted-foreground))" }}>
                      No entry text yet
                    </Entry>
                  ) : null}
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
                          <AttachThumb
                            key={String(aid)}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <img src={href} alt="Attachment preview" />
                          </AttachThumb>
                        );
                      })}
                    </AttachRow>
                  ) : null}
                  <Actions>
                    <Btn
                      type="button"
                      onClick={() => startEdit(j)}
                      disabled={busy}
                    >
                      Edit entry
                    </Btn>
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
            </Card>
          );
        })}
      </Stack>
    </section>
  );
}
