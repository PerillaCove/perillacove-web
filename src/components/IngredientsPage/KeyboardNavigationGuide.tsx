interface KeyboardNavigationGuideProps {
  showLeft?: boolean;
  showRight?: boolean;
  showUp?: boolean;
  showDown?: boolean;
  textClasses?: string;
  bgClasses?: string;
  additionalTitleClasses?: string;
}

const KeyboardNavigationGuide = ({
  showLeft = true,
  showRight = true,
  showUp = true,
  showDown = true,
  textClasses = "text-neutral-500 dark:text-neutral-300",
  bgClasses = "bg-neutral-200 dark:bg-neutral-600",
  additionalTitleClasses = "",
}: KeyboardNavigationGuideProps) => {
  const baseClasses = "px-2 py-0.5 rounded";
  return (
    <div className="flex items-center gap-2">
      <span className={`${additionalTitleClasses} font-medium`}>Navigate:</span>
      <div className="flex gap-1">
        {showLeft && (
          <kbd className={`${baseClasses} ${bgClasses} ${textClasses}`}>◀</kbd>
        )}
        {showRight && (
          <kbd className={`${baseClasses} ${bgClasses} ${textClasses}`}>▶</kbd>
        )}
        {showUp && (
          <kbd className={`${baseClasses} ${bgClasses} ${textClasses}`}>▲</kbd>
        )}
        {showDown && (
          <kbd className={`${baseClasses} ${bgClasses} ${textClasses}`}>▼</kbd>
        )}
      </div>
    </div>
  );
};

export default KeyboardNavigationGuide;
