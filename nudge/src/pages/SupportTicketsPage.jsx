import { useCallback, useEffect, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import {
  createOwnSupportTicketMessage,
  createSupportTicket,
  getOwnSupportTicket,
  listOwnSupportTickets,
} from "../api/supportApi";

const STATUS = ["open", "in_progress", "waiting_on_customer", "resolved", "closed"];
const PRIORITY = ["low", "normal", "high", "urgent"];

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Card = styled.section`
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border) / 0.6);
  background: hsl(var(--card) / 0.85);
  padding: 1rem 1.05rem;
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
`;

const Title = styled.h1`
  margin: 0 0 0.25rem;
  font-size: 1.7rem;
  letter-spacing: -0.02em;
`;

const Subtle = styled.p`
  margin: 0 0 0.85rem;
  font-size: 0.92rem;
  color: hsl(var(--muted-foreground));
`;

const ErrorBox = styled.p`
  margin: 0 0 0.7rem;
  padding: 0.6rem 0.7rem;
  border-radius: 0.6rem;
  border: 1px solid hsl(0 55% 78%);
  background: hsl(0 80% 97%);
  color: hsl(0 50% 38%);
  font-size: 0.86rem;
`;

const Stack = styled.div`
  display: grid;
  gap: 0.55rem;
`;

const Input = styled.input`
  width: 100%;
  height: 2.5rem;
  border-radius: 0.65rem;
  border: 1px solid hsl(var(--border) / 0.8);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 0 0.75rem;
  font: inherit;

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 2px;
  }
`;

const Textarea = styled.textarea`
  width: 100%;
  border-radius: 0.65rem;
  border: 1px solid hsl(var(--border) / 0.8);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 0.65rem 0.75rem;
  font: inherit;
  resize: vertical;

  &:focus-visible {
    outline: 2px solid hsl(var(--primary) / 0.35);
    outline-offset: 2px;
  }
`;

const Button = styled.button`
  height: 2.5rem;
  border-radius: 0.65rem;
  border: 1px solid hsl(var(--border) / 0.8);
  background: ${(p) => (p.$primary ? "hsl(var(--primary))" : "hsl(var(--background))")};
  color: ${(p) => (p.$primary ? "white" : "hsl(var(--foreground))")};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  transition: box-shadow 180ms ease, transform 160ms ease, opacity 180ms ease;

  &:hover:not(:disabled) {
    box-shadow: 0 6px 18px hsl(var(--foreground) / 0.08);
  }

  &:active:not(:disabled) {
    transform: scale(0.99);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TicketButton = styled.button`
  text-align: left;
  width: 100%;
  padding: 0.7rem;
  border-radius: 0.75rem;
  border: 1px solid
    ${(p) => (p.$active ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border) / 0.6)")};
  background: ${(p) => (p.$active ? "hsl(var(--primary) / 0.09)" : "hsl(var(--background) / 0.75)")};
  color: hsl(var(--foreground));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
`;

const TicketSubject = styled.div`
  font-weight: 600;
  font-size: 0.95rem;
  line-height: 1.3;
`;

const Chevron = styled.span`
  color: hsl(var(--muted-foreground));
  font-size: 0.9rem;
`;

const ChipRow = styled.div`
  margin-top: 0.35rem;
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
`;

const Chip = styled.span`
  border: 1px solid hsl(var(--border) / 0.7);
  border-radius: 999px;
  padding: 0.18rem 0.5rem;
  font-size: 0.7rem;
  color: hsl(var(--muted-foreground));
`;

const TicketPanel = styled.div`
  margin-top: 0.45rem;
  border: 1px solid hsl(var(--border) / 0.55);
  border-radius: 0.75rem;
  padding: 0.75rem;
  background: hsl(var(--background) / 0.48);
`;

const MessageItem = styled.div`
  border: 1px solid hsl(var(--border) / 0.55);
  border-radius: 0.75rem;
  padding: 0.6rem;
  background: hsl(var(--background) / 0.5);
`;

const Meta = styled.div`
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  margin-bottom: 0.2rem;
`;

const EmptyState = styled.div`
  border: 1px dashed hsl(var(--border) / 0.7);
  border-radius: 0.8rem;
  background: hsl(var(--background) / 0.45);
  padding: 1rem;
`;

export default function SupportTicketsPage() {
  const [items, setItems] = useState([]);
  const [openTicketId, setOpenTicketId] = useState("");
  const [detailsById, setDetailsById] = useState({});
  const [detailLoadingId, setDetailLoadingId] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [replyById, setReplyById] = useState({});
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadList = useCallback(async () => {
    const list = await listOwnSupportTickets({ skip: 0, limit: 200 });
    setItems(list);
    if (!openTicketId && list[0]?.id) {
      setOpenTicketId(list[0].id);
    }
  }, [openTicketId]);

  const loadDetail = useCallback(async (ticketId) => {
    if (!ticketId) {
      return;
    }
    setDetailLoadingId(ticketId);
    try {
      const data = await getOwnSupportTicket(ticketId);
      setDetailsById((prev) => ({ ...prev, [ticketId]: data }));
    } finally {
      setDetailLoadingId("");
    }
  }, []);

  useEffect(() => {
    void loadList().catch(() => setError("Could not load tickets."));
  }, [loadList]);

  useEffect(() => {
    if (!openTicketId || detailsById[openTicketId]) {
      return;
    }
    void loadDetail(openTicketId).catch(() => setError("Could not load ticket detail."));
  }, [openTicketId, detailsById, loadDetail]);

  const onCreate = useCallback(async () => {
    const sub = subject.trim();
    const body = message.trim();
    if (sub.length < 4 || sub.length > 140) {
      setError("Subject must be 4-140 characters.");
      return;
    }
    if (body.length < 8 || body.length > 4000) {
      setError("Message must be 8-4000 characters.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const created = await createSupportTicket({ subject: sub, message: body, priority: "normal" });
      setSubject("");
      setMessage("");
      await loadList();
      if (created?.ticket?.id) {
        setOpenTicketId(created.ticket.id);
        await loadDetail(created.ticket.id);
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError("Your account is locked. You cannot create tickets.");
      } else {
        setError("Could not create ticket.");
      }
    } finally {
      setBusy(false);
    }
  }, [subject, message, loadDetail, loadList]);

  const onReply = useCallback(async (ticketId) => {
    const body = String(replyById[ticketId] ?? "").trim();
    if (!body) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createOwnSupportTicketMessage(ticketId, body);
      setReplyById((prev) => ({ ...prev, [ticketId]: "" }));
      await loadDetail(ticketId);
      await loadList();
    } catch (err) {
      if (axios.isAxiosError(err) && (err.response?.status === 403 || err.response?.status === 404)) {
        setError("Message could not be posted for this ticket.");
      } else {
        setError("Could not post message.");
      }
    } finally {
      setBusy(false);
    }
  }, [replyById, loadDetail, loadList]);

  return (
    <Page>
      <Card>
        <Title>Support</Title>
        <Subtle>Send a message and track replies in one conversation thread.</Subtle>
        {error ? <ErrorBox>{error}</ErrorBox> : null}
        {items.length === 0 ? (
          <EmptyState>
            <h2 style={{ margin: "0 0 0.35rem", fontSize: "1.05rem" }}>No tickets yet</h2>
            <Subtle style={{ marginBottom: "0.7rem" }}>
              Need help? Start a ticket and we will reply here.
            </Subtle>
            <Stack>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
              />
              <Textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
              />
              <Button $primary type="button" disabled={busy} onClick={() => void onCreate()}>
                {busy ? "Creating..." : "Create ticket"}
              </Button>
            </Stack>
          </EmptyState>
        ) : (
          <Stack>
            <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Create a new ticket</h2>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
            />
            <Textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help?"
            />
            <Button $primary type="button" disabled={busy} onClick={() => void onCreate()}>
              {busy ? "Creating..." : "Create ticket"}
            </Button>
          </Stack>
        )}
      </Card>

      {items.length ? (
        <Card>
          <h2 style={{ marginTop: 0, marginBottom: "0.75rem" }}>Your tickets</h2>
          <Stack>
            {items.map((ticket) => {
              const isOpen = openTicketId === ticket.id;
              const detail = detailsById[ticket.id];
              return (
                <div key={ticket.id}>
                  <TicketButton
                    type="button"
                    onClick={() => setOpenTicketId((prev) => (prev === ticket.id ? "" : ticket.id))}
                    $active={isOpen}
                  >
                    <div>
                      <TicketSubject>{ticket.subject}</TicketSubject>
                      <ChipRow>
                        <Chip>{ticket.status}</Chip>
                        <Chip>{ticket.priority}</Chip>
                      </ChipRow>
                    </div>
                    <Chevron aria-hidden>{isOpen ? "▾" : "▸"}</Chevron>
                  </TicketButton>
                  {isOpen ? (
                    <TicketPanel>
                      <Subtle style={{ marginBottom: "0.6rem" }}>
                        Conversation with support. Internal team notes are never shown.
                      </Subtle>
                      {detailLoadingId === ticket.id ? (
                        <Subtle style={{ marginBottom: "0.55rem" }}>Loading conversation...</Subtle>
                      ) : null}
                      <Stack>
                        {(detail?.messages ?? []).map((m) => (
                          <MessageItem key={m.id}>
                            <Meta>{new Date(m.createdAt).toLocaleString()}</Meta>
                            <div>{m.body}</div>
                          </MessageItem>
                        ))}
                      </Stack>
                      <Stack style={{ marginTop: "0.75rem" }}>
                        <Textarea
                          rows={3}
                          value={replyById[ticket.id] ?? ""}
                          onChange={(e) =>
                            setReplyById((prev) => ({ ...prev, [ticket.id]: e.target.value }))
                          }
                          placeholder="Reply..."
                        />
                        <Button
                          $primary
                          type="button"
                          disabled={busy}
                          onClick={() => void onReply(ticket.id)}
                        >
                          Send reply
                        </Button>
                      </Stack>
                    </TicketPanel>
                  ) : null}
                </div>
              );
            })}
          </Stack>
          <Stack>
            <Subtle style={{ marginBottom: 0, marginTop: "0.65rem", fontSize: "0.78rem" }}>
              Supported values: {STATUS.join(", ")} | {PRIORITY.join(", ")}
            </Subtle>
          </Stack>
        </Card>
      ) : null}
    </Page>
  );
}
