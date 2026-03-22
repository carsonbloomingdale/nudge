import {
  StyledAuthIconCircle,
  StyledAuthIconLabel,
  StyledAuthMark,
  StyledAuthTagline,
  StyledAuthVisualItem,
  StyledAuthVisualRow,
} from "./authStyles";

function IconReflect({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M8 9h8M8 13h6M8 17h4" />
    </svg>
  );
}

function IconNudge({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" />
      <path d="M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function IconGrow({ size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 18V6M4 18h16M8 14l3-3 3 2 5-6" />
      <path d="M17 7h4v4" />
    </svg>
  );
}

export default function AuthLoginPitch({ showIcons = true }) {
  return (
    <>
      <StyledAuthMark>nudge</StyledAuthMark>
      <StyledAuthTagline>
        Tiny reflections. Optional ideas. Patterns over time.
      </StyledAuthTagline>
      {showIcons ? (
        <StyledAuthVisualRow
          role="img"
          aria-label="Write reflections, get gentle suggestions, see growth over time"
        >
          <StyledAuthVisualItem>
            <StyledAuthIconCircle>
              <IconReflect />
            </StyledAuthIconCircle>
            <StyledAuthIconLabel>Reflect</StyledAuthIconLabel>
          </StyledAuthVisualItem>
          <StyledAuthVisualItem>
            <StyledAuthIconCircle>
              <IconNudge />
            </StyledAuthIconCircle>
            <StyledAuthIconLabel>Nudge</StyledAuthIconLabel>
          </StyledAuthVisualItem>
          <StyledAuthVisualItem>
            <StyledAuthIconCircle>
              <IconGrow />
            </StyledAuthIconCircle>
            <StyledAuthIconLabel>Grow</StyledAuthIconLabel>
          </StyledAuthVisualItem>
        </StyledAuthVisualRow>
      ) : null}
    </>
  );
}
