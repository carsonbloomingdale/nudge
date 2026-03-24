import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import styled from "styled-components";
import {
  getAdminCustomer,
  listAdminCustomers,
  patchAdminCustomerActions,
} from "../api/adminApi";

const Card = styled.section`
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border) / 0.6);
  background: hsl(var(--card) / 0.85);
  padding: 1rem 1.05rem;
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
`;

const Grid = styled.div`
  display: grid;
  gap: 1rem;
  grid-template-columns: 18rem minmax(0, 1fr);
  @media (max-width: 1023px) {
    grid-template-columns: 1fr;
  }
`;

const Input = styled.input`
  width: 100%;
  height: 2.35rem;
  border-radius: 0.65rem;
  border: 1px solid hsl(var(--border) / 0.8);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 0 0.7rem;
  font: inherit;
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
`;

const Button = styled.button`
  height: 2.3rem;
  border-radius: 0.6rem;
  border: 1px solid hsl(var(--border) / 0.8);
  background: ${(p) => (p.$primary ? "hsl(var(--primary))" : "hsl(var(--background))")};
  color: ${(p) => (p.$primary ? "white" : "hsl(var(--foreground))")};
  padding: 0 0.8rem;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  opacity: ${(p) => (p.disabled ? 0.55 : 1)};
`;

const CustomerButton = styled.button`
  width: 100%;
  text-align: left;
  border: 1px solid
    ${(p) => (p.$active ? "hsl(var(--primary) / 0.5)" : "hsl(var(--border) / 0.6)")};
  border-radius: 0.75rem;
  padding: 0.55rem;
  background: ${(p) => (p.$active ? "hsl(var(--primary) / 0.1)" : "hsl(var(--background) / 0.65)")};
  color: hsl(var(--foreground));
  cursor: pointer;
`;

const Subtle = styled.p`
  margin: 0;
  font-size: 0.82rem;
  color: hsl(var(--muted-foreground));
`;

const StatusChip = styled.span`
  display: inline-flex;
  align-items: center;
  border: 1px solid hsl(var(--border) / 0.7);
  border-radius: 999px;
  padding: 0.15rem 0.5rem;
  font-size: 0.72rem;
  color: hsl(var(--muted-foreground));
`;

export default function AdminCustomersPage() {
  const [query, setQuery] = useState("");
  const [list, setList] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [detail, setDetail] = useState(null);
  const [adminNote, setAdminNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const loadList = useCallback(async () => {
    setLoadingList(true);
    setError("");
    try {
      const items = await listAdminCustomers({
        q: query || undefined,
        limit: 50,
        skip: 0,
      });
      setList(items);
      setSelectedId((prev) => (prev || !items[0]?.userId ? prev : items[0].userId));
    } finally {
      setLoadingList(false);
    }
  }, [query]);

  const loadDetail = useCallback(async () => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    setLoadingDetail(true);
    try {
      const data = await getAdminCustomer(selectedId);
      setDetail(data);
      setAdminNote(data?.adminNote ?? "");
    } finally {
      setLoadingDetail(false);
    }
  }, [selectedId]);

  useEffect(() => {
    void loadList().catch((err) => {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError("Insufficient permissions.");
      } else {
        setError("Could not load customers.");
      }
    });
  }, [loadList]);

  useEffect(() => {
    void loadDetail().catch(() => setError("Could not load customer detail."));
  }, [loadDetail]);

  const runAction = useCallback(async (patch) => {
    if (!selectedId) {
      return;
    }
    setSaving(true);
    setError("");
    try {
      const next = await patchAdminCustomerActions(selectedId, patch);
      setDetail(next);
      await loadList();
    } catch {
      setError("Customer action failed.");
    } finally {
      setSaving(false);
    }
  }, [loadList, selectedId]);

  return (
    <Grid>
      <Card>
        <h1 style={{ marginTop: 0, fontSize: "1.2rem" }}>Admin Customers</h1>
        {error ? <p style={{ color: "hsl(0 50% 40%)" }}>{error}</p> : null}
        <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem" }}>
          <Input
            placeholder="Search username/email"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Button type="button" onClick={() => void loadList()}>Search</Button>
        </div>
        <Subtle style={{ marginBottom: "0.4rem" }}>
          Showing all matching customers.
        </Subtle>
        <div style={{ display: "grid", gap: "0.4rem", marginTop: "0.6rem" }}>
          {loadingList ? (
            <p style={{ margin: 0, color: "hsl(var(--muted-foreground))" }}>Loading customers...</p>
          ) : null}
          {!loadingList && list.length === 0 && !error ? (
            <p style={{ margin: 0, color: "hsl(var(--muted-foreground))" }}>
              No customers found. Try clearing search/MFA code, then refresh.
            </p>
          ) : null}
          {list.map((c) => (
            <CustomerButton
              key={c.userId}
              type="button"
              onClick={() => setSelectedId(c.userId)}
              $active={selectedId === c.userId}
            >
              <div style={{ fontWeight: 600 }}>{c.username || c.email || c.userId}</div>
              <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>
                tickets: {c.createdTickets} · tasks: {c.totalTasks}
              </div>
            </CustomerButton>
          ))}
        </div>
      </Card>
      <Card>
        <h2 style={{ marginTop: 0, marginBottom: "0.45rem" }}>
          Customer detail
          {detail?.username || detail?.email || detail?.userId
            ? ` - ${detail.username || detail.email || detail.userId}`
            : ""}
        </h2>
        {loadingDetail ? (
          <Subtle>Loading customer profile...</Subtle>
        ) : detail ? (
          <>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.6rem" }}>
              <StatusChip>role: {detail.role}</StatusChip>
              <StatusChip>locked: {detail.accountLocked ? "yes" : "no"}</StatusChip>
              <StatusChip>mfa: {detail.mfaEnabled ? "on" : "off"}</StatusChip>
            </div>
            <label style={{ display: "grid", gap: "0.35rem" }}>
              Admin note
              <Textarea
                rows={4}
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
              />
            </label>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.6rem", flexWrap: "wrap" }}>
              <Button $primary type="button" disabled={saving} onClick={() => void runAction({ admin_note: adminNote })}>Save note</Button>
              <Button
                type="button"
                disabled={saving}
                onClick={() => {
                  if (window.confirm("Lock this account?")) {
                    void runAction({ lock_account: true });
                  }
                }}
              >Lock account</Button>
              <Button type="button" disabled={saving} onClick={() => void runAction({ lock_account: false })}>Unlock</Button>
              <Button type="button" disabled={saving} onClick={() => void runAction({ mfa_enabled: !detail.mfaEnabled })}>
                {detail.mfaEnabled ? "Disable MFA" : "Enable MFA"}
              </Button>
            </div>
          </>
        ) : (
          <Subtle>Select a customer from the list.</Subtle>
        )}
      </Card>
    </Grid>
  );
}
