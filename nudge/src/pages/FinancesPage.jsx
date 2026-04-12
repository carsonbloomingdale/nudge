import { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import * as XLSX from "xlsx";
import ExpandableSection from "../components/ui/ExpandableSection";
import {
  createFinanceBudget,
  createFinanceCategorizationJob,
  createFinanceTransaction,
  deleteFinanceBudget,
  deleteFinanceTransaction,
  fetchFinanceBudgetUtilization,
  fetchFinancePieAnalytics,
  getFinanceCategorizationJob,
  importFinanceTransactions,
  listFinanceBudgets,
  listFinanceTransactions,
  patchFinanceBudget,
  patchFinanceTransaction,
} from "../api/financeApi";

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Header = styled.header`
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;
`;

const Lead = styled.p`
  margin: 0;
  font-size: 0.9rem;
  color: hsl(var(--muted-foreground));
`;

const InlineRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.55rem;
  align-items: center;
`;

const Input = styled.input`
  border: 1px solid hsl(var(--border) / 0.7);
  border-radius: 0.55rem;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 0.45rem 0.6rem;
  font-size: 0.85rem;
  min-width: 0;
`;

const Select = styled.select`
  border: 1px solid hsl(var(--border) / 0.7);
  border-radius: 0.55rem;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 0.45rem 0.6rem;
  font-size: 0.85rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 9rem;
  resize: vertical;
  border: 1px solid hsl(var(--border) / 0.7);
  border-radius: 0.55rem;
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 0.55rem 0.65rem;
  font-size: 0.82rem;
  line-height: 1.45;
  font-family: var(--font-sans), sans-serif;
`;

const Button = styled.button`
  border: 1px solid hsl(var(--border) / 0.75);
  border-radius: 0.55rem;
  background: ${(p) => (p.$primary ? "hsl(var(--primary))" : "hsl(var(--card))")};
  color: ${(p) => (p.$primary ? "white" : "hsl(var(--foreground))")};
  padding: 0.45rem 0.7rem;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  opacity: ${(p) => (p.disabled ? 0.6 : 1)};
`;

const Muted = styled.p`
  margin: 0;
  font-size: 0.78rem;
  color: hsl(var(--muted-foreground));
`;

const TableWrap = styled.div`
  overflow-x: auto;
  border: 1px solid hsl(var(--border) / 0.55);
  border-radius: 0.7rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 56rem;

  th,
  td {
    text-align: left;
    padding: 0.5rem 0.55rem;
    border-bottom: 1px solid hsl(var(--border) / 0.45);
    font-size: 0.78rem;
    vertical-align: top;
  }

  th {
    color: hsl(var(--muted-foreground));
    font-weight: 600;
    background: hsl(var(--card) / 0.65);
  }
`;

const SortableTh = styled.th`
  cursor: pointer;
  user-select: none;
`;

const Pill = styled.span`
  display: inline-block;
  border: 1px solid hsl(var(--border) / 0.75);
  border-radius: 999px;
  padding: 0.1rem 0.45rem;
  font-size: 0.68rem;
  color: hsl(var(--muted-foreground));
`;

const PieBox = styled.div`
  width: 180px;
  height: 180px;
  border-radius: 50%;
  border: 1px solid hsl(var(--border) / 0.65);
`;

const Split = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: flex-start;
`;

const Legend = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 14rem;
`;

const LegendItem = styled.li`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.8rem;
`;

const ColorDot = styled.span`
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 50%;
  background: ${(p) => p.$color};
  flex-shrink: 0;
`;

const BarTrack = styled.div`
  width: 100%;
  height: 8px;
  border-radius: 999px;
  background: hsl(var(--muted) / 0.8);
  overflow: hidden;
`;

const BarFill = styled.div`
  height: 100%;
  width: ${(p) => `${Math.max(0, Math.min(100, p.$pct))}%`};
  background: ${(p) =>
    p.$pct > 100 ? "hsl(10 72% 58%)" : "hsl(var(--primary) / 0.78)"};
`;

const Banner = styled.div`
  border: 1px solid hsl(var(--border) / 0.7);
  border-radius: 0.7rem;
  background: hsl(var(--card) / 0.88);
  padding: 0.6rem 0.75rem;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.55rem;
`;

const BannerText = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: hsl(var(--foreground));
`;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function money(minor, currency = "USD") {
  const safeMinor = Number(minor) || 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: String(currency || "USD").toUpperCase(),
  }).format(safeMinor / 100);
}

function pieGradient(slices, total) {
  if (!slices.length || total <= 0) {
    return "conic-gradient(hsl(var(--muted)) 0deg 360deg)";
  }
  let current = 0;
  const colors = [
    "hsl(var(--trait-creative))",
    "hsl(var(--trait-social))",
    "hsl(var(--trait-analytical))",
    "hsl(var(--trait-adventurous))",
    "hsl(var(--trait-nurturing))",
    "hsl(var(--trait-disciplined))",
    "hsl(var(--primary))",
  ];
  const stops = slices.map((slice, i) => {
    const next = current + (slice.amount_minor / total) * 360;
    const seg = `${colors[i % colors.length]} ${current}deg ${next}deg`;
    current = next;
    return seg;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

function sanitizeSpreadsheetRow(raw) {
  if (!raw || typeof raw !== "object") {
    return null;
  }
  const out = {};
  for (const [key, value] of Object.entries(raw)) {
    const k = String(key ?? "").trim();
    if (!k) {
      continue;
    }
    if (value == null) {
      out[k] = "";
      continue;
    }
    if (typeof value === "number") {
      out[k] = Number.isFinite(value) ? value : "";
      continue;
    }
    out[k] = String(value).trim();
  }
  return out;
}

const FINANCE_ACTIVE_JOB_STORAGE_KEY = "nudge_finance_active_categorization_job_id";
const TERMINAL_JOB_STATES = new Set(["completed", "partial", "failed"]);
const ACTIVE_JOB_STATES = new Set(["queued", "running"]);

export default function FinancesPage() {
  const [fromDate, setFromDate] = useState(() => daysAgoIso(30));
  const [toDate, setToDate] = useState(() => todayIso());
  const [loading, setLoading] = useState(false);

  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [pie, setPie] = useState({ total_minor: 0, slices: [] });
  const [utilization, setUtilization] = useState([]);
  const [job, setJob] = useState(null);

  const [txForm, setTxForm] = useState({
    occurred_on: todayIso(),
    amount_minor: "",
    currency: "USD",
    merchant: "",
    description: "",
    category: "",
    source: "manual",
    source_external_id: "",
    account_label: "",
  });

  const [importForm, setImportForm] = useState({
    source: "import",
    fuzzy_days: 2,
    itemsJson: `[
  { "occurred_on": "${todayIso()}", "amount_minor": 1299, "currency": "USD", "merchant": "Coffee Shop", "description": "Latte" }
]`,
  });
  const [importResult, setImportResult] = useState(null);
  const [spreadsheetName, setSpreadsheetName] = useState("");
  const [jobTxIds, setJobTxIds] = useState("");
  const [uncategorizedOnly, setUncategorizedOnly] = useState(true);
  const [jobStartedAtMs, setJobStartedAtMs] = useState(0);
  const [lastJobTerminalMessage, setLastJobTerminalMessage] = useState("");

  const [budgetForm, setBudgetForm] = useState({
    category: "",
    period: "monthly",
    period_start: daysAgoIso(30),
    period_end: todayIso(),
    amount_minor: "",
  });
  const [txSort, setTxSort] = useState({
    key: "occurred_on",
    dir: "desc",
  });

  const setActiveJobIdInStorage = useCallback((jobId) => {
    try {
      if (jobId == null || String(jobId).trim() === "") {
        localStorage.removeItem(FINANCE_ACTIVE_JOB_STORAGE_KEY);
      } else {
        localStorage.setItem(FINANCE_ACTIVE_JOB_STORAGE_KEY, String(jobId));
      }
    } catch {
      // ignore storage failures
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tx, b, p, u] = await Promise.all([
        listFinanceTransactions({ skip: 0, limit: 100, include_deleted: false }),
        listFinanceBudgets(),
        fetchFinancePieAnalytics(fromDate, toDate),
        fetchFinanceBudgetUtilization(fromDate, toDate),
      ]);
      setTransactions(tx);
      setBudgets(b);
      setPie(p);
      setUtilization(u);
    } catch (e) {
      window.alert(
        e?.message || "Could not load finances right now. Check your API connection.",
      );
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    try {
      const savedJobId = localStorage.getItem(FINANCE_ACTIVE_JOB_STORAGE_KEY);
      if (!savedJobId) {
        return;
      }
      setJobStartedAtMs(Date.now());
      setJob((prev) => prev ?? {
        job_id: savedJobId,
        status: "queued",
        requested_count: 0,
        processed_count: 0,
        failed_count: 0,
        created_at: "",
      });
    } catch {
      // ignore storage failures
    }
  }, []);

  useEffect(() => {
    if (!job?.job_id) {
      setActiveJobIdInStorage(null);
      return;
    }
    if (ACTIVE_JOB_STATES.has(job.status)) {
      setActiveJobIdInStorage(job.job_id);
    } else if (TERMINAL_JOB_STATES.has(job.status)) {
      setActiveJobIdInStorage(null);
    }
  }, [job, setActiveJobIdInStorage]);

  useEffect(() => {
    if (!job?.job_id) {
      return undefined;
    }
    if (!ACTIVE_JOB_STATES.has(job.status)) {
      return undefined;
    }
    const elapsedMs = Math.max(0, Date.now() - (jobStartedAtMs || Date.now()));
    const intervalMs = elapsedMs <= 20000 ? 1500 : 4000;
    const t = setTimeout(async () => {
      try {
        const fresh = await getFinanceCategorizationJob(job.job_id);
        if (fresh) {
          setJob(fresh);
          if (TERMINAL_JOB_STATES.has(fresh.status)) {
            if (fresh.status === "completed") {
              setLastJobTerminalMessage("Categorization finished.");
            } else if (fresh.status === "partial") {
              setLastJobTerminalMessage(
                "Categorization finished with some failures.",
              );
            } else if (fresh.status === "failed") {
              setLastJobTerminalMessage("Categorization failed. Retry suggested.");
            }
            await loadAll();
          }
        }
      } catch {
        // keep current state and try again on next render cycle
      }
    }, intervalMs);
    return () => clearTimeout(t);
  }, [job, jobStartedAtMs, loadAll]);

  const pieGradientCss = useMemo(
    () => pieGradient(pie.slices, pie.total_minor),
    [pie],
  );

  const sortedTransactions = useMemo(() => {
    const list = [...(transactions ?? [])];
    const { key, dir } = txSort;
    const sign = dir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let av;
      let bv;
      if (key === "occurred_on") {
        av = String(a?.occurred_on ?? "");
        bv = String(b?.occurred_on ?? "");
      } else if (key === "amount_minor") {
        av = Number(a?.amount_minor ?? 0);
        bv = Number(b?.amount_minor ?? 0);
      } else if (key === "is_hidden_from_charts") {
        av = a?.is_hidden_from_charts ? 1 : 0;
        bv = b?.is_hidden_from_charts ? 1 : 0;
      } else {
        av = String(a?.[key] ?? "").toLowerCase();
        bv = String(b?.[key] ?? "").toLowerCase();
      }
      if (av < bv) {
        return -1 * sign;
      }
      if (av > bv) {
        return 1 * sign;
      }
      return 0;
    });
    return list;
  }, [transactions, txSort]);

  function toggleTxSort(key) {
    setTxSort((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { key, dir: "asc" };
    });
  }

  function sortMark(key) {
    if (txSort.key !== key) {
      return "";
    }
    return txSort.dir === "asc" ? " ▲" : " ▼";
  }

  async function handleCreateTx() {
    if (!txForm.occurred_on || !txForm.amount_minor || !txForm.merchant) {
      window.alert("occurred_on, amount_minor, and merchant are required.");
      return;
    }
    try {
      const created = await createFinanceTransaction({
        ...txForm,
        amount_minor: Number(txForm.amount_minor),
      });
      if (created) {
        setTransactions((prev) => [created, ...(prev ?? [])]);
      }
      setTxForm((prev) => ({
        ...prev,
        amount_minor: "",
        merchant: "",
        description: "",
      }));
      await loadAll();
    } catch (e) {
      window.alert(e?.message || "Could not create transaction.");
    }
  }

  async function handlePatchTx(id, patch) {
    try {
      const updated = await patchFinanceTransaction(id, patch);
      if (!updated) {
        return;
      }
      setTransactions((prev) =>
        (prev ?? []).map((t) => (t.transaction_id === id ? updated : t)),
      );
      await loadAll();
    } catch (e) {
      window.alert(e?.message || "Could not update transaction.");
    }
  }

  async function handleDeleteTx(id) {
    try {
      await deleteFinanceTransaction(id);
      setTransactions((prev) => (prev ?? []).filter((t) => t.transaction_id !== id));
      await loadAll();
    } catch (e) {
      window.alert(e?.message || "Could not delete transaction.");
    }
  }

  async function handleImport() {
    try {
      const parsed = JSON.parse(importForm.itemsJson);
      if (!Array.isArray(parsed)) {
        throw new Error("itemsJson must be a JSON array.");
      }
      const res = await importFinanceTransactions({
        source: importForm.source || "import",
        fuzzy_days: Number(importForm.fuzzy_days) || 2,
        items: parsed,
      });
      setImportResult(res);
      if (res?.categorization_job_id != null) {
        setJobStartedAtMs(Date.now());
        setLastJobTerminalMessage("");
        setJob({
          job_id: String(res.categorization_job_id),
          status: res.categorization_status || "queued",
          requested_count: res.net_added ?? 0,
          processed_count: 0,
          failed_count: 0,
          created_at: "",
        });
      }
      await loadAll();
    } catch (e) {
      window.alert(e?.message || "Import failed.");
    }
  }

  async function handleSpreadsheetImport(file) {
    if (!(file instanceof File)) {
      return;
    }
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) {
        throw new Error("Spreadsheet has no sheets.");
      }
      const sheet = workbook.Sheets[firstSheet];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      const items = rows.map(sanitizeSpreadsheetRow).filter(Boolean);
      if (items.length === 0) {
        throw new Error("No rows found in spreadsheet.");
      }
      const res = await importFinanceTransactions({
        source: importForm.source || "import",
        fuzzy_days: Number(importForm.fuzzy_days) || 2,
        items,
      });
      setImportResult(res);
      setSpreadsheetName(file.name);
      if (res?.categorization_job_id != null) {
        setJobStartedAtMs(Date.now());
        setLastJobTerminalMessage("");
        setJob({
          job_id: String(res.categorization_job_id),
          status: res.categorization_status || "queued",
          requested_count: res.net_added ?? 0,
          processed_count: 0,
          failed_count: 0,
          created_at: "",
        });
      }
      await loadAll();
    } catch (e) {
      window.alert(e?.message || "Spreadsheet import failed.");
    }
  }

  async function handleStartCategorization() {
    try {
      const ids = jobTxIds
        .split(",")
        .map((x) => x.trim())
        .filter(Boolean);
      const payload = {
        uncategorized_only: uncategorizedOnly,
      };
      if (ids.length > 0) {
        payload.transaction_ids = ids;
      }
      const created = await createFinanceCategorizationJob(payload);
      setJob(created);
      setJobStartedAtMs(Date.now());
      setLastJobTerminalMessage("");
    } catch (e) {
      window.alert(e?.message || "Could not start categorization.");
    }
  }

  async function handleCreateBudget() {
    if (!budgetForm.category || !budgetForm.amount_minor) {
      window.alert("category and amount_minor are required.");
      return;
    }
    try {
      await createFinanceBudget({
        ...budgetForm,
        amount_minor: Number(budgetForm.amount_minor),
      });
      setBudgetForm((prev) => ({ ...prev, category: "", amount_minor: "" }));
      await loadAll();
    } catch (e) {
      window.alert(e?.message || "Could not create budget.");
    }
  }

  async function handlePatchBudget(budgetId, patch) {
    try {
      await patchFinanceBudget(budgetId, patch);
      await loadAll();
    } catch (e) {
      window.alert(e?.message || "Could not update budget.");
    }
  }

  async function handleDeleteBudget(budgetId) {
    try {
      await deleteFinanceBudget(budgetId);
      await loadAll();
    } catch (e) {
      window.alert(e?.message || "Could not delete budget.");
    }
  }

  async function handleRetryCategorization() {
    try {
      const created = await createFinanceCategorizationJob({
        uncategorized_only: true,
      });
      setJob(created);
      setJobStartedAtMs(Date.now());
      setLastJobTerminalMessage("");
    } catch (e) {
      window.alert(e?.message || "Could not retry categorization.");
    }
  }

  const isJobActive = Boolean(job?.job_id && ACTIVE_JOB_STATES.has(job.status));
  const requested = Number(job?.requested_count ?? 0) || 0;
  const processed = Number(job?.processed_count ?? 0) || 0;
  const progressPct = requested > 0 ? Math.round((processed / requested) * 100) : 0;
  const showFailedRetry = job?.status === "failed";

  return (
    <Wrap>
      <Header>
        <Title>Finances</Title>
        <Lead>
          Connected to `/api/finances` for transactions, imports, categorization,
          spend pie, and budget utilization.
        </Lead>
        <InlineRow>
          <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          <Button type="button" onClick={loadAll} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh analytics"}
          </Button>
        </InlineRow>
      </Header>
      {importResult ? (
        <Banner>
          <BannerText>
            Import complete. Net added: {importResult.net_added}.{" "}
            {isJobActive
              ? `Categorizing ${requested || importResult.net_added} transactions...`
              : job?.status === "completed"
                ? "Categorization finished."
                : job?.status === "partial"
                  ? "Categorization finished with some failures."
                  : job?.status === "failed"
                    ? "Categorization failed."
                    : ""}
            {isJobActive && requested > 0 ? ` (${processed}/${requested}, ${progressPct}%)` : ""}
          </BannerText>
          {showFailedRetry ? (
            <Button type="button" onClick={handleRetryCategorization}>
              Retry uncategorized
            </Button>
          ) : null}
        </Banner>
      ) : null}
      {lastJobTerminalMessage && !importResult ? (
        <Banner>
          <BannerText>{lastJobTerminalMessage}</BannerText>
          {showFailedRetry ? (
            <Button type="button" onClick={handleRetryCategorization}>
              Retry uncategorized
            </Button>
          ) : null}
        </Banner>
      ) : null}

      <ExpandableSection title="Spend pie analytics" defaultOpen>
        <Split>
          <PieBox style={{ background: pieGradientCss }} />
          <Legend>
            <LegendItem>
              <strong>Total spend</strong>
              <strong>{money(pie.total_minor, "USD")}</strong>
            </LegendItem>
            {pie.slices.map((slice, i) => {
              const colors = [
                "hsl(var(--trait-creative))",
                "hsl(var(--trait-social))",
                "hsl(var(--trait-analytical))",
                "hsl(var(--trait-adventurous))",
                "hsl(var(--trait-nurturing))",
                "hsl(var(--trait-disciplined))",
                "hsl(var(--primary))",
              ];
              return (
                <LegendItem key={`${slice.category}-${i}`}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}>
                    <ColorDot $color={colors[i % colors.length]} />
                    {slice.category}
                  </span>
                  <span>{money(slice.amount_minor, "USD")}</span>
                </LegendItem>
              );
            })}
          </Legend>
        </Split>
      </ExpandableSection>

      <ExpandableSection title="Transactions" defaultOpen>
        <InlineRow>
          <Input
            type="date"
            value={txForm.occurred_on}
            onChange={(e) => setTxForm((s) => ({ ...s, occurred_on: e.target.value }))}
          />
          <Input
            placeholder="amount_minor"
            value={txForm.amount_minor}
            onChange={(e) => setTxForm((s) => ({ ...s, amount_minor: e.target.value }))}
          />
          <Input
            placeholder="currency"
            value={txForm.currency}
            onChange={(e) => setTxForm((s) => ({ ...s, currency: e.target.value }))}
          />
          <Input
            placeholder="merchant"
            value={txForm.merchant}
            onChange={(e) => setTxForm((s) => ({ ...s, merchant: e.target.value }))}
          />
          <Input
            placeholder="description"
            value={txForm.description}
            onChange={(e) => setTxForm((s) => ({ ...s, description: e.target.value }))}
          />
          <Input
            placeholder="category"
            value={txForm.category}
            onChange={(e) => setTxForm((s) => ({ ...s, category: e.target.value }))}
          />
          <Input
            placeholder="account_label"
            value={txForm.account_label}
            onChange={(e) => setTxForm((s) => ({ ...s, account_label: e.target.value }))}
          />
          <Button type="button" $primary onClick={handleCreateTx}>
            Add transaction
          </Button>
        </InlineRow>
        <TableWrap>
          <Table>
            <thead>
              <tr>
                <SortableTh onClick={() => toggleTxSort("occurred_on")}>
                  Date{sortMark("occurred_on")}
                </SortableTh>
                <SortableTh onClick={() => toggleTxSort("amount_minor")}>
                  Amount{sortMark("amount_minor")}
                </SortableTh>
                <SortableTh onClick={() => toggleTxSort("merchant")}>
                  Merchant{sortMark("merchant")}
                </SortableTh>
                <SortableTh onClick={() => toggleTxSort("description")}>
                  Description{sortMark("description")}
                </SortableTh>
                <SortableTh onClick={() => toggleTxSort("category")}>
                  Category{sortMark("category")}
                </SortableTh>
                <SortableTh onClick={() => toggleTxSort("account_label")}>
                  Account{sortMark("account_label")}
                </SortableTh>
                <SortableTh onClick={() => toggleTxSort("is_hidden_from_charts")}>
                  Hidden{sortMark("is_hidden_from_charts")}
                </SortableTh>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedTransactions.map((t) => (
                <tr key={t.transaction_id}>
                  <td>{t.occurred_on}</td>
                  <td>{money(t.amount_minor, t.currency)}</td>
                  <td>{t.merchant || <Muted>None</Muted>}</td>
                  <td>{t.description || <Muted>None</Muted>}</td>
                  <td>{t.category || <Pill>Uncategorized</Pill>}</td>
                  <td>{t.account_label || <Muted>-</Muted>}</td>
                  <td>{t.is_hidden_from_charts ? "Yes" : "No"}</td>
                  <td>
                    <InlineRow>
                      <Button
                        type="button"
                        onClick={() =>
                          handlePatchTx(t.transaction_id, {
                            is_hidden_from_charts: !t.is_hidden_from_charts,
                          })}
                      >
                        {t.is_hidden_from_charts ? "Unhide" : "Hide"}
                      </Button>
                      <Button
                        type="button"
                        onClick={() => {
                          const nextCategory = window.prompt(
                            "New category",
                            t.category || "",
                          );
                          if (nextCategory == null) {
                            return;
                          }
                          handlePatchTx(t.transaction_id, { category: nextCategory });
                        }}
                      >
                        Edit category
                      </Button>
                      <Button type="button" onClick={() => handleDeleteTx(t.transaction_id)}>
                        Delete
                      </Button>
                    </InlineRow>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
      </ExpandableSection>

      <ExpandableSection title="Import + de-dupe" defaultOpen>
        <InlineRow>
          <Input
            placeholder="source"
            value={importForm.source}
            onChange={(e) => setImportForm((s) => ({ ...s, source: e.target.value }))}
          />
          <Input
            type="number"
            placeholder="fuzzy_days"
            value={importForm.fuzzy_days}
            onChange={(e) => setImportForm((s) => ({ ...s, fuzzy_days: e.target.value }))}
          />
          <Button type="button" $primary onClick={handleImport}>
            Import transactions
          </Button>
          <Input
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={(e) => {
              const file = e.target.files?.[0];
              void handleSpreadsheetImport(file);
              e.target.value = "";
            }}
          />
        </InlineRow>
        <Muted>
          Spreadsheet import supports `.csv`, `.xlsx`, `.xls`. Headers are sent
          through to backend mapping (fuzzy + AI fallback) before import.
        </Muted>
        {spreadsheetName ? <Muted>Last spreadsheet imported: {spreadsheetName}</Muted> : null}
        <TextArea
          value={importForm.itemsJson}
          onChange={(e) => setImportForm((s) => ({ ...s, itemsJson: e.target.value }))}
        />
        {importResult ? (
          <Muted>
            rows_total: {importResult.rows_total} · duplicates_skipped:{" "}
            {importResult.duplicates_skipped} · net_added: {importResult.net_added}
          </Muted>
        ) : null}
      </ExpandableSection>

      <ExpandableSection title="AI categorization jobs" defaultOpen>
        <InlineRow>
          <Input
            placeholder="transaction_ids comma separated"
            value={jobTxIds}
            onChange={(e) => setJobTxIds(e.target.value)}
            style={{ minWidth: "20rem" }}
          />
          <label style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
            <input
              type="checkbox"
              checked={uncategorizedOnly}
              onChange={(e) => setUncategorizedOnly(e.target.checked)}
              style={{ marginRight: "0.35rem" }}
            />
            uncategorized_only
          </label>
          <Button type="button" $primary onClick={handleStartCategorization}>
            Start job
          </Button>
        </InlineRow>
        {job ? (
          <InlineRow>
            <Pill>job_id: {job.job_id}</Pill>
            <Pill>status: {job.status}</Pill>
            <Pill>requested: {job.requested_count}</Pill>
            <Pill>processed: {job.processed_count}</Pill>
            <Pill>failed: {job.failed_count}</Pill>
            {requested > 0 ? (
              <Pill>
                progress: {Math.min(100, Math.max(0, progressPct))}%
              </Pill>
            ) : null}
            {job.error_detail ? <Pill>error: {job.error_detail}</Pill> : null}
          </InlineRow>
        ) : (
          <Muted>No active categorization job.</Muted>
        )}
      </ExpandableSection>

      <ExpandableSection title="Budgets + utilization" defaultOpen>
        <InlineRow>
          <Input
            placeholder="category"
            value={budgetForm.category}
            onChange={(e) => setBudgetForm((s) => ({ ...s, category: e.target.value }))}
          />
          <Select
            value={budgetForm.period}
            onChange={(e) => setBudgetForm((s) => ({ ...s, period: e.target.value }))}
          >
            <option value="monthly">monthly</option>
            <option value="weekly">weekly</option>
            <option value="custom">custom</option>
          </Select>
          <Input
            type="date"
            value={budgetForm.period_start}
            onChange={(e) => setBudgetForm((s) => ({ ...s, period_start: e.target.value }))}
          />
          <Input
            type="date"
            value={budgetForm.period_end}
            onChange={(e) => setBudgetForm((s) => ({ ...s, period_end: e.target.value }))}
          />
          <Input
            placeholder="amount_minor"
            value={budgetForm.amount_minor}
            onChange={(e) => setBudgetForm((s) => ({ ...s, amount_minor: e.target.value }))}
          />
          <Button type="button" $primary onClick={handleCreateBudget}>
            Add budget
          </Button>
        </InlineRow>

        <TableWrap>
          <Table style={{ minWidth: "48rem" }}>
            <thead>
              <tr>
                <th>Category</th>
                <th>Range</th>
                <th>Budget</th>
                <th>Spent</th>
                <th>Remaining</th>
                <th>Used</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {utilization.map((u) => (
                <tr key={u.budget_id}>
                  <td>{u.category || "Uncategorized"}</td>
                  <td>{u.period_start} - {u.period_end}</td>
                  <td>{money(u.budget_amount_minor, "USD")}</td>
                  <td>{money(u.spent_minor, "USD")}</td>
                  <td>{money(u.remaining_minor, "USD")}</td>
                  <td style={{ minWidth: "11rem" }}>
                    <InlineRow style={{ flexDirection: "column", alignItems: "stretch", gap: "0.3rem" }}>
                      <BarTrack>
                        <BarFill $pct={u.used_percent} />
                      </BarTrack>
                      <span>{Number(u.used_percent || 0).toFixed(1)}%</span>
                    </InlineRow>
                  </td>
                  <td>
                    <InlineRow>
                      <Button
                        type="button"
                        onClick={() => {
                          const next = window.prompt(
                            "New budget amount (minor units)",
                            String(u.budget_amount_minor || 0),
                          );
                          if (next == null) {
                            return;
                          }
                          const parsed = Number(next);
                          if (!Number.isFinite(parsed) || parsed <= 0) {
                            window.alert("Budget amount must be > 0.");
                            return;
                          }
                          handlePatchBudget(u.budget_id, { amount_minor: parsed });
                        }}
                      >
                        Edit
                      </Button>
                      <Button type="button" onClick={() => handleDeleteBudget(u.budget_id)}>
                        Delete
                      </Button>
                    </InlineRow>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </TableWrap>
        <Muted>
          Budgets configured: {budgets.length}. Utilization range: {fromDate} to {toDate}.
        </Muted>
      </ExpandableSection>
    </Wrap>
  );
}
