import { useCallback, useEffect, useRef, useState } from "react";
import styled, { keyframes } from "styled-components";

const DAMP = 0.45;
const THRESHOLD = 56;
const MAX_PULL = 96;
const REFRESH_HOLD_PX = 52;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

const Root = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 0;
`;

/** In-flow region — grows with pull so page content moves down (no overlay). */
const Spacer = styled.div`
  flex-shrink: 0;
  height: ${(p) => p.$h}px;
  min-height: 0;
  overflow: hidden;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 6px;
  box-sizing: border-box;
  background: linear-gradient(
    to bottom,
    hsl(var(--background)),
    hsl(var(--background) / 0.92)
  );
  border-bottom: 1px solid transparent;
  transition: ${(p) =>
    p.$settle ? "height 0.28s cubic-bezier(0.16, 1, 0.3, 1)" : "none"};
`;

const Message = styled.span`
  font-size: 0.75rem;
  font-weight: 600;
  color: hsl(var(--muted-foreground));
  letter-spacing: 0.02em;
`;

const Spinner = styled.span`
  width: 22px;
  height: 22px;
  border: 2px solid hsl(var(--border));
  border-top-color: hsl(var(--primary));
  border-radius: 50%;
  animation: ${spin} 0.7s linear infinite;

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    border-top-color: hsl(var(--border));
  }
`;

function isEditableTarget(el) {
  if (!el || !el.closest) {
    return false;
  }
  return Boolean(
    el.closest(
      "input, textarea, select, [contenteditable=true], [data-ptr-ignore]",
    ),
  );
}

/**
 * Pull down from the top (touch) to refresh. Spacer height grows with the
 * gesture so content shifts down instead of being covered.
 */
export default function PullToRefresh({
  children,
  onRefresh,
  disabled,
  refreshing,
}) {
  const [pullPx, setPullPx] = useState(0);
  const [settle, setSettle] = useState(false);
  const armed = useRef(false);
  const startY = useRef(0);
  const pullRef = useRef(0);
  const running = useRef(false);
  const prevRefreshing = useRef(refreshing);

  const runRefresh = useCallback(async () => {
    if (running.current || disabled) {
      return;
    }
    running.current = true;
    try {
      await onRefresh();
    } finally {
      running.current = false;
    }
  }, [onRefresh, disabled]);

  useEffect(() => {
    if (prevRefreshing.current && !refreshing) {
      setSettle(true);
      setPullPx(0);
    }
    prevRefreshing.current = refreshing;
  }, [refreshing]);

  useEffect(() => {
    const onStart = (e) => {
      if (disabled || refreshing) {
        return;
      }
      if (window.scrollY > 4) {
        return;
      }
      if (isEditableTarget(e.target)) {
        return;
      }
      armed.current = true;
      startY.current = e.touches[0].clientY;
      setSettle(false);
    };

    const onMove = (e) => {
      if (!armed.current || disabled || refreshing) {
        return;
      }
      if (window.scrollY > 4) {
        armed.current = false;
        pullRef.current = 0;
        setSettle(true);
        setPullPx(0);
        return;
      }
      const y = e.touches[0].clientY;
      const raw = y - startY.current;
      if (raw <= 0) {
        pullRef.current = 0;
        setPullPx(0);
        return;
      }
      e.preventDefault();
      const h = Math.min(raw * DAMP, MAX_PULL);
      pullRef.current = h;
      setPullPx(h);
    };

    const onEnd = () => {
      if (!armed.current) {
        return;
      }
      armed.current = false;
      const p = pullRef.current;
      pullRef.current = 0;
      const shouldRefresh = p >= THRESHOLD && !refreshing && !disabled;

      if (shouldRefresh) {
        setSettle(false);
        setPullPx(REFRESH_HOLD_PX);
        void runRefresh();
      } else {
        setSettle(true);
        setPullPx(0);
      }
    };

    const onCancel = () => {
      armed.current = false;
      pullRef.current = 0;
      setSettle(true);
      setPullPx(0);
    };

    document.addEventListener("touchstart", onStart, { passive: true });
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd, { passive: true });
    document.addEventListener("touchcancel", onCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onStart);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      document.removeEventListener("touchcancel", onCancel);
    };
  }, [disabled, refreshing, runRefresh]);

  const h = refreshing ? REFRESH_HOLD_PX : pullPx;
  const showHint = pullPx > 10 || refreshing;

  let label = "Pull to refresh";
  if (refreshing) {
    label = "Updating…";
  } else if (pullPx >= THRESHOLD) {
    label = "Release to refresh";
  }

  return (
    <Root>
      <Spacer
        $h={h}
        $settle={settle}
        aria-live="polite"
        aria-hidden={h < 4 && !refreshing}
      >
        {refreshing ? (
          <Spinner aria-hidden />
        ) : showHint ? (
          <Message>{label}</Message>
        ) : null}
      </Spacer>
      {children}
    </Root>
  );
}
