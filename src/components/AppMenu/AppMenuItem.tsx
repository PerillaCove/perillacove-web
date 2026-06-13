import clsx from "clsx";
import { FC, ReactNode, useCallback, useState } from "react";
import { useCircadianTheme } from "../../util/hooks/general";

interface AppMenuItemProps {
  icon: string | ReactNode;
  text: string;
  action: () => void;
  isSelected?: boolean;
  keyboardNavigationActive?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

const AppMenuItem: FC<AppMenuItemProps> = ({
  icon,
  text,
  action,
  isSelected,
  keyboardNavigationActive,
  onMouseEnter,
  onMouseLeave,
}) => {
  const { isDarkMode } = useCircadianTheme();
  const [isHovered, setIsHovered] = useState(false);
  const getMenuButtonClasses = useCallback(
    (isSelected?: boolean) =>
      clsx(
        "cursor-pointer transition-all flex items-center",
        "gap-5 px-3 py-2 w-full mb-3 lg:gap-4 lg:px-1",
        "lg:text-base text-sm",
        {
          "ring-1 dark:ring-amber-500 ring-cyan-500 rounded-lg":
            (isSelected && keyboardNavigationActive) || isHovered,
        },
      ),
    [keyboardNavigationActive, isHovered],
  );

  return (
    <div
      className={getMenuButtonClasses(isSelected)}
      onClick={action}
      onMouseEnter={() => {
        setIsHovered(true);
        onMouseEnter?.();
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        onMouseLeave?.();
      }}
    >
      <span className="inline-flex h-4 w-4 items-center justify-center">
        {typeof icon === "string" ? (
          <i className={icon} aria-hidden="true" />
        ) : (
          icon
        )}
      </span>
      <span
        className={`whitespace-nowrap ${
          text === "Designs"
            ? isDarkMode
              ? "text-cove-dark font-semibold"
              : "text-cove font-semibold"
            : ""
        }`}
      >
        {text}
      </span>
    </div>
  );
};

export default AppMenuItem;
