import styled from "styled-components";

export const StyledHeader = styled.h1`
  margin: 0 0 0.5rem;
  text-align: center;
`;

export const StyledInput = styled.input`
  width: 100%;
  max-width: 100%;
  height: 2.75rem;
  padding: 0 1rem;
  border-radius: var(--radius);
  font-size: 15px;
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

export const StyledSubmitBtn = styled.button`
  background: hsl(var(--primary));
  color: white;
  border: none;
  width: 60px;
  height: 2.25rem;
  border-radius: var(--radius);
  font-family: var(--font-sans), sans-serif;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  box-shadow: 0 4px 14px hsl(var(--primary) / 0.2);
  transition: box-shadow 200ms ease, transform 200ms ease;

  &:hover {
    box-shadow: 0 6px 20px hsl(var(--primary) / 0.25);
    cursor: pointer;
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

export const StyledAuthSubmitBtn = styled(StyledSubmitBtn)`
  width: auto;
  min-width: 120px;
  height: 2.75rem;
  padding: 0 1.25rem;
`;

export const StyledForm = styled.form`
  padding-bottom: 0;
  z-index: 2;
  display: flex;
  align-items: center;
`;

export const StyledColumnForm = styled(StyledForm)`
  flex-direction: column;
  align-items: stretch;
  width: 100%;
  max-width: 320px;
  gap: 0.75rem;
  padding-bottom: 12px;
`;

export const StyledMain = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 28rem;
  padding: 1.5rem;
  border-radius: var(--radius);
  background: hsl(var(--card) / 0.8);
  border: 1px solid hsl(var(--border) / 0.5);
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
`;

/** Product name — page h1 on auth screens (brand before task). */
export const StyledAuthMark = styled.h1`
  margin: 0 0 0.25rem;
  padding: 0;
  border: none;
  text-align: center;
  font-family: var(--font-display), serif;
  font-size: clamp(1.5rem, 5vw, 1.85rem);
  font-weight: 400;
  letter-spacing: -0.02em;
  color: hsl(var(--foreground));
  line-height: 1.1;
`;

/** Form section label (h2): sign in / create account, above fields. */
export const StyledAuthFormTitle = styled.h2`
  margin: 0 0 0.65rem;
  width: 100%;
  max-width: 320px;
  padding: 0;
  border: none;
  text-align: center;
  font-family: var(--font-sans), sans-serif;
  font-size: 1rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: hsl(var(--foreground));
`;

export const StyledAuthTagline = styled.p`
  margin: 0 0 1rem;
  text-align: center;
  font-size: 13px;
  line-height: 1.35;
  color: hsl(var(--muted-foreground));
  text-wrap: balance;
  max-width: 16rem;
  margin-left: auto;
  margin-right: auto;
`;

export const StyledAuthVisualRow = styled.div`
  display: flex;
  justify-content: center;
  align-items: flex-start;
  gap: clamp(0.75rem, 4vw, 1.35rem);
  margin: 0 auto 1.1rem;
  width: 100%;
  max-width: 19rem;
`;

export const StyledAuthVisualItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
  flex: 1;
  min-width: 0;
`;

export const StyledAuthIconCircle = styled.div`
  width: 46px;
  height: 46px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--primary) / 0.14);
  color: hsl(var(--primary));
  flex-shrink: 0;
  transition: transform 180ms ease, background 180ms ease;

  ${StyledAuthVisualItem}:hover & {
    transform: translateY(-2px);
    background: hsl(var(--primary) / 0.2);
  }
`;

export const StyledAuthIconLabel = styled.span`
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
  text-align: center;
  line-height: 1.15;
`;

export const StyledMuted = styled.p`
  margin: 0 0 1rem;
  max-width: 100%;
  text-align: center;
  color: hsl(var(--muted-foreground));
  line-height: 1.625;
  font-size: 15px;
  text-wrap: pretty;
  overflow-wrap: break-word;
`;

export const StyledError = styled.p`
  margin: 0 0 0.75rem;
  max-width: 100%;
  text-align: center;
  color: hsl(0 45% 40%);
  font-size: 14px;
  overflow-wrap: break-word;
`;

export const StyledSecondaryBtn = styled.button`
  background: transparent;
  color: hsl(var(--foreground));
  border: 1px solid hsl(var(--border) / 0.5);
  width: fit-content;
  padding: 0.5rem 1.25rem;
  min-height: 2.5rem;
  font-size: 15px;
  border-radius: var(--radius);
  margin-top: 8px;
  cursor: pointer;
  font-family: var(--font-sans), sans-serif;
  transition: box-shadow 300ms ease, transform 200ms ease;

  &:hover {
    box-shadow: 0 4px 14px hsl(var(--foreground) / 0.08);
  }

  &:active {
    transform: scale(0.97);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }
`;

export const AuthLinks = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.625rem;
  margin-top: 0.5rem;
  font-size: 14px;

  a {
    color: hsl(var(--primary));
    text-decoration: underline;
    text-underline-offset: 3px;

    &:hover {
      color: hsl(var(--foreground));
    }
  }
`;

export const StyledOptionalHeading = styled.h3`
  margin: 0.5rem 0 0;
  width: 100%;
  max-width: 320px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: hsl(var(--muted-foreground));
  text-align: left;
`;

export const StyledCheckboxRow = styled.label`
  display: flex;
  gap: 0.55rem;
  align-items: flex-start;
  max-width: 320px;
  font-size: 14px;
  line-height: 1.45;
  color: hsl(var(--foreground));
  cursor: pointer;
  text-align: left;

  input {
    margin-top: 0.15rem;
    flex-shrink: 0;
    width: 1rem;
    height: 1rem;
    cursor: pointer;
  }
`;

export const StyledFieldHint = styled.span`
  display: block;
  font-size: 12px;
  color: hsl(var(--muted-foreground));
  margin-top: 0.3rem;
  line-height: 1.45;
  max-width: 320px;
  text-align: left;
`;
