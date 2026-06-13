import { ReactNode } from "react";
import clsx from "clsx";

export type TooltipPosition = "top" | "bottom" | "left" | "right";

interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  position?: TooltipPosition;
  show?: boolean;
  widthClasses?: string;
  alwaysShow?: boolean;
}

export default function Tooltip({
  children,
  content,
  position = "top",
  show = true,
  widthClasses = "w-fit",
  alwaysShow = false,
}: TooltipProps) {
  const tooltipPositionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  const tooltipClasses = clsx(
    "absolute whitespace-nowrap",
    alwaysShow
      ? "opacity-100"
      : "opacity-0 group-hover:opacity-100 transition-opacity duration-600",
    "pointer-events-none",
    tooltipPositionClasses[position],
    {
      hidden: !show && !alwaysShow,
    },
  );

  const arrowPositionClasses = {
    top: "left-1/2 -translate-x-1/2 top-full -mt-1",
    bottom: "left-1/2 -translate-x-1/2 bottom-full -mb-1",
    left: "top-1/2 -translate-y-1/2 left-full -ml-1",
    right: "top-1/2 -translate-y-1/2 right-full -mr-1",
  };

  const arrowBorderClasses = {
    top: "border-t-neutral-800 dark:border-t-neutral-500",
    bottom: "border-b-neutral-800 dark:border-b-neutral-500",
    left: "border-l-neutral-800 dark:border-l-neutral-500",
    right: "border-r-neutral-800 dark:border-r-neutral-500",
  };

  return (
    <div className={clsx("relative group", widthClasses)}>
      {children}
      <div className={tooltipClasses}>
        <div className="bg-neutral-800 dark:bg-neutral-500 text-white px-2 py-1 rounded text-sm">
          {content}
        </div>
        {/* Triangle pointer */}
        <div className={clsx("absolute", arrowPositionClasses[position])}>
          <div
            className={clsx(
              "border-8 border-transparent",
              arrowBorderClasses[position],
            )}
          />
        </div>
      </div>
    </div>
  );
}
