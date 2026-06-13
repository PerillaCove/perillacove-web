import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSetAtom } from "jotai";
import { useParams } from "react-router-dom";
import PanoramicViewer from "./PanoramicViewer";
import HotspotDetailPanel from "./HotspotDetailPanel";
import TourIntro from "./TourIntro";
import { IsSacredScrollOpenAtom } from "../../state";
import { PANORAMIC_TOURS, sampleTropicalTour } from "./data/sampleTropical";
import type { PanoramicViewerHandle } from "./types";
import type { ControlsLegendAction } from "../ControlsLegend";
import {
  getIntegrationStoryForTourIngredient,
  type IntegrationStoryPayload,
} from "../Forest/integrationStories";
import { normalizePanoramaTourData } from "./tourNormalization";
import { createIngredientResolver } from "../IngredientsPage/data";
import { useDocumentImmersiveBackground } from "./useDocumentImmersiveBackground";
import { resolveHotspotById } from "./hotspotKnowledge";

interface PanoramicTourPageProps {
  isImmersiveMode?: boolean;
}

export default function PanoramicTourPage({
  isImmersiveMode = false,
}: PanoramicTourPageProps) {
  const { tourId } = useParams<{ tourId?: string }>();
  const resolvedTourId = tourId ?? sampleTropicalTour.id;
  const selectedTour = PANORAMIC_TOURS[resolvedTourId] ?? sampleTropicalTour;
  const normalizedTour = useMemo(
    () => normalizePanoramaTourData(selectedTour),
    [selectedTour],
  );
  const hasFallback = !PANORAMIC_TOURS[resolvedTourId];
  const forestWorkspace = normalizedTour.forestWorkspace;
  const hotspotForestPreviewWorkspace = forestWorkspace?.showInHotspotStory
    ? forestWorkspace
    : null;
  const integrationStoriesByIngredient = useMemo<
    Record<string, IntegrationStoryPayload>
  >(() => {
    const workspaceIngredientIds = new Set(
      forestWorkspace?.speciesIds ?? forestWorkspace?.ingredientIds ?? [],
    );
    const stories: Record<string, IntegrationStoryPayload> = {};

    for (const node of normalizedTour.nodes) {
      for (const hotspot of node.hotspots) {
        const ingredientId = hotspot.ingredientId ?? hotspot.id;
        if (!workspaceIngredientIds.has(ingredientId)) continue;
        if (stories[ingredientId]) continue;

        stories[ingredientId] = {
          storyText: hotspot.description,
          storyLabel: "Integration",
        };
      }
    }

    for (const ingredientId of workspaceIngredientIds) {
      if (stories[ingredientId]) continue;
      if (normalizedTour.id === sampleTropicalTour.id) {
        const hotspotStory = resolveHotspotById(ingredientId);
        if (hotspotStory) {
          stories[ingredientId] = {
            storyText: hotspotStory.description,
            storyLabel: "Integration",
          };
          continue;
        }
      }
      const fallbackStory = getIntegrationStoryForTourIngredient(
        normalizedTour.id,
        ingredientId,
      );
      if (fallbackStory) {
        stories[ingredientId] = fallbackStory;
      }
    }

    return stories;
  }, [forestWorkspace, normalizedTour.id, normalizedTour.nodes]);
  const [activeNodeId, setActiveNodeId] = useState(
    normalizedTour.initialNodeId,
  );

  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [isTourMode, setIsTourMode] = useState(false);
  const setIsSacredScrollOpen = useSetAtom(IsSacredScrollOpenAtom);

  const viewerRef = useRef<PanoramicViewerHandle | null>(null);
  const activeNode = useMemo(
    () =>
      normalizedTour.nodes.find((node) => node.id === activeNodeId) ??
      normalizedTour.nodes[0] ??
      null,
    [activeNodeId, normalizedTour.nodes],
  );
  const activeNodeHotspots = useMemo(
    () => activeNode?.hotspots ?? [],
    [activeNode],
  );

  useDocumentImmersiveBackground({
    enabled: isImmersiveMode,
    imageSrc: activeNode?.imageSrc,
  });

  const resolveIngredientById = useMemo(
    () =>
      createIngredientResolver({
        overridesById: normalizedTour.ingredientOverridesById,
      }),
    [normalizedTour.ingredientOverridesById],
  );
  const tourSource = normalizedTour.source;
  const sourceBadgeLabel = tourSource.label;
  const sourceBadgeTextClass = "uppercase tracking-[0.2em]";

  const activeHotspot = useMemo(
    () =>
      activeNodeHotspots.find((hotspot) => hotspot.id === activeHotspotId) ??
      null,
    [activeHotspotId, activeNodeHotspots],
  );
  const activeHotspotIndex = useMemo(
    () =>
      activeHotspotId
        ? activeNodeHotspots.findIndex(
            (hotspot) => hotspot.id === activeHotspotId,
          )
        : -1,
    [activeHotspotId, activeNodeHotspots],
  );

  const stopTour = useCallback(() => {
    setIsTourMode(false);
  }, []);

  useEffect(() => {
    setActiveNodeId(normalizedTour.initialNodeId);
    setActiveHotspotId(null);
    setShowIntro(true);
    setIsTourMode(false);
    stopTour();
  }, [normalizedTour.id, normalizedTour.initialNodeId, stopTour]);

  const focusHotspotByIndex = useCallback(
    (index: number, animate = true) => {
      const hotspot = activeNodeHotspots[index];
      if (!hotspot) return;

      setShowIntro(false);
      setActiveHotspotId(hotspot.id);
      if (hotspot.position.projection === "flat") {
        viewerRef.current?.focusHotspot(
          {
            projection: "flat",
            x: hotspot.position.x,
            y: hotspot.position.y,
            // Disambiguates duplicate-id hotspots (the two cows) in scene3d.
            hotspotId: hotspot.id,
          },
          { animate },
        );
        return;
      }

      viewerRef.current?.focusHotspot(
        {
          projection: "equirectangular",
          yaw: hotspot.position.yaw,
          pitch: hotspot.position.pitch,
        },
        { animate },
      );
    },
    [activeNodeHotspots],
  );

  const focusHotspotByIngredientId = useCallback(
    (ingredientId: string) => {
      const hotspotIndex = activeNodeHotspots.findIndex(
        (hotspot) => (hotspot.ingredientId ?? hotspot.id) === ingredientId,
      );
      if (hotspotIndex < 0) return false;

      focusHotspotByIndex(hotspotIndex, true);
      return true;
    },
    [activeNodeHotspots, focusHotspotByIndex],
  );

  const startTour = useCallback(() => {
    if (!activeNodeHotspots.length) return;

    setShowIntro(false);
    setIsTourMode(true);

    if (activeHotspotIndex >= 0) {
      focusHotspotByIndex(activeHotspotIndex, true);
      return;
    }

    focusHotspotByIndex(0, true);
  }, [activeHotspotIndex, activeNodeHotspots.length, focusHotspotByIndex]);

  const goTourPrevious = useCallback(() => {
    if (!isTourMode) return;
    if (activeHotspotIndex <= 0) return;
    focusHotspotByIndex(activeHotspotIndex - 1, true);
  }, [activeHotspotIndex, focusHotspotByIndex, isTourMode]);

  const goTourNext = useCallback(() => {
    if (!isTourMode) return;
    if (activeHotspotIndex < 0) return;
    if (activeHotspotIndex >= activeNodeHotspots.length - 1) return;
    focusHotspotByIndex(activeHotspotIndex + 1, true);
  }, [
    activeHotspotIndex,
    activeNodeHotspots.length,
    focusHotspotByIndex,
    isTourMode,
  ]);

  const startTourLegendAction = useMemo<ControlsLegendAction | null>(() => {
    if (!activeNodeHotspots.length) return null;

    return {
      label: isTourMode ? "Restart Tour" : "Start Tour",
      onClick: startTour,
      ariaLabel: "Start guided panoramic tour",
      iconClassName: "fa-solid fa-play text-[10px]",
    };
  }, [activeNodeHotspots.length, isTourMode, startTour]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;

      if (isTourMode) {
        stopTour();
      }

      if (activeHotspotId) {
        setActiveHotspotId(null);
        return;
      }

      if (showIntro) {
        setShowIntro(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeHotspotId, isTourMode, showIntro, stopTour]);

  useEffect(() => {
    if (!activeHotspotId) return;

    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      if (target.closest(".pt-hotspot-detail-panel")) return;
      if (target.closest(".pt-viewer-root")) return;
      if (target.closest("#Modal")) return;

      stopTour();
      setActiveHotspotId(null);
    };

    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, [activeHotspotId, stopTour]);

  const pageShellClasses = `relative flex h-dvh min-h-dvh w-full flex-col overflow-hidden bg-[radial-gradient(circle_at_15%_20%,rgba(26,58,42,0.45),transparent_38%),radial-gradient(circle_at_85%_15%,rgba(101,67,33,0.28),transparent_42%),linear-gradient(180deg,#0d1712_0%,#101814_45%,#0f1613_100%)] text-gray-200 ${
    isImmersiveMode
      ? ""
      : "gap-[0.8rem] px-[0.55rem] pb-[0.9rem] pt-[0.65rem] md:px-[1.15rem] md:pb-[1.35rem] md:pt-4"
  }`;
  const viewerClasses = `pt-viewer-root ${
    isImmersiveMode ? "!rounded-none !border-0 !bg-transparent" : ""
  }`;
  const immersiveShellStyle =
    isImmersiveMode && activeNode?.imageSrc
      ? {
          backgroundColor: "#0d1712",
          backgroundImage: `url(${activeNode.imageSrc})`,
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          backgroundSize: "auto 100%",
        }
      : undefined;

  return (
    <div className={pageShellClasses} style={immersiveShellStyle}>
      {!isImmersiveMode ? (
        <div className="z-30 flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="m-0 text-2xl font-semibold leading-[1.15] md:text-4xl">
                {normalizedTour.title}
              </h1>
              {tourSource.url ? (
                <a
                  href={tourSource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`inline-flex items-center gap-1.5 border-l border-emerald-200/40 pl-3 lg:text-base text-xs font-semibold text-emerald-200/85 transition-colors hover:text-emerald-100 ${sourceBadgeTextClass}`}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300/85"
                    aria-hidden="true"
                  />
                  {sourceBadgeLabel}
                </a>
              ) : (
                <span
                  className={`inline-flex items-center gap-1.5 border-l border-emerald-200/40 pl-3 lg:text-base text-xs font-semibold text-emerald-200/85 ${sourceBadgeTextClass}`}
                >
                  <span
                    className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-300/85"
                    aria-hidden="true"
                  />
                  {sourceBadgeLabel}
                </span>
              )}
            </div>
            <p className="mt-[0.22rem] max-w-[42ch] text-lg leading-[1.35] text-gray-200/80 md:mt-[0.35rem] md:max-w-[64ch] md:leading-[1.45]">
              {normalizedTour.subtitle}
            </p>
          </div>
        </div>
      ) : null}

      {hasFallback ? (
        <div
          className="z-20 rounded-[0.8rem] border border-amber-300/45 bg-amber-900/30 px-3 py-[0.45rem] text-[0.86rem] text-amber-200"
          role="status"
        >
          Tour not found, showing sample tropical tour.
        </div>
      ) : null}

      <PanoramicViewer
        ref={viewerRef}
        imageSrc={activeNode?.imageSrc ?? ""}
        projection={activeNode?.projection ?? "flat"}
        className={viewerClasses}
        hotspots={activeNodeHotspots}
        activeHotspotId={activeHotspotId}
        tourAction={startTourLegendAction}
        onHotspotSelect={(hotspotId) => {
          stopTour();
          setShowIntro(false);
          setActiveHotspotId(hotspotId);
        }}
        onBackgroundSelect={() => {
          stopTour();
          setActiveHotspotId(null);
        }}
        autoPanHint
        showControlsLegend={!isImmersiveMode}
      />

      {isImmersiveMode ? (
        <button
          type="button"
          className="fixed left-1/2 top-[calc(env(safe-area-inset-top)+0.75rem)] z-[11000] -translate-x-1/2 rounded-full border border-white/20 bg-black/50 px-4 py-2 text-base font-semibold uppercase tracking-[0.22em] text-white text-shadow shadow-[0_4px_14px_rgba(0,0,0,0.24)] backdrop-blur-sm transition-colors hover:bg-black/65 hover:text-white lg:top-8 lg:text-xl"
          onClick={() => setIsSacredScrollOpen(true)}
          aria-label="Open sacred scroll"
        >
          PerillaCove
        </button>
      ) : null}

      <HotspotDetailPanel
        hotspot={activeHotspot ?? null}
        isOpen={Boolean(activeHotspot)}
        isTourMode={isTourMode}
        canGoPrevious={activeHotspotIndex > 0}
        canGoNext={
          activeHotspotIndex >= 0 &&
          activeHotspotIndex < activeNodeHotspots.length - 1
        }
        onClose={() => {
          stopTour();
          setActiveHotspotId(null);
        }}
        onPrevious={goTourPrevious}
        onNext={goTourNext}
        onIngredientSelect={focusHotspotByIngredientId}
        resolveIngredientById={resolveIngredientById}
        forestPreviewWorkspace={hotspotForestPreviewWorkspace}
        integrationStoriesByIngredient={integrationStoriesByIngredient}
      />

      {showIntro && !isImmersiveMode ? (
        <TourIntro
          title={normalizedTour.title}
          subtitle={normalizedTour.subtitle}
          sourceBadge={tourSource}
          onStart={() => setShowIntro(false)}
        />
      ) : null}
    </div>
  );
}
