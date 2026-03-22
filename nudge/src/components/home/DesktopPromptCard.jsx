import styled from "styled-components";
import Suggestion from "../Suggestion";
import SuggestionLoading from "../SuggestionLoading";

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
  min-height: 4.5rem;
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
  flex-wrap: wrap;
  align-items: center;
  gap: 0.65rem;
`;

const PrimaryBtn = styled.button`
  height: 2.5rem;
  padding: 0 1.15rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 15px;
  font-family: var(--font-sans), sans-serif;
  font-weight: 600;
  cursor: pointer;
  background: hsl(var(--primary));
  color: white;
  box-shadow: 0 4px 14px hsl(var(--primary) / 0.2);
  transition: box-shadow 200ms ease, transform 200ms ease;

  &:hover {
    box-shadow: 0 6px 20px hsl(var(--primary) / 0.25);
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

const SecondaryBtn = styled.button`
  height: 2.5rem;
  padding: 0 1rem;
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: 0.5rem;
  font-size: 15px;
  font-family: var(--font-sans), sans-serif;
  font-weight: 500;
  cursor: pointer;
  background: hsl(var(--card) / 0.9);
  color: hsl(var(--foreground));
  transition: box-shadow 300ms ease, transform 200ms ease;

  &:hover {
    box-shadow: 0 2px 10px hsl(var(--foreground) / 0.06);
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.65;
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
  onSubmit,
  onChangeDebounced,
  onGetSuggestion,
  suggestion,
  setSuggestion,
  suggestionLoading,
}) {
  return (
    <Card className="animate-fade-up stagger-200">
      <HeadRow>
        <SparkleIcon />
        <Heading>Today&apos;s prompt</Heading>
      </HeadRow>
      <PromptLine>
        What did you do today that you&apos;d actually want to remember?
      </PromptLine>
      <Form onSubmit={onSubmit}>
        <TextArea
          key={fieldKey}
          name="didToday"
          onChange={onChangeDebounced}
          placeholder="Write freely — a sentence is enough."
          aria-label="What you did today"
          rows={3}
        />
        <Actions>
          <PrimaryBtn type="submit">Save reflection</PrimaryBtn>
          <SecondaryBtn
            type="button"
            onClick={onGetSuggestion}
            disabled={suggestionLoading}
          >
            {suggestionLoading ? "Thinking…" : "What should I do?"}
          </SecondaryBtn>
        </Actions>
      </Form>
      <div style={{ marginTop: "1rem" }}>
        {suggestionLoading ? (
          <SuggestionLoading />
        ) : (
          <Suggestion
            setSuggestion={setSuggestion}
            suggestion={suggestion?.reccomendedTask}
            context={suggestion?.context}
            className="animate-fade-up stagger-100"
          />
        )}
      </div>
    </Card>
  );
}
