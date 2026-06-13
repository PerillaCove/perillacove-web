import React from "react";
import clsx from "clsx";
import LazyImage from "../LazyImage";

interface ButtonProps {
  text?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  colorClasses?: string;
  borderClasses?: string;
  additionalClasses?: string;
  iconClasses?: string;
  roundedClasses?: string;
  paddingClasses?: string;
  textClasses?: string;
  widthClasses?: string;
  imgPath?: string;
  imgWidth?: number;
  imgHeight?: number;
  overlayClasses?: string;
  containerWidthClasses?: string;
  containerPositionClasses?: string;
}

const Button = ({
  text,
  type,
  disabled,
  onClick,
  colorClasses = "hover:bg-neutral-700 hover:text-white bg-black dark:bg-dark-gradient text-white",
  borderClasses = "dark:border border-neutral-400",
  additionalClasses = "",
  iconClasses,
  paddingClasses = "p-3",
  roundedClasses = "rounded",
  textClasses = "",
  widthClasses = "w-full",
  imgPath,
  imgWidth,
  imgHeight,
  overlayClasses,
  containerWidthClasses = "w-auto",
  containerPositionClasses = "relative",
}: ButtonProps) => {
  const buttonClasses = clsx(
    "z-10 font-semibold text-sm outline-none",
    paddingClasses,
    colorClasses,
    borderClasses,
    additionalClasses,
    roundedClasses,
    widthClasses,
    {
      "opacity-50 cursor-not-allowed text-white": disabled,
    },
  );

  const onClickHandler = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) {
      return;
    }
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <div className={`${containerPositionClasses} ${containerWidthClasses}`}>
      <button
        onClick={onClickHandler}
        type={type || "button"}
        className={buttonClasses}
      >
        {iconClasses && <i className={iconClasses}></i>}
        {imgPath && (
          <LazyImage
            src={imgPath}
            width={imgWidth || 24}
            height={imgHeight || 24}
            alt="button icon"
            className="inline-block mr-2"
          />
        )}
        {overlayClasses && (
          <div
            className={`${overlayClasses} absolute inset-0 rounded-[12px]`}
          ></div>
        )}
        {text && (
          <span className={`${iconClasses ? "ml-2" : ""} ${textClasses}`}>
            {text}
          </span>
        )}
      </button>
    </div>
  );
};

export default Button;
