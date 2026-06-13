import clsx from "clsx";
import Tooltip from ".";
import { useIsWidescreen } from "../../util/hooks/general";

interface Props {
  shortcut: string;
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
  styleAsNormalText?: boolean;
  show?: boolean;
  widthClasses?: string;
  alwaysShow?: boolean;
}

export default function KeyboardShortcutTooltip({
  shortcut,
  position,
  children,
  show = true,
  styleAsNormalText,
  widthClasses = "w-fit",
  alwaysShow = false,
}: Props) {
  const isWidescreen = useIsWidescreen();
  const containerClasses = clsx(
    "px-1.5 py-0.5 rounded bg-neutral-700 dark:bg-neutral-600 text-sm",
  );
  return (
    <Tooltip
      content={
        <>
          {styleAsNormalText ? (
            <div className={containerClasses}>{shortcut}</div>
          ) : (
            <kbd className={containerClasses}>{shortcut}</kbd>
          )}
        </>
      }
      show={isWidescreen && show}
      position={position}
      widthClasses={widthClasses}
      alwaysShow={alwaysShow}
    >
      {children}
    </Tooltip>
  );
}
