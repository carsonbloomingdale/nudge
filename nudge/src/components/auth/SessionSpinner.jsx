import styled from "styled-components";

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #133926;
  font-family: "Varela Round", sans-serif;
  font-size: 18px;
`;

export default function SessionSpinner({ message = "Restoring session…" }) {
  return <Wrap role="status">{message}</Wrap>;
}
