import { type CSSProperties, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { createPortal } from "react-dom";
import styles from "./SacredScroll.module.css";

export type SacredScrollBlock =
  | { type: "paragraph"; html: string }
  | { type: "rule" };

interface SacredScrollProps {
  isOpen: boolean;
  onClose: () => void;
  beforeImageBlocks: SacredScrollBlock[];
  afterImageBlocks: SacredScrollBlock[];
  imageSrc: string;
  imageAlt: string;
  backdropOpacity?: number;
}

const DEFAULT_BACKDROP_OPACITY = 0.9;
const OPEN_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const CLOSE_EASE: [number, number, number, number] = [0.4, 0, 0.9, 1];
const SHEET_CLOSED_CLIP =
  "inset(50% 0% 50% 0% round 8px 14px 11px 13px / 11px 8px 13px 9px)";
const SHEET_OPEN_CLIP =
  "inset(0% 0% 0% 0% round 8px 14px 11px 13px / 11px 8px 13px 9px)";
const toAlpha = (value: number) => String(Math.round(value * 1000) / 1000);

const getBackdropStyle = (backdropOpacity: number): CSSProperties => {
  const opacity = Number.isFinite(backdropOpacity)
    ? Math.min(Math.max(backdropOpacity, 0), 1)
    : DEFAULT_BACKDROP_OPACITY;
  const relativeOpacity = opacity / DEFAULT_BACKDROP_OPACITY;

  return {
    "--sacred-scroll-backdrop-glow-opacity": toAlpha(opacity * 0.5),
    "--sacred-scroll-backdrop-rim-opacity": toAlpha(
      Math.min(opacity * 1.033, 1),
    ),
    "--sacred-scroll-backdrop-start-opacity": toAlpha(opacity),
    "--sacred-scroll-backdrop-end-opacity": toAlpha(
      Math.min(opacity * 1.067, 1),
    ),
    "--sacred-scroll-backdrop-dark-glow-opacity": toAlpha(opacity * 0.444),
    "--sacred-scroll-backdrop-dark-rim-opacity": toAlpha(
      Math.min(opacity * 1.044, 1),
    ),
    "--sacred-scroll-backdrop-dark-start-opacity": toAlpha(
      Math.min(opacity * 1.044, 1),
    ),
    "--sacred-scroll-backdrop-dark-end-opacity": toAlpha(
      Math.min(opacity * 1.089, 1),
    ),
    "--sacred-scroll-backdrop-texture-opacity": toAlpha(
      Math.min(0.2 * relativeOpacity, 0.2),
    ),
    "--sacred-scroll-backdrop-dark-texture-opacity": toAlpha(
      Math.min(0.14 * relativeOpacity, 0.14),
    ),
  } as CSSProperties;
};

export default function SacredScroll({
  isOpen,
  onClose,
  beforeImageBlocks,
  afterImageBlocks,
  imageSrc,
  imageAlt,
  backdropOpacity = DEFAULT_BACKDROP_OPACITY,
}: SacredScrollProps) {
  const backdropStyle = getBackdropStyle(backdropOpacity);
  const firstParagraphBeforeIndex = beforeImageBlocks.findIndex(
    (block) => block.type === "paragraph",
  );
  const firstParagraphAfterIndex = afterImageBlocks.findIndex(
    (block) => block.type === "paragraph",
  );

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          className={styles.backdrop}
          style={backdropStyle}
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            if (event.target === event.currentTarget) onClose();
          }}
          initial={{ opacity: 0 }}
          animate={{
            opacity: 1,
            transition: { duration: 0.9, ease: OPEN_EASE },
          }}
          exit={{
            opacity: 0,
            transition: { duration: 0.65, ease: CLOSE_EASE },
          }}
        >
          <motion.div
            className={styles.scrollStage}
            onClick={(event) => event.stopPropagation()}
            initial={{
              opacity: 0,
              scale: 0.985,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              transition: { duration: 0.95, ease: OPEN_EASE },
            }}
            exit={{
              opacity: 0,
              scale: 0.992,
              transition: { duration: 0.62, ease: CLOSE_EASE },
            }}
          >
            <motion.div
              className={styles.rollTop}
              initial={{ y: 0, opacity: 0.85, scaleX: 0.93 }}
              animate={{
                y: "calc(-1 * var(--roll-travel))",
                opacity: 1,
                scaleX: 1,
                transition: { duration: 1.05, ease: OPEN_EASE },
              }}
              exit={{
                y: 0,
                opacity: 0.85,
                scaleX: 0.94,
                transition: { duration: 0.72, ease: CLOSE_EASE },
              }}
            />

            <motion.div
              className={styles.rollBottom}
              initial={{ y: 0, opacity: 0.9, scaleX: 0.93 }}
              animate={{
                y: "var(--roll-travel)",
                opacity: 1,
                scaleX: 1,
                transition: { duration: 1.05, ease: OPEN_EASE },
              }}
              exit={{
                y: 0,
                opacity: 0.9,
                scaleX: 0.94,
                transition: { duration: 0.72, ease: CLOSE_EASE },
              }}
            />

            <motion.div
              className={styles.sheetMask}
              initial={{
                clipPath: SHEET_CLOSED_CLIP,
                opacity: 0.2,
              }}
              animate={{
                clipPath: SHEET_OPEN_CLIP,
                opacity: 1,
                transition: { duration: 1.1, ease: OPEN_EASE },
              }}
              exit={{
                clipPath: SHEET_CLOSED_CLIP,
                opacity: 0.2,
                transition: { duration: 0.72, ease: CLOSE_EASE },
              }}
            >
              <div className={styles.sheetSurface}>
                <div className={styles.contentScroller}>
                  <article className={styles.prose}>
                    {/* <h1 className={styles.title}>
                      PerillaCove ~ The Integrated System of Nature
                    </h1> */}
                    {beforeImageBlocks.map((block, index) => {
                      if (block.type === "rule") {
                        return <hr key={`before-rule-${index}`} />;
                      }

                      return (
                        <p
                          key={`before-paragraph-${index}-${block.html.slice(0, 16)}`}
                          className={
                            index === firstParagraphBeforeIndex
                              ? styles.intro
                              : undefined
                          }
                          dangerouslySetInnerHTML={{ __html: block.html }}
                        />
                      );
                    })}
                    <figure className={styles.illustrationFrame}>
                      <img src={imageSrc} alt={imageAlt} />
                    </figure>
                    {afterImageBlocks.map((block, index) => {
                      if (block.type === "rule") {
                        return <hr key={`after-rule-${index}`} />;
                      }

                      const shouldUseIntroStyle =
                        firstParagraphBeforeIndex === -1 &&
                        index === firstParagraphAfterIndex;

                      return (
                        <p
                          key={`after-paragraph-${index}-${block.html.slice(0, 16)}`}
                          className={
                            shouldUseIntroStyle ? styles.intro : undefined
                          }
                          dangerouslySetInnerHTML={{ __html: block.html }}
                        />
                      );
                    })}
                    <p className={styles.authorSignature}>Nikhil</p>
                  </article>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
