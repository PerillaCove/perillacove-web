import clsx from "clsx";
import { useMemo } from "react";
import type { Ingredient } from "./types";
import {
  getIngredientSensoryProfile,
  type SensoryDisplaySignal,
} from "./sensory";
import { integrationProfileCardClasses } from "./integrationProfileStyles";

interface Props {
  ingredient: Ingredient;
  ingredientsInPlay?: Ingredient[];
  enforceDarkMode?: boolean;
  isDarkMode: boolean;
  variant?: "card" | "bare";
}

interface Point {
  x: number;
  y: number;
}

const SIZE = 260;
const CENTER = SIZE / 2;
const RADIUS = 82;
const LABEL_RADIUS = RADIUS + 28;
const RADAR_GRID_RINGS = [0.33, 0.66, 1];
const radarCanvasClasses = "h-[250px] w-full sm:h-[270px]";
const radarSlotClasses = "min-h-[250px] sm:min-h-[270px]";

function polarPoint(radius: number, angle: number): Point {
  return {
    x: CENTER + Math.cos(angle) * radius,
    y: CENTER + Math.sin(angle) * radius,
  };
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function labelAnchor(x: number): "start" | "middle" | "end" {
  if (x > CENTER + 12) return "start";
  if (x < CENTER - 12) return "end";
  return "middle";
}

function labelBaseline(y: number): "hanging" | "middle" | "auto" {
  if (y < CENTER - RADIUS - 8) return "hanging";
  if (y > CENTER + RADIUS + 8) return "auto";
  return "middle";
}

function signalColor(
  signal: SensoryDisplaySignal,
  isDarkMode: boolean,
): string {
  return isDarkMode
    ? signal.colors.bgGradientStopDark
    : signal.colors.bgGradientStop;
}

function RadarChart({
  signals,
  isDarkMode,
}: {
  signals: SensoryDisplaySignal[];
  isDarkMode: boolean;
}) {
  if (signals.length === 0) return null;

  const points = signals.map((signal, index) => {
    const angle =
      -Math.PI / 2 + (index / Math.max(signals.length, 1)) * Math.PI * 2;
    const valueRadius = (signal.intensity / 5) * RADIUS;
    const point = polarPoint(valueRadius, angle);
    const axis = polarPoint(RADIUS, angle);
    const label = polarPoint(LABEL_RADIUS, angle);

    return { signal, angle, point, axis, label };
  });
  const valuePath = points
    .map(({ point }) => `${point.x},${point.y}`)
    .join(" ");
  const averageColor = signalColor(signals[0], isDarkMode);
  const gridStroke = isDarkMode
    ? "rgba(148,163,184,0.28)"
    : "rgba(15,23,42,0.16)";
  const axisStroke = isDarkMode
    ? "rgba(148,163,184,0.34)"
    : "rgba(15,23,42,0.22)";

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={radarCanvasClasses}>
      {RADAR_GRID_RINGS.map((ring) => (
        <circle
          key={ring}
          cx={CENTER}
          cy={CENTER}
          r={RADIUS * ring}
          fill="none"
          stroke={gridStroke}
          strokeWidth="1"
        />
      ))}

      {points.map(({ signal, axis }) => (
        <line
          key={`axis-${signal.kind}-${signal.id}`}
          x1={CENTER}
          y1={CENTER}
          x2={axis.x}
          y2={axis.y}
          stroke={axisStroke}
          strokeWidth="1.1"
        />
      ))}

      {signals.length >= 3 ? (
        <polygon
          points={valuePath}
          fill={hexToRgba(averageColor, isDarkMode ? 0.2 : 0.16)}
          stroke={hexToRgba(averageColor, 0.62)}
          strokeWidth="1.8"
        />
      ) : (
        <polyline
          points={valuePath}
          fill="none"
          stroke={hexToRgba(averageColor, 0.62)}
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}

      {points.map(({ signal, point, label }) => {
        const color = signalColor(signal, isDarkMode);

        return (
          <g
            key={`${signal.kind}-${signal.id}`}
            aria-label={`${signal.label} ${signal.kind} intensity ${signal.intensity} of 5`}
          >
            <title>{`${signal.label}: ${signal.intensity}/5`}</title>
            <line
              x1={CENTER}
              y1={CENTER}
              x2={point.x}
              y2={point.y}
              stroke={hexToRgba(color, 0.72)}
              strokeLinecap="round"
              strokeWidth={1.55 + signal.intensity * 0.3}
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={2 + signal.intensity * 1.08}
              fill={hexToRgba(color, 0.86)}
              stroke={color}
              strokeWidth="1.9"
            />
            <text
              x={label.x}
              y={label.y}
              textAnchor={labelAnchor(label.x)}
              dominantBaseline={labelBaseline(label.y)}
              fill={isDarkMode ? "rgba(248,250,252,0.92)" : "#0f172a"}
              fontSize="14"
              fontWeight="700"
            >
              {signal.label}
            </text>
          </g>
        );
      })}

      <circle
        cx={CENTER}
        cy={CENTER}
        r="5"
        fill={isDarkMode ? "rgba(209,250,229,0.72)" : "rgba(4,120,87,0.58)"}
      />
    </svg>
  );
}

export default function SensoryRadarCharts({
  ingredient,
  isDarkMode,
  variant = "card",
}: Props) {
  const profile = useMemo(
    () => getIngredientSensoryProfile(ingredient),
    [ingredient],
  );

  if (profile.tastes.length + profile.qualities.length === 0) {
    return null;
  }

  const charts = [profile.tastes, profile.qualities].filter(
    (signals) => signals.length > 0,
  );

  const contents = charts.map((signals) => (
    <div key={signals[0].kind} className={radarSlotClasses}>
      <RadarChart signals={signals} isDarkMode={isDarkMode} />
    </div>
  ));

  if (variant === "bare") {
    return (
      <section
        className="grid grid-cols-1 gap-3 md:grid-cols-2"
        aria-label={`${ingredient.id.replace(/_/g, " ")} sensory charts`}
      >
        {contents}
      </section>
    );
  }

  return (
    <section
      className={clsx(
        integrationProfileCardClasses,
        "mx-2 mb-2 grid grid-cols-1 gap-3 md:grid-cols-2",
      )}
      aria-label={`${ingredient.id.replace(/_/g, " ")} sensory charts`}
    >
      {contents}
    </section>
  );
}
