import KeyboardNavigationGuide from "./KeyboardNavigationGuide";
interface KeyboardControlsProps {
  additionalClasses?: string;
  showClearFilters?: boolean;
  fadeEnterKey?: boolean;
}

const IngredientsKeyboardControls = ({
  additionalClasses,
  showClearFilters,
  fadeEnterKey,
}: KeyboardControlsProps) => {
  return (
    <div className={`text-sm mb-3 items-center gap-3 ${additionalClasses}`}>
      <KeyboardNavigationGuide />
      <div className="h-6 w-px bg-neutral-400 dark:bg-neutral-400"></div>
      <div
        className={`flex items-center gap-2 ${fadeEnterKey ? "opacity-40" : ""} transition-all duration-300`}
      >
        <span className="font-medium">Choose:</span>
        <kbd className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-600">
          Enter
        </kbd>
      </div>
      {showClearFilters && (
        <>
          <div className="h-6 w-px bg-neutral-400 dark:bg-neutral-400"></div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Clear filters:</span>
            <kbd className="px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-600">
              Esc
            </kbd>
          </div>
        </>
      )}
    </div>
  );
};

export default IngredientsKeyboardControls;
