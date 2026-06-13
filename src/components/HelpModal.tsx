interface HelpModalProps {
  onClose: () => void;
}

export default function HelpModal({ onClose }: HelpModalProps) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-neutral-200/70 bg-gradient-to-br from-white via-emerald-50 to-cyan-50 text-neutral-900 dark:border-neutral-700/80 dark:from-neutral-900 dark:via-neutral-900 dark:to-slate-900 dark:text-neutral-100">
      <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-300/30 blur-3xl dark:bg-emerald-500/20" />
      <div className="absolute -bottom-20 -left-20 h-52 w-52 rounded-full bg-cyan-300/30 blur-3xl dark:bg-cyan-500/20" />

      <div className="relative flex items-center justify-between border-b border-neutral-200/70 px-5 py-4 dark:border-neutral-700/80">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200">
            <i className="fa-solid fa-seedling text-base" />
          </div>
          <div>
            <h2 className="text-xl font-semibold leading-tight">Contact</h2>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-full p-2 text-neutral-500 transition-colors hover:bg-black/5 hover:text-neutral-800 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"
          aria-label="Close help modal"
        >
          <i className="fa-solid fa-xmark text-xl" />
        </button>
      </div>

      <div className="relative space-y-4 px-5 py-5">
        <p className="text-lg leading-relaxed text-neutral-700 dark:text-neutral-200">
          For any questions, send me an email at{" "}
          <a
            href="mailto:nikhil38@gmail.com"
            className="font-semibold text-emerald-700 underline decoration-emerald-500/60 underline-offset-2 transition-colors hover:text-emerald-800 dark:text-emerald-300 dark:hover:text-emerald-200"
          >
            nikhil38@gmail.com
          </a>
          .
        </p>

        <div className="rounded-xl border border-emerald-200/80 bg-white/70 p-4 shadow-sm backdrop-blur-sm dark:border-emerald-500/30 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                Direct Contact
              </p>
              <p className="text-lg font-medium">nikhil38@gmail.com</p>
            </div>
            <a
              href="mailto:nikhil38@gmail.com"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
            >
              <i className="fa-solid fa-paper-plane text-xs" />
              Send Email
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
