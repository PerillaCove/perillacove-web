import {
  useCallback,
  useRef,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import clsx from "clsx";
import type { DurationOption } from "./util";
import { computePhasePositions } from "./util";

interface TimeCursorProps {
  /** Current year (can be fractional for smooth scrubbing) */
  year: number;
  /** Callback when year changes */
  onYearChange: (year: number) => void;
  /** Maximum year to show on the timeline (effective duration after override) */
  maxYear?: number;
  /** Whether dark mode is enabled */
  isDarkMode: boolean;
  /** Optional class name for the container */
  className?: string;
  /** Playback speed in timeline-years per real-time second */
  simulationSpeedYearsPerSecond?: number;
  /** Auto-start simulation when the component first mounts */
  autoStartSimulation?: boolean;
  /**
   * Callback when auto-play simulation state changes.
   * Used by parent to track if "Simulate" button is active.
   */
  onSimulatingChange?: (isSimulating: boolean) => void;
  /**
   * Callback when user starts/stops dragging the timeline slider.
   * Used by parent to track manual time scrubbing.
   *
   * FRUIT BEHAVIOR: Parent combines (isSimulating || isDragging) to determine
   * if fruits should fall (true) or hang static (false).
   */
  onDraggingChange?: (isDragging: boolean) => void;
  /**
   * Smart duration options based on ingredient lifecycles.
   * If provided, shows a dropdown to select viewing range.
   */
  durationOptions?: DurationOption[];
  /**
   * Currently selected duration (null = full timeline).
   * This value should match one of the durationOptions values.
   */
  selectedDuration?: number | null;
  /**
   * Callback when user selects a different duration.
   * Pass null to reset to full timeline.
   */
  onDurationChange?: (duration: number | null) => void;
  /**
   * Optional content rendered on the right side of the header row,
   * before the current year label (for fullscreen tab controls).
   */
  headerRightContent?: ReactNode;
  /** Compact mode hides year readouts and duration controls. */
  compactMode?: boolean;
}

/**
 * TimeCursor - A horizontal slider that controls the active year for
 * 3D visualization and chart animations.
 *
 * Includes a simulate button that smoothly animates time progression.
 */
export default function TimeCursor({
  year,
  onYearChange,
  maxYear = 20,
  isDarkMode,
  className,
  simulationSpeedYearsPerSecond = 0.25,
  autoStartSimulation = false,
  onSimulatingChange,
  onDraggingChange,
  durationOptions,
  selectedDuration,
  onDurationChange,
  headerRightContent,
  compactMode = false,
}: TimeCursorProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const autoStartAppliedRef = useRef(false);
  // Use a ref in RAF loop to avoid stale-year jumps when React re-renders.
  const yearRef = useRef(year);

  useEffect(() => {
    yearRef.current = year;
  }, [year]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // Compute phase positions based on current duration
  const phasePositions = computePhasePositions(maxYear);

  // Convert position to year
  const positionToYear = useCallback(
    (clientX: number): number => {
      if (!trackRef.current) return 0;
      const rect = trackRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      return percentage * maxYear;
    },
    [maxYear],
  );

  // Handle mouse/touch move
  const handleMove = useCallback(
    (clientX: number) => {
      if (!isDragging) return;
      const newYear = positionToYear(clientX);
      onYearChange(newYear);
    },
    [isDragging, positionToYear, onYearChange],
  );

  // Handle mouse down on track
  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      const newYear = positionToYear(e.clientX);
      onYearChange(newYear);
    },
    [positionToYear, onYearChange],
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    [],
  );

  // Global mouse/touch listeners for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };
    const handleEnd = () => setIsDragging(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleEnd);
    window.addEventListener("touchmove", handleTouchMove);
    window.addEventListener("touchend", handleEnd);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleEnd);
    };
  }, [isDragging, handleMove]);

  // Simulation animation loop
  useEffect(() => {
    if (!isSimulating) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = currentTime;
        animationRef.current = requestAnimationFrame(animate);
        return;
      }

      const deltaTime = currentTime - lastTimeRef.current;
      lastTimeRef.current = currentTime;

      const newYear =
        yearRef.current + (deltaTime / 1000) * simulationSpeedYearsPerSecond;

      if (newYear >= maxYear) {
        // Loop back to start or stop
        yearRef.current = 0;
        onYearChange(0);
        setIsSimulating(false);
      } else {
        yearRef.current = newYear;
        onYearChange(newYear);
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    lastTimeRef.current = 0;
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSimulating, maxYear, onYearChange, simulationSpeedYearsPerSecond]);

  // Stop simulation when user drags
  useEffect(() => {
    if (isDragging && isSimulating) {
      setIsSimulating(false);
    }
  }, [isDragging, isSimulating]);

  // Notify parent when simulation state changes
  useEffect(() => {
    onSimulatingChange?.(isSimulating);
  }, [isSimulating, onSimulatingChange]);

  // Start playback automatically once for immersive sessions.
  useEffect(() => {
    if (!autoStartSimulation || autoStartAppliedRef.current) return;
    if (year >= maxYear - 0.5) {
      onYearChange(0);
    }
    setIsSimulating(true);
    autoStartAppliedRef.current = true;
  }, [autoStartSimulation, year, maxYear, onYearChange]);

  // Notify parent when dragging state changes
  useEffect(() => {
    onDraggingChange?.(isDragging);
  }, [isDragging, onDraggingChange]);

  // Toggle simulation
  const handleSimulateToggle = useCallback(() => {
    if (!isSimulating && year >= maxYear - 0.5) {
      // If at end, reset to start before playing
      onYearChange(0);
    }
    setIsSimulating((prev) => !prev);
  }, [isSimulating, year, maxYear, onYearChange]);

  // Calculate thumb position as percentage
  const thumbPosition = (year / maxYear) * 100;

  // Generate tick marks for years
  const ticks = [];
  for (let i = 0; i <= maxYear; i += 5) {
    ticks.push(i);
  }

  return (
    <div className={clsx("w-full select-none", className)}>
      {/* Header with year display and simulate button */}
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {/* Simulate button */}
          <motion.button
            onClick={handleSimulateToggle}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-base font-medium",
              "transition-colors duration-200",
              isSimulating
                ? isDarkMode
                  ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30"
                  : "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : isDarkMode
                  ? "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                  : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
            )}
          >
            <i
              className={clsx(
                "fa-solid text-sm",
                isSimulating ? "fa-pause" : "fa-play",
              )}
            />
          </motion.button>
          {!compactMode ? (
            <span
              className={clsx(
                "text-base font-medium",
                isDarkMode ? "text-neutral-300" : "text-neutral-700",
              )}
            >
              Year
            </span>
          ) : null}
          {/* Duration selector dropdown */}
          {!compactMode &&
            durationOptions &&
            durationOptions.length > 1 &&
            onDurationChange && (
              <div ref={dropdownRef} className="hide-feature relative">
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={clsx(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-sm font-medium",
                    "transition-colors duration-200 border",
                    isDarkMode
                      ? "bg-neutral-700/50 border-neutral-600 text-neutral-300 hover:bg-neutral-700"
                      : "bg-neutral-100 border-neutral-200 text-neutral-600 hover:bg-neutral-200",
                  )}
                >
                  <i className="fa-solid fa-clock text-[10px]" />
                  <span>
                    {selectedDuration === null
                      ? durationOptions[durationOptions.length - 1].label
                      : (durationOptions.find(
                          (o) => o.value === selectedDuration,
                        )?.label ?? `${maxYear} yrs`)}
                  </span>
                  <i
                    className={clsx(
                      "fa-solid fa-chevron-down text-[8px] transition-transform",
                      isDropdownOpen && "rotate-180",
                    )}
                  />
                </button>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className={clsx(
                        "absolute top-full left-0 mt-1 py-1 rounded-lg shadow-lg border z-50 min-w-[120px]",
                        isDarkMode
                          ? "bg-neutral-800 border-neutral-700"
                          : "bg-white border-neutral-200",
                      )}
                    >
                      {durationOptions.map((option) => {
                        const isSelected =
                          selectedDuration === null
                            ? option ===
                              durationOptions[durationOptions.length - 1]
                            : option.value === selectedDuration;
                        const isFull =
                          option ===
                          durationOptions[durationOptions.length - 1];
                        return (
                          <button
                            key={option.value}
                            onClick={() => {
                              // null means "full timeline" (last option)
                              onDurationChange(isFull ? null : option.value);
                              setIsDropdownOpen(false);
                            }}
                            className={clsx(
                              "w-full px-3 py-1.5 text-left text-sm font-medium transition-colors",
                              "flex items-center gap-2",
                              isSelected
                                ? isDarkMode
                                  ? "bg-emerald-900/30 text-emerald-400"
                                  : "bg-emerald-50 text-emerald-700"
                                : isDarkMode
                                  ? "text-neutral-300 hover:bg-neutral-700"
                                  : "text-neutral-600 hover:bg-neutral-100",
                            )}
                          >
                            <span
                              className={clsx(
                                "w-3 h-3 rounded-full border-2 flex items-center justify-center",
                                isSelected
                                  ? "border-emerald-500"
                                  : isDarkMode
                                    ? "border-neutral-500"
                                    : "border-neutral-300",
                              )}
                            >
                              {isSelected && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              )}
                            </span>
                            {option.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
        </div>
        <div className="flex min-w-0 items-center gap-3">
          {!compactMode && headerRightContent && (
            <div className="max-w-[56vw] min-w-0 overflow-x-auto scrollbar-hide sm:max-w-none">
              {headerRightContent}
            </div>
          )}
          {!compactMode ? (
            <motion.span
              key={Math.round(year)}
              initial={{ opacity: 0.5, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={clsx(
                "text-lg font-bold tabular-nums",
                isDarkMode ? "text-emerald-400" : "text-emerald-600",
              )}
            >
              {Math.round(year)}
            </motion.span>
          ) : null}
        </div>
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        onClick={handleTrackClick}
        className={clsx(
          "relative h-2 rounded-full cursor-pointer",
          isDarkMode ? "bg-neutral-700" : "bg-neutral-200",
        )}
      >
        {/* Filled portion */}
        <div
          className={clsx(
            "absolute inset-y-0 left-0 rounded-full",
            "bg-gradient-to-r from-emerald-500 to-teal-500",
          )}
          style={{ width: `${thumbPosition}%` }}
        />

        {/* Thumb */}
        <motion.div
          onMouseDown={handleDragStart}
          onTouchStart={handleDragStart}
          animate={{
            left: `${thumbPosition}%`,
            scale: isDragging ? 1.2 : 1,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={clsx(
            "absolute top-1/2 -translate-y-1/2 -translate-x-1/2",
            "w-4 h-4 rounded-full cursor-grab active:cursor-grabbing",
            "border-2 shadow-lg",
            "bg-white border-emerald-500",
            isDragging && "ring-4 ring-emerald-500/30",
          )}
        />
      </div>

      {/* Tick marks */}
      <div className="relative mt-1.5 h-4">
        {ticks.map((tick) => {
          const position = (tick / maxYear) * 100;
          return (
            <div
              key={tick}
              className="absolute flex flex-col items-center -translate-x-1/2"
              style={{ left: `${position}%` }}
            >
              <div
                className={clsx(
                  "w-px h-1.5",
                  isDarkMode ? "bg-neutral-600" : "bg-neutral-300",
                )}
              />
              <span
                className={clsx(
                  "text-[10px] mt-0.5",
                  isDarkMode ? "text-neutral-500" : "text-neutral-400",
                )}
              >
                {tick}
              </span>
            </div>
          );
        })}
      </div>

      {/* Phase indicators - positioned dynamically based on duration */}
      <div className="relative mt-2 h-4">
        {/* Establishment label */}
        <span
          className={clsx(
            "absolute text-[12px] -translate-x-1/2",
            isDarkMode ? "text-neutral-500" : "text-neutral-400",
          )}
          style={{
            left: `${((phasePositions.establishment.start + phasePositions.establishment.end) / 2) * 100}%`,
          }}
        >
          Establishment
        </span>
        {/* Transition label */}
        <span
          className={clsx(
            "absolute text-[12px] -translate-x-1/2",
            isDarkMode ? "text-neutral-500" : "text-neutral-400",
          )}
          style={{
            left: `${((phasePositions.transition.start + phasePositions.transition.end) / 2) * 100}%`,
          }}
        >
          Transition
        </span>
        {/* Maturity label */}
        <span
          className={clsx(
            "absolute text-[12px] -translate-x-1/2",
            isDarkMode ? "text-neutral-500" : "text-neutral-400",
          )}
          style={{
            left: `${((phasePositions.maturity.start + phasePositions.maturity.end) / 2) * 100}%`,
          }}
        >
          Maturity
        </span>
      </div>
    </div>
  );
}
