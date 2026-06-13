import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import type { PanoramaTourForestWorkspace, TourHotspot } from "./types";
import type { IntegrationStoryPayload } from "../Forest/integrationStories";
import type { FocusedIngredientState } from "../../state";
import IngredientQualities from "../IngredientsPage/Qualities";
import {
  createIngredientResolver,
  type IngredientResolver,
} from "../IngredientsPage/data";
import { PT_GLASS_SURFACE_STRONG } from "./uiClasses";
import TourForestPreview from "./TourForestPreview";

interface HotspotDetailPanelProps {
  hotspot: TourHotspot | null;
  isOpen: boolean;
  isTourMode: boolean;
  canGoPrevious: boolean;
  canGoNext: boolean;
  onClose: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onIngredientSelect?: (ingredientId: string) => boolean;
  resolveIngredientById?: IngredientResolver;
  forestPreviewWorkspace?: PanoramaTourForestWorkspace | null;
  integrationStoriesByIngredient?: Record<string, IntegrationStoryPayload>;
}

const splitStoryIntoSentences = (storyText: string): string[] =>
  storyText.split(/\n{2,}/).flatMap((paragraph) =>
    paragraph
      .trim()
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean),
  );

function CustomTextStory({
  text,
  animate,
  storyId,
}: {
  text: string;
  animate: boolean;
  storyId: string;
}) {
  const sentences = useMemo(() => splitStoryIntoSentences(text), [text]);

  if (!animate || sentences.length === 0) {
    return (
      <p className="my-[0.85rem] text-[1.18rem] leading-[1.72] text-gray-100/95 md:text-[1.26rem] md:leading-[1.78]">
        {text}
      </p>
    );
  }

  return (
    <motion.p
      key={`custom-story-${storyId}`}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.11,
            delayChildren: 0.06,
          },
        },
      }}
      className="my-[0.85rem] text-[1.18rem] leading-[1.72] text-gray-100/95 md:text-[1.26rem] md:leading-[1.78]"
    >
      {sentences.map((sentence, index) => (
        <motion.span
          key={`${storyId}-sentence-${index}`}
          variants={{
            hidden: { opacity: 0, y: 6, filter: "blur(1.5px)" },
            visible: {
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
              transition: { duration: 0.34, ease: "easeOut" },
            },
          }}
        >
          {index > 0 ? " " : ""}
          {sentence}
        </motion.span>
      ))}
    </motion.p>
  );
}

function ForestPreviewPlaceholder() {
  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-emerald-300/20 bg-[rgba(5,12,9,0.62)] shadow-[inset_0_0_0_1px_rgba(16,185,129,0.06)]">
      <div className="flex h-[380px] items-center justify-center sm:h-[430px]">
        <div className="flex flex-col items-center gap-3 text-sm text-emerald-50/55">
          <div className="h-10 w-10 animate-pulse rounded-xl border border-emerald-100/12 bg-emerald-100/8" />
          <span>Preparing 3D preview...</span>
        </div>
      </div>
    </div>
  );
}

export default function HotspotDetailPanel({
  hotspot,
  isOpen,
  isTourMode,
  canGoPrevious,
  canGoNext,
  onClose,
  onPrevious,
  onNext,
  onIngredientSelect,
  resolveIngredientById,
  forestPreviewWorkspace,
  integrationStoriesByIngredient,
}: HotspotDetailPanelProps) {
  const resolveIngredient = useMemo(
    () => resolveIngredientById ?? createIngredientResolver(),
    [resolveIngredientById],
  );
  const ingredient = hotspot
    ? resolveIngredient(hotspot.ingredientId ?? hotspot.id)
    : null;
  const hotspotIngredientId = hotspot?.ingredientId ?? hotspot?.id ?? null;
  const seenTextOnlyStoriesRef = useRef<Set<string>>(new Set());
  const [animateCustomTextStory, setAnimateCustomTextStory] = useState(false);
  const [shouldRenderForestPreview, setShouldRenderForestPreview] =
    useState(false);
  const [forestPanelInspection, setForestPanelInspection] = useState<{
    inspection: FocusedIngredientState;
    baseHotspotId: string | null;
    anchoredToHotspot: boolean;
  } | null>(null);
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window === "undefined"
      ? true
      : window.matchMedia("(min-width: 960px)").matches,
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const media = window.matchMedia("(min-width: 960px)");
    const handleChange = (event: MediaQueryListEvent) =>
      setIsDesktop(event.matches);

    setIsDesktop(media.matches);
    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  const closedMotion = useMemo(
    () => (isDesktop ? { x: "104%", y: 0 } : { x: 0, y: "104%" }),
    [isDesktop],
  );
  const hasCustomStoryImage = Boolean(hotspot?.storyImageSrc?.trim());
  const shouldUseTextOnlyCustomStory =
    Boolean(hotspot) && !ingredient && !hasCustomStoryImage;

  useEffect(() => {
    if (!hotspot || !isOpen || !shouldUseTextOnlyCustomStory) {
      setAnimateCustomTextStory(false);
      return;
    }

    if (seenTextOnlyStoriesRef.current.has(hotspot.id)) {
      setAnimateCustomTextStory(false);
      return;
    }

    seenTextOnlyStoriesRef.current.add(hotspot.id);
    setAnimateCustomTextStory(true);
  }, [hotspot, isOpen, shouldUseTextOnlyCustomStory]);

  const handleForestIngredientInspect = useCallback(
    (inspection: FocusedIngredientState) => {
      const didSelectHotspot =
        onIngredientSelect?.(inspection.ingredient.id) ?? false;

      setForestPanelInspection({
        inspection,
        baseHotspotId: hotspot?.id ?? null,
        anchoredToHotspot: didSelectHotspot,
      });
    },
    [hotspot?.id, onIngredientSelect],
  );

  const activeForestInspection = (() => {
    if (!forestPanelInspection) return null;

    if (forestPanelInspection.anchoredToHotspot) {
      return forestPanelInspection.inspection.ingredient.id ===
        hotspotIngredientId
        ? forestPanelInspection.inspection
        : null;
    }

    return forestPanelInspection.baseHotspotId === (hotspot?.id ?? null)
      ? forestPanelInspection.inspection
      : null;
  })();
  const panelIngredient = activeForestInspection?.ingredient ?? ingredient;
  const panelStoryText = activeForestInspection
    ? activeForestInspection.storyText
    : hotspot?.description;
  const panelStoryLabel = activeForestInspection?.storyLabel ?? "Integration";

  useEffect(() => {
    if (!isOpen || !forestPreviewWorkspace) {
      setShouldRenderForestPreview(false);
      return;
    }

    setShouldRenderForestPreview(false);
    const delayMs = isDesktop ? 280 : 320;
    const timeoutId = window.setTimeout(() => {
      setShouldRenderForestPreview(true);
    }, delayMs);

    return () => window.clearTimeout(timeoutId);
  }, [forestPreviewWorkspace, isDesktop, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && hotspot ? (
        <motion.aside
          className={`pt-hotspot-detail-panel pointer-events-auto fixed bottom-0 left-0 right-0 z-[12050] transform-gpu will-change-transform md:left-auto md:right-0 md:top-0 ${
            forestPreviewWorkspace
              ? "md:w-[min(58vw,920px)] xl:w-[min(54vw,1040px)]"
              : "md:w-[min(42vw,640px)]"
          }`}
          style={{ backfaceVisibility: "hidden" }}
          initial={{ ...closedMotion, opacity: 0.98 }}
          animate={{ x: 0, y: 0, opacity: 1 }}
          exit={{ ...closedMotion, opacity: 0.98 }}
          transition={{
            type: "spring",
            stiffness: 330,
            damping: 34,
            mass: 0.86,
          }}
        >
          <div
            className={`max-h-[85dvh] overflow-auto rounded-t-[1.1rem] border-l border-r border-t md:h-full md:max-h-none md:rounded-none md:border-t-0 md:border-l-emerald-100/30  ${PT_GLASS_SURFACE_STRONG}`}
          >
            {isTourMode ? (
              <div
                className="mx-[0.15rem] mb-[0.4rem] flex items-center justify-between gap-2"
                role="group"
                aria-label="Tour navigation"
              >
                <button
                  type="button"
                  className="inline-flex h-[1.9rem] w-[1.9rem] items-center justify-center rounded-full border border-emerald-200/30 bg-[rgba(4,10,7,0.7)] text-emerald-50/90 transition hover:bg-[rgba(16,26,20,0.9)] disabled:cursor-not-allowed disabled:opacity-35"
                  onClick={onPrevious}
                  disabled={!canGoPrevious}
                  aria-label="Previous tour species"
                >
                  <i className="fa-solid fa-chevron-left" aria-hidden="true" />
                </button>
                <span className="text-[0.82rem] font-semibold uppercase tracking-[0.12em] text-emerald-100/85">
                  Tour
                </span>
                <button
                  type="button"
                  className="inline-flex h-[1.9rem] w-[1.9rem] items-center justify-center rounded-full border border-emerald-200/30 bg-[rgba(4,10,7,0.7)] text-emerald-50/90 transition hover:bg-[rgba(16,26,20,0.9)] disabled:cursor-not-allowed disabled:opacity-35"
                  onClick={onNext}
                  disabled={!canGoNext}
                  aria-label="Next tour species"
                >
                  <i className="fa-solid fa-chevron-right" aria-hidden="true" />
                </button>
              </div>
            ) : null}

            {panelIngredient ? (
              <section
                className="overflow-visible rounded-[0.9rem]"
                aria-label={`${panelIngredient.id.replace(/_/g, " ")} profile`}
              >
                <IngredientQualities
                  ingredient={panelIngredient}
                  onClose={onClose}
                  resolveIngredientById={resolveIngredient}
                  enforceDarkMode
                  embedded
                  showBorder={false}
                  storyText={panelStoryText}
                  storyLabel={panelStoryLabel}
                  showInlineCloseButton
                  integrationProfileContext={
                    activeForestInspection?.integrationProfileContext
                  }
                  storyAccessory={
                    forestPreviewWorkspace ? (
                      shouldRenderForestPreview ? (
                        <TourForestPreview
                          workspace={forestPreviewWorkspace}
                          integrationStoriesByIngredient={
                            integrationStoriesByIngredient
                          }
                          onIngredientInspect={handleForestIngredientInspect}
                        />
                      ) : (
                        <ForestPreviewPlaceholder />
                      )
                    ) : undefined
                  }
                />
              </section>
            ) : (
              <section className="mx-[0.2rem] my-[0.3rem] rounded-[0.9rem]">
                <div className="mb-[0.55rem] flex items-center justify-between gap-3">
                  <h2 className="m-0 min-w-0 truncate text-xl font-medium text-emerald-200">
                    {hotspot.shortLabel}
                  </h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-emerald-100/25 bg-black/25 text-sm text-emerald-50/80 transition hover:bg-emerald-50/10 hover:text-emerald-50"
                    aria-label="Close hotspot panel"
                  >
                    <i className="fa-solid fa-xmark" aria-hidden="true" />
                  </button>
                </div>
                {hotspot.storyImageSrc ? (
                  <img
                    src={hotspot.storyImageSrc}
                    alt={`${hotspot.shortLabel} reference`}
                    className="mb-[0.55rem] w-full rounded-[0.7rem] border border-emerald-100/20 object-cover"
                    loading="lazy"
                  />
                ) : null}
                <CustomTextStory
                  text={hotspot.description}
                  animate={animateCustomTextStory && !hotspot.storyImageSrc}
                  storyId={hotspot.id}
                />
              </section>
            )}
          </div>
        </motion.aside>
      ) : null}
    </AnimatePresence>
  );
}
