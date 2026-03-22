import styled, { css } from "styled-components";

export const PREVIEW_BADGE_TITLE =
  "In development — sample data only, not synced with your account or the server.";

const Inner = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 9999px;
  font-family: var(--font-sans), sans-serif;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--muted) / 0.55);
  border: 1px solid hsl(var(--border) / 0.65);
  padding: 0.22rem 0.55rem;
  font-size: 0.625rem;
  line-height: 1;

  ${(p) =>
    p.$compact &&
    css`
      padding: 0.12rem 0.38rem;
      font-size: 0.5rem;
      letter-spacing: 0.05em;
    `}
`;

export function FeaturePreviewBadge({ compact, className, ...rest }) {
  return (
    <Inner
      $compact={compact}
      className={className}
      role="note"
      title={PREVIEW_BADGE_TITLE}
      {...rest}
    >
      Preview
    </Inner>
  );
}

export const PageTitleWithBadge = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;

  & > h1 {
    flex: 1;
    min-width: min(100%, 12rem);
  }
`;
