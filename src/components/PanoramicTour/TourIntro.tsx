import {
  PT_HOTSPOT_DOT_BACKGROUND,
  PT_HOTSPOT_INTRO_DOT_SHADOW,
  PT_PRIMARY_BUTTON,
} from "./uiClasses";
import type { PanoramaTourSource } from "./types";

interface TourIntroProps {
  title: string;
  subtitle: string;
  onStart: () => void;
  sourceBadge?: PanoramaTourSource | null;
}

export default function TourIntro({
  title,
  subtitle,
  onStart,
  sourceBadge,
}: TourIntroProps) {
  const hasSourceLink = Boolean(sourceBadge?.url);
  const sourceBadgeLabel = sourceBadge?.label;
  const badgeTextClass = "uppercase tracking-[0.2em]";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[8600] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="false"
    >
      <div className="pointer-events-auto w-[min(680px,96vw)] rounded-2xl border border-emerald-100/30 bg-[linear-gradient(135deg,rgba(8,18,14,0.46),rgba(5,12,10,0.32))] p-[1.1rem] shadow-[0_10px_28px_rgba(0,0,0,0.4),inset_0_0_0_1px_rgba(148,233,190,0.14)] backdrop-blur-xl">
        <div className="flex flex-wrap items-center gap-3 md:gap-4">
          <h1 className="text-xl leading-tight text-slate-100 lg:text-4xl">
            {title}
          </h1>
          {sourceBadge ? (
            hasSourceLink ? (
              <a
                href={sourceBadge.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-1.5 border-l border-emerald-200/35 pl-2.5 lg:text-base text-xs font-semibold text-emerald-200/90 transition-colors hover:text-emerald-100 ${badgeTextClass}`}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300/90"
                  aria-hidden="true"
                />
                {sourceBadgeLabel}
              </a>
            ) : (
              <span
                className={`inline-flex items-center gap-1.5 border-l border-emerald-200/35 pl-2.5 lg:text-base text-xs font-semibold text-emerald-200/90 ${badgeTextClass}`}
              >
                <span
                  className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300/90"
                  aria-hidden="true"
                />
                {sourceBadgeLabel}
              </span>
            )
          ) : null}
        </div>
        <p className="mt-1.5 lg:text-lg text-[rgba(236,253,245,0.87)]">
          {subtitle}
        </p>
        <p className="mt-4 max-w-[56ch] text-base leading-[1.45] text-slate-200/85 md:mt-5">
          Click the{" "}
          <span className="inline-flex items-center gap-1.5 font-semibold text-orange-300">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{
                background: PT_HOTSPOT_DOT_BACKGROUND,
                boxShadow: PT_HOTSPOT_INTRO_DOT_SHADOW,
              }}
              aria-hidden="true"
            />
            orange circles
          </span>{" "}
          to discover each species and how it participates in the system.
        </p>
        <button
          type="button"
          className={`${PT_PRIMARY_BUTTON} mt-6 md:mt-7`}
          style={{
            background:
              "linear-gradient(135deg, rgba(20, 28, 26, 0.95) 0%, rgba(8, 14, 12, 0.98) 100%)",
            borderColor: "rgba(148, 163, 184, 0.42)",
            color: "#e2e8f0",
            boxShadow:
              "0 10px 24px rgba(0, 0, 0, 0.42), inset 0 0 0 1px rgba(148, 163, 184, 0.12)",
          }}
          onClick={onStart}
        >
          Begin
        </button>
      </div>
    </div>
  );
}
