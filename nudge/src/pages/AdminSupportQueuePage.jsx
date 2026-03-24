import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import {
  assignAdminSupportTicket,
  getAdminSupportTicket,
  listAdminSupportTickets,
  patchAdminSupportTicket,
  postAdminSupportTicketMessage,
} from "../api/adminApi";
import { writeAdminMfaCode } from "../api/adminMfa";

const STATUS = ["open", "in_progress", "waiting_on_customer", "resolved", "closed"];
const PRIORITY = ["low", "normal", "high", "urgent"];

const Card = styled.section`
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border) / 0.6);
  background: hsl(var(--card) / 0.85);
  padding: 1rem 1.05rem;
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
`;

const Input = styled.input`
  height: 2.35rem;
  border-radius: 0.65rem;
  border: 1px solid hsl(var(--border) / 0.8);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 0 0.7rem;
  font: inherit;
`;

const Select = styled.select`
  height: 2.35rem;
  border-radius: 0.65rem;
  border: 1px solid hsl(var(--border) / 0.8);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 0 0.5rem;
  font: inherit;
`;

const Button = styled.button`
  height: 2.35rem;
  border-radius: 0.65rem;
  border: 1px solid hsl(var(--border) / 0.8);
  background: ${(p) => (p.$primary ? "hsl(var(--primary))" : "hsl(var(--background))")};
  color: ${(p) => (p.$primary ? "white" : "hsl(var(--foreground))")};
  padding: 0 0.8rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  opacity: ${(p) => (p.disabled ? 0.55 : 1)};
`;

const TicketCard = styled.div`
  border: 1px solid
    ${(p) => (p.$open ? "hsl(var(--primary) / 0.45)" : "hsl(var(--border) / 0.6)")};
  border-radius: 0.8rem;
  padding: 0.75rem;
  background: ${(p) => (p.$open ? "hsl(var(--primary) / 0.06)" : "hsl(var(--background) / 0.52)")};
`;

const TicketHead = styled.button`
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  cursor: pointer;
  color: hsl(var(--foreground));
`;

const TicketSubject = styled.div`
  font-weight: 700;
  line-height: 1.25;
`;

const Subtle = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: hsl(var(--muted-foreground));
`;

const Chip = styled.span`
  display: inline-flex;
  align-items: center;
  border: 1px solid hsl(var(--border) / 0.72);
  border-radius: 999px;
  padding: 0.12rem 0.45rem;
  font-size: 0.72rem;
  color: hsl(var(--muted-foreground));
`;

const Thread = styled.div`
  margin-top: 0.65rem;
  display: grid;
  gap: 0.5rem;
`;

const MessageCard = styled.div`
  border: 1px solid hsl(var(--border) / 0.6);
  border-radius: 0.7rem;
  padding: 0.55rem 0.6rem;
  background: ${(p) => (p.$internal ? "hsl(45 85% 95% / 0.75)" : "hsl(var(--background) / 0.72)")};
`;

const Composer = styled.div`
  margin-top: 0.65rem;
  display: grid;
  gap: 0.45rem;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 4.5rem;
  border-radius: 0.65rem;
  border: 1px solid hsl(var(--border) / 0.8);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 0.6rem 0.7rem;
  font: inherit;
  resize: vertical;
`;

export default function AdminSupportQueuePage() {
  const [items, setItems] = useState([]);
  const [filters, setFilters] = useState({ q: "", status: "", priority: "" });
  const [mfaCode, setMfaCode] = useState("");
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [openId, setOpenId] = useState("");
  const [detailById, setDetailById] = useState({});
  const [loadingDetailId, setLoadingDetailId] = useState("");
  const [messageById, setMessageById] = useState({});
  const [internalById, setInternalById] = useState({});
  const [loadingList, setLoadingList] = useState(false);

  const load = useCallback(async () => {
    setLoadingList(true);
    try {
      const next = await listAdminSupportTickets({
        q: filters.q || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        limit: 50,
        skip: 0,
      });
      setItems(next);
      setOpenId((prev) => prev || next[0]?.id || "");
    } finally {
      setLoadingList(false);
    }
  }, [filters]);

  const loadDetail = useCallback(async (ticketId) => {
    if (!ticketId) {
      return;
    }
    setLoadingDetailId(ticketId);
    try {
      const data = await getAdminSupportTicket(ticketId);
      setDetailById((prev) => ({ ...prev, [ticketId]: data }));
    } finally {
      setLoadingDetailId("");
    }
  }, []);

  useEffect(() => {
    writeAdminMfaCode(mfaCode);
  }, [mfaCode]);

  useEffect(() => {
    void load().catch((err) => {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError("Insufficient permissions.");
      } else {
        setError("Could not load admin queue.");
      }
    });
  }, [load]);

  useEffect(() => {
    if (!openId || detailById[openId]) {
      return;
    }
    void loadDetail(openId).catch(() => setError("Could not load ticket thread."));
  }, [openId, detailById, loadDetail]);

  const runPatch = useCallback(async (ticketId, patch) => {
    setBusyId(ticketId);
    setError("");
    try {
      const updated = await patchAdminSupportTicket(ticketId, patch);
      setItems((prev) => prev.map((x) => (x.id === ticketId ? { ...x, ...updated } : x)));
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError("Insufficient permissions.");
      } else {
        setError("Ticket update failed.");
      }
    } finally {
      setBusyId("");
    }
  }, []);

  const runAssign = useCallback(async (ticketId) => {
    const uid = window.prompt("Assign to user id:");
    if (!uid) {
      return;
    }
    setBusyId(ticketId);
    try {
      const updated = await assignAdminSupportTicket(ticketId, uid);
      setItems((prev) => prev.map((x) => (x.id === ticketId ? { ...x, ...updated } : x)));
    } catch {
      setError("Assignment failed.");
    } finally {
      setBusyId("");
    }
  }, []);

  const runMessage = useCallback(async (ticketId) => {
    const body = String(messageById[ticketId] ?? "").trim();
    if (!body) {
      return;
    }
    setBusyId(ticketId);
    try {
      await postAdminSupportTicketMessage(ticketId, {
        body,
        is_internal: Boolean(internalById[ticketId]),
      });
      setMessageById((prev) => ({ ...prev, [ticketId]: "" }));
      await loadDetail(ticketId);
      await load();
    } catch {
      setError("Message failed.");
    } finally {
      setBusyId("");
    }
  }, [internalById, load, loadDetail, messageById]);

  return (
    <Card>
      <h1 style={{ marginTop: 0 }}>Admin Support Queue</h1>
      {error ? <p style={{ color: "hsl(0 50% 40%)" }}>{error}</p> : null}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <Input placeholder="MFA code" value={mfaCode} onChange={(e) => setMfaCode(e.target.value)} />
        <Input placeholder="Search subject" value={filters.q} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))} />
        <Select value={filters.status} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}>
          <option value="">All statuses</option>
          {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
        </Select>
        <Select value={filters.priority} onChange={(e) => setFilters((f) => ({ ...f, priority: e.target.value }))}>
          <option value="">All priorities</option>
          {PRIORITY.map((p) => <option key={p} value={p}>{p}</option>)}
        </Select>
        <Button type="button" onClick={() => void load()}>Refresh</Button>
      </div>
      {loadingList ? <Subtle>Loading queue...</Subtle> : null}
      {!loadingList && items.length === 0 ? <Subtle>No tickets found for these filters.</Subtle> : null}
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {items.map((ticket) => (
          <TicketCard key={ticket.id} $open={openId === ticket.id}>
            <TicketHead
              type="button"
              onClick={() => setOpenId((prev) => (prev === ticket.id ? "" : ticket.id))}
            >
              <div>
                <TicketSubject>{ticket.subject}</TicketSubject>
                <Subtle>Updated {new Date(ticket.updatedAt).toLocaleString()}</Subtle>
                <div style={{ display: "flex", gap: "0.35rem", marginTop: "0.3rem" }}>
                  <Chip>{ticket.status}</Chip>
                  <Chip>{ticket.priority}</Chip>
                  {ticket.assignedToUserId ? <Chip>assignee: {ticket.assignedToUserId}</Chip> : null}
                </div>
              </div>
              <span aria-hidden>{openId === ticket.id ? "▾" : "▸"}</span>
            </TicketHead>
            {openId === ticket.id ? (
              <>
                <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
                  <Select value={ticket.status} disabled={busyId === ticket.id} onChange={(e) => void runPatch(ticket.id, { status: e.target.value })}>
                    {STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </Select>
                  <Select value={ticket.priority} disabled={busyId === ticket.id} onChange={(e) => void runPatch(ticket.id, { priority: e.target.value })}>
                    {PRIORITY.map((p) => <option key={p} value={p}>{p}</option>)}
                  </Select>
                  <Button type="button" disabled={busyId === ticket.id} onClick={() => void runAssign(ticket.id)}>
                    {ticket.assignedToUserId ? `Reassign (${ticket.assignedToUserId})` : "Assign"}
                  </Button>
                </div>
                <Thread>
                  {loadingDetailId === ticket.id ? (
                    <Subtle>Loading full thread...</Subtle>
                  ) : null}
                  {(detailById[ticket.id]?.messages ?? []).map((m) => (
                    <MessageCard key={m.id} $internal={m.isInternal}>
                      <Subtle style={{ marginBottom: "0.18rem" }}>
                        {new Date(m.createdAt).toLocaleString()}
                        {m.authorUserId ? ` · by ${m.authorUserId}` : ""}
                        {m.isInternal ? " · internal" : " · public"}
                      </Subtle>
                      <div>{m.body}</div>
                    </MessageCard>
                  ))}
                </Thread>
                <Composer>
                  <Textarea
                    rows={2}
                    placeholder="Add message..."
                    value={messageById[ticket.id] ?? ""}
                    onChange={(e) => setMessageById((prev) => ({ ...prev, [ticket.id]: e.target.value }))}
                  />
                  <label style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>
                    <input
                      type="checkbox"
                      checked={Boolean(internalById[ticket.id])}
                      onChange={(e) => setInternalById((prev) => ({ ...prev, [ticket.id]: e.target.checked }))}
                    />{" "}
                    Internal note
                  </label>
                  <Button $primary type="button" disabled={busyId === ticket.id} onClick={() => void runMessage(ticket.id)}>
                    Post message
                  </Button>
                </Composer>
              </>
            ) : null}
          </TicketCard>
        ))}
      </div>
    </Card>
  );
}
