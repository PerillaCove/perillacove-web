import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import type { PhaseNarrative } from "./util";

export interface NarrativeSectionProps {
  narratives: PhaseNarrative[];
  isDarkMode: boolean;
  /** Optional class name to override default container styles */
  className?: string;
}

export function NarrativeSection({
  narratives,
  isDarkMode,
  className,
}: NarrativeSectionProps) {
  // Only show if there's actual narrative content
  const hasContent = narratives.some((n) => n.sentences.length > 0);
  if (!hasContent) return null;

  return (
    <div
      className={
        className ||
        clsx(
          "mt-6 rounded-xl p-4 lg:p-5 border",
          isDarkMode
            ? "bg-neutral-800/30 border-neutral-700"
            : "bg-gradient-to-br from-emerald-50/50 to-white border-neutral-200",
        )
      }
    >
      <div className="flex items-center gap-2 mb-3">
        <i
          className={clsx(
            "fa-solid fa-feather text-base",
            isDarkMode ? "text-emerald-400" : "text-emerald-600",
          )}
        />
        <span
          className={clsx(
            "text-lg font-medium",
            isDarkMode ? "text-neutral-200" : "text-neutral-700",
          )}
        >
          Integration
        </span>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {narratives.map((narrative, idx) => (
            <motion.div
              key={`${narrative.phase}-${narrative.sentences.join("")}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3, delay: idx * 0.1 }}
            >
              {narrative.sentences.length > 0 && (
                <div className="flex gap-3">
                  {/* Phase indicator */}
                  <div
                    className={clsx(
                      "flex-shrink-0 w-1 rounded-full",
                      narrative.phase === "establishment" &&
                        "bg-gradient-to-b from-lime-400 to-lime-500",
                      narrative.phase === "transition" &&
                        "bg-gradient-to-b from-amber-400 to-amber-500",
                      narrative.phase === "maturity" &&
                        "bg-gradient-to-b from-emerald-500 to-emerald-600",
                    )}
                  />

                  {/* Narrative content */}
                  <div className="flex-1">
                    <span
                      className={clsx(
                        "text-xs font-semibold uppercase tracking-wide",
                        narrative.phase === "establishment" &&
                          (isDarkMode ? "text-lime-400" : "text-lime-600"),
                        narrative.phase === "transition" &&
                          (isDarkMode ? "text-amber-400" : "text-amber-600"),
                        narrative.phase === "maturity" &&
                          (isDarkMode
                            ? "text-emerald-400"
                            : "text-emerald-600"),
                      )}
                    >
                      {narrative.phaseLabel}
                    </span>
                    <p
                      className={clsx(
                        "mt-1 text-base leading-relaxed",
                        isDarkMode ? "text-neutral-300" : "text-neutral-600",
                      )}
                    >
                      {narrative.sentences.join(" ")}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
