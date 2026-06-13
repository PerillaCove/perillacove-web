import { useCallback, useRef, useState, useEffect } from "react";
import clsx from "clsx";

interface RangeSliderProps {
  min: number;
  max: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  label?: string;
  unit?: string;
  step?: number;
  disabled?: boolean;
  className?: string;
}

export default function RangeSlider({
  min,
  max,
  value,
  onChange,
  label,
  unit = "",
  step = 1,
  disabled = false,
  className = "",
}: RangeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<"min" | "max" | null>(null);

  const getPercentage = useCallback(
    (val: number) => ((val - min) / (max - min)) * 100,
    [min, max],
  );

  const getValueFromPosition = useCallback(
    (clientX: number) => {
      if (!trackRef.current) return min;
      const rect = trackRef.current.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      const rawValue = min + percentage * (max - min);
      // Round to step
      return Math.round(rawValue / step) * step;
    },
    [min, max, step],
  );

  const handleMouseDown = useCallback(
    (thumb: "min" | "max") => (e: React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();
      setDragging(thumb);
    },
    [disabled],
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!dragging || disabled) return;

      const newValue = getValueFromPosition(e.clientX);
      const [currentMin, currentMax] = value;

      if (dragging === "min") {
        const clampedMin = Math.min(newValue, currentMax - step);
        onChange([Math.max(min, clampedMin), currentMax]);
      } else {
        const clampedMax = Math.max(newValue, currentMin + step);
        onChange([currentMin, Math.min(max, clampedMax)]);
      }
    },
    [dragging, disabled, getValueFromPosition, value, onChange, min, max, step],
  );

  const handleMouseUp = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }
  }, [dragging, handleMouseMove, handleMouseUp]);

  // Touch support
  const handleTouchStart = useCallback(
    (thumb: "min" | "max") => (e: React.TouchEvent) => {
      if (disabled) return;
      e.preventDefault();
      setDragging(thumb);
    },
    [disabled],
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!dragging || disabled) return;

      const touch = e.touches[0];
      const newValue = getValueFromPosition(touch.clientX);
      const [currentMin, currentMax] = value;

      if (dragging === "min") {
        const clampedMin = Math.min(newValue, currentMax - step);
        onChange([Math.max(min, clampedMin), currentMax]);
      } else {
        const clampedMax = Math.max(newValue, currentMin + step);
        onChange([currentMin, Math.min(max, clampedMax)]);
      }
    },
    [dragging, disabled, getValueFromPosition, value, onChange, min, max, step],
  );

  const handleTouchEnd = useCallback(() => {
    setDragging(null);
  }, []);

  useEffect(() => {
    if (dragging) {
      window.addEventListener("touchmove", handleTouchMove);
      window.addEventListener("touchend", handleTouchEnd);
      return () => {
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [dragging, handleTouchMove, handleTouchEnd]);

  const minPercent = getPercentage(value[0]);
  const maxPercent = getPercentage(value[1]);

  const containerClasses = clsx(
    "flex flex-col w-full",
    disabled && "opacity-50 cursor-not-allowed",
    className,
  );

  const thumbClasses = clsx(
    "absolute w-4 h-4 bg-white dark:bg-neutral-200 border-2 border-neutral-400 dark:border-neutral-500 rounded-full -translate-x-1/2 -translate-y-1/2 top-1/2 cursor-grab active:cursor-grabbing shadow-sm",
    "hover:border-neutral-500 dark:hover:border-neutral-400 transition-colors",
    disabled && "cursor-not-allowed",
  );

  return (
    <div className={containerClasses}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-neutral-600 dark:text-neutral-300">
            {label}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            {value[0]}
            {unit} – {value[1]}
            {unit}
          </span>
        </div>
      )}
      <div
        ref={trackRef}
        className="relative h-2 bg-neutral-200 dark:bg-neutral-600 rounded-full cursor-pointer"
      >
        {/* Active range highlight */}
        <div
          className="absolute h-full bg-green-400 dark:bg-green-500 rounded-full"
          style={{
            left: `${minPercent}%`,
            width: `${maxPercent - minPercent}%`,
          }}
        />
        {/* Min thumb */}
        <div
          className={thumbClasses}
          style={{ left: `${minPercent}%` }}
          onMouseDown={handleMouseDown("min")}
          onTouchStart={handleTouchStart("min")}
          role="slider"
          aria-label="Minimum value"
          aria-valuemin={min}
          aria-valuemax={value[1]}
          aria-valuenow={value[0]}
          tabIndex={disabled ? -1 : 0}
        />
        {/* Max thumb */}
        <div
          className={thumbClasses}
          style={{ left: `${maxPercent}%` }}
          onMouseDown={handleMouseDown("max")}
          onTouchStart={handleTouchStart("max")}
          role="slider"
          aria-label="Maximum value"
          aria-valuemin={value[0]}
          aria-valuemax={max}
          aria-valuenow={value[1]}
          tabIndex={disabled ? -1 : 0}
        />
      </div>
      {/* Min/Max labels */}
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
          {min}
          {unit}
        </span>
        <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
          {max}
          {unit}
        </span>
      </div>
    </div>
  );
}
