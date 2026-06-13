import clsx from "clsx";
import LazyImage from "../LazyImage";
import type { Ingredient } from "./types";

interface Props {
  // Kept intentionally lightweight so Earth narrative chips can reuse this
  // without constructing full Ingredient records.
  ingredient: Pick<Ingredient, "id" | "imgPath"> | null;
  width?: number;
  height?: number;
  placeholderWidth?: number;
  placeholderHeight?: number;
  onClick?: () => void;
}

export default function IngredientImg({
  ingredient,
  width = 30,
  height = 30,
  placeholderWidth,
  placeholderHeight,
  onClick,
}: Props) {
  if (!ingredient) return null;
  const pWidth = placeholderWidth || width;
  const pHeight = placeholderHeight || height;

  // Slightly upscale SVGs so they match raster assets visually in chips.
  const isSvg = ingredient.imgPath?.toLowerCase().endsWith(".svg");
  const finalWidth = isSvg ? width * 1.15 : width;
  const finalHeight = isSvg ? height * 1.15 : height;

  const containerClasses = clsx({
    "bg-light-gradient border border-stone-400 rounded-full": true,
    "cursor-pointer hover:scale-105 transition-all duration-300": !!onClick,
  });

  if (!ingredient.imgPath)
    return (
      <div
        className={containerClasses}
        onClick={onClick}
        style={{ width: pWidth, height: pHeight }}
      >
        <div className="w-full h-full flex flex-col items-center justify-center text-black font-medium">
          {ingredient.id[0].toUpperCase()}
        </div>
      </div>
    );
  return (
    <LazyImage
      src={ingredient.imgPath}
      width={finalWidth}
      height={finalHeight}
      alt={`Image of ${ingredient.id}`}
      onClick={onClick}
      className={
        onClick
          ? "cursor-pointer hover:scale-110 transition-all duration-300"
          : ""
      }
    />
  );
}
