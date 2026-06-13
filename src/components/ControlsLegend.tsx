import { useState } from "react";
import clsx from "clsx";

export interface ControlsLegendHint {
  iconClassName: string;
  label: string;
}

export interface ControlsLegendAction {
  label: string;
  onClick: () => void;
  ariaLabel?: string;
  iconClassName?: string;
  disabled?: boolean;
}

interface ControlsLegendProps {
  className?: string;
  isDarkMode?: boolean;
  title?: string;
  desktopHints: ControlsLegendHint[];
  mobileHints?: ControlsLegendHint[];
  action?: ControlsLegendAction | null;
  defaultExpanded?: boolean;
}

export default function ControlsLegend({
  className,
  isDarkMode = true,
  title = "Controls",
  desktopHints,
  mobileHints,
  action = null,
  defaultExpanded,
}: ControlsLegendProps) {
  const [expanded, setExpanded] = useState(
    () =>
      defaultExpanded ??
      (typeof window !== "undefined" && window.innerWidth >= 768),
  );
  const resolvedMobileHints = mobileHints ?? desktopHints;

  return (
    <div
      className={clsx(
        "rounded-xl text-sm overflow-hidden",
        "backdrop-blur-md shadow-lg",
        isDarkMode
          ? "bg-neutral-800/90 text-neutral-300"
          : "bg-white/90 text-neutral-600",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((previous) => !previous)}
        className={clsx(
          "flex w-full items-center justify-between gap-3 px-3 py-2",
          "transition-colors duration-200",
          isDarkMode ? "hover:bg-neutral-700/50" : "hover:bg-neutral-100/50",
        )}
      >
        <span className="flex items-center gap-2 font-medium">
          <i className="fa-solid fa-compass text-[10px] opacity-50" />
          {title}
        </span>
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={clsx(
            "opacity-40 transition-transform duration-300",
            expanded && "rotate-180",
          )}
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <div className={`collapse-grid ${expanded ? "collapse-grid-open" : ""}`}>
        <div className="overflow-hidden">
          <div className="px-3 pb-2.5 space-y-1">
            <div className="hidden md:block space-y-1">
              {desktopHints.map((hint) => (
                <div
                  key={`desktop-${hint.iconClassName}-${hint.label}`}
                  className="flex items-center gap-2"
                >
                  <i
                    className={`${hint.iconClassName} text-[10px] opacity-50`}
                  />
                  <span>{hint.label}</span>
                </div>
              ))}
            </div>
            <div className="block md:hidden space-y-1">
              {resolvedMobileHints.map((hint) => (
                <div
                  key={`mobile-${hint.iconClassName}-${hint.label}`}
                  className="flex items-center gap-2"
                >
                  <i
                    className={`${hint.iconClassName} text-[10px] opacity-50`}
                  />
                  <span>{hint.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      {action ? (
        <div
          className={clsx(
            "border-t px-3 pb-2.5 pt-2",
            isDarkMode ? "border-white/10" : "border-neutral-300/50",
          )}
        >
          <button
            type="button"
            onClick={action.onClick}
            aria-label={action.ariaLabel ?? action.label}
            disabled={action.disabled}
            className={clsx(
              "flex w-full items-center justify-center gap-2 rounded-md border px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.15em] transition-colors",
              isDarkMode
                ? "border-emerald-200/45 bg-emerald-500/20 text-emerald-100 hover:bg-emerald-500/30 hover:text-white disabled:border-emerald-100/15 disabled:bg-emerald-200/5 disabled:text-emerald-100/45"
                : "border-emerald-600/40 bg-emerald-500/12 text-emerald-800 hover:bg-emerald-500/22 hover:text-emerald-900 disabled:border-emerald-700/15 disabled:bg-emerald-700/5 disabled:text-emerald-900/35",
            )}
          >
            <i
              className={action.iconClassName ?? "fa-solid fa-play text-[10px]"}
              aria-hidden="true"
            />
            <span>{action.label}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
