import http from "./httpClient";
import { buildAdminMfaHeaders } from "./adminMfa";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function pickListPayload(data) {
  if (Array.isArray(data)) {
    return data;
  }
  return (
    data?.items ||
    data?.customers ||
    data?.users ||
    data?.results ||
    data?.rows ||
    data?.data ||
    []
  );
}

function withMfa(config = {}) {
  return {
    ...config,
    headers: {
      ...(config.headers ?? {}),
      ...buildAdminMfaHeaders(),
    },
  };
}

function normalizeTicket(ticket) {
  if (!ticket || typeof ticket !== "object") {
    return null;
  }
  return {
    id: String(ticket.id ?? ticket.ticket_id ?? ""),
    subject: String(ticket.subject ?? ""),
    status: String(ticket.status ?? "open"),
    priority: String(ticket.priority ?? "normal"),
    assignedToUserId:
      ticket.assigned_to_user_id != null
        ? String(ticket.assigned_to_user_id)
        : null,
    updatedAt: String(ticket.updated_at ?? ticket.updatedAt ?? ""),
    createdAt: String(ticket.created_at ?? ticket.createdAt ?? ""),
    createdByUserId:
      ticket.created_by_user_id != null
        ? String(ticket.created_by_user_id)
        : null,
  };
}

function normalizeMessage(msg) {
  if (!msg || typeof msg !== "object") {
    return null;
  }
  return {
    id: String(msg.id ?? msg.message_id ?? ""),
    body: String(msg.body ?? ""),
    isInternal: Boolean(msg.is_internal ?? msg.isInternal),
    createdAt: String(msg.created_at ?? msg.createdAt ?? ""),
    authorUserId: msg.author_user_id != null ? String(msg.author_user_id) : null,
  };
}

function normalizeCustomer(user) {
  if (!user || typeof user !== "object") {
    return null;
  }
  return {
    userId: String(user.id ?? user.user_id ?? user.uuid ?? user.sub ?? ""),
    username: user.username != null ? String(user.username) : null,
    email: user.email != null ? String(user.email) : null,
    role: user.role != null ? String(user.role) : "user",
    accountLocked: Boolean(user.account_locked ?? user.accountLocked),
    mfaEnabled: Boolean(user.mfa_enabled ?? user.mfaEnabled),
    adminNote: user.admin_note != null ? String(user.admin_note) : "",
    createdTickets: Number(user.created_tickets ?? 0),
    totalTasks: Number(user.total_tasks ?? 0),
  };
}

export async function listAdminSupportTickets(params = {}) {
  const { data } = await http.get("/api/admin/support/tickets", withMfa({ params }));
  return asArray(data?.items ?? data?.tickets ?? data)
    .map(normalizeTicket)
    .filter(Boolean);
}

export async function patchAdminSupportTicket(ticketId, patch) {
  const { data } = await http.patch(
    `/api/admin/support/tickets/${ticketId}`,
    patch,
    withMfa(),
  );
  return normalizeTicket(data?.ticket ?? data);
}

export async function getAdminSupportTicket(ticketId) {
  const { data } = await http.get(
    `/api/admin/support/tickets/${ticketId}`,
    withMfa(),
  );
  return {
    ticket: normalizeTicket(data?.ticket ?? data),
    messages: asArray(data?.messages).map(normalizeMessage).filter(Boolean),
  };
}

export async function postAdminSupportTicketMessage(ticketId, payload) {
  const { data } = await http.post(
    `/api/admin/support/tickets/${ticketId}/messages`,
    payload,
    withMfa(),
  );
  return {
    message: normalizeMessage(data?.message ?? data),
    ticket: normalizeTicket(data?.ticket),
  };
}

export async function assignAdminSupportTicket(ticketId, assignedToUserId) {
  const { data } = await http.post(
    `/api/admin/support/tickets/${ticketId}/assign`,
    { assigned_to_user_id: assignedToUserId },
    withMfa(),
  );
  return normalizeTicket(data?.ticket ?? data);
}

export async function listAdminCustomers(params = {}) {
  const { data } = await http.get("/api/admin/customers", withMfa({ params }));
  return asArray(pickListPayload(data))
    .map(normalizeCustomer)
    .filter((x) => Boolean(x?.userId));
}

export async function getAdminCustomer(userId) {
  const { data } = await http.get(`/api/admin/customers/${userId}`, withMfa());
  return normalizeCustomer(data?.customer ?? data?.user ?? data);
}

export async function patchAdminCustomerActions(userId, payload) {
  const { data } = await http.patch(
    `/api/admin/customers/${userId}/actions`,
    payload,
    withMfa(),
  );
  return normalizeCustomer(data?.customer ?? data?.user ?? data);
}
