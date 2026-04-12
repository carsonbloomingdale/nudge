import http from "./httpClient";

function asText(v) {
  if (v == null) {
    return "";
  }
  return String(v).trim();
}

function asInt(v, fallback = 0) {
  const n = Number(v);
  if (!Number.isFinite(n)) {
    return fallback;
  }
  return Math.trunc(n);
}

function normalizeTransaction(row) {
  if (!row || typeof row !== "object") {
    return null;
  }
  const transactionId = asText(row.transaction_id ?? row.transactionId ?? row.id);
  if (!transactionId) {
    return null;
  }
  return {
    transaction_id: transactionId,
    occurred_on: asText(row.occurred_on ?? row.occurredOn),
    amount_minor: asInt(row.amount_minor ?? row.amountMinor),
    currency: asText(row.currency).toUpperCase() || "USD",
    merchant: asText(row.merchant),
    description: asText(row.description),
    category: asText(row.category),
    source: asText(row.source),
    source_external_id: asText(row.source_external_id ?? row.sourceExternalId),
    account_label: asText(row.account_label ?? row.accountLabel),
    is_hidden_from_charts: Boolean(row.is_hidden_from_charts ?? row.isHiddenFromCharts),
    deleted_at: asText(row.deleted_at ?? row.deletedAt),
  };
}

function normalizeTransactionsPayload(data) {
  const list = Array.isArray(data?.transactions)
    ? data.transactions
    : Array.isArray(data?.items)
      ? data.items
      : Array.isArray(data)
        ? data
        : [];
  return list.map(normalizeTransaction).filter(Boolean);
}

export async function createFinanceTransaction(payload) {
  const { data } = await http.post("/api/finances/transactions", payload);
  return normalizeTransaction(data);
}

export async function listFinanceTransactions(options = {}) {
  const params = {
    skip: asInt(options.skip, 0),
    limit: asInt(options.limit, 100),
    include_deleted: Boolean(options.include_deleted ?? false),
  };
  const { data } = await http.get("/api/finances/transactions", { params });
  return normalizeTransactionsPayload(data);
}

export async function patchFinanceTransaction(transactionId, patch) {
  const safe = encodeURIComponent(asText(transactionId));
  const { data } = await http.patch(`/api/finances/transactions/${safe}`, patch);
  return normalizeTransaction(data);
}

export async function deleteFinanceTransaction(transactionId) {
  const safe = encodeURIComponent(asText(transactionId));
  await http.delete(`/api/finances/transactions/${safe}`);
}

export async function importFinanceTransactions(payload) {
  const { data } = await http.post("/api/finances/transactions/import", payload);
  return {
    rows_total: asInt(data?.rows_total),
    duplicates_skipped: asInt(data?.duplicates_skipped),
    net_added: asInt(data?.net_added),
    categorization_job_id: data?.categorization_job_id ?? data?.categorizationJobId ?? null,
    categorization_status: asText(
      data?.categorization_status ?? data?.categorizationStatus,
    ) || null,
  };
}

function normalizeCategorizationJob(data) {
  if (!data || typeof data !== "object") {
    return null;
  }
  const jobId = asText(data.job_id ?? data.jobId ?? data.id);
  if (!jobId) {
    return null;
  }
  return {
    job_id: jobId,
    status: asText(data.status) || "queued",
    requested_count: asInt(data.requested_count),
    processed_count: asInt(data.processed_count),
    failed_count: asInt(data.failed_count),
    created_at: asText(data.created_at ?? data.createdAt),
    started_at: asText(data.started_at ?? data.startedAt),
    completed_at: asText(data.completed_at ?? data.completedAt),
    updated_at: asText(data.updated_at ?? data.updatedAt),
    error_detail: asText(data.error_detail ?? data.errorDetail),
  };
}

export async function createFinanceCategorizationJob(payload = {}) {
  const { data } = await http.post("/api/finances/categorization-jobs", payload);
  return normalizeCategorizationJob(data);
}

export async function getFinanceCategorizationJob(jobId) {
  const safe = encodeURIComponent(asText(jobId));
  const { data } = await http.get(`/api/finances/categorization-jobs/${safe}`);
  return normalizeCategorizationJob(data);
}

export async function fetchFinancePieAnalytics(fromDate, toDate) {
  const { data } = await http.get("/api/finances/analytics/pie", {
    params: { from_date: fromDate, to_date: toDate },
  });
  const slicesRaw = Array.isArray(data?.slices) ? data.slices : [];
  return {
    from_date: asText(data?.from_date ?? fromDate),
    to_date: asText(data?.to_date ?? toDate),
    total_minor: asInt(data?.total_minor),
    slices: slicesRaw
      .map((x) => ({
        category: asText(x?.category) || "Uncategorized",
        amount_minor: asInt(x?.amount_minor),
      }))
      .filter((x) => x.amount_minor > 0),
  };
}

function normalizeBudget(row) {
  if (!row || typeof row !== "object") {
    return null;
  }
  const budgetId = asText(row.budget_id ?? row.budgetId ?? row.id);
  if (!budgetId) {
    return null;
  }
  return {
    budget_id: budgetId,
    category: asText(row.category),
    period: asText(row.period),
    period_start: asText(row.period_start ?? row.periodStart),
    period_end: asText(row.period_end ?? row.periodEnd),
    amount_minor: asInt(row.amount_minor ?? row.amountMinor),
  };
}

function normalizeBudgetsPayload(data) {
  const list = Array.isArray(data?.budgets)
    ? data.budgets
    : Array.isArray(data)
      ? data
      : [];
  return list.map(normalizeBudget).filter(Boolean);
}

export async function createFinanceBudget(payload) {
  const { data } = await http.post("/api/finances/budgets", payload);
  return normalizeBudget(data);
}

export async function listFinanceBudgets() {
  const { data } = await http.get("/api/finances/budgets");
  return normalizeBudgetsPayload(data);
}

export async function patchFinanceBudget(budgetId, patch) {
  const safe = encodeURIComponent(asText(budgetId));
  const { data } = await http.patch(`/api/finances/budgets/${safe}`, patch);
  return normalizeBudget(data);
}

export async function deleteFinanceBudget(budgetId) {
  const safe = encodeURIComponent(asText(budgetId));
  await http.delete(`/api/finances/budgets/${safe}`);
}

export async function fetchFinanceBudgetUtilization(fromDate, toDate) {
  const { data } = await http.get("/api/finances/analytics/budgets-utilization", {
    params: { from_date: fromDate, to_date: toDate },
  });
  const list = Array.isArray(data?.budgets)
    ? data.budgets
    : Array.isArray(data)
      ? data
      : [];
  return list
    .map((x) => ({
      budget_id: asText(x?.budget_id ?? x?.budgetId ?? x?.id),
      category: asText(x?.category),
      period_start: asText(x?.period_start ?? x?.periodStart),
      period_end: asText(x?.period_end ?? x?.periodEnd),
      budget_amount_minor: asInt(x?.budget_amount_minor ?? x?.amount_minor),
      spent_minor: asInt(x?.spent_minor),
      remaining_minor: asInt(x?.remaining_minor),
      used_percent: Number(x?.used_percent ?? 0) || 0,
    }))
    .filter((x) => x.budget_id);
}
