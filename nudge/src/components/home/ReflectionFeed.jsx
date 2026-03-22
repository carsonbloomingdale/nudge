import styled from "styled-components";
import {
  extractPersonalityTraits,
  formatReflectionTime,
  traitForEntry,
  traitThemeForSlug,
} from "./traitUtils";

const SectionTitle = styled.h2`
  margin: 0 0 1rem;
  font-family: var(--font-display), serif;
  font-size: 1.25rem;
  font-weight: 400;
  line-height: 1.25;
  color: hsl(var(--foreground));
`;

const Stack = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const Card = styled.article`
  position: relative;
  border-radius: 0.5rem;
  padding: 1.25rem;
  background: hsl(var(--card) / 0.8);
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  transition: box-shadow 300ms ease;

  &:hover {
    box-shadow: 0 4px 14px hsl(var(--foreground) / 0.08);
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.65rem;
`;

const TraitBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.65rem;
  border-radius: 9999px;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: ${(p) =>
    p.$hsl
      ? `hsl(${p.$hsl} / 0.14)`
      : p.$var
        ? `hsl(var(${p.$var}) / 0.12)`
        : "hsl(var(--primary) / 0.12)"};
  color: ${(p) =>
    p.$hsl
      ? `hsl(${p.$hsl})`
      : p.$var
        ? `hsl(var(${p.$var}))`
        : "hsl(var(--primary))"};
`;

const Time = styled.time`
  flex-shrink: 0;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  font-variant-numeric: tabular-nums;
`;

const Body = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.625;
  color: hsl(var(--foreground) / 0.85);
  overflow-wrap: break-word;
`;

const PhotoNote = styled.p`
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin: 0.65rem 0 0;
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
`;

const Empty = styled.p`
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: hsl(var(--muted-foreground));
`;

function CameraIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 9h2l1.5-2h5L14 9h6v10H4V9Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="14" r="2.5" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export default function ReflectionFeed({ taskList, title = "Recent reflections" }) {
  if (!taskList?.length) {
    return (
      <section aria-label={title}>
        <SectionTitle>{title}</SectionTitle>
        <Empty className="animate-fade-up stagger-0">
          Nothing here yet. Log a moment and it will show up as a card in your
          feed.
        </Empty>
      </section>
    );
  }

  const items = [...taskList].reverse().slice(0, 12);

  return (
    <section aria-label={title}>
      <SectionTitle>{title}</SectionTitle>
      <Stack>
        {items.map((item, index) => {
          const fromApi = extractPersonalityTraits(item);
          const fallback = traitForEntry(item.label, index);
          const trait = fromApi.length
            ? traitThemeForSlug(fromApi[0])
            : { label: fallback.label, cssVar: fallback.cssVar, hsl: null };
          const ts = formatReflectionTime(item);
          const hasPhoto =
            item.photo_url || item.photoUrl || item.has_photo || item.image;
          return (
            <Card
              key={`${item.label}-${index}`}
              className="animate-fade-up"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <TopRow>
                <TraitBadge $var={trait.cssVar} $hsl={trait.hsl}>
                  {trait.label}
                </TraitBadge>
                <Time dateTime={item.created_at}>{ts}</Time>
              </TopRow>
              <Body>{item.label}</Body>
              {hasPhoto ? (
                <PhotoNote>
                  <CameraIcon />
                  Photo attached
                </PhotoNote>
              ) : null}
            </Card>
          );
        })}
      </Stack>
    </section>
  );
}
