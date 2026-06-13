import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";

// Sample forest ingredient IDs for comparison
export const SAMPLE_FOREST_IDS = [
  "banana",
  "peanut",
  "cacao",
  "durian",
  "pigeon_pea",
  "jackfruit",
];

// Per-species instance counts for the sample forest (omitted = 1)
export const SAMPLE_FOREST_COUNTS: Record<string, number> = {
  banana: 3,
  peanut: 15,
  cacao: 2,
  pigeon_pea: 3,
};

// Registry of sample forest designs by name
export const SAMPLE_DESIGNS: Record<string, string[]> = {
  "cacao-durian": SAMPLE_FOREST_IDS,
};

interface SampleDesignCardProps {
  isDarkMode: boolean;
  onLoadSample: () => void;
  /** Current ingredient IDs to compare against sample */
  currentIngredientIds: string[];
}

/**
 * Card that shows a sample food forest design.
 * Hidden when current selection matches the sample exactly.
 */
export default function SampleDesignCard({
  isDarkMode,
  onLoadSample,
  currentIngredientIds,
}: SampleDesignCardProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if current forest matches sample (same ingredients, nothing more/less)
  const isSampleLoaded = useMemo(() => {
    if (currentIngredientIds.length !== SAMPLE_FOREST_IDS.length) return false;
    const currentSet = new Set(currentIngredientIds);
    return SAMPLE_FOREST_IDS.every((id) => currentSet.has(id));
  }, [currentIngredientIds]);

  // Don't show if sample is already loaded
  if (isSampleLoaded) return null;

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
  };

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.div
          key="sample-design-card"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className={clsx(
            "rounded-2xl overflow-hidden shadow-sm border cursor-pointer group relative",
            "hover:shadow-md transition-all duration-300",
            isDarkMode
              ? "bg-gradient-to-br from-neutral-800 to-neutral-900 border-neutral-700"
              : "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200",
          )}
          onClick={onLoadSample}
        >
          {/* Close button */}
          <button
            onClick={handleDismiss}
            className={clsx(
              "absolute top-2 right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center",
              "opacity-70 hover:opacity-100 transition-opacity duration-200",
              "focus:outline-none focus:ring-2 focus:ring-offset-1",
              isDarkMode
                ? "bg-neutral-800/80 hover:bg-neutral-700/80 text-neutral-300 focus:ring-neutral-500"
                : "bg-white/80 hover:bg-white text-neutral-600 focus:ring-amber-400",
            )}
            aria-label="Dismiss card"
          >
            <i className="fa-solid fa-times text-sm" />
          </button>

          {/* Image */}
          <div className="relative h-24 overflow-hidden">
            <img
              src="https://infoimages.perillacove.com/sample_forest.webp"
              alt="Sample food forest design"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div
              className={clsx(
                "absolute inset-0 bg-gradient-to-t",
                isDarkMode
                  ? "from-neutral-900/80 to-transparent"
                  : "from-amber-900/40 to-transparent",
              )}
            />
          </div>

          {/* Content */}
          <div className="p-3">
            <div className="flex items-center gap-2 mb-1">
              <i
                className={clsx(
                  "fa-solid fa-wand-magic-sparkles text-base",
                  isDarkMode ? "text-amber-400" : "text-amber-600",
                )}
              />
              <span
                className={clsx(
                  "font-semibold text-base",
                  isDarkMode ? "text-amber-300" : "text-amber-800",
                )}
              >
                Load Sample Design
              </span>
            </div>
            <p
              className={clsx(
                "text-base",
                isDarkMode ? "text-neutral-400" : "text-neutral-600",
              )}
            >
              Load a tropical food forest example with Durian, Cacao, Banana &
              more.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
