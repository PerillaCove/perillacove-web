import clsx from "clsx";
import { useCallback, useState } from "react";

interface DropdownItemProps {
  isDarkMode: boolean;
  option: string;
  isReadonly: boolean;
  unchangeableOptionLabels: string[];
  checkedOptions: string[];
  optionToColorClassesMap: Record<string, string>;
  handleCheckboxChange: (option: string) => void;
  onCheckboxChange: (option: string) => void;
  onlyOne: boolean;
}

export const DropdownItem = ({
  isDarkMode,
  option,
  isReadonly,
  unchangeableOptionLabels,
  checkedOptions,
  optionToColorClassesMap,
  handleCheckboxChange,
  onCheckboxChange,
  onlyOne,
}: DropdownItemProps) => {
  const isChecked = checkedOptions.includes(option);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const canChangeOption = useCallback(
    (label: string) => {
      if (unchangeableOptionLabels.includes(label) || isReadonly) {
        return false;
      }
      return true;
    },
    [isReadonly, unchangeableOptionLabels],
  );
  const getCursorStyle = useCallback(
    (label: string) => {
      return canChangeOption(label) ? "cursor-pointer" : "cursor-not-allowed";
    },
    [canChangeOption],
  );
  const containerClasses = clsx({
    "flex items-center capitalize": true,
    [getCursorStyle(option)]: true,
    "p-2": !isReadonly,
    "pr-2 py-2": isReadonly,
    "bg-slate-100": (isHovered || isChecked) && !isDarkMode,
    "bg-neutral-700/80": (isHovered || isChecked) && isDarkMode,
    "opacity-40": onlyOne && !isChecked && checkedOptions.length > 0,
  });

  const boxClasses = clsx({
    "mr-2 w-[1.375rem] h-[1.375rem] flex flex-col justify-center items-center border": true,
    "bg-neutral-50 border-neutral-400": !isDarkMode,
    "bg-neutral-600 border-neutral-500": isDarkMode,
    "rounded-full": onlyOne,
    "rounded-md": !onlyOne,
  });
  return (
    <div
      className={containerClasses}
      onClick={() => onCheckboxChange(option)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isReadonly && (
        <i
          className={`mr-4 fa-solid ${
            isChecked ? "fa-check" : "fa-xmark text-red-500"
          } fa-lg`}
        />
      )}
      {!isReadonly && (
        <div
          onClick={() => handleCheckboxChange(option)}
          className={boxClasses}
        >
          {!onlyOne && (
            <i
              className={`fa-solid ${isChecked ? "fa-check fa-lg" : ""} fa-lg ${isDarkMode ? "text-neutral-100" : "text-neutral-900"}`}
            />
          )}
          {onlyOne && isChecked && (
            <div
              className={`w-3 h-3 rounded-full ${isDarkMode ? "bg-white" : "bg-black"}`}
            />
          )}
        </div>
      )}
      <span
        className={`lowercase ${optionToColorClassesMap[option] ? `${optionToColorClassesMap[option]} border-[0.5px] border-neutral-300 dark:border-0` : isDarkMode ? "bg-gradient-to-r from-neutral-700 to-neutral-800 text-neutral-100 border border-neutral-500" : "bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-900 border border-neutral-300"} px-2 font-medium rounded-md flex items-center gap-1`}
      >
        {option}
        {option === "vegetable" && (
          <a
            href="https://perillacove.com/writing/vegetables-arent-real-nature/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-800 dark:hover:text-cyan-300"
            title="Why vegetables aren't real"
          >
            <i className="fa-solid fa-arrow-up-right-from-square fa-xs" />
          </a>
        )}
      </span>
    </div>
  );
};
