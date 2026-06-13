import { useMemo, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "motion/react";
import type { Ingredient } from "../../IngredientsPage/types";
import type { LayerPlacement, VerticalLayer, CanopyClosure } from "../types";
import {
  VERTICAL_LAYER_ORDER,
  VERTICAL_LAYER_LABELS,
  VERTICAL_LAYER_COLORS,
} from "../types";
import {
  buildLayerPlacements,
  groupPlacementsByLayer,
  simulateCanopyClosure,
  describeShadeLevel,
} from "../util";
import IngredientImg from "../../IngredientsPage/Image";
import Modal from "../../Modal";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface LayerMapProps {
  ingredients: Ingredient[];
  isDarkMode: boolean;
  isWidescreen: boolean;
  /** Selected year for highlighting */
  selectedYear?: number;
  onYearSelect?: (year: number) => void;
}

interface LayerRowProps {
  layer: VerticalLayer;
  placements: LayerPlacement[];
  isDarkMode: boolean;
  isWidescreen: boolean;
  selectedYear: number;
}

function LayerRow({
  layer,
  placements,
  isDarkMode,
  selectedYear,
}: LayerRowProps) {
  const color = VERTICAL_LAYER_COLORS[layer];
  const label = VERTICAL_LAYER_LABELS[layer];

  // Top layers need tooltip below to avoid clipping
  const tooltipBelow = layer === "canopy" || layer === "midstory";

  // Filter placements active at selected year
  const activePlacements = placements.filter(
    (p) => selectedYear >= p.activeYears[0] && selectedYear <= p.activeYears[1],
  );
  const inactivePlacements = placements.filter(
    (p) => selectedYear < p.activeYears[0] || selectedYear > p.activeYears[1],
  );

  return (
    <div className="flex items-center gap-2 lg:gap-3 py-1.5">
      {/* Layer label */}
      <div
        className={clsx(
          "w-20 lg:w-24 flex-shrink-0 flex items-center justify-center rounded px-1.5 py-1",
          "font-medium text-[10px] lg:text-xs text-white",
        )}
        style={{ backgroundColor: color }}
      >
        {label}
      </div>

      {/* Species in this layer */}
      <div className="flex-1 flex flex-wrap gap-1.5 items-center overflow-visible">
        {activePlacements.map((placement) => (
          <PlacementChip
            key={placement.ingredient.id}
            placement={placement}
            isDarkMode={isDarkMode}
            isActive={true}
            selectedYear={selectedYear}
            tooltipBelow={tooltipBelow}
          />
        ))}
        {inactivePlacements.map((placement) => (
          <PlacementChip
            key={placement.ingredient.id}
            placement={placement}
            isDarkMode={isDarkMode}
            isActive={false}
            selectedYear={selectedYear}
            tooltipBelow={tooltipBelow}
          />
        ))}
        {placements.length === 0 && (
          <span className="text-xs text-neutral-400 dark:text-neutral-500 italic">
            —
          </span>
        )}
      </div>
    </div>
  );
}

interface PlacementChipProps {
  placement: LayerPlacement;
  isDarkMode: boolean;
  isActive: boolean;
  selectedYear: number;
  /** If true, tooltip appears below instead of above (for top layers) */
  tooltipBelow?: boolean;
}

function PlacementChip({
  placement,
  isDarkMode,
  isActive,
  selectedYear,
  tooltipBelow = false,
}: PlacementChipProps) {
  const { ingredient, layer, needsRelocation, relocationYear, placementNotes } =
    placement;
  const color = VERTICAL_LAYER_COLORS[layer];

  // Check if this plant needs relocation warning at current year
  const showRelocationWarning =
    needsRelocation && relocationYear && selectedYear >= relocationYear;

  return (
    <div
      className={clsx(
        "group relative flex items-center gap-1.5 px-2 py-1.5 rounded-lg transition-all duration-200",
        "border text-sm cursor-default",
        {
          "opacity-40": !isActive,
          "border-amber-400 dark:border-amber-500": showRelocationWarning,
          "border-neutral-300 dark:border-neutral-600": !showRelocationWarning,
          "bg-white dark:bg-neutral-800": !showRelocationWarning,
          "bg-amber-50 dark:bg-amber-900/30": showRelocationWarning,
        },
      )}
    >
      <IngredientImg ingredient={ingredient} width={18} height={18} />
      <span
        className={clsx("capitalize whitespace-nowrap", {
          "text-neutral-700 dark:text-neutral-200": isActive,
          "text-neutral-400 dark:text-neutral-500": !isActive,
        })}
      >
        {ingredient.id.replace(/_/g, " ")}
      </span>

      {/* Layer color indicator */}
      <div
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ backgroundColor: color, opacity: isActive ? 1 : 0.4 }}
      />

      {/* Relocation warning icon */}
      {showRelocationWarning && (
        <i className="fa-solid fa-arrow-right-arrow-left text-amber-500 text-xs" />
      )}

      {/* Tooltip on hover - positioned below for top layers to avoid clipping */}
      <div
        className={clsx(
          "absolute left-1/2 -translate-x-1/2 z-50",
          "w-56 p-3 rounded-lg shadow-lg border",
          "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
          "transition-all duration-200 pointer-events-none",
          tooltipBelow ? "top-full mt-2" : "bottom-full mb-2",
          isDarkMode
            ? "bg-neutral-800 border-neutral-600 text-neutral-100"
            : "bg-white border-neutral-200 text-neutral-800",
        )}
      >
        <p className="font-semibold capitalize mb-1">
          {ingredient.id.replace(/_/g, " ")}
        </p>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
          Active: Year {placement.activeYears[0].toFixed(1)} –{" "}
          {placement.activeYears[1].toFixed(1)}
        </p>
        {placementNotes.slice(0, 2).map((note, idx) => (
          <p
            key={idx}
            className="text-xs text-neutral-600 dark:text-neutral-300 mb-1"
          >
            • {note}
          </p>
        ))}
        {showRelocationWarning && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 font-medium">
            ⚠ Consider relocating to sunnier gaps
          </p>
        )}
      </div>
    </div>
  );
}

interface ShadeTimelineProps {
  canopyClosure: CanopyClosure[];
  isDarkMode: boolean;
  isWidescreen: boolean;
  selectedYear: number;
  onYearSelect: (year: number) => void;
  onInfoClick: () => void;
}

function ShadeTimeline({
  canopyClosure,
  isDarkMode,
  isWidescreen,
  selectedYear,
  onYearSelect,
  onInfoClick,
}: ShadeTimelineProps) {
  const chartData = canopyClosure.map((c) => ({
    year: c.year,
    closure: c.closureIndex * 100,
    shade: describeShadeLevel(c.closureIndex),
  }));

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2 gap-3">
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              "text-base lg:text-lg font-medium",
              isDarkMode ? "text-cove-dark" : "text-cove",
            )}
          >
            Canopy Closure Over Time
          </span>
          <button
            type="button"
            onClick={onInfoClick}
            className={clsx(
              "flex items-center gap-1 text-[11px] px-2 py-1 rounded-full border transition-colors",
              isDarkMode
                ? "border-neutral-700 text-neutral-300 hover:bg-neutral-800"
                : "border-neutral-200 text-neutral-600 hover:bg-neutral-100",
            )}
            aria-label="What is canopy closure?"
          >
            <i className="fa-solid fa-circle-info text-[12px]" />
            <span className="hidden sm:inline">What’s this?</span>
          </button>
        </div>
        <span className="text-sm text-neutral-500 dark:text-neutral-400">
          Year {selectedYear}:{" "}
          {describeShadeLevel(canopyClosure[selectedYear]?.closureIndex ?? 0)}
        </span>
      </div>

      <div className={isWidescreen ? "h-[180px]" : "h-[140px]"}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={
              isWidescreen
                ? { top: 10, right: 20, left: 0, bottom: 10 }
                : { top: 5, right: 10, left: 0, bottom: 5 }
            }
            onClick={(e) => {
              if (e && e.activeLabel !== undefined) {
                onYearSelect(Number(e.activeLabel));
              }
            }}
          >
            <defs>
              <linearGradient id="shadeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#166534" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#166534" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="year"
              tickFormatter={(v) => `Y${v}`}
              tick={{
                fill: isDarkMode ? "#9ca3af" : "#6b7280",
                fontSize: isWidescreen ? 12 : 10,
              }}
            />
            <YAxis
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{
                fill: isDarkMode ? "#9ca3af" : "#6b7280",
                fontSize: isWidescreen ? 12 : 10,
              }}
              width={40}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const data = payload[0]?.payload;
                if (!data) return null;
                return (
                  <div
                    className={clsx(
                      "px-3 py-2 rounded-lg shadow-lg border",
                      isDarkMode
                        ? "bg-neutral-800 border-neutral-600"
                        : "bg-white border-neutral-200",
                    )}
                  >
                    <p className="font-semibold">Year {data.year}</p>
                    <p className="text-sm">
                      Closure: {data.closure.toFixed(0)}%
                    </p>
                    <p className="text-sm text-neutral-500">{data.shade}</p>
                  </div>
                );
              }}
            />
            <Area
              type="monotone"
              dataKey="closure"
              stroke="#166534"
              fill="url(#shadeGradient)"
              strokeWidth={2}
            />
            <ReferenceLine
              x={selectedYear}
              stroke={isDarkMode ? "#f59e0b" : "#d97706"}
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            {/* Reference lines for shade thresholds */}
            <ReferenceLine
              y={50}
              stroke="#d1d5db"
              strokeDasharray="3 3"
              label={{
                value: "Partial shade",
                position: "right",
                fill: "#9ca3af",
                fontSize: 10,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Year slider */}
      <div className="mt-3 px-2">
        <input
          type="range"
          min={0}
          max={canopyClosure.length - 1}
          value={selectedYear}
          onChange={(e) => onYearSelect(Number(e.target.value))}
          className="w-full accent-emerald-600"
        />
      </div>
    </div>
  );
}

export default function LayerMap({
  ingredients,
  isDarkMode,
  isWidescreen,
  selectedYear: controlledYear,
  onYearSelect: controlledOnYearSelect,
}: LayerMapProps) {
  // Build layer placements
  const placements = useMemo(
    () => buildLayerPlacements(ingredients),
    [ingredients],
  );

  // Group by layer
  const groupedPlacements = useMemo(
    () => groupPlacementsByLayer(placements),
    [placements],
  );

  // Simulate canopy closure
  const maxYear = useMemo(() => {
    if (placements.length === 0) return 20;
    return Math.max(...placements.map((p) => p.activeYears[1]), 20);
  }, [placements]);

  const canopyClosure = useMemo(
    () => simulateCanopyClosure(placements, Math.ceil(maxYear)),
    [placements, maxYear],
  );

  // Internal state for year if not controlled
  const selectedYear = controlledYear ?? 0;
  const onYearSelect = controlledOnYearSelect ?? (() => {});

  // Toggle to show all layers vs only populated ones
  const [showAllLayers, setShowAllLayers] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  if (ingredients.length === 0) return null;

  // Layers with actual species
  const populatedLayers = VERTICAL_LAYER_ORDER.filter(
    (layer) =>
      groupedPlacements.has(layer) && groupedPlacements.get(layer)!.length > 0,
  );

  // Show all layers or just populated ones
  const layersToShow = showAllLayers ? VERTICAL_LAYER_ORDER : populatedLayers;
  const emptyLayerCount = VERTICAL_LAYER_ORDER.length - populatedLayers.length;

  return (
    <div className="w-full space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Where each species sits spatially. Drag the timeline to see how shade
          affects placement.
        </p>
      </div>

      {/* Shade timeline */}
      <div
        className={clsx(
          "rounded-xl p-4 border",
          isDarkMode
            ? "bg-neutral-800/50 border-neutral-700"
            : "bg-neutral-50 border-neutral-200",
        )}
      >
        <ShadeTimeline
          canopyClosure={canopyClosure}
          isDarkMode={isDarkMode}
          isWidescreen={isWidescreen}
          selectedYear={selectedYear}
          onYearSelect={onYearSelect}
          onInfoClick={() => setIsInfoOpen(true)}
        />
      </div>

      {/* Layer diagram */}
      <div
        className={clsx(
          "rounded-xl border",
          isDarkMode ? "border-neutral-700" : "border-neutral-200",
        )}
      >
        <div
          className={clsx(
            "divide-y",
            isDarkMode ? "divide-neutral-700" : "divide-neutral-200",
          )}
        >
          <AnimatePresence initial={false}>
            {layersToShow.map((layer, idx) => (
              <motion.div
                key={layer}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className={clsx(
                  "px-3 lg:px-4",
                  isDarkMode ? "bg-neutral-800/30" : "bg-white",
                  // Round corners for first and last items
                  idx === 0 && "rounded-t-xl",
                  idx === layersToShow.length - 1 &&
                    !showAllLayers &&
                    "rounded-b-xl",
                )}
              >
                <LayerRow
                  layer={layer}
                  placements={groupedPlacements.get(layer) || []}
                  isDarkMode={isDarkMode}
                  isWidescreen={isWidescreen}
                  selectedYear={selectedYear}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Expand/collapse toggle */}
        {emptyLayerCount > 0 && (
          <button
            onClick={() => setShowAllLayers(!showAllLayers)}
            className={clsx(
              "w-full py-1.5 text-xs flex items-center justify-center gap-1.5",
              "border-t transition-colors",
              isDarkMode
                ? "border-neutral-700 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-700/50"
                : "border-neutral-200 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-50",
              "rounded-b-xl",
            )}
          >
            <motion.i
              animate={{ rotate: showAllLayers ? 180 : 0 }}
              transition={{ duration: 0.2 }}
              className="fa-solid fa-chevron-down text-[10px]"
            />
            {showAllLayers
              ? "Show less"
              : `Show all ${VERTICAL_LAYER_ORDER.length} layers`}
          </button>
        )}
      </div>

      <AnimatePresence>
        {isInfoOpen && (
          <Modal
            widthClasses="w-[95%] max-w-xl"
            heightClasses="max-h-[80vh]"
            onDismiss={() => setIsInfoOpen(false)}
            scrollable
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="space-y-3 p-2"
            >
              <div className="flex items-center gap-2">
                <i className="fa-solid fa-circle-info text-cove-dark" />
                <h3 className="text-lg font-semibold">
                  What is Canopy Closure?
                </h3>
              </div>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                This is a lightweight simulation to visualize how quickly shade
                builds as trees mature. It is not a physics engine—just a
                planning aid.
              </p>
              <ul className="text-sm text-neutral-600 dark:text-neutral-300 list-disc pl-5 space-y-1">
                <li>
                  Each canopy tree contributes ~15% shade at maturity; midstory
                  ~8%; understory ~3%.
                </li>
                <li>
                  Trees ramp up over time (understory ~3y, midstory ~5y, canopy
                  ~7y to meaningful shade).
                </li>
                <li>
                  Total shade is capped at 90% to reflect management (thinning,
                  pruning, creating gaps).
                </li>
                <li>
                  Labels map closure to light: Full sun (&lt;20%), Light shade,
                  Partial shade, Mostly shaded, Deep shade.
                </li>
              </ul>
              <p className="text-sm text-neutral-600 dark:text-neutral-300">
                Use it to decide when full-sun species should shift to sunnier
                gaps and when shade-tolerant species can take over.
              </p>
              <div className="flex justify-end">
                <button
                  onClick={() => setIsInfoOpen(false)}
                  className={clsx(
                    "px-4 py-2 rounded-lg text-sm font-medium border",
                    isDarkMode
                      ? "border-neutral-600 text-neutral-100 hover:bg-neutral-700"
                      : "border-neutral-300 text-neutral-700 hover:bg-neutral-100",
                  )}
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </Modal>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 lg:gap-4 justify-center">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-neutral-400" />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Inactive at Year {selectedYear}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <i className="fa-solid fa-arrow-right-arrow-left text-amber-500 text-xs" />
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Needs relocation to sunnier gap
          </span>
        </div>
      </div>
    </div>
  );
}
