import React, { useEffect } from "react";
import styles from "./index.module.css";
import clsx from "clsx";
import { useSetAtom } from "jotai";
import { ModalVisibleAtom } from "../../state";

interface ModalProps {
  onDismiss?: () => void;
  children?: React.ReactNode;
  backgroundColorClasses?: string;
  zIndexClasses?: string;
  widthClasses: string;
  heightClasses: string;
  scrollable?: boolean;
  hidden?: boolean;
  backdropOpacity?: number;
}

export default function Modal({
  onDismiss,
  children,
  backgroundColorClasses = "bg-light-gradient dark:bg-dark-gradient",
  zIndexClasses = "z-[10000]",
  widthClasses = "",
  heightClasses = "",
  scrollable = true,
  hidden = false,
  backdropOpacity = 0.9,
}: ModalProps) {
  const setModalVisible = useSetAtom(ModalVisibleAtom);
  const resolvedBackdropOpacity = Number.isFinite(backdropOpacity)
    ? Math.min(Math.max(backdropOpacity, 0), 1)
    : 0.9;

  const dismissDialog = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e?.target as HTMLElement).id === "Modal") {
      e.preventDefault();
      e.stopPropagation();
      onDismiss?.();
    }
  };

  const containerClasses = clsx(
    "pointer-events-auto font-cormorant-garamond",
    zIndexClasses,
    {
      [styles.container]: true,
      "overflow-y-auto": scrollable,
      "overflow-hidden": !scrollable,
      hidden: hidden,
    },
  );

  const innerContainerClasses = clsx(
    widthClasses,
    heightClasses,
    backgroundColorClasses,
    "absolute rounded-lg dark:border border-neutral-400 dark:border-neutral-500",
    zIndexClasses,
    {
      "overflow-y-auto": scrollable,
      "overflow-hidden": !scrollable,
      [styles.innerContainer]: true,
    },
  );

  useEffect(() => {
    setModalVisible(true);
    return () => {
      setModalVisible(false);
    };
  }, [setModalVisible]);

  return (
    <div
      id="Modal"
      onClick={dismissDialog}
      className={containerClasses}
      style={{ backgroundColor: `rgba(0, 0, 0, ${resolvedBackdropOpacity})` }}
    >
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) scale(1)`,
        }}
        className={innerContainerClasses}
      >
        {children}
      </div>
    </div>
  );
}
