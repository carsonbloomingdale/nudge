import styled from "styled-components";

const Panel = styled.div`
  margin-top: 1.25rem;
  border-radius: var(--radius);
  padding: 1.25rem 1.5rem;
  background: hsl(var(--card) / 0.8);
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  color: hsl(var(--foreground));
  font-size: 15px;
  line-height: 1.625;
  overflow-wrap: break-word;
  transition: box-shadow 300ms ease;

  &:hover {
    box-shadow: 0 4px 14px hsl(var(--foreground) / 0.08);
  }
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const CloseBtn = styled.button`
  flex-shrink: 0;
  border: none;
  background: transparent;
  padding: 0.25rem;
  margin: -0.25rem -0.25rem 0 0;
  font-size: 1.25rem;
  line-height: 1;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  border-radius: 6px;
  transition: color 200ms ease, transform 200ms ease;

  &:hover {
    color: hsl(var(--foreground));
  }

  &:active {
    transform: scale(0.97);
  }
`;

const SuggestionTitle = styled.h3`
  margin: 0;
`;

const Block = styled.div`
  margin-top: 0.75rem;

  &:first-of-type {
    margin-top: 0;
  }
`;

const Strong = styled.span`
  font-weight: 600;
  color: hsl(var(--foreground));
`;

export default function Suggestion({
  suggestion,
  setSuggestion,
  context,
  className,
}) {
  if (!suggestion) {
    return null;
  }

  return (
    <Panel className={className}>
      <HeaderRow>
        <SuggestionTitle>Suggestion</SuggestionTitle>
        <CloseBtn
          type="button"
          onClick={() => setSuggestion()}
          aria-label="Dismiss suggestion"
        >
          ×
        </CloseBtn>
      </HeaderRow>
      <Block>{suggestion}</Block>
      {context ? (
        <Block>
          <Strong>Why? </Strong>
          {context}
        </Block>
      ) : null}
    </Panel>
  );
}
