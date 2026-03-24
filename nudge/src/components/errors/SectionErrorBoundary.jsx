import React from "react";
import styled from "styled-components";
import { createSupportTicket } from "../../api/supportApi";

const DEDUPE_KEY = "nudge_error_boundary_ticket_cache_v1";
const DEDUPE_MS = 10 * 60 * 1000;

const Card = styled.section`
  max-width: 40rem;
  margin: 0 auto;
  border-radius: var(--radius);
  border: 1px solid hsl(var(--border) / 0.65);
  background: hsl(var(--card) / 0.88);
  padding: 1rem;
`;

const Title = styled.h2`
  margin: 0 0 0.4rem;
`;

const Subtle = styled.p`
  margin: 0 0 0.8rem;
  color: hsl(var(--muted-foreground));
  font-size: 0.9rem;
`;

const ErrorBox = styled.p`
  margin: 0 0 0.6rem;
  padding: 0.55rem 0.65rem;
  border-radius: 0.6rem;
  border: 1px solid hsl(0 55% 78%);
  background: hsl(0 80% 97%);
  color: hsl(0 48% 38%);
  font-size: 0.82rem;
  white-space: pre-wrap;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
`;

const Button = styled.button`
  height: 2.35rem;
  border-radius: 0.6rem;
  border: 1px solid hsl(var(--border) / 0.8);
  padding: 0 0.85rem;
  background: ${(p) => (p.$primary ? "hsl(var(--primary))" : "hsl(var(--background))")};
  color: ${(p) => (p.$primary ? "white" : "hsl(var(--foreground))")};
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  opacity: ${(p) => (p.disabled ? 0.55 : 1)};
`;

function safeReadCache() {
  if (typeof window === "undefined") {
    return {};
  }
  try {
    return JSON.parse(sessionStorage.getItem(DEDUPE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function safeWriteCache(cache) {
  if (typeof window === "undefined") {
    return;
  }
  try {
    sessionStorage.setItem(DEDUPE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function extractSignature(section, error, info) {
  const msg = String(error?.message ?? "unknown_error").slice(0, 120);
  const topStack = String(info?.componentStack ?? "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 1)
    .join("|");
  return `${section}|${msg}|${topStack}`;
}

function shouldSend(signature) {
  const now = Date.now();
  const cache = safeReadCache();
  const last = Number(cache[signature] ?? 0);
  if (last && now - last < DEDUPE_MS) {
    return false;
  }
  cache[signature] = now;
  safeWriteCache(cache);
  return true;
}

function buildPayload(section, error, info) {
  const message = String(error?.message ?? "Unknown runtime error");
  const stack = String(error?.stack ?? "").slice(0, 2500);
  const componentStack = String(info?.componentStack ?? "").slice(0, 2500);
  const path =
    typeof window !== "undefined"
      ? `${window.location.pathname}${window.location.search}`
      : "unknown";
  return {
    subject: `Auto error report: ${section}`,
    message: [
      `A runtime error was caught in section: ${section}`,
      `Path: ${path}`,
      "",
      `Message: ${message}`,
      "",
      "Component stack:",
      componentStack || "(none)",
      "",
      "Error stack:",
      stack || "(none)",
    ]
      .join("\n")
      .slice(0, 3900),
    priority: "high",
  };
}

export default class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      info: null,
      sending: false,
      sent: false,
      sendError: "",
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  async componentDidCatch(error, info) {
    this.setState({ info });
    const section = this.props.section || "Unknown section";
    const signature = extractSignature(section, error, info);
    if (!shouldSend(signature)) {
      return;
    }
    try {
      await createSupportTicket(buildPayload(section, error, info));
      this.setState({ sent: true, sendError: "" });
    } catch {
      this.setState({ sendError: "Auto-report failed. You can send one manually." });
    }
  }

  handleRetryView = () => {
    this.setState({
      hasError: false,
      error: null,
      info: null,
      sending: false,
      sent: false,
      sendError: "",
    });
  };

  handleSendManual = async () => {
    const { error, info, sending } = this.state;
    if (sending) {
      return;
    }
    this.setState({ sending: true, sendError: "" });
    try {
      await createSupportTicket(
        buildPayload(this.props.section || "Unknown section", error, info),
      );
      this.setState({ sent: true, sendError: "", sending: false });
    } catch {
      this.setState({
        sendError: "Could not send support ticket from this screen.",
        sending: false,
      });
    }
  };

  render() {
    const { hasError, error, sending, sent, sendError } = this.state;
    const { children, showSendSupport = true } = this.props;
    if (!hasError) {
      return children;
    }
    return (
      <Card role="alert">
        <Title>Something went wrong</Title>
        <Subtle>
          This section crashed. You can retry this view, refresh the app, or send a
          support ticket.
        </Subtle>
        {error?.message ? <ErrorBox>{String(error.message)}</ErrorBox> : null}
        {sent ? <Subtle style={{ color: "hsl(140 38% 32%)" }}>Support ticket sent.</Subtle> : null}
        {sendError ? <Subtle style={{ color: "hsl(0 48% 38%)" }}>{sendError}</Subtle> : null}
        <ButtonRow>
          <Button type="button" onClick={this.handleRetryView}>
            Try again
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
          >
            Refresh
          </Button>
          {showSendSupport ? (
            <Button
              $primary
              type="button"
              disabled={sending}
              onClick={this.handleSendManual}
            >
              {sending ? "Sending..." : "Send support ticket"}
            </Button>
          ) : null}
        </ButtonRow>
      </Card>
    );
  }
}
