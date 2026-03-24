import { useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";

const Wrap = styled.section`
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 1rem;
`;

const Toggle = styled.div`
  display: inline-flex;
  border: 1px solid hsl(var(--border) / 0.8);
  border-radius: 999px;
  overflow: hidden;
`;

const ToggleBtn = styled.button`
  border: none;
  background: ${(p) => (p.$active ? "hsl(var(--primary) / 0.15)" : "hsl(var(--card))")};
  color: hsl(var(--foreground));
  padding: 0.35rem 0.65rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
`;


const Card = styled.div`
  position: relative;
  border: 1px solid hsl(var(--border) / 0.5);
  border-radius: 0.75rem;
  padding: 0.8rem;
  background: hsl(var(--card));
  min-height: 152px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--cell-size));
  grid-template-rows: repeat(var(--rows), var(--cell-size));
  column-gap: var(--cell-gap);
  row-gap: var(--cell-gap);
  transition: opacity 180ms ease;
`;

const Cell = styled.button`
  width: var(--cell-size);
  height: var(--cell-size);
  border: none;
  border-radius: 3px;
  background: ${(p) => p.$color};
  padding: 0;
  opacity: ${(p) => (p.$muted ? 0.42 : 1)};
`;

const Legend = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.35rem;
  font-size: 0.7rem;
  color: hsl(var(--muted-foreground));
  margin-top: 0.5rem;
`;

const Empty = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: hsl(var(--muted-foreground));
`;

const StateText = styled.p`
  margin: 0;
  font-size: 0.85rem;
  color: hsl(var(--muted-foreground));
`;

const HoverTip = styled.div`
  position: absolute;
  top: ${(p) => `${p.$y}px`};
  left: ${(p) => `${p.$x}px`};
  transform: translate(-50%, -110%);
  max-width: min(14rem, calc(100% - 0.8rem));
  border: 1px solid hsl(var(--border) / 0.8);
  border-radius: 0.5rem;
  padding: 0.35rem 0.5rem;
  background: hsl(var(--background) / 0.96);
  color: hsl(var(--foreground));
  font-size: 0.72rem;
  line-height: 1.25;
  box-shadow: 0 4px 12px hsl(var(--foreground) / 0.1);
  pointer-events: none;
  z-index: 3;
`;

const EmptyOverlay = styled.div`
  position: absolute;
  inset: 0.8rem;
  border-radius: 0.55rem;
  border: 1px dashed hsl(var(--border) / 0.8);
  background: hsl(var(--background) / 0.72);
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.75rem;
  z-index: 2;
`;

const EmptyOverlayInner = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
`;

const EmptyOverlayTitle = styled.p`
  margin: 0;
  font-size: 0.82rem;
  font-weight: 600;
  color: hsl(var(--foreground));
`;

const EmptyOverlaySub = styled.p`
  margin: 0;
  font-size: 0.74rem;
  color: hsl(var(--muted-foreground));
`;

const CalendarShell = styled.div`
  display: flex;
  gap: 0.45rem;
  align-items: flex-start;
`;

const WeekdayRail = styled.div`
  width: 2rem;
  padding-top: calc(var(--cell-size) + 0.25rem);
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: calc(var(--cell-size) + var(--cell-gap));
  color: hsl(var(--muted-foreground));
  font-size: 0.72rem;
  line-height: 1;
`;

const CalendarMain = styled.div`
  min-width: 0;
  flex: 1;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: thin;
`;

const CompactWrap = styled.div`
  display: grid;
  grid-template-columns: repeat(var(--compact-cols), minmax(0, 1fr));
  gap: 4px;
`;

const CompactCell = styled.button`
  width: 100%;
  aspect-ratio: 1 / 1;
  border: none;
  border-radius: 3px;
  background: ${(p) => p.$color};
  opacity: ${(p) => (p.$muted ? 0.42 : 1)};
  padding: 0;
`;

const MonthRow = styled.div`
  height: calc(var(--cell-size) + 0.2rem);
  display: grid;
  grid-template-columns: repeat(var(--cols), var(--cell-size));
  column-gap: var(--cell-gap);
  margin-bottom: 0.2rem;
  width: max-content;
  min-width: 100%;
`;

const MonthLabel = styled.span`
  grid-column: ${(p) => p.$col + 1};
  font-size: 0.72rem;
  line-height: 1;
  color: hsl(var(--muted-foreground));
  white-space: nowrap;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  inset: 0.8rem;
  border-radius: 0.55rem;
  border: 1px dashed hsl(var(--border) / 0.75);
  background: hsl(var(--background) / 0.74);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
`;

const LoadingText = styled.p`
  margin: 0;
  font-size: 0.8rem;
  color: hsl(var(--muted-foreground));
`;

const RAMP = [
  "hsl(var(--muted))",
  "hsl(var(--primary) / 0.18)",
  "hsl(var(--primary) / 0.33)",
  "hsl(var(--primary) / 0.52)",
  "hsl(var(--primary) / 0.75)",
];

function pctFromBuckets(buckets) {
  const totals = buckets.map((x) => x.total);
  const max = Math.max(...totals, 0);
  const min = Math.min(...totals, 0);
  return buckets.map((x) => {
    if (x.total <= 0 || max <= min) {
      return { ...x, level: 0 };
    }
    const pct = (x.total - min) / (max - min);
    const level = Math.max(1, Math.min(RAMP.length - 1, Math.round(pct * (RAMP.length - 1))));
    return { ...x, level };
  });
}

function parseIsoDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value ?? ""));
  if (!m) {
    return null;
  }
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  return new Date(Date.UTC(y, mo, d));
}

function toIsoDate(d) {
  return d.toISOString().slice(0, 10);
}

function alignToGrainStart(date, grain) {
  const x = new Date(date.getTime());
  if (grain === "month") {
    x.setUTCDate(1);
    return x;
  }
  if (grain === "week") {
    const dow = x.getUTCDay();
    const mondayOffset = dow === 0 ? 6 : dow - 1;
    x.setUTCDate(x.getUTCDate() - mondayOffset);
    return x;
  }
  return x;
}

function bump(date, grain) {
  const x = new Date(date.getTime());
  if (grain === "month") {
    x.setUTCMonth(x.getUTCMonth() + 1, 1);
    return x;
  }
  if (grain === "week") {
    x.setUTCDate(x.getUTCDate() + 7);
    return x;
  }
  x.setUTCDate(x.getUTCDate() + 1);
  return x;
}

function buildExpectedStarts(fromDate, toDate, grain) {
  const from = parseIsoDate(fromDate);
  const to = parseIsoDate(toDate);
  if (!from || !to) {
    return [];
  }
  const starts = [];
  let cursor = alignToGrainStart(from, grain);
  const end = alignToGrainStart(to, grain);
  let guard = 0;
  while (cursor <= end && guard < 800) {
    starts.push(toIsoDate(cursor));
    cursor = bump(cursor, grain);
    guard += 1;
  }
  return starts;
}

function startOfWeekSunday(date) {
  const x = new Date(date.getTime());
  x.setUTCDate(x.getUTCDate() - x.getUTCDay());
  return x;
}

function endOfWeekSaturday(date) {
  const x = new Date(date.getTime());
  x.setUTCDate(x.getUTCDate() + (6 - x.getUTCDay()));
  return x;
}

function buildDayCells(fromDate, toDate, buckets) {
  const byStart = new Map((buckets ?? []).map((x) => [String(x.bucketStart), x]));
  const from = parseIsoDate(fromDate);
  const to = parseIsoDate(toDate);
  if (!from || !to) {
    return { cells: [], cols: 0, rows: 7, monthLabels: [] };
  }
  const gridStart = startOfWeekSunday(from);
  const gridEnd = endOfWeekSaturday(to);
  const cells = [];
  const monthLabels = [];
  let cursor = new Date(gridStart.getTime());
  let col = 0;
  let guard = 0;
  while (cursor <= gridEnd && guard < 500) {
    const weekStart = new Date(cursor.getTime());
    if (
      col === 0 ||
      weekStart.getUTCDate() <= 7
    ) {
      monthLabels.push({ col, label: weekStart.toLocaleString("en-US", { month: "short", timeZone: "UTC" }) });
    }
    for (let row = 0; row < 7; row += 1) {
      const day = new Date(weekStart.getTime());
      day.setUTCDate(weekStart.getUTCDate() + row);
      const dayIso = toIsoDate(day);
      const hit = byStart.get(dayIso);
      const inRange = day >= from && day <= to;
      cells.push({
        key: `${dayIso}-${dayIso}`,
        bucketStart: dayIso,
        bucketEnd: dayIso,
        total: Number(hit?.total ?? 0) || 0,
        col,
        row,
        muted: !inRange,
      });
    }
    cursor.setUTCDate(cursor.getUTCDate() + 7);
    col += 1;
    guard += 1;
  }
  return { cells, cols: col, rows: 7, monthLabels };
}

function buildPeriodCells(starts, buckets) {
  const byStart = new Map((buckets ?? []).map((x) => [String(x.bucketStart), x]));
  const cells = starts.map((start, col) => {
    const hit = byStart.get(start);
    return {
      key: `${start}-${hit?.bucketEnd ?? start}`,
      bucketStart: start,
      bucketEnd: hit?.bucketEnd ?? start,
      total: Number(hit?.total ?? 0) || 0,
      col,
      row: 0,
      muted: false,
    };
  });
  const monthLabels = [];
  let prev = "";
  for (let i = 0; i < starts.length; i += 1) {
    const d = parseIsoDate(starts[i]);
    if (!d) {
      continue;
    }
    const label = d.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    const marker = `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
    if (i === 0 || marker !== prev) {
      monthLabels.push({ col: i, label });
      prev = marker;
    }
  }
  return { cells, cols: starts.length, rows: 1, monthLabels };
}

function compactMonthLabels(labels, minColGap) {
  if (!Array.isArray(labels) || labels.length === 0) {
    return [];
  }
  const out = [];
  let lastCol = -999;
  for (const label of labels) {
    if (label.col - lastCol >= minColGap) {
      out.push(label);
      lastCol = label.col;
    }
  }
  return out;
}

function applyLevelsToCells(cells) {
  const totals = cells.map((x) => Number(x.total) || 0);
  const max = Math.max(...totals, 0);
  const min = Math.min(...totals, 0);
  return cells.map((x) => {
    if ((Number(x.total) || 0) <= 0 || max <= min) {
      return { ...x, level: 0 };
    }
    const pct = ((Number(x.total) || 0) - min) / (max - min);
    const level = Math.max(1, Math.min(RAMP.length - 1, Math.round(pct * (RAMP.length - 1))));
    return { ...x, level };
  });
}

/**
 * @param {{
 *   title: string;
 *   buckets?: import("../../api/analyticsApi").ActivityBucket[];
 *   grain: "day" | "week" | "month";
 *   onGrainChange: (grain: "day" | "week" | "month") => void;
 *   fromDate?: string;
 *   toDate?: string;
 *   loading?: boolean;
 *   error?: boolean;
 * }} props
 */
export default function ActivityHeatmap({
  title,
  buckets = [],
  grain,
  onGrainChange,
  fromDate = "",
  toDate = "",
  loading = false,
  error = false,
}) {
  const cardRef = useRef(null);
  const [hoveredBucketKey, setHoveredBucketKey] = useState("");
  const [hoverTipPos, setHoverTipPos] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const normalized = useMemo(() => {
    const byStart = new Map(
      (Array.isArray(buckets) ? buckets : []).map((x) => [String(x.bucketStart), x]),
    );
    const starts = buildExpectedStarts(fromDate, toDate, grain);
    if (starts.length === 0) {
      return pctFromBuckets(buckets);
    }
    const expanded = starts.map((start) => {
      const hit = byStart.get(start);
      if (hit) {
        return hit;
      }
      return { bucketStart: start, bucketEnd: start, total: 0 };
    });
    return pctFromBuckets(expanded);
  }, [buckets, fromDate, toDate, grain]);
  const layout = useMemo(() => {
    if (grain === "day") {
      const built = buildDayCells(fromDate, toDate, normalized);
      return {
        ...built,
        cells: applyLevelsToCells(built.cells),
        monthLabels: compactMonthLabels(built.monthLabels, 4),
      };
    }
    const starts = buildExpectedStarts(fromDate, toDate, grain);
    const built = buildPeriodCells(starts, normalized);
    return {
      ...built,
      cells: applyLevelsToCells(built.cells),
      monthLabels: compactMonthLabels(built.monthLabels, grain === "month" ? 2 : 3),
    };
  }, [fromDate, toDate, grain, normalized]);
  const total = useMemo(
    () => layout.cells.reduce((sum, x) => sum + (Number(x.total) || 0), 0),
    [layout],
  );
  const hoveredBucket = useMemo(
    () =>
      layout.cells.find((x) => `${x.bucketStart}-${x.bucketEnd}` === hoveredBucketKey) || null,
    [layout, hoveredBucketKey],
  );
  const hasData = layout.cells.length > 0;
  const showLoadingText = loading && !hasData;
  const hasActivity = total > 0;
  const showLoadingOverlay = loading && hasData;
  const compactCols = useMemo(() => {
    if (grain === "month") {
      return 6;
    }
    if (grain === "week") {
      return 8;
    }
    return 12;
  }, [grain]);
  const useCompactView = isMobile;

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }
    const media = window.matchMedia("(max-width: 640px)");
    const apply = () => setIsMobile(media.matches);
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, []);

  function setHover(bucket, element) {
    const cardRect = cardRef.current?.getBoundingClientRect?.();
    const cellRect = element?.getBoundingClientRect?.();
    if (!cardRect || !cellRect) {
      setHoveredBucketKey(`${bucket.bucketStart}-${bucket.bucketEnd}`);
      return;
    }
    const rawX = cellRect.left - cardRect.left + cellRect.width / 2;
    const rawY = cellRect.top - cardRect.top - 2;
    const sidePadding = 8;
    const approxHalfTooltip = Math.min(112, Math.max(48, (cardRect.width - sidePadding * 2) / 2));
    const minX = sidePadding + approxHalfTooltip;
    const maxX = Math.max(minX, cardRect.width - sidePadding - approxHalfTooltip);
    const clampedX = Math.max(minX, Math.min(maxX, rawX));
    const clampedY = Math.max(24, rawY);
    setHoverTipPos({ x: clampedX, y: clampedY });
    setHoveredBucketKey(`${bucket.bucketStart}-${bucket.bucketEnd}`);
  }

  return (
    <Wrap>
      <Head>
        <Title>{title}</Title>
        <Toggle role="tablist" aria-label={`${title} grain`}>
          {["day", "week", "month"].map((value) => (
            <ToggleBtn
              key={value}
              type="button"
              role="tab"
              aria-selected={grain === value}
              $active={grain === value}
              onClick={() => onGrainChange(value)}
            >
              {value}
            </ToggleBtn>
          ))}
        </Toggle>
      </Head>
      <Card ref={cardRef}>
        {hoveredBucket ? (
          <HoverTip role="status" aria-live="polite" $x={hoverTipPos.x} $y={hoverTipPos.y}>
            {hoveredBucket.bucketStart} to {hoveredBucket.bucketEnd} · Total: {hoveredBucket.total}
          </HoverTip>
        ) : null}
        {showLoadingText ? <StateText>Loading activity…</StateText> : null}
        {error && !showLoadingText ? (
          <StateText>
            Activity is unavailable right now. Check your connection and try again.
          </StateText>
        ) : null}
        {!showLoadingText && !error && normalized.length === 0 ? (
          <Empty>No activity yet for this range.</Empty>
        ) : null}
        {!error && normalized.length > 0 ? (
          <>
            {useCompactView ? (
              <CompactWrap
                style={{
                  "--compact-cols": compactCols,
                  opacity: hasActivity ? 1 : 0.55,
                }}
              >
                {layout.cells.map((bucket) => (
                  <CompactCell
                    key={`${bucket.bucketStart}-${bucket.bucketEnd}`}
                    type="button"
                    aria-label={`${bucket.bucketStart} to ${bucket.bucketEnd}. Total ${bucket.total}`}
                    title={`${bucket.bucketStart} to ${bucket.bucketEnd} · Total: ${bucket.total}`}
                    $color={RAMP[bucket.level]}
                    $muted={bucket.muted}
                    onMouseEnter={(event) => setHover(bucket, event.currentTarget)}
                    onMouseLeave={() => setHoveredBucketKey("")}
                    onFocus={(event) => setHover(bucket, event.currentTarget)}
                    onBlur={() => setHoveredBucketKey("")}
                  />
                ))}
              </CompactWrap>
            ) : (
              <CalendarShell
                style={{
                  "--cols": layout.cols,
                  "--rows": layout.rows,
                  "--cell-size": "11px",
                  "--cell-gap": "4px",
                }}
              >
                {grain === "day" ? (
                  <WeekdayRail aria-hidden>
                    <span>Mon</span>
                    <span>Wed</span>
                    <span>Fri</span>
                  </WeekdayRail>
                ) : null}
                <CalendarMain>
                  <MonthRow aria-hidden>
                    {layout.monthLabels.map((m) => (
                      <MonthLabel key={`${m.col}-${m.label}`} $col={m.col}>
                        {m.label}
                      </MonthLabel>
                    ))}
                  </MonthRow>
                  <Grid style={{ opacity: hasActivity ? 1 : 0.55, width: "max-content", minWidth: "100%" }}>
                    {layout.cells.map((bucket) => (
                      <Cell
                        key={`${bucket.bucketStart}-${bucket.bucketEnd}`}
                        type="button"
                        aria-label={`${bucket.bucketStart} to ${bucket.bucketEnd}. Total ${bucket.total}`}
                        title={`${bucket.bucketStart} to ${bucket.bucketEnd} · Total: ${bucket.total}`}
                        $color={RAMP[bucket.level]}
                        $muted={bucket.muted}
                        style={{
                          gridColumn: bucket.col + 1,
                          gridRow: bucket.row + 1,
                        }}
                        onMouseEnter={(event) => setHover(bucket, event.currentTarget)}
                        onMouseLeave={() => setHoveredBucketKey("")}
                        onFocus={(event) => setHover(bucket, event.currentTarget)}
                        onBlur={() => setHoveredBucketKey("")}
                      />
                    ))}
                  </Grid>
                </CalendarMain>
              </CalendarShell>
            )}
            {showLoadingOverlay ? (
              <LoadingOverlay>
                <LoadingText>Loading trend data…</LoadingText>
              </LoadingOverlay>
            ) : null}
            {!showLoadingOverlay && !hasActivity ? (
              <EmptyOverlay>
                <EmptyOverlayInner>
                  <EmptyOverlayTitle>No activity in this range yet</EmptyOverlayTitle>
                  <EmptyOverlaySub>
                    Keep logging and your trend squares will start filling in.
                  </EmptyOverlaySub>
                </EmptyOverlayInner>
              </EmptyOverlay>
            ) : null}
            <Legend>
              <span>Total: {total}</span>
              {RAMP.map((c, i) => (
                <span
                  key={String(i)}
                  style={{
                    width: "10px",
                    height: "10px",
                    borderRadius: "2px",
                    display: "inline-block",
                    background: c,
                  }}
                />
              ))}
            </Legend>
          </>
        ) : null}
      </Card>
    </Wrap>
  );
}
