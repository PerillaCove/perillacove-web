import clsx from "clsx";
import { useCircadianTheme } from "../../util/hooks/general";
import KeyboardShortcutTooltip from "../Tooltip/KeyboardShortcut";

interface Props {
  isFilterActive: boolean;
  clearFilters: () => void;
}

export default function FilterPanel({ isFilterActive, clearFilters }: Props) {
  const { isDarkMode } = useCircadianTheme();
  if (!isFilterActive) return null;

  return (
    <div className="flex items-center gap-2">
      <KeyboardShortcutTooltip shortcut="Esc" position="left" show>
        <div
          className={clsx(
            "px-2 rounded-lg border border-neutral-400 dark:border-neutral-400 flex items-center",
            "transition-all duration-300 ease-in-out",
            "hover:bg-neutral-300 dark:hover:bg-neutral-700",
            "opacity-100 animate-fade-in cursor-pointer",
          )}
          onClick={clearFilters}
        >
          <i
            className={`fa-solid fa-arrows-rotate cursor-pointer text-lg ${isDarkMode ? "text-cove-dark" : "text-cove"}`}
          />
        </div>
      </KeyboardShortcutTooltip>
    </div>
  );
}
