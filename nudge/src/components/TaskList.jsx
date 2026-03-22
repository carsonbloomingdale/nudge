import styled from "styled-components";

const TaskGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;

  @media (min-width: 480px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const TaskCard = styled.div`
  border-radius: var(--radius);
  padding: 1rem 1.25rem;
  background: hsl(var(--card) / 0.8);
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
  color: hsl(var(--foreground));
  font-size: 15px;
  line-height: 1.5;
  overflow-wrap: break-word;
  transition: box-shadow 300ms ease;

  &:hover {
    box-shadow: 0 4px 14px hsl(var(--foreground) / 0.08);
  }
`;

const EmptyState = styled.p`
  margin: 0;
  font-size: 15px;
  color: hsl(var(--muted-foreground));
`;

export default function TaskList({ taskList }) {
  if (!taskList?.length) {
    return (
      <EmptyState className="animate-fade-up stagger-0">
        No activities yet. Log something you did today to build your feed.
      </EmptyState>
    );
  }

  return (
    <TaskGrid>
      {taskList.map((item, index) => (
        <TaskCard
          key={`${item.label}-${index}`}
          className="animate-fade-up"
          style={{ animationDelay: `${index * 80}ms` }}
        >
          {item.label}
        </TaskCard>
      ))}
    </TaskGrid>
  );
}
