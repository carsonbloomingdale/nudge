import styled from "styled-components";

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  color: hsl(var(--foreground));
  font-family: var(--font-sans), sans-serif;
  font-size: 15px;
  background: hsl(var(--background));
`;

export default function SessionSpinner({ message = "Restoring session…" }) {
  return <Wrap role="status">{message}</Wrap>;
}
