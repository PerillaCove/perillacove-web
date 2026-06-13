import { useMemo, useState } from "react";
import { motion } from "motion/react";
import clsx from "clsx";
import { createPortal } from "react-dom";
import type { Ingredient } from "../../IngredientsPage/types";
import type { SpeciesCountConfig } from "../types";
import {
  buildLayerPlacements,
  computeLayerDominanceByPhase,
  DISPLAY_LAYER_ORDER,
  DISPLAY_LAYER_LABELS,
  DISPLAY_LAYER_COLORS,
  SUCCESSION_PHASES,
  type DisplayLayer,
  type SuccessionPhaseLabel,
  type LayerPhaseDominance,
} from "../util";
import IngredientImg from "../../IngredientsPage/Image";
// Shorter labels for mobile
const MOBILE_LAYER_LABELS: Record<DisplayLayer, string> = {
  canopy: "Canopy",
  understory: "Understory",
  herbShrub: "Herb/Shrub",
  groundcover: "Ground",
};

// Shorter phase labels for mobile
const MOBILE_PHASE_LABELS: Record<SuccessionPhaseLabel, string> = {
  establishment: "Early",
  transition: "Mid",
  maturity: "Mature",
};

interface DominanceChartProps {
  ingredients: Ingredient[];
  isDarkMode: boolean;
  isWidescreen: boolean;
  speciesCountConfig?: SpeciesCountConfig;
}

interface DominanceCellProps {
  data: LayerPhaseDominance;
  isDarkMode: boolean;
  maxBarWidth: number;
  tooltipBelow?: boolean;
}

/**
 * Converts hex color to rgba string.
 */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Generates a gradient string for the dominance bar.
 * Creates a left-to-right gradient from lighter to full color.
 */
function getBarGradient(color: string, opacity: number): string {
  return `linear-gradient(90deg, ${hexToRgba(color, opacity * 0.7)} 0%, ${hexToRgba(color, opacity)} 100%)`;
}

// /**
//  * Generates a gradient for layer labels.
//  * Creates a left-to-right gradient from darker to lighter.
//  */
// function getLabelGradient(color: string): string {
//   return `linear-gradient(90deg, ${color} 0%, ${hexToRgba(color, 0.75)} 100%)`;
// }

function DominanceCell({
  data,
  isDarkMode,
  maxBarWidth,
  tooltipBelow = false,
}: DominanceCellProps) {
  const { layer, dominance, species } = data;
  const color = DISPLAY_LAYER_COLORS[layer];

  // Minimum bar width for visibility when there's any dominance
  const barWidth = dominance > 0 ? Math.max(8, dominance * maxBarWidth) : 0;

  // Opacity based on dominance
  const opacity = dominance > 0 ? 0.5 + dominance * 0.5 : 0.1;

  return (
    <div className="group relative flex-1 flex items-center justify-center px-0.5 sm:px-1 py-1.5 sm:py-2 min-h-[44px] sm:min-h-[48px]">
      {/* Background bar showing dominance with gradient */}
      <div
        className="absolute inset-y-1 left-1/2 -translate-x-1/2 rounded-md sm:rounded-lg transition-all duration-300"
        style={{
          width: barWidth,
          background: getBarGradient(color, opacity),
        }}
      />

      {/* Species icons overlaid on bar */}
      <div className="relative z-10 flex items-center justify-center gap-0.5 flex-wrap max-w-full">
        {species.slice(0, 3).map((sp) => (
          <div
            key={sp.ingredient.id}
            className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-white dark:bg-neutral-700 shadow-sm flex items-center justify-center"
            style={{ opacity: 0.3 + sp.intensity * 0.7 }}
          >
            <IngredientImg ingredient={sp.ingredient} width={12} height={12} />
          </div>
        ))}
        {species.length > 3 && (
          <span className="text-base text-neutral-500 dark:text-neutral-400 ml-0.5">
            +{species.length - 3}
          </span>
        )}
      </div>

      {/* Hover tooltip */}
      {species.length > 0 && (
        <div
          className={clsx(
            "absolute z-50 left-1/2 -translate-x-1/2",
            tooltipBelow ? "top-full mt-2" : "bottom-full mb-2",
            "w-48 p-3 rounded-lg shadow-lg border",
            "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
            "transition-all duration-200 pointer-events-none",
            isDarkMode
              ? "bg-neutral-800 border-neutral-600 text-neutral-100"
              : "bg-white border-neutral-200 text-neutral-800",
          )}
        >
          {(() => {
            const phase = SUCCESSION_PHASES.find((p) => p.id === data.phase);
            return (
              <>
                <p className="font-semibold text-base mb-1">
                  {DISPLAY_LAYER_LABELS[layer]} · {phase?.label}
                </p>
                <p className="text-base text-neutral-400 mb-2">
                  Year {phase?.yearRange[0]}–{phase?.yearRange[1]}
                </p>
                <div className="space-y-1.5">
                  {species.slice(0, 6).map((sp) => (
                    <div
                      key={sp.ingredient.id}
                      className="flex items-center gap-2"
                    >
                      <IngredientImg
                        ingredient={sp.ingredient}
                        width={16}
                        height={16}
                      />
                      <span className="text-base capitalize flex-1 truncate">
                        {sp.ingredient.id.replace(/_/g, " ")}
                      </span>
                      {(sp.instanceCount ?? 1) > 1 && (
                        <span className="text-base text-emerald-300">
                          x{sp.instanceCount ?? 1}
                        </span>
                      )}
                      <span className="text-base text-neutral-400">
                        {Math.round(sp.intensity * 100)}%
                      </span>
                    </div>
                  ))}
                  {species.length > 6 && (
                    <p className="text-base text-neutral-400 pt-1">
                      +{species.length - 6} more
                    </p>
                  )}
                </div>
                <p className="text-base mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-600">
                  % = avg. productivity over Y{phase?.yearRange[0]}–
                  {phase?.yearRange[1]}
                </p>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}

export {
  NarrativeSection,
  type NarrativeSectionProps,
} from "../NarrativeSection";

export default function DominanceChart({
  ingredients,
  isDarkMode,
  isWidescreen,
  speciesCountConfig,
}: DominanceChartProps) {
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Build placements for later use
  const placements = useMemo(
    () => buildLayerPlacements(ingredients, speciesCountConfig),
    [ingredients, speciesCountConfig],
  );

  // Build placements and compute dominance
  const dominanceData = useMemo(() => {
    return computeLayerDominanceByPhase(placements);
  }, [placements]);

  // Group data by layer for easy row rendering
  const dataByLayer = useMemo(() => {
    const grouped = new Map<
      DisplayLayer,
      Map<SuccessionPhaseLabel, LayerPhaseDominance>
    >();

    for (const layer of DISPLAY_LAYER_ORDER) {
      grouped.set(layer, new Map());
    }

    for (const item of dominanceData) {
      grouped.get(item.layer)?.set(item.phase, item);
    }

    return grouped;
  }, [dominanceData]);

  if (ingredients.length === 0) return null;

  const maxBarWidth = isWidescreen ? 120 : 60;

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <button
          onClick={() => setShowInfoModal(true)}
          className="flex items-center gap-2 group"
        >
          <span
            className={clsx(
              "text-xl font-medium group-hover:underline",
              isDarkMode ? "text-cove-dark" : "text-cove",
            )}
          >
            Role Dominance
          </span>
          <i className="fa-solid fa-circle-info text-base text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-200 transition-colors" />
        </button>
        <p className="text-base text-neutral-500 dark:text-neutral-400 mt-1">
          Wider bands = more productivity in that layer.
        </p>
      </div>

      {/* Chart container */}
      <div
        className={clsx(
          "rounded-xl border",
          isDarkMode ? "border-neutral-700" : "border-neutral-200",
        )}
      >
        {/* Phase headers */}
        <div
          className={clsx(
            "flex border-b rounded-t-xl overflow-hidden",
            isDarkMode
              ? "bg-neutral-800/50 border-neutral-700"
              : "bg-neutral-50 border-neutral-200",
          )}
        >
          {/* Layer label column spacer */}
          <div className="w-[72px] sm:w-24 lg:w-28 flex-shrink-0" />

          {/* Phase labels */}
          {SUCCESSION_PHASES.map((phase) => (
            <div
              key={phase.id}
              className="flex-1 text-center py-2 sm:py-2.5 px-1 sm:px-2 min-w-0"
            >
              <span
                className={clsx(
                  "text-base font-medium block truncate",
                  isDarkMode ? "text-neutral-200" : "text-neutral-700",
                )}
              >
                <span className="sm:hidden">
                  {MOBILE_PHASE_LABELS[phase.id]}
                </span>
                <span className="hidden sm:inline">{phase.label}</span>
              </span>
              <span className="block text-base text-neutral-400 dark:text-neutral-500">
                Y{phase.yearRange[0]}–{phase.yearRange[1]}
              </span>
            </div>
          ))}
        </div>

        {/* Layer rows */}
        {DISPLAY_LAYER_ORDER.map((layer, idx) => {
          const phaseData = dataByLayer.get(layer);
          // const color = DISPLAY_LAYER_COLORS[layer];

          return (
            <div
              key={layer}
              className={clsx(
                "flex items-stretch",
                idx < DISPLAY_LAYER_ORDER.length - 1 && "border-b",
                isDarkMode ? "border-neutral-700" : "border-neutral-200",
              )}
            >
              {/* Layer label */}
              <div
                className={clsx(
                  "w-[72px] sm:w-24 lg:w-28 flex-shrink-0 flex items-center justify-cener px-1.5 sm:px-2 py-2 sm:py-3",
                  "font-medium  text-base  leading-tight dark:text-slate-400 text-slate-700",
                )}
              >
                <span className="sm:hidden">{MOBILE_LAYER_LABELS[layer]}</span>
                <span className="hidden sm:inline">
                  {DISPLAY_LAYER_LABELS[layer]}
                </span>
              </div>

              {/* Phase cells */}
              {SUCCESSION_PHASES.map((phase, phaseIdx) => {
                const cellData = phaseData?.get(phase.id);

                return (
                  <div
                    key={phase.id}
                    className={clsx(
                      "flex-1 flex",
                      phaseIdx < SUCCESSION_PHASES.length - 1 && "border-r",
                      isDarkMode
                        ? "border-neutral-700 bg-neutral-800/30"
                        : "border-neutral-100 bg-white",
                    )}
                  >
                    {cellData ? (
                      <DominanceCell
                        data={cellData}
                        isDarkMode={isDarkMode}
                        maxBarWidth={maxBarWidth}
                        tooltipBelow={layer === "canopy"}
                      />
                    ) : (
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-neutral-300 dark:text-neutral-600">
                          —
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 lg:gap-4 justify-center mt-4">
        <div className="flex items-center gap-1.5">
          <div
            className="w-8 h-3 rounded"
            style={{
              background: `linear-gradient(to right, ${DISPLAY_LAYER_COLORS.canopy}40, ${DISPLAY_LAYER_COLORS.canopy})`,
            }}
          />
          <span className="text-base text-neutral-500 dark:text-neutral-400">
            Low → High dominance
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-white dark:bg-neutral-700 shadow-sm flex items-center justify-center">
            <i className="fa-solid fa-seedling text-base text-neutral-400" />
          </div>
          <span className="text-base text-neutral-500 dark:text-neutral-400">
            Contributing species
          </span>
        </div>
      </div>

      {/* Info Modal */}
      {showInfoModal &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setShowInfoModal(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className={clsx(
                "relative max-w-md w-full rounded-xl shadow-xl p-5 border",
                isDarkMode
                  ? "bg-neutral-800 border-neutral-700 text-neutral-100"
                  : "bg-white border-neutral-200 text-neutral-800",
              )}
            >
              {/* Close button */}
              <button
                onClick={() => setShowInfoModal(false)}
                className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-colors"
              >
                <i className="fa-solid fa-xmark text-neutral-500" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-2 mb-4">
                <i
                  className={clsx(
                    "fa-solid fa-calculator",
                    isDarkMode ? "text-emerald-400" : "text-emerald-600",
                  )}
                />
                <h3 className="font-semibold text-xl">
                  How Productivity % is Calculated
                </h3>
              </div>

              {/* Content */}
              <div className="space-y-3 text-base leading-relaxed">
                <p>
                  The percentage shows a plant's{" "}
                  <strong>average productivity</strong> during a time phase, not
                  its peak.
                </p>

                <div
                  className={clsx(
                    "rounded-lg p-3",
                    isDarkMode ? "bg-neutral-700/50" : "bg-neutral-50",
                  )}
                >
                  <p className="font-medium mb-2">Plant lifecycle stages:</p>
                  <ul className="space-y-1.5 text-base">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span>
                        <strong>Establishing</strong> — growing, not yet
                        productive (0-30%)
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-lime-400" />
                      <span>
                        <strong>Ramping up</strong> — starting to produce
                        (30-80%)
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>
                        <strong>Peak</strong> — full productivity (100%)
                      </span>
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      <span>
                        <strong>Declining</strong> — past prime (80-30%)
                      </span>
                    </li>
                  </ul>
                </div>

                <p className="text-neutral-500 dark:text-neutral-400">
                  <strong>Example:</strong> A slow-maturing tree might show 79%
                  because it's still ramping up early in the phase, while a
                  faster one shows 100% because it's at peak the entire time.
                </p>

                {/* Natural vs Managed explanation */}
                <div
                  className={clsx(
                    "rounded-lg p-3 mt-3",
                    isDarkMode ? "bg-neutral-700/50" : "bg-neutral-50",
                  )}
                >
                  <p className="font-medium mb-2">Natural vs Managed modes:</p>
                  <ul className="space-y-1.5 text-base">
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-neutral-400 mt-1 flex-shrink-0" />
                      <span>
                        <strong>Natural</strong> — Sun-loving plants fade as
                        canopy closes, following natural succession
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                      <span>
                        <strong>Managed</strong> — Sun-lovers stay productive
                        via edge planting or canopy pruning (capped at 75%)
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>,
          document.body,
        )}
    </div>
  );
}
