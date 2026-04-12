import styled, { keyframes } from "styled-components";
import {
  FeaturePreviewBadge,
  PageTitleWithBadge,
} from "../ui/FeaturePreviewBadge";

const LG = "1024px";

const fadeUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
    filter: blur(3px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
`;

const Wrap = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 1.5rem;

  @media (min-width: ${LG}) {
    font-size: 2.25rem;
  }
`;

const Lead = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));

  @media (min-width: ${LG}) {
    font-size: 15px;
  }
`;

const Panel = styled.section`
  border-radius: var(--radius);
  padding: 1.1rem;
  border: 1px solid hsl(var(--border) / 0.55);
  background: hsl(var(--card) / 0.8);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  animation: ${fadeUp} 500ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
  opacity: 0;
`;

const PanelTitle = styled.h2`
  margin: 0 0 0.35rem;
  font-size: 1rem;
`;

const Copy = styled.p`
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.5;
  color: hsl(var(--muted-foreground));
`;

export default function FinancesContent() {
  return (
    <Wrap>
      <header className="animate-fade-up stagger-0">
        <PageTitleWithBadge>
          <Title>Finances</Title>
          <FeaturePreviewBadge />
        </PageTitleWithBadge>
        <Lead>
          A placeholder space for your financial picture. Budgeting, spending,
          and trend tracking will land here in a later update.
        </Lead>
      </header>
      <Panel className="stagger-100">
        <PanelTitle>Coming soon</PanelTitle>
        <Copy>
          This page is intentionally stubbed so navigation and layout are in
          place before we build live finance features.
        </Copy>
      </Panel>
    </Wrap>
  );
}
