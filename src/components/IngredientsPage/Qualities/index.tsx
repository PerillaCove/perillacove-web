import clsx from "clsx";
import { Ingredient, ExtraFact, ExtraFactHighlightTheme } from "../types";
import IngredientImg from "../Image";
import { formatIngredientIdForDisplay } from "../../../util/functions";
import ComboButton from "../../Button/Combo";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createIngredientResolver, type IngredientResolver } from "../data";
import { useCircadianTheme } from "../../../util/hooks/general";
import { motion } from "motion/react";
import IntegrationProfileDisplay from "../IntegrationProfileDisplay";
import type { IntegrationProfileDisplayContext } from "../../Forest/substrate/profiles/display";
import SensoryRadarCharts from "../SensoryRadarCharts";

// Theme classes matching Growth component
const highlightThemeMap: Record<ExtraFactHighlightTheme, string> = {
  height: "text-emerald-700 dark:text-emerald-300 font-medium",
  lifecycle: "text-sky-700 dark:text-sky-300 font-medium",
  growthForm: "text-green-700 dark:text-green-300 font-medium",
  light: "text-amber-700 dark:text-amber-300 font-medium",
  frost: "text-indigo-700 dark:text-indigo-300 font-medium",
  moisture: "text-cyan-700 dark:text-cyan-300 font-medium",
  airHumidity: "text-slate-700 dark:text-slate-300 font-medium",
};

const ingredientQualitiesSurfaceClasses =
  "bg-gradient-to-br from-emerald-50/80 via-white to-emerald-100/75 dark:from-emerald-950/65 dark:via-neutral-950/90 dark:to-emerald-950/45";

function formatCowYieldDisplayName(ingredient: Ingredient): string {
  return ingredient.originIngredients?.includes("cow")
    ? formatIngredientIdForDisplay(ingredient.id, { includeDescriptors: false })
    : formatIngredientIdForDisplay(ingredient.id);
}

function renderHighlightedContent(fact: ExtraFact): React.ReactNode {
  if (!fact.highlights?.length && !fact.links?.length) {
    return fact.content;
  }

  const parts: React.ReactNode[] = [];
  let remaining = fact.content;
  let keyIndex = 0;

  while (remaining.length > 0) {
    let earliestHighlight: {
      index: number;
      text: string;
      theme: ExtraFactHighlightTheme;
    } | null = null;

    let earliestLink: {
      index: number;
      text: string;
      url: string;
    } | null = null;

    // Find earliest highlight match
    for (const highlight of fact.highlights ?? []) {
      const index = remaining
        .toLowerCase()
        .indexOf(highlight.text.toLowerCase());
      if (
        index !== -1 &&
        (earliestHighlight === null || index < earliestHighlight.index)
      ) {
        earliestHighlight = {
          index,
          text: highlight.text,
          theme: highlight.theme,
        };
      }
    }

    // Find earliest link match
    for (const link of fact.links ?? []) {
      const index = remaining.toLowerCase().indexOf(link.text.toLowerCase());
      if (
        index !== -1 &&
        (earliestLink === null || index < earliestLink.index)
      ) {
        earliestLink = { index, text: link.text, url: link.url };
      }
    }

    // Determine which match comes first
    const highlightFirst =
      earliestHighlight !== null &&
      (earliestLink === null || earliestHighlight.index <= earliestLink.index);
    const linkFirst =
      earliestLink !== null &&
      (earliestHighlight === null ||
        earliestLink.index < earliestHighlight.index);

    if (!earliestHighlight && !earliestLink) {
      parts.push(<span key={keyIndex++}>{remaining}</span>);
      break;
    }

    if (highlightFirst && earliestHighlight) {
      if (earliestHighlight.index > 0) {
        parts.push(
          <span key={keyIndex++}>
            {remaining.slice(0, earliestHighlight.index)}
          </span>,
        );
      }

      const matchedText = remaining.slice(
        earliestHighlight.index,
        earliestHighlight.index + earliestHighlight.text.length,
      );
      parts.push(
        <span
          key={keyIndex++}
          className={highlightThemeMap[earliestHighlight.theme]}
        >
          {matchedText}
        </span>,
      );

      remaining = remaining.slice(
        earliestHighlight.index + earliestHighlight.text.length,
      );
    } else if (linkFirst && earliestLink) {
      if (earliestLink.index > 0) {
        parts.push(
          <span key={keyIndex++}>
            {remaining.slice(0, earliestLink.index)}
          </span>,
        );
      }

      const matchedText = remaining.slice(
        earliestLink.index,
        earliestLink.index + earliestLink.text.length,
      );
      parts.push(
        <a
          key={keyIndex++}
          href={earliestLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-600 dark:text-cyan-400 underline hover:text-cyan-800 dark:hover:text-cyan-300 cursor-pointer"
          onClick={(e) => e.stopPropagation()}
        >
          {matchedText}
          <i className="fa-solid fa-arrow-up-right-from-square fa-xs ml-1 opacity-70" />
        </a>,
      );

      remaining = remaining.slice(
        earliestLink.index + earliestLink.text.length,
      );
    }
  }

  return <>{parts}</>;
}

interface Props {
  ingredient: Ingredient;
  onClose: () => void;
  onEnter?: () => void;
  showComboButton?: boolean;
  ingredientsInPlay?: Ingredient[];
  resolveIngredientById?: IngredientResolver;
  enforceDarkMode?: boolean;
  embedded?: boolean;
  showBorder?: boolean;
  transparentBackground?: boolean;
  storyText?: string;
  storyLabel?: string;
  storyAccessory?: React.ReactNode;
  integrationProfileContext?: IntegrationProfileDisplayContext;
  showInlineCloseButton?: boolean;
}

function YieldSensoryCarousel({
  ingredient,
  resolveIngredient,
  isDarkMode,
}: {
  ingredient: Ingredient;
  resolveIngredient: IngredientResolver;
  isDarkMode: boolean;
}) {
  const yieldIngredients = useMemo(
    () =>
      (ingredient.yieldIngredientIds ?? [])
        .map((id) => resolveIngredient(id))
        .filter(Boolean) as Ingredient[],
    [ingredient.yieldIngredientIds, resolveIngredient],
  );
  const [activeYieldIndex, setActiveYieldIndex] = useState(0);

  useEffect(() => {
    setActiveYieldIndex(0);
  }, [ingredient.id]);

  if (yieldIngredients.length === 0) return null;
  const activeIndex = activeYieldIndex % yieldIngredients.length;
  const activeYield = yieldIngredients[activeIndex]!;
  const goNext = () => {
    setActiveYieldIndex((current) => (current + 1) % yieldIngredients.length);
  };

  return (
    <section
      className="relative mx-2 mb-2 rounded-xl border border-emerald-200/60 bg-white/55 p-3 pr-12 dark:border-emerald-100/20 dark:bg-neutral-900/45"
      aria-label={`${ingredient.id.replace(/_/g, " ")} yields`}
    >
      <div className="mb-2 flex items-center gap-2">
        <IngredientImg ingredient={activeYield} width={34} height={34} />
        <span className="text-lg font-medium capitalize text-neutral-900 dark:text-neutral-100">
          {formatCowYieldDisplayName(activeYield)}
        </span>
        {yieldIngredients.length > 1 ? (
          <span className="ml-auto text-xs font-semibold tabular-nums text-emerald-800/55 dark:text-emerald-100/55">
            {activeIndex + 1}/{yieldIngredients.length}
          </span>
        ) : null}
      </div>
      <SensoryRadarCharts
        ingredient={activeYield}
        enforceDarkMode={isDarkMode}
        isDarkMode={isDarkMode}
        variant="bare"
      />
      {yieldIngredients.length > 1 ? (
        <button
          type="button"
          onClick={goNext}
          className={clsx(
            "absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border transition",
            isDarkMode
              ? "border-emerald-100/25 bg-black/25 text-emerald-50 hover:bg-emerald-50/10"
              : "border-emerald-700/20 bg-white/70 text-emerald-900 hover:bg-white",
          )}
          aria-label="Next yield sensory profile"
        >
          <i className="fa-solid fa-chevron-right text-sm" />
        </button>
      ) : null}
    </section>
  );
}

export default function IngredientQualities({
  ingredient,
  onClose,
  onEnter,
  showComboButton,
  ingredientsInPlay,
  resolveIngredientById: resolveIngredientByIdProp,
  enforceDarkMode = false,
  embedded = false,
  showBorder = false,
  transparentBackground = false,
  storyText,
  storyLabel = "Integration",
  storyAccessory,
  integrationProfileContext,
  showInlineCloseButton = false,
}: Props) {
  const { isDarkMode: systemDarkMode } = useCircadianTheme();
  const isDarkMode = enforceDarkMode || systemDarkMode;
  const resolveIngredient = useMemo(
    () => resolveIngredientByIdProp ?? createIngredientResolver(),
    [resolveIngredientByIdProp],
  );

  const showPersistentAddButton = Boolean(showComboButton || onEnter);

  const containerClasses = clsx(
    "relative flex min-h-0 flex-col overflow-hidden rounded-[1.1rem]  transition-width duration-500 pt-2 px-2",
    {
      "text-neutral-900": !isDarkMode,
      "text-neutral-100": isDarkMode,
    },
    {
      "max-h-[calc(90vh-1.25rem)] lg:w-[700px]": !embedded,
      "w-full max-h-none lg:w-full": embedded,
    },
    transparentBackground
      ? "bg-transparent"
      : ingredientQualitiesSurfaceClasses,
    showBorder && "border border-emerald-300/25 dark:border-emerald-200/30",
  );

  const [currentOriginIdx, setCurrentOriginIdx] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [justEntered, setJustEntered] = useState(false);
  const [transitionDir, setTransitionDir] = useState<"prev" | "next" | null>(
    null,
  );
  const transitionTimeoutRef = useRef<number | null>(null);
  const enterTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (transitionTimeoutRef.current) {
        window.clearTimeout(transitionTimeoutRef.current);
        transitionTimeoutRef.current = null;
      }
      if (enterTimeoutRef.current) {
        window.clearTimeout(enterTimeoutRef.current);
        enterTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    setCurrentOriginIdx(0);
    setIsExiting(false);
    setJustEntered(false);
    setTransitionDir(null);
  }, [ingredient.id]);

  const renderIntegrationBlock = () => {
    const originIds = ingredient.originIngredients ?? [];
    const originIngredients = originIds
      .map((id) => resolveIngredient(id))
      .filter(Boolean) as Ingredient[];
    const baseSources =
      originIngredients.length > 0 ? originIngredients : [ingredient];
    const growthCandidates = baseSources.filter(
      (ing) =>
        ing.properties.growth ||
        ing.properties.fungiGrowth ||
        ing.properties.algaeGrowth ||
        ing.properties.animalIntegration,
    );
    const hasProfile = growthCandidates.length > 0;
    const hasIntroContent = Boolean(storyText || storyAccessory);

    if (!hasIntroContent && !hasProfile) return null;

    const profileContent = (() => {
      if (!hasProfile) return null;

      const hasMultiple = growthCandidates.length > 1;
      const safeIndex = Math.min(currentOriginIdx, growthCandidates.length - 1);
      const current = growthCandidates[safeIndex];
      const hasOrigins = originIngredients.length > 0;
      const currentOriginLabel = hasOrigins
        ? formatIngredientIdForDisplay(current.id)
        : originIds.length > 0
          ? formatIngredientIdForDisplay(originIds[safeIndex])
          : null;
      const triggerTransition = (dir: "prev" | "next", nextIndex: number) => {
        if (isExiting) return;
        setTransitionDir(dir);
        setIsExiting(true);
        if (transitionTimeoutRef.current) {
          window.clearTimeout(transitionTimeoutRef.current);
        }
        transitionTimeoutRef.current = window.setTimeout(() => {
          setCurrentOriginIdx(nextIndex);
          setIsExiting(false);
          setJustEntered(true);
          if (enterTimeoutRef.current) {
            window.clearTimeout(enterTimeoutRef.current);
          }
          // Next tick: remove justEntered to animate to settled position.
          enterTimeoutRef.current = window.setTimeout(() => {
            setJustEntered(false);
          }, 0);
        }, 180);
      };
      const goPrev = () => {
        const nextIndex =
          (safeIndex - 1 + growthCandidates.length) % growthCandidates.length;
        triggerTransition("prev", nextIndex);
      };
      const goNext = () => {
        const nextIndex = (safeIndex + 1) % growthCandidates.length;
        triggerTransition("next", nextIndex);
      };
      const transitionClasses = (() => {
        if (isExiting) {
          return clsx(
            "transition-all duration-200 ease-out",
            transitionDir === "next"
              ? "-translate-x-2 opacity-0"
              : "translate-x-2 opacity-0",
          );
        }
        if (justEntered) {
          return clsx(
            "transition-all duration-200 ease-out",
            transitionDir === "next"
              ? "translate-x-2 opacity-0"
              : "-translate-x-2 opacity-0",
          );
        }
        return "transition-all duration-200 ease-out translate-x-0 opacity-100";
      })();

      return (
        <div
          className={clsx(
            hasIntroContent
              ? "mt-3 border-t border-neutral-200 pt-3 dark:border-neutral-700"
              : "mt-3",
          )}
        >
          {currentOriginLabel || hasMultiple ? (
            <div className="mb-2 flex items-center justify-between">
              {currentOriginLabel ? (
                <span className="text-[10px] sm:text-sm font-normal opacity-80">
                  Origin: {currentOriginLabel}
                </span>
              ) : (
                <span />
              )}
              {hasMultiple && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Previous origin"
                    onClick={goPrev}
                    className="px-1 py-0.5 rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                  >
                    <i className="fa-solid fa-chevron-left fa-xs" />
                  </button>
                  <div className="text-[10px] sm:text-sm opacity-70">
                    {safeIndex + 1}/{growthCandidates.length}
                  </div>
                  <button
                    type="button"
                    aria-label="Next origin"
                    onClick={goNext}
                    className="px-1 py-0.5 rounded-md border border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                  >
                    <i className="fa-solid fa-chevron-right fa-xs" />
                  </button>
                </div>
              )}
            </div>
          ) : null}
          <div className={clsx("mb-1 last:mb-0", transitionClasses)}>
            <IntegrationProfileDisplay
              ingredient={current}
              {...(current.id === ingredient.id
                ? integrationProfileContext
                : undefined)}
            />
          </div>
        </div>
      );
    })();

    return (
      <section className="mb-2 flex flex-col px-2 pb-2 pt-1">
        <motion.div
          key={`integration-story-${ingredient.id}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
        >
          <div className="flex items-center justify-between gap-3">
            <div
              aria-label={storyLabel}
              className="flex min-w-0 items-center gap-1.5"
            >
              <IngredientImg ingredient={ingredient} width={34} height={34} />
              <span
                className={clsx(
                  "min-w-0 truncate text-xl capitalize font-medium",
                  isDarkMode ? "text-emerald-200" : "text-emerald-800",
                )}
              >
                {formatCowYieldDisplayName(ingredient)}
              </span>
            </div>
            {showInlineCloseButton ? (
              <button
                type="button"
                onClick={onClose}
                className={clsx(
                  "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm transition",
                  isDarkMode
                    ? "border-emerald-100/25 bg-black/25 text-emerald-50/80 hover:bg-emerald-50/10 hover:text-emerald-50"
                    : "border-emerald-700/20 bg-white/60 text-emerald-900/70 hover:bg-white hover:text-emerald-950",
                )}
                aria-label="Close ingredient panel"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            ) : null}
          </div>
          {storyText ? (
            <p
              className={clsx(
                "mt-2 text-lg leading-relaxed",
                isDarkMode ? "text-neutral-200" : "text-neutral-800",
              )}
            >
              {storyText}
            </p>
          ) : null}
        </motion.div>
        {storyAccessory}
        {profileContent ? (
          <motion.div
            key={`integration-profile-${ingredient.id}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut", delay: 0.03 }}
          >
            {profileContent}
          </motion.div>
        ) : null}
      </section>
    );
  };

  const renderInsightsBlock = () => {
    if (!ingredient.extraFacts?.length) return null;

    return (
      <div className="flex flex-col rounded-lg p-2 mb-2 hide-feature">
        <div className={`text-sm font-medium mb-2 flex items-center`}>
          <i
            className={`fa-solid fa-leaf mr-1 ${isDarkMode ? "text-cove-dark" : "text-cove"}`}
          />
          <span
            className={`${isDarkMode ? "text-cove-dark" : "text-cove"} text-xl`}
          >
            Insights
          </span>
        </div>
        <div className="flex flex-col gap-2">
          {ingredient.extraFacts.map((fact, index) => (
            <div
              key={fact.id}
              className={`flex flex-col ${index < (ingredient.extraFacts?.length ?? 0) - 1 ? "pb-2 border-b border-neutral-200 dark:border-neutral-700" : ""}`}
            >
              <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-0.5 hide-feature">
                {fact.label}
              </div>
              <div className="text-base text-neutral-700 dark:text-neutral-300">
                {renderHighlightedContent(fact)}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={enforceDarkMode ? "dark" : undefined}>
      <div className={containerClasses}>
        <div className="flex min-h-0 flex-1 flex-col pb-0">
          <div className={clsx("min-h-0 flex-1 overflow-y-auto pr-1", {})}>
            {renderIntegrationBlock()}
            {renderInsightsBlock()}
            <YieldSensoryCarousel
              ingredient={ingredient}
              resolveIngredient={resolveIngredient}
              isDarkMode={isDarkMode}
            />

            {!!ingredient.articles?.length && (
              <div className="flex flex-col rounded-lg p-2 mb-2 w-fit">
                <div className="font-medium mt-1 mb-2 text-blue-800 dark:text-blue-200 rounded-md w-fit text-sm hide-feature">
                  <i className="fa-solid fa-book-open fa-sm mr-1.5 text-base" />
                  Related Readings
                </div>
                <div className="flex flex-col gap-1.5">
                  {ingredient.articles.map((article) => (
                    <a
                      key={article.id}
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lg text-blue-600 dark:text-blue-300 hover:underline flex items-center gap-1.5"
                    >
                      <i className="fa-solid fa-arrow-up-right-from-square fa-xs" />
                      {article.title}
                    </a>
                  ))}
                </div>
              </div>
            )}
            <SensoryRadarCharts
              ingredient={ingredient}
              ingredientsInPlay={ingredientsInPlay}
              enforceDarkMode={enforceDarkMode}
              isDarkMode={isDarkMode}
            />
          </div>
          {showPersistentAddButton && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="mt-1 rounded-2xl border border-neutral-200/80 bg-gradient-to-t from-white/95 via-white/90 to-white/60 px-2 pt-2 pb-1 backdrop-blur-sm dark:border-neutral-700/80 dark:from-neutral-900/95 dark:via-neutral-900/90 dark:to-neutral-900/60"
            >
              <ComboButton
                ingredientId={onEnter ? undefined : ingredient.id}
                additionalClasses="w-full rounded-xl shadow-[0_8px_24px_rgba(15,23,42,0.35)] hover:scale-[1.01] hover:shadow-[0_10px_28px_rgba(15,23,42,0.45)]"
                canEnterToClick
                keyboardShortcutWidthClasses="w-full"
                customText={onEnter ? "Add" : undefined}
                onCustomClick={onEnter}
              />
            </motion.div>
          )}
        </div>
        <div className="absolute top-2 right-3 flex items-center gap-1 hide-feature">
          {!!ingredient.link && (
            <i
              onClick={() => window.open(ingredient.link, "_blank")}
              className="hidden lg:block cursor-pointer hover:scale-110 p-2 fa-solid fa-arrow-up-right-from-square fa-sm text-neutral-600 dark:text-neutral-200"
            />
          )}
          <i
            onClick={onClose}
            className="lg:hidden cursor-pointer hover:text-black p-2 text-base fa-solid fa-xmark"
          />
        </div>
      </div>
    </div>
  );
}
