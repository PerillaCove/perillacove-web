import { memo, useMemo, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TooltipProps } from "recharts";
import {
  getSuccessionProfile,
  getActiveSegmentsAtYear,
  getSpeciesIntensityAtYear,
} from "../util";
import { SpeciesLifetimeSegment } from "../types";

const PHASE_COLORS = [
  "#22c55e", // green - pioneers
  "#84cc16", // lime - early
  "#eab308", // yellow - mid
  "#f97316", // orange - late
  "#8b5cf6", // purple - legacy
];

const PHASE_LABELS = ["Primary", "Secondary", "Mid", "Late", "Legacy"];

const ROLE_TO_COLOR: Record<string, string> = {
  pioneer: "#22c55e",
  early: "#84cc16",
  mid: "#eab308",
  late: "#f97316",
  legacy: "#8b5cf6",
};

interface SuccessionWavesProps {
  segments: SpeciesLifetimeSegment[];
  isWidescreen: boolean;
  isDarkMode: boolean;
  selectedYear?: number;
  onYearSelect?: (year: number) => void;
  onInfoClick?: () => void;
}

/**
 * Generates wave data for a species lifecycle across multiple time points.
 * Uses the shared getSpeciesIntensityAtYear function for consistency.
 *
 * Returns an array of intensity values (0-1) for each time point.
 */
function generateWaveData(
  plantYear: number,
  harvestStart: number,
  harvestEnd: number,
  timePoints: number[],
): number[] {
  return timePoints.map((t) =>
    getSpeciesIntensityAtYear(plantYear, harvestStart, harvestEnd, t),
  );
}

// Memoized margin constants to avoid recreating objects
const MARGIN_WIDE = { top: 20, right: 30, left: 20, bottom: 20 };
const MARGIN_NARROW = { top: 10, right: 10, left: 0, bottom: 10 };
const TICK_STYLE_WIDE = { fill: "#6b7280", fontSize: 12 };
const TICK_STYLE_NARROW = { fill: "#6b7280", fontSize: 10 };

// Custom tooltip component to avoid inline function recreation
const CustomTooltip = memo(function CustomTooltip({
  active,
  payload,
  label,
  segments,
}: TooltipProps<number, string> & { segments: SpeciesLifetimeSegment[] }) {
  if (!active || !payload || !payload.length) return null;
  const year = Number(label);
  const activeSpecies = getActiveSegmentsAtYear(segments, year);
  if (activeSpecies.length === 0) return null;
  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-2 shadow-lg max-w-xs">
      <p className="font-semibold text-neutral-800 dark:text-neutral-100 mb-2">
        Year {year.toFixed(1)}
      </p>
      <div className="space-y-1">
        {activeSpecies.slice(0, 8).map(({ segment, status, intensity }) => {
          const profile = getSuccessionProfile(segment.ingredient);
          const phase = profile?.successionalPhase || "early";
          const color = ROLE_TO_COLOR[phase] || "#6b7280";
          const respawnCycle = segment.respawnCycle ?? 0;
          const instanceCount = segment.instanceCount ?? 1;
          const uniqueKey = `${segment.ingredient.id}-cycle${respawnCycle}`;
          return (
            <div key={uniqueKey} className="flex items-center gap-2">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: color,
                  opacity: intensity,
                }}
              />
              <span className="text-base text-neutral-700 dark:text-neutral-200 capitalize">
                {segment.ingredient.id.replace(/_/g, " ")}
                {respawnCycle > 0 && (
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 ml-1">
                    (#{respawnCycle + 1})
                  </span>
                )}
                {instanceCount > 1 && (
                  <span className="text-sm text-emerald-600 dark:text-emerald-400 ml-1">
                    x{instanceCount}
                  </span>
                )}
              </span>
              <span className="text-sm text-neutral-400 dark:text-neutral-500 ml-auto">
                {status}
              </span>
            </div>
          );
        })}
        {activeSpecies.length > 8 && (
          <p className="text-sm text-neutral-400 dark:text-neutral-500 pt-1">
            +{activeSpecies.length - 8} more
          </p>
        )}
      </div>
    </div>
  );
});

export const SuccessionWavesChart = memo(function SuccessionWavesChart({
  segments,
  isWidescreen,
  isDarkMode,
  // selectedYear = 0,
  // onYearSelect,
  onInfoClick,
}: SuccessionWavesProps) {
  // Memoize maxYear calculation
  const maxYear = useMemo(
    () => Math.max(...segments.map((s) => s.harvestEndYear), 10),
    [segments],
  );

  // Memoize timePoints array
  const timePoints = useMemo(() => {
    const points: number[] = [];
    for (let t = 0; t <= Math.ceil(maxYear) + 2; t += 0.25) {
      points.push(t);
    }
    return points;
  }, [maxYear]);

  // Memoize phaseData grouping
  const phaseData = useMemo(() => {
    const data: Record<
      number,
      { segments: SpeciesLifetimeSegment[]; color: string }
    > = {};

    segments.forEach((seg) => {
      const profile = getSuccessionProfile(seg.ingredient);
      const phase = profile?.successionalPhase || "early";
      const phaseIndex =
        phase === "pioneer"
          ? 0
          : phase === "early"
            ? 1
            : phase === "mid"
              ? 2
              : phase === "late"
                ? 3
                : 4;

      if (!data[phaseIndex]) {
        data[phaseIndex] = {
          segments: [],
          color: PHASE_COLORS[phaseIndex],
        };
      }
      data[phaseIndex].segments.push(seg);
    });

    return data;
  }, [segments]);

  // Memoize chart data - this is the expensive calculation
  const chartData = useMemo(() => {
    return timePoints.map((t) => {
      const point: Record<string, number | string> = { year: t };

      Object.entries(phaseData).forEach(
        ([phaseIdx, { segments: phaseSegments }]) => {
          const phaseKey =
            PHASE_LABELS[parseInt(phaseIdx)] || `Phase${phaseIdx}`;
          let totalIntensity = 0;

          phaseSegments.forEach((seg) => {
            const wave = generateWaveData(
              seg.plantYear,
              seg.harvestStartYear,
              seg.harvestEndYear,
              [t],
            );
            totalIntensity += wave[0] * (seg.instanceCount ?? 1);
          });

          point[phaseKey] = totalIntensity;
        },
      );

      return point;
    });
  }, [timePoints, phaseData]);

  // Memoize active phases
  const activePhases = useMemo(
    () =>
      Object.keys(phaseData)
        .map(Number)
        .sort((a, b) => a - b),
    [phaseData],
  );

  // Memoize ticks array
  const xAxisTicks = useMemo(
    () =>
      timePoints.filter(
        (t) => Number.isInteger(t) && t % (isWidescreen ? 2 : 5) === 0,
      ),
    [timePoints, isWidescreen],
  );

  // Memoize reference line years
  const referenceYears = useMemo(
    () => [1, 3, 5, 10].filter((y) => y <= maxYear),
    [maxYear],
  );

  // Memoized tooltip content renderer
  const renderTooltip = useCallback(
    (props: TooltipProps<number, string>) => (
      <CustomTooltip {...props} segments={segments} />
    ),
    [segments],
  );

  if (segments.length === 0) return null;

  return (
    <div className="w-full">
      {onInfoClick ? (
        <button onClick={onInfoClick} className="flex items-center gap-2 group">
          <span
            className={`text-xl font-medium ${isDarkMode ? "text-cove-dark" : "text-cove"} group-hover:underline`}
          >
            Layers of Succession
          </span>
          <i className="fa-solid fa-circle-info text-base text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition-colors" />
        </button>
      ) : (
        <span
          className={`text-xl font-medium ${isDarkMode ? "text-cove-dark" : "text-cove"}`}
        >
          Layers of Succession
        </span>
      )}
      <p className="text-base text-neutral-500 dark:text-neutral-400 mb-4 hidden lg:block mt-3">
        When each layer is active. Taller = more species productive in that
        phase.
      </p>
      <div
        className={isWidescreen ? "h-[350px]" : "h-[250px]"}
        style={{ width: "100%" }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={isWidescreen ? MARGIN_WIDE : MARGIN_NARROW}
          >
            <defs>
              {activePhases.map((phaseIdx) => (
                <linearGradient
                  key={`gradient-${phaseIdx}`}
                  id={`colorPhase${phaseIdx}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={PHASE_COLORS[phaseIdx]}
                    stopOpacity={0.9}
                  />
                  <stop
                    offset="95%"
                    stopColor={PHASE_COLORS[phaseIdx]}
                    stopOpacity={0.4}
                  />
                </linearGradient>
              ))}
            </defs>
            <XAxis
              dataKey="year"
              tickFormatter={(v) => `Y${v}`}
              tick={isWidescreen ? TICK_STYLE_WIDE : TICK_STYLE_NARROW}
              ticks={xAxisTicks}
            />
            <YAxis hide />
            <Tooltip content={renderTooltip} />
            {/* Render areas in reverse order so pioneers are on top visually */}
            {[...activePhases].reverse().map((phaseIdx) => (
              <Area
                key={phaseIdx}
                type="monotone"
                dataKey={PHASE_LABELS[phaseIdx]}
                stackId="1"
                stroke="none"
                fill={`url(#colorPhase${phaseIdx})`}
              />
            ))}
            {/* Reference lines for key milestones */}
            {referenceYears.map((year) => (
              <ReferenceLine
                key={year}
                x={year}
                stroke="#d1d5db"
                strokeDasharray="3 3"
                label={{
                  value: `Y${year}`,
                  position: "top",
                  fill: "#9ca3af",
                  fontSize: 10,
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Year slider - synced with LayerMap */}
      {/* {onYearSelect && (
        <div className="mt-3 px-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Year {selectedYear}
            </span>
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              {maxYearCeil} years
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={maxYearCeil}
            value={selectedYear}
            onChange={(e) => onYearSelect(Number(e.target.value))}
            className="w-full accent-emerald-600"
          />
        </div>
      )} */}

      {/* Legend */}
      <div className="flex flex-wrap gap-2 lg:gap-4 justify-center mt-3 lg:mt-4">
        {activePhases.map((phaseIdx) => (
          <div key={phaseIdx} className="flex items-center gap-1.5 lg:gap-2">
            <div
              className="w-3 h-3 lg:w-4 lg:h-4 rounded"
              style={{ backgroundColor: PHASE_COLORS[phaseIdx] }}
            />
            <span className="text-sm lg:text-base text-neutral-600 dark:text-neutral-400">
              {PHASE_LABELS[phaseIdx]}
              <span className="text-sm text-neutral-400 dark:text-neutral-500 ml-1">
                ({phaseData[phaseIdx].segments.length})
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
});
