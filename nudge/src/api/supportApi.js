import http from "./httpClient";

function asArray(value) {
  return Array.isArray(value) ? value : [];
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

export async function createSupportTicket(payload) {
  const { data } = await http.post("/api/support/tickets", payload);
  return {
    ticket: normalizeTicket(data?.ticket ?? data),
    firstMessage: normalizeMessage(data?.first_message ?? data?.message),
  };
}

export async function listOwnSupportTickets(params = {}) {
  const { data } = await http.get("/api/support/tickets", { params });
  const raw = data?.items ?? data?.tickets ?? data;
  return asArray(raw).map(normalizeTicket).filter(Boolean);
}

export async function getOwnSupportTicket(ticketId) {
  const { data } = await http.get(`/api/support/tickets/${ticketId}`);
  return {
    ticket: normalizeTicket(data?.ticket ?? data),
    messages: asArray(data?.messages).map(normalizeMessage).filter(Boolean),
  };
}

export async function createOwnSupportTicketMessage(ticketId, body) {
  const { data } = await http.post(`/api/support/tickets/${ticketId}/messages`, {
    body,
  });
  return {
    message: normalizeMessage(data?.message ?? data),
    ticket: normalizeTicket(data?.ticket),
  };
}
