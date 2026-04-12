import styled from "styled-components";
import JournalAttachmentPicker from "../journal/JournalAttachmentPicker";

const Card = styled.section`
  border-radius: 0.75rem;
  padding: 1.25rem;
  background: hsl(var(--primary) / 0.06);
  border: none;
  box-shadow: none;
`;

const HeadRow = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const Heading = styled.h2`
  margin: 0;
  font-family: var(--font-display), serif;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.3;
  color: hsl(var(--foreground));
`;

const PromptLine = styled.p`
  margin: 0 0 0.85rem;
  font-size: 15px;
  line-height: 1.625;
  font-style: italic;
  color: hsl(var(--muted-foreground));
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const TextArea = styled.textarea`
  width: 100%;
  min-height: 10rem;
  resize: vertical;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-size: 15px;
  line-height: 1.625;
  font-family: var(--font-sans), sans-serif;
  border: 1px solid hsl(var(--border) / 0.5);
  background: hsl(var(--background) / 0.6);
  color: hsl(var(--foreground));

  &::placeholder {
    color: hsl(var(--muted-foreground));
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.3);
    border-color: hsl(var(--primary) / 0.35);
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.15rem;
`;

const PrimaryBtn = styled.button`
  height: 2.2rem;
  padding: 0 0.95rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-family: var(--font-sans), sans-serif;
  font-weight: 600;
  letter-spacing: 0.01em;
  cursor: pointer;
  background: linear-gradient(
    135deg,
    hsl(var(--primary) / 0.92) 0%,
    hsl(var(--primary) / 0.78) 100%
  );
  color: white;
  box-shadow:
    inset 0 1px 0 hsl(var(--background) / 0.22),
    0 2px 10px hsl(var(--primary) / 0.18);
  transition: box-shadow 200ms ease, transform 200ms ease, filter 200ms ease;

  &:hover {
    filter: saturate(1.04);
    box-shadow:
      inset 0 1px 0 hsl(var(--background) / 0.24),
      0 5px 16px hsl(var(--primary) / 0.23);
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
    transform: none;
  }
`;

function SparkleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3v2.5M12 18.5V21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M3 12h2.5M18.5 12H21M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"
        stroke="hsl(var(--primary))"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.5" fill="hsl(var(--primary))" opacity="0.35" />
    </svg>
  );
}

export default function DesktopPromptCard({
  fieldKey = 0,
  textValue = "",
  onTextChange,
  onSubmit,
  attachmentFiles = [],
  onAttachmentFilesChange,
}) {
  return (
    <Card className="animate-fade-up stagger-200">
      <HeadRow>
        <SparkleIcon />
        <Heading>Your nudge space</Heading>
      </HeadRow>
      <PromptLine>
        What felt meaningful today, and what small nudge would help next?
      </PromptLine>
      <Form onSubmit={onSubmit}>
        <TextArea
          key={fieldKey}
          name="didToday"
          value={textValue}
          onChange={(e) => onTextChange?.(e.target.value)}
          onInput={(e) => {
            const el = e.currentTarget;
            el.style.height = "auto";
            el.style.height = `${Math.max(el.scrollHeight, 160)}px`;
          }}
          placeholder="Write freely — a sentence is enough."
          aria-label="What you did today"
          rows={6}
        />
        {typeof onAttachmentFilesChange === "function" ? (
          <JournalAttachmentPicker
            files={attachmentFiles}
            onFilesChange={onAttachmentFilesChange}
          />
        ) : null}
        <Actions>
          <PrimaryBtn type="submit">Save and generate insights</PrimaryBtn>
        </Actions>
      </Form>
    </Card>
  );
}
