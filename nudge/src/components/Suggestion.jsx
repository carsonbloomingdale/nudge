import styled from "styled-components";

const StyledDiv = styled.div`
  background-color: white;
  border-radius: 5px;
  width: 60%;
  max-width: 750px;
  color: #133926;
  font-size: 20px;
  position: absolute;
  bottom: 90px;
  padding: 10px;
  margin: 10px;
  display: flex;
  flex-direction: column;

  @media (max-width: 750px) {
    bottom: 180px;
  }

  @media (max-width: 480px) {
    width: 80%;
    bottom: 5px;
  }

  @media (max-height: 750px) and (min-width: 800px) {
    right: 10px;
    max-width: 40%;
    bottom: auto;
    margin-top: -40px;
  }
`;

const StyledButton = styled.div`
    float: right;
    transition: all 0.3s ease-out;
    font-size: 25px;
    margin: bottom: 10px;

    &:hover{
        color: #2e6046;
        cursor: pointer;
    }
`;

const Suggestion = ({ suggestion, setSuggestion, context }) => {
  if (!suggestion) {
    return;
  }

  return (
    <StyledDiv>
      <div>
        <StyledButton onClick={() => setSuggestion()}>
          <b>X</b>
        </StyledButton>
      </div>
      <div>
        <b>Suggestion:</b> {suggestion}
        <br />
        <b>Why?</b> {context}
      </div>
    </StyledDiv>
  );
};

export default Suggestion;
