import { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import { deleteTask } from "../../api/taskApi";
import { formatReflectionTime } from "./traitUtils";

const SectionTitle = styled.h2`
  margin: 0 0 1rem;
  font-family: var(--font-display), serif;
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.25;
  color: hsl(var(--foreground));
`;

const Sub = styled.p`
  margin: -0.5rem 0 1rem;
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

const MetaRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.55rem;
`;

const MetaEnd = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-shrink: 0;
`;

const IconDeleteBtn = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 0.4rem;
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition: background 150ms ease, color 150ms ease;

  &:hover:not(:disabled) {
    background: hsl(var(--foreground) / 0.06);
    color: hsl(var(--foreground));
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 2px;
  }

  svg {
    display: block;
  }
`;

const Pill = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.15rem 0.55rem;
  border-radius: 9999px;
  font-size: 0.65rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: capitalize;
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
`;

const Time = styled.time`
  font-size: 0.72rem;
  color: hsl(var(--muted-foreground));
  font-variant-numeric: tabular-nums;
`;

const Body = styled.p`
  margin: 0 0 0.5rem;
  font-size: 15px;
  line-height: 1.6;
  color: hsl(var(--foreground) / 0.9);
  overflow-wrap: break-word;
`;

const Detail = styled.p`
  margin: 0;
  font-size: 13px;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
`;

const TraitRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin-top: 0.55rem;
`;

const Trait = styled.button`
  display: inline-flex;
  align-items: center;
  font-size: 0.65rem;
  font-weight: 500;
  padding: 0.12rem 0.45rem;
  border-radius: 4px;
  border: none;
  background: hsl(var(--muted) / 0.5);
  color: hsl(var(--foreground) / 0.85);
  cursor: default;
`;

const Empty = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));
`;

/** Hide placeholder AI values like "unspecified" from pills and traits */
function isSpecifiedInsightValue(v) {
  if (v == null || v === "") {
    return false;
  }
  return String(v).trim().toLowerCase() !== "unspecified";
}

function listTraits(t) {
  const raw = t.personality_traits ?? t.personalityTraits;
  if (!Array.isArray(raw)) {
    return [];
  }
  const labels = raw.map((x) => {
    if (x == null) {
      return "";
    }
    if (typeof x === "string") {
      return x.trim();
    }
    if (typeof x === "object" && x.label != null) {
      return String(x.label).trim();
    }
    return "";
  });
  return labels.filter((x) => x && isSpecifiedInsightValue(x));
}

/**
 * Map journal_id → journal submitted_at (align insight cards with log time).
 */
function useJournalSubmittedAtById(journals) {
  return useMemo(() => {
    const m = new Map();
    for (const j of journals ?? []) {
      const id = j.journal_id ?? j.journalId ?? j.id;
      if (id == null) {
        continue;
      }
      const iso = j.submitted_at ?? j.submittedAt;
      if (iso) {
        m.set(String(id), iso);
      }
    }
    return m;
  }, [journals]);
}

function TrashIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M3 6h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function insightSortTimeMs(t, journalTimeById) {
  const jid = t.journal_id ?? t.journalId;
  if (jid != null) {
    const jIso = journalTimeById.get(String(jid));
    if (jIso) {
      const d = new Date(jIso);
      if (!Number.isNaN(d.getTime())) {
        return d.getTime();
      }
    }
  }
  const raw =
    t.created_at ??
    t.createdAt ??
    t.updated_at ??
    t.timestamp ??
    0;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? 0 : d.getTime();
}

export default function InsightsTaskFeed({
  tasks,
  journals = [],
  title = "AI insights",
  onRefresh = async () => {},
}) {
  const [deletingTaskId, setDeletingTaskId] = useState(null);
  const journalTimeById = useJournalSubmittedAtById(journals);

  const removeInsight = useCallback(
    async (taskId) => {
      if (taskId == null) {
        return;
      }
      if (
        !window.confirm(
          "Remove this insight? Trait links for this line will be removed; your journal entry stays.",
        )
      ) {
        return;
      }
      const idStr = String(taskId);
      setDeletingTaskId(idStr);
      try {
        await deleteTask(taskId);
        await onRefresh();
      } catch {
        window.alert("Could not remove this insight. Try again.");
      } finally {
        setDeletingTaskId(null);
      }
    },
    [onRefresh],
  );
  const rows = useMemo(() => {
    const list = [...(tasks ?? [])];
    list.sort(
      (a, b) =>
        insightSortTimeMs(b, journalTimeById) -
        insightSortTimeMs(a, journalTimeById),
    );
    return list.slice(0, 24);
  }, [tasks, journalTimeById]);

  if (!rows.length) {
    return (
      <section aria-label={title}>
        <SectionTitle>{title}</SectionTitle>
        <Sub>Structured signals from your logs (sentiment, themes, traits).</Sub>
        <Empty className="animate-fade-up stagger-0">
          Nothing parsed yet. Add a journal entry and enrichment will fill this
          in.
        </Empty>
      </section>
    );
  }

  return (
    <section aria-label={title}>
      <SectionTitle>{title}</SectionTitle>
      <Sub>
        Structured signals from your logs. Remove an insight with the trash
        icon; your journal note stays.
      </Sub>
      <Stack>
        {rows.map((t, index) => {
          const traits = listTraits(t);
          const sentimentRaw = t.sentiment ?? t.mood;
          const sentiment = isSpecifiedInsightValue(sentimentRaw)
            ? sentimentRaw
            : null;
          const categoryRaw = t.category;
          const category = isSpecifiedInsightValue(categoryRaw)
            ? categoryRaw
            : null;
          const ctx = t.context;
          const todRaw = t.time_of_day ?? t.timeOfDay;
          const tod = isSpecifiedInsightValue(todRaw) ? todRaw : null;
          const jid = t.journal_id ?? t.journalId;
          const journalSubmitted =
            jid != null ? journalTimeById.get(String(jid)) : null;
          const ts = formatReflectionTime({
            submittedAt: journalSubmitted ?? undefined,
            created_at: t.created_at,
            createdAt: t.createdAt,
            updated_at: t.updated_at,
            timestamp: t.timestamp,
          });
          const dateAttr =
            journalSubmitted ?? t.created_at ?? t.createdAt ?? undefined;
          const taskId = t.task_id ?? t.id;
          const taskIdStr = taskId != null ? String(taskId) : "";
          const canDelete = taskId != null;
          return (
            <Card
              key={`${t.task_id ?? t.id ?? "t"}-${index}`}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <MetaRow>
                {sentiment != null ? (
                  <Pill>{String(sentiment)}</Pill>
                ) : null}
                {category != null ? (
                  <Pill>{String(category)}</Pill>
                ) : null}
                {tod != null ? <Pill>{String(tod)}</Pill> : null}
                <MetaEnd>
                  {canDelete ? (
                    <IconDeleteBtn
                      type="button"
                      aria-label="Remove this insight"
                      title="Remove this insight"
                      disabled={deletingTaskId === taskIdStr}
                      onClick={() => removeInsight(taskId)}
                    >
                      <TrashIcon />
                    </IconDeleteBtn>
                  ) : null}
                  <Time dateTime={dateAttr}>{ts}</Time>
                </MetaEnd>
              </MetaRow>
              <Body>{t.label}</Body>
              {ctx ? <Detail>{String(ctx)}</Detail> : null}
              {traits.length > 0 ? (
                <TraitRow>
                  {traits.map((x) => (
                    <Trait key={String(x)}>{String(x)}</Trait>
                  ))}
                </TraitRow>
              ) : null}
            </Card>
          );
        })}
      </Stack>
    </section>
  );
}
