import { useLayoutEffect, useRef, useState } from "react";

// Flip this to false to restore the rectangular Time card everywhere by default.
export const INTEGRATION_PROFILE_TIME_PUZZLE_ENABLED = true;

export type PuzzleSide = "left" | "right";

export interface TimePuzzleLayout {
  active: boolean;
  shorter: PuzzleSide;
  delta: number;
  stepX: number;
  width: number;
  height: number;
}

export const TIME_PUZZLE_CARD_GAP_PX = 12;

const DESKTOP_MEDIA_QUERY = "(min-width: 640px)";
const MIN_PUZZLE_DELTA_PX = 6;
const TIME_CARD_RADIUS_PX = 8;

const DEFAULT_TIME_PUZZLE_LAYOUT: TimePuzzleLayout = {
  active: false,
  shorter: "left",
  delta: 0,
  stepX: 0,
  width: 0,
  height: 0,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatSvgNumber(value: number): string {
  return Number(value.toFixed(2)).toString();
}

function sameTimePuzzleLayout(
  current: TimePuzzleLayout,
  next: TimePuzzleLayout,
): boolean {
  if (!current.active && !next.active) return true;

  return (
    current.active === next.active &&
    current.shorter === next.shorter &&
    current.delta === next.delta &&
    current.stepX === next.stepX &&
    current.width === next.width &&
    current.height === next.height
  );
}

interface SvgPoint {
  x: number;
  y: number;
}

function distanceBetweenPoints(a: SvgPoint, b: SvgPoint): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function pointToward(from: SvgPoint, to: SvgPoint, distance: number): SvgPoint {
  const length = distanceBetweenPoints(from, to);
  if (length <= 0) return from;

  const ratio = distance / length;

  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

function buildRoundedRectilinearPath(
  points: SvgPoint[],
  radius: number,
): string {
  if (points.length === 0) return "";

  const roundedPoints = points.map((point, index) => {
    const previous = points[(index - 1 + points.length) % points.length];
    const next = points[(index + 1) % points.length];
    const cornerRadius = Math.min(
      radius,
      distanceBetweenPoints(point, previous) / 2,
      distanceBetweenPoints(point, next) / 2,
    );

    return {
      point,
      start: pointToward(point, previous, cornerRadius),
      end: pointToward(point, next, cornerRadius),
    };
  });

  const first = roundedPoints[0].end;
  const commands = [
    `M ${formatSvgNumber(first.x)} ${formatSvgNumber(first.y)}`,
  ];

  for (let index = 1; index < roundedPoints.length; index += 1) {
    const { point, start, end } = roundedPoints[index];
    commands.push(
      `L ${formatSvgNumber(start.x)} ${formatSvgNumber(start.y)}`,
      `Q ${formatSvgNumber(point.x)} ${formatSvgNumber(
        point.y,
      )} ${formatSvgNumber(end.x)} ${formatSvgNumber(end.y)}`,
    );
  }

  const { point, start, end } = roundedPoints[0];
  commands.push(
    `L ${formatSvgNumber(start.x)} ${formatSvgNumber(start.y)}`,
    `Q ${formatSvgNumber(point.x)} ${formatSvgNumber(
      point.y,
    )} ${formatSvgNumber(end.x)} ${formatSvgNumber(end.y)}`,
    "Z",
  );

  return commands.join(" ");
}

export function buildTimePuzzlePath(
  layout: TimePuzzleLayout,
  inset: number,
): string {
  if (!layout.active || layout.width <= 0 || layout.height <= 0) return "";

  const left = inset;
  const top = inset;
  const right = Math.max(layout.width - inset, inset);
  const bottom = Math.max(layout.height - inset, inset);
  const stepX = clamp(layout.stepX, inset, right);
  const delta = clamp(layout.delta, inset, bottom);
  const radius = Math.min(TIME_CARD_RADIUS_PX, (right - left) / 2);

  return buildRoundedRectilinearPath(
    layout.shorter === "left"
      ? [
          { x: left, y: top },
          { x: stepX, y: top },
          { x: stepX, y: delta },
          { x: right, y: delta },
          { x: right, y: bottom },
          { x: left, y: bottom },
        ]
      : [
          { x: left, y: delta },
          { x: stepX, y: delta },
          { x: stepX, y: top },
          { x: right, y: top },
          { x: right, y: bottom },
          { x: left, y: bottom },
        ],
    radius,
  );
}

export function useTimePuzzleLayout(
  enabled = INTEGRATION_PROFILE_TIME_PUZZLE_ENABLED,
) {
  const frameRef = useRef<HTMLDivElement>(null);
  const leftColumnRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const timeCardRef = useRef<HTMLElement>(null);
  const [timePuzzle, setTimePuzzle] = useState<TimePuzzleLayout>(
    DEFAULT_TIME_PUZZLE_LAYOUT,
  );

  useLayoutEffect(() => {
    if (!enabled || typeof window === "undefined") {
      setTimePuzzle((current) =>
        sameTimePuzzleLayout(current, DEFAULT_TIME_PUZZLE_LAYOUT)
          ? current
          : DEFAULT_TIME_PUZZLE_LAYOUT,
      );
      return;
    }

    const mediaQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    let animationFrame = 0;

    const resetLayout = () => {
      setTimePuzzle((current) =>
        sameTimePuzzleLayout(current, DEFAULT_TIME_PUZZLE_LAYOUT)
          ? current
          : DEFAULT_TIME_PUZZLE_LAYOUT,
      );
    };

    const measure = () => {
      animationFrame = 0;

      const frame = frameRef.current;
      const leftColumn = leftColumnRef.current;
      const rightColumn = rightColumnRef.current;

      if (!mediaQuery.matches || !frame || !leftColumn || !rightColumn) {
        resetLayout();
        return;
      }

      const frameRect = frame.getBoundingClientRect();
      const leftRect = leftColumn.getBoundingClientRect();
      const rightRect = rightColumn.getBoundingClientRect();
      const timeRect = timeCardRef.current?.getBoundingClientRect();
      const delta = Math.round(Math.abs(leftRect.height - rightRect.height));
      const active = delta >= MIN_PUZZLE_DELTA_PX && frameRect.width > 0;

      if (!active) {
        resetLayout();
        return;
      }

      const columnGap = Math.max(0, rightRect.left - leftRect.right);
      const next: TimePuzzleLayout = {
        active: true,
        shorter: leftRect.height <= rightRect.height ? "left" : "right",
        delta,
        stepX: Math.round(leftRect.right - frameRect.left + columnGap / 2),
        width: Math.round(frameRect.width),
        height: Math.round(timeRect?.height ?? 0),
      };

      setTimePuzzle((current) =>
        sameTimePuzzleLayout(current, next) ? current : next,
      );
    };

    const requestMeasure = () => {
      if (animationFrame === 0) {
        animationFrame = window.requestAnimationFrame(measure);
      }
    };

    const resizeObserver =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(requestMeasure);

    [
      frameRef.current,
      leftColumnRef.current,
      rightColumnRef.current,
      timeCardRef.current,
    ].forEach((element) => {
      if (element) resizeObserver?.observe(element);
    });

    window.addEventListener("resize", requestMeasure);
    mediaQuery.addEventListener("change", requestMeasure);
    requestMeasure();

    return () => {
      if (animationFrame !== 0) {
        window.cancelAnimationFrame(animationFrame);
      }
      resizeObserver?.disconnect();
      window.removeEventListener("resize", requestMeasure);
      mediaQuery.removeEventListener("change", requestMeasure);
    };
  }, [enabled]);

  return {
    frameRef,
    leftColumnRef,
    rightColumnRef,
    timeCardRef,
    timePuzzle,
  };
}
