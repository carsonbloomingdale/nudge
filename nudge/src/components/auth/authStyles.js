import styled from "styled-components";

export const StyledHeader = styled.div`
  font-size: 24px;
  margin: 20px;
  z-index: 2;
  color: #133926;
  font-weight: bold;
`;

export const StyledInput = styled.input`
  max-width: 60vw;
  height: 30px;
  border-radius: 15px;
  font-size: 14px;
  border: none;
  margin: 10px;
  font-size: 16px;

  font-family: "Varela Round", sans-serif;
  font-weight: 400;
  font-style: normal;
`;

export const StyledSubmitBtn = styled.button`
  background-color: #133926;
  color: white;
  border: none;
  width: 60px;
  height: 30px;
  border-radius: 15px;
  transition: all 1s ease-out;

  font-family: "Varela Round", sans-serif;
  font-weight: 400;
  font-style: normal;

  &:hover {
    background-color: #1f4f37;
    cursor: pointer;
  }

  &:disabled {
    opacity: 0.65;
    cursor: not-allowed;
  }
`;

export const StyledAuthSubmitBtn = styled(StyledSubmitBtn)`
  width: auto;
  min-width: 120px;
  padding: 0 16px;
`;

export const StyledForm = styled.form`
  padding-bottom: 40px;
  z-index: 2;
  display: flex;
  align-items: center;
`;

/** Stacked fields (login / signup) */
export const StyledColumnForm = styled(StyledForm)`
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: 320px;
  gap: 4px;
  padding-bottom: 12px;
`;

export const StyledMain = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: hsla(120, 100%, 100%, 0.5);
  padding: 40px;
  border-radius: 15px;
  z-index: 20000;

  @media (max-width: 750px) {
    margin: 20px;
    background-color: #74aa8de8;
  }

  @media (max-height: 750px) and (min-width: 800px) {
    margin: 20px;
    background-color: #74aa8de8;
  }
`;

export const StyledMuted = styled.p`
  margin: 0 20px 16px;
  max-width: 70vw;
  text-align: center;
  color: #133926;
  opacity: 0.85;
  line-height: 1.4;
  font-size: 15px;
`;

export const StyledError = styled.p`
  margin: 0 20px 12px;
  max-width: 70vw;
  text-align: center;
  color: #8b2c2c;
  font-size: 14px;
`;

export const StyledSecondaryBtn = styled.button`
  background: transparent;
  color: #133926;
  border: 1px solid #133926;
  width: fit-content;
  padding: 8px 20px;
  height: auto;
  min-height: 36px;
  font-size: 15px;
  border-radius: 15px;
  margin-top: 8px;
  cursor: pointer;
  font-family: "Varela Round", sans-serif;

  &:hover {
    background: hsla(150, 30%, 95%, 0.9);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

export const AuthLinks = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
  font-size: 14px;

  a {
    color: #133926;
    text-decoration: underline;
  }
`;
