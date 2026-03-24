import { useCallback, useEffect, useRef, useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { Link } from "react-router-dom";
import { createSupportTicket } from "../../api/supportApi";

const LG = "1024px";

const Wrap = styled.div`
  display: none;
  @media (min-width: ${LG}) {
    display: block;
    position: fixed;
    right: 1rem;
    bottom: 0;
    z-index: 65;
  }
`;

const MoleButton = styled.button`
  border: 1px solid hsl(var(--border) / 0.75);
  border-bottom: none;
  border-radius: 0.9rem 0.9rem 0 0;
  padding: 0.45rem 0.9rem 0.4rem;
  min-width: 8rem;
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  box-shadow: 0 -4px 18px hsl(var(--foreground) / 0.12);
  font-size: 0.78rem;
  font-weight: 600;
  cursor: pointer;
`;

const Popover = styled.section`
  position: absolute;
  right: 0;
  bottom: calc(100% + 0.4rem);
  width: min(24rem, 44vw);
  border-radius: 0.95rem;
  border: 1px solid hsl(var(--border) / 0.72);
  background: hsl(var(--card));
  box-shadow: 0 14px 28px hsl(var(--foreground) / 0.14);
  padding: 0.8rem;
`;

const Title = styled.h3`
  margin: 0 0 0.25rem;
  font-size: 0.95rem;
`;

const Hint = styled.p`
  margin: 0 0 0.6rem;
  font-size: 0.78rem;
  color: hsl(var(--muted-foreground));
`;

const Input = styled.input`
  width: 100%;
  height: 2.3rem;
  border-radius: 0.65rem;
  border: 1px solid hsl(var(--border) / 0.8);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 0 0.65rem;
  font: inherit;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 4.6rem;
  border-radius: 0.65rem;
  border: 1px solid hsl(var(--border) / 0.8);
  background: hsl(var(--background));
  color: hsl(var(--foreground));
  padding: 0.55rem 0.65rem;
  font: inherit;
  resize: vertical;
`;

const Actions = styled.div`
  margin-top: 0.5rem;
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const Button = styled.button`
  height: 2.2rem;
  border-radius: 0.6rem;
  border: 1px solid hsl(var(--border) / 0.75);
  padding: 0 0.75rem;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  background: ${(p) => (p.$primary ? "hsl(var(--primary))" : "hsl(var(--background))")};
  color: ${(p) => (p.$primary ? "white" : "hsl(var(--foreground))")};
  opacity: ${(p) => (p.disabled ? 0.6 : 1)};
`;

const Error = styled.p`
  margin: 0 0 0.45rem;
  font-size: 0.78rem;
  color: hsl(0 50% 38%);
`;

const Success = styled.p`
  margin: 0 0 0.45rem;
  font-size: 0.78rem;
  color: hsl(140 38% 30%);
`;

export default function SupportMole() {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const onDocClick = (event) => {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("touchstart", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("touchstart", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const onSubmit = useCallback(async () => {
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
    setSuccess("");
    try {
      await createSupportTicket({ subject: sub, message: body, priority: "normal" });
      setSubject("");
      setMessage("");
      setSuccess("Sent. We will reply in your Support inbox.");
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError("Your account is locked. Ticket submission is unavailable.");
      } else {
        setError("Could not send support request.");
      }
    } finally {
      setBusy(false);
    }
  }, [message, subject]);

  return (
    <Wrap ref={wrapRef}>
      {open ? (
        <Popover aria-label="Quick support">
          <Title>Quick support</Title>
          <Hint>Drop a note here or open full Support for history.</Hint>
          {error ? <Error>{error}</Error> : null}
          {success ? <Success>{success}</Success> : null}
          <Input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Subject"
          />
          <div style={{ height: "0.45rem" }} />
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="How can we help?"
          />
          <Actions>
            <Button $primary type="button" disabled={busy} onClick={() => void onSubmit()}>
              {busy ? "Sending..." : "Send"}
            </Button>
            <Button type="button" onClick={() => setOpen(false)}>
              Close
            </Button>
            <Link style={{ marginLeft: "auto", fontSize: "0.78rem" }} to="/app/support">
              Full page
            </Link>
          </Actions>
        </Popover>
      ) : null}
      <MoleButton
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Open support"
        onClick={() => setOpen((v) => !v)}
      >
        Support
      </MoleButton>
    </Wrap>
  );
}
