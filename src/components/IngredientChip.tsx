import type { CSSProperties, ReactNode } from "react";
import clsx from "clsx";

interface IngredientChipProps {
  label: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  className?: string;
  labelClassName?: string;
  style?: CSSProperties;
  labelStyle?: CSSProperties;
}

export default function IngredientChip({
  label,
  leading,
  trailing,
  onClick,
  className,
  labelClassName,
  style,
  labelStyle,
}: IngredientChipProps) {
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2",
        onClick ? "cursor-pointer" : undefined,
        className,
      )}
      style={style}
      onClick={onClick}
    >
      {leading}
      <span
        className={clsx("whitespace-nowrap", labelClassName)}
        style={labelStyle}
      >
        {label}
      </span>
      {trailing}
    </div>
  );
}
