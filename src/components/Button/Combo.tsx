import { useNavigate } from "react-router-dom";
import { useCallback, useEffect } from "react";
import KeyboardShortcutTooltip from "../Tooltip/KeyboardShortcut";
import clsx from "clsx";
import { TooltipPosition } from "../Tooltip";

interface Props {
  ingredientId?: string;
  additionalClasses?: string;
  canEnterToClick?: boolean;
  keyboardShortcutWidthClasses?: string;
  pxClasses?: string;
  keyboardShortcutPosition?: TooltipPosition;
  customKeyboardShortcutCondition?: (e: KeyboardEvent) => boolean;
  customKeyboardShortcut?: string;
  styleKeyboardShortcutAsNormalText?: boolean;
  customText?: string;
  onCustomClick?: () => void;
}

const ComboButton = ({
  ingredientId,
  additionalClasses,
  canEnterToClick = false,
  keyboardShortcutWidthClasses,
  pxClasses = "px-4",
  keyboardShortcutPosition,
  customKeyboardShortcutCondition,
  styleKeyboardShortcutAsNormalText,
  customKeyboardShortcut,
  customText,
  onCustomClick,
}: Props) => {
  const navigate = useNavigate();
  const onClick = useCallback(() => {
    if (onCustomClick) {
      onCustomClick();
    } else if (!ingredientId) {
      navigate("/food-forest");
    } else {
      navigate(`/food-forest/?ingredients=${ingredientId}`);
    }
  }, [ingredientId, navigate, onCustomClick]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!canEnterToClick) {
        return;
      }
      if (customKeyboardShortcutCondition?.(e)) {
        onClick();
      } else if (e.key === "Enter" && !customKeyboardShortcut) {
        onClick();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    canEnterToClick,
    onClick,
    customKeyboardShortcutCondition,
    customKeyboardShortcut,
  ]);

  const containerClasses = clsx(
    "font-semibold py-2 rounded-lg transition-all duration-300 hover:scale-[102%] lg:text-base text-sm",
    additionalClasses,
    pxClasses,
    "flex items-center justify-center gap-2",
    {
      "bg-combo border-combo text-white": true,
      // "bg-gradient-to-r from-cyan-100 to-amber-100 text-black border-[0.5px] border-neutral-500": !isDarkMode,
    },
  );

  return (
    <KeyboardShortcutTooltip
      shortcut={customKeyboardShortcut || "Enter"}
      show={canEnterToClick}
      widthClasses={keyboardShortcutWidthClasses}
      position={keyboardShortcutPosition}
      styleAsNormalText={styleKeyboardShortcutAsNormalText}
    >
      <button onClick={onClick} className={containerClasses}>
        <i className="fa-regular fa-circles-overlap" />
        <span>{customText || "Add to Cove"}</span>
      </button>
    </KeyboardShortcutTooltip>
  );
};

export default ComboButton;
