import { useEffect, useState } from "react";
import { formatIngredientIdForDisplay } from "../../../util/functions";
import {
  useCircadianTheme,
  useIsWidescreen,
} from "../../../util/hooks/general";
import IngredientImg from "../Image";
import { Ingredient } from "../types";
import clsx from "clsx";
import {
  INGREDIENT_CARD_HEIGHT_MOBILE,
  INGREDIENT_CARD_HEIGHT_WIDESCREEN,
  INGREDIENT_CARD_WIDTH,
} from "..";

interface Props {
  ingredient: Ingredient;
  onClick?: () => void;
  additionalClasses?: string;
  customBgClasses?: string;
  borderClasses?: string;
  condense?: boolean;
  focused?: boolean;
  "data-index"?: number;
  onHover?: (ingredientId: string) => void;
  onHoverOut?: () => void;
  hasCombos?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  showPaired?: boolean;
  enforceDarkMode?: boolean;
}
export default function IngredientCard({
  ingredient,
  onClick,
  additionalClasses = "",
  customBgClasses = "",
  borderClasses = "border border-neutral-300 dark:border-neutral-500",
  condense = false,
  focused = false,
  "data-index": dataIndex,
  onHover,
  onHoverOut,
  hasCombos = false,
  isSelectable = true,
  isSelected = false,
  showPaired,
  enforceDarkMode = false,
  ...props
}: Props) {
  const { isDarkMode: systemDarkMode } = useCircadianTheme();
  const isDarkMode = enforceDarkMode || systemDarkMode;
  const [isHovered, setIsHovered] = useState(focused);
  const isWidescreen = useIsWidescreen();
  const containerClasses = clsx(
    "transition-all duration-300",
    "relative flex flex-col items-center justify-center rounded-lg p-3",
    additionalClasses,
    borderClasses,
    {
      "bg-dark-gradient": isDarkMode && !customBgClasses && !isHovered,
      "bg-gradient-to-t from-white from-70% to-zinc-100 to-100%":
        !isDarkMode && !customBgClasses && !isHovered,
      "bg-amber-50": isHovered && !!onClick && !isDarkMode,
      "ring-2 ring-inset dark:ring-amber-500 ring-cyan-500":
        (isHovered && !!onClick) || isSelected,
      "cursor-pointer": !!onClick,
      [`w-[${INGREDIENT_CARD_WIDTH}px]`]: !condense && isWidescreen,
      "w-full": !condense && !isWidescreen,
      [`lg:h-[${INGREDIENT_CARD_HEIGHT_WIDESCREEN}px] h-[${INGREDIENT_CARD_HEIGHT_MOBILE}px]`]:
        !condense,
      "h-24 w-24": condense,
    },
  );

  useEffect(() => {
    setIsHovered(focused);
  }, [focused]);

  const textClasses = clsx("text-center text-base", "capitalize", {
    "text-neutral-100": isDarkMode,
    "text-neutral-900": !isDarkMode,
    "w-[70px]": condense,
    "overflow-hidden text-ellipsis whitespace-nowrap": condense,
  });

  const handleMouseEnter = () => {
    setIsHovered(true);
    onHover?.(ingredient.id);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    onHoverOut?.();
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      className={containerClasses}
      data-index={dataIndex}
      {...props}
    >
      <IngredientImg
        ingredient={ingredient}
        width={50}
        height={50}
        placeholderHeight={40}
        placeholderWidth={40}
      />
      <div className="flex items-center mt-4">
        <div className={textClasses}>
          {formatIngredientIdForDisplay(ingredient.id)}
        </div>
      </div>
      {!!ingredient.link && false && (
        <div
          onClick={onClick}
          className="absolute -top-2 -right-2 flex hover:scale-110 flex-col bg-neutral-300 border border-neutral-400 items-center justify-center cursor-pointer h-4 w-4 rounded-full"
        >
          <i className="fa-solid fa-question fa-xs text-neutral-500" />
        </div>
      )}
      {((hasCombos && !isSelectable) || showPaired) && (
        <div className="absolute -top-3 -right-2.5 text-xl">
          <i
            className={`fa-regular fa-circles-overlap ${isDarkMode ? "text-cove-dark" : "text-cove"}`}
          />
        </div>
      )}
    </div>
  );
}
