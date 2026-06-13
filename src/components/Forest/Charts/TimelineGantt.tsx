import { memo, useMemo, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import type { TooltipProps } from "recharts";
import { getSuccessionProfile } from "../util";
import { SpeciesLifetimeSegment } from "../types";

const ROLE_TO_COLOR: Record<string, string> = {
  pioneer: "#22c55e",
  early: "#84cc16",
  mid: "#eab308",
  late: "#f97316",
  legacy: "#8b5cf6",
};

// Memoized constants
const MARGIN_WIDE = { top: 20, right: 30, left: 100, bottom: 20 };
const MARGIN_NARROW = { top: 10, right: 10, left: 10, bottom: 10 };
const MARGIN_NARROW_LABELED = { top: 10, right: 10, left: 6, bottom: 10 };
const TICK_STYLE_WIDE = { fill: "#6b7280", fontSize: 12 };
const TICK_STYLE_NARROW = { fill: "#6b7280", fontSize: 10 };
const Y_TICK_NARROW = { fill: "#6b7280", fontSize: 11 };
const Y_TICK_WIDE = { fill: "#6b7280", fontSize: 16 };

interface TimelineGanttProps {
  segments: SpeciesLifetimeSegment[];
  isWidescreen: boolean;
  isDarkMode: boolean;
  /** Use a taller chart height for fullscreen chart surfaces. */
  expandedHeight?: boolean;
}

interface GanttDataItem {
  name: string;
  baseName: string;
  respawnCycle: number;
  instanceCount: number;
  plantYear: number;
  waitPeriod: number;
  harvestPeriod: number;
  totalEnd: number;
  phase: string;
  color: string;
}

// Memoized tooltip component
const GanttTooltip = memo(function GanttTooltip({
  active,
  payload,
}: TooltipProps<number, string>) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0]?.payload as GanttDataItem | undefined;
  if (!item) return null;
  return (
    <div className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 rounded-lg px-3 py-2 shadow-lg">
      <p className="font-semibold capitalize text-neutral-800 dark:text-neutral-100">
        {item.baseName}
        {item.respawnCycle > 0 && (
          <span className="text-emerald-600 dark:text-emerald-400 ml-1 text-base font-normal">
            (Cycle #{item.respawnCycle + 1})
          </span>
        )}
        {item.instanceCount > 1 && (
          <span className="text-emerald-600 dark:text-emerald-400 ml-1 text-base font-normal">
            x{item.instanceCount}
          </span>
        )}
      </p>
      <p className="text-base text-neutral-600 dark:text-neutral-300">
        Plant: Year {item.plantYear.toFixed(1)}
      </p>
      <p className="text-base text-neutral-600 dark:text-neutral-300">
        Harvest: Year {(item.plantYear + item.waitPeriod).toFixed(1)} -{" "}
        {item.totalEnd.toFixed(1)}
      </p>
      <p className="text-base capitalize" style={{ color: item.color }}>
        Phase: {item.phase}
      </p>
    </div>
  );
});

export const TimelineGantt = memo(function TimelineGantt({
  segments,
  isWidescreen,
  expandedHeight = false,
}: TimelineGanttProps) {
  // Memoize maxYear
  const maxYear = useMemo(
    () => Math.max(...segments.map((s) => s.harvestEndYear), 10),
    [segments],
  );

  // Memoize data transformation
  const data = useMemo(() => {
    const transformed = segments.map((seg) => {
      const profile = getSuccessionProfile(seg.ingredient);
      const phase = profile?.successionalPhase || "early";
      const respawnCycle = seg.respawnCycle ?? 0;
      const instanceCount = seg.instanceCount ?? 1;
      const baseName = seg.ingredient.id.replace(/_/g, " ");
      const countSuffix = instanceCount > 1 ? ` x${instanceCount}` : "";
      const cycleSuffix = respawnCycle > 0 ? ` #${respawnCycle + 1}` : "";
      const displayName = `${baseName}${countSuffix}${cycleSuffix}`;

      return {
        name: displayName,
        baseName,
        respawnCycle,
        instanceCount,
        plantYear: seg.plantYear,
        waitPeriod: seg.harvestStartYear - seg.plantYear,
        harvestPeriod: seg.harvestEndYear - seg.harvestStartYear,
        totalEnd: seg.harvestEndYear,
        phase,
        color: ROLE_TO_COLOR[phase] || "#6b7280",
      };
    });

    // Sort by plant year
    transformed.sort((a, b) => a.plantYear - b.plantYear);
    return transformed;
  }, [segments]);

  const showCompactLabels = !isWidescreen && expandedHeight;
  const rowHeight = isWidescreen ? 50 : showCompactLabels ? 34 : 42;

  // Memoize chart height. Widescreen historically used a fixed 400px height,
  // but fullscreen timeline benefits from more vertical room.
  const chartHeight = useMemo(() => {
    const dataDrivenHeight = Math.max(200, data.length * rowHeight + 60);
    if (!isWidescreen) {
      if (!expandedHeight) return dataDrivenHeight;
      return Math.min(760, Math.max(360, dataDrivenHeight));
    }
    if (!expandedHeight) return 400;
    return Math.min(760, Math.max(520, dataDrivenHeight));
  }, [data.length, expandedHeight, isWidescreen, rowHeight]);

  // Memoize X domain
  const xDomain = useMemo(
    () => [0, Math.ceil(maxYear / 5) * 5] as [number, number],
    [maxYear],
  );

  // Memoize reference years
  const referenceYears = useMemo(
    () => [1, 2, 3, 5, 10].filter((y) => y <= maxYear),
    [maxYear],
  );

  // Memoized tooltip renderer
  const renderTooltip = useCallback(
    (props: TooltipProps<number, string>) => <GanttTooltip {...props} />,
    [],
  );

  if (segments.length === 0) return null;

  return (
    <div className="w-full">
      <div style={{ height: chartHeight }} className="w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={
              isWidescreen
                ? MARGIN_WIDE
                : showCompactLabels
                  ? MARGIN_NARROW_LABELED
                  : MARGIN_NARROW
            }
          >
            <XAxis
              type="number"
              domain={xDomain}
              tickFormatter={(v) => `Y${v}`}
              tick={isWidescreen ? TICK_STYLE_WIDE : TICK_STYLE_NARROW}
              tickCount={isWidescreen ? undefined : 4}
            />
            <YAxis
              type="category"
              dataKey="name"
              tick={
                isWidescreen
                  ? Y_TICK_WIDE
                  : showCompactLabels
                    ? Y_TICK_NARROW
                    : false
              }
              width={isWidescreen ? 90 : showCompactLabels ? 112 : 10}
              tickFormatter={(label) =>
                showCompactLabels &&
                typeof label === "string" &&
                label.length > 14
                  ? `${label.slice(0, 13)}…`
                  : label
              }
            />
            <Tooltip content={renderTooltip} />
            {/* Invisible bar for offset (plant year) */}
            <Bar dataKey="plantYear" stackId="a" fill="transparent" />
            {/* Wait period (before harvest) - shown lighter */}
            <Bar dataKey="waitPeriod" stackId="a" radius={[0, 0, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`wait-${index}`}
                  fill={entry.color}
                  fillOpacity={0.3}
                />
              ))}
            </Bar>
            {/* Harvest period - shown solid */}
            <Bar dataKey="harvestPeriod" stackId="a" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`harvest-${index}`} fill={entry.color} />
              ))}
            </Bar>
            {/* Reference lines for years */}
            {referenceYears.map((year) => (
              <ReferenceLine
                key={year}
                x={year}
                stroke="#d1d5db"
                strokeDasharray="3 3"
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-3 lg:gap-6 mt-3 lg:mt-4 flex-wrap">
        <div className="flex items-center gap-1.5 lg:gap-2">
          <div className="w-3 h-3 lg:w-4 lg:h-4 rounded bg-green-500 opacity-30" />
          <span className="text-sm lg:text-base text-neutral-600 dark:text-neutral-400">
            Establishment
          </span>
        </div>
        <div className="flex items-center gap-1.5 lg:gap-2">
          <div className="w-3 h-3 lg:w-4 lg:h-4 rounded bg-green-500" />
          <span className="text-sm lg:text-base text-neutral-600 dark:text-neutral-400">
            Productive
          </span>
        </div>
      </div>
    </div>
  );
});
