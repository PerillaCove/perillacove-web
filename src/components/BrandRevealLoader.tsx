import { useCircadianTheme } from "../util/hooks/general";

interface BrandRevealLoaderProps {
  wordmark?: string;
  tagline?: string;
}

export default function BrandRevealLoader({
  wordmark = "PERILLACOVE",
  tagline = "an integrated system",
}: BrandRevealLoaderProps) {
  const { isDarkMode } = useCircadianTheme();

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="relative flex h-screen w-screen items-center justify-center overflow-hidden bg-slate-50 dark:bg-[#0a0f1a]">
        <div className="pointer-events-none absolute inset-0">
          <div className="brand-glow" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-50/25 to-slate-100/70 dark:via-emerald-950/10 dark:to-slate-950/40" />
        </div>

        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <h1 className="brand-title select-none whitespace-nowrap text-4xl text-slate-800 dark:text-slate-100 sm:text-6xl">
            {wordmark}
          </h1>

          <p className="brand-tagline mt-3 text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            {tagline}
          </p>

          <div className="mt-5 flex items-center justify-center" role="status">
            <span className="sr-only">Loading</span>
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-emerald-200 border-t-emerald-600 dark:border-emerald-950/70 dark:border-t-emerald-300" />
          </div>
        </div>
      </div>
    </div>
  );
}
