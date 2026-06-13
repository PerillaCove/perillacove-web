import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import clsx from "clsx";
import type { PanoramaTourForestWorkspace } from "./types";
import type { IntegrationStoryPayload } from "../Forest/integrationStories";
import type { FocusedIngredientState } from "../../state";
import {
  FOREST_WORKSPACE_SHELL_FRAME_CLASSES,
  FOREST_WORKSPACE_STAGE_INSET_CLASSES,
} from "../Forest/workspaceSurfaceLayout";

const ForestWorkspace = lazy(() => import("../Forest"));

interface TourForestPreviewProps {
  workspace: PanoramaTourForestWorkspace;
  integrationStoriesByIngredient?: Record<string, IntegrationStoryPayload>;
  onIngredientInspect?: (inspection: FocusedIngredientState) => void;
}

function getWorkspaceUiDarkMode(workspace: PanoramaTourForestWorkspace) {
  return workspace.forceDarkMode ?? true;
}

function getWorkspaceSceneDarkMode() {
  return true;
}

function getWorkspaceSpeciesIds(workspace: PanoramaTourForestWorkspace) {
  return workspace.speciesIds ?? workspace.ingredientIds ?? [];
}

function ForestPreviewWorkspace({
  workspace,
  initialIntegrationCockpitOpen = false,
  showIntegrationEntry = false,
  readOnly = true,
  allowReposition = false,
  compactPreviewMode = false,
  forceIntegrationPanelMobile = false,
  speciesCountConfig,
  respawnConfig,
  integrationStoriesByIngredient,
  onCollapsedIntegrationPanelClick,
  onIngredientInspect,
}: {
  workspace: PanoramaTourForestWorkspace;
  initialIntegrationCockpitOpen?: boolean;
  showIntegrationEntry?: boolean;
  readOnly?: boolean;
  allowReposition?: boolean;
  compactPreviewMode?: boolean;
  forceIntegrationPanelMobile?: boolean;
  speciesCountConfig?: Record<string, number>;
  respawnConfig?: Record<string, number>;
  integrationStoriesByIngredient?: Record<string, IntegrationStoryPayload>;
  onCollapsedIntegrationPanelClick?: () => void;
  onIngredientInspect?: (inspection: FocusedIngredientState) => void;
}) {
  const forceDarkMode = getWorkspaceUiDarkMode(workspace);

  return (
    <Suspense
      fallback={
        <div
          className={`flex h-full w-full items-center justify-center text-sm ${
            forceDarkMode
              ? "bg-neutral-950 text-emerald-50/70"
              : "bg-neutral-100 text-neutral-600"
          }`}
        >
          Loading 3D preview...
        </div>
      }
    >
      <ForestWorkspace
        readOnly={readOnly}
        forceDarkMode={forceDarkMode}
        sceneForceDarkMode={getWorkspaceSceneDarkMode()}
        embeddedFullscreen
        initialIntegrationCockpitOpen={initialIntegrationCockpitOpen}
        showIntegrationEntry={showIntegrationEntry}
        allowReposition={allowReposition}
        compactPreviewMode={compactPreviewMode}
        forceIntegrationPanelMobile={forceIntegrationPanelMobile}
        autoStartSimulation
        preferInitialIngredientIds
        initialYear={workspace.initialYear}
        initialDurationOverride={workspace.initialDuration}
        initialIngredientIds={getWorkspaceSpeciesIds(workspace)}
        initialSpeciesCountConfig={
          speciesCountConfig ?? workspace.speciesCountConfig
        }
        initialRespawnConfig={respawnConfig ?? workspace.respawnConfig}
        integrationStoriesByIngredient={integrationStoriesByIngredient}
        onCollapsedIntegrationPanelClick={onCollapsedIntegrationPanelClick}
        onIngredientInspect={onIngredientInspect}
        showGroundDressing={workspace.showGroundDressing ?? true}
        forest3DCameraDistanceScale={workspace.sceneCameraDistanceScale}
        forest3DControlsDefaultExpanded={
          workspace.sceneControlsExpandedDefault ?? false
        }
      />
    </Suspense>
  );
}

function getLifecycleCycleItems(
  workspace: PanoramaTourForestWorkspace,
  speciesCountConfig: Record<string, number>,
  respawnConfig: Record<string, number>,
) {
  return getWorkspaceSpeciesIds(workspace).map((speciesId) => ({
    speciesId,
    label: speciesId.replace(/_/g, " "),
    count: speciesCountConfig[speciesId] ?? 1,
    respawns: respawnConfig[speciesId] ?? 0,
  }));
}

function LifecycleCycleInfo({
  onClose,
  positionClassName,
}: {
  onClose: () => void;
  positionClassName: string;
}) {
  return (
    <motion.div
      className={`hide-feature pointer-events-auto absolute ${positionClassName} z-[100020] w-[min(92vw,420px)] overflow-hidden rounded-xl border border-emerald-100/25 bg-[linear-gradient(145deg,rgba(5,15,12,0.97),rgba(12,22,18,0.96))] text-emerald-50 shadow-[0_18px_54px_rgba(0,0,0,0.45)] backdrop-blur-xl`}
      initial={{ opacity: 0, y: -8, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.99 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    >
      <div className="flex items-start justify-between gap-3 border-b border-emerald-100/12 px-4 py-3">
        <div>
          <div className="text-sm font-semibold uppercase tracking-[0.14em] text-emerald-100/75">
            Lifecycle cycles
          </div>
          <p className="mt-1 text-sm leading-snug text-emerald-50/72">
            These numbers control density and succession timing in the 3D
            forest.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-emerald-100/20 bg-white/[0.06] text-emerald-50/85 transition hover:border-emerald-100/45 hover:bg-white/[0.1]"
          onClick={(event) => {
            event.stopPropagation();
            onClose();
          }}
          aria-label="Close lifecycle cycle explanation"
        >
          <i className="fa-solid fa-xmark text-xs" />
        </button>
      </div>
      <div className="grid gap-2 px-4 py-3 text-sm leading-snug text-emerald-50/78">
        <div className="rounded-lg border border-sky-200/15 bg-sky-400/10 p-3">
          <div className="mb-1 inline-flex items-center gap-2 font-semibold text-sky-100">
            <i className="fa-solid fa-hashtag text-xs" />
            Count
          </div>
          <p>
            How many copies of that species are present in the scene at the same
            time.
          </p>
        </div>
        <div className="rounded-lg border border-emerald-200/15 bg-emerald-400/10 p-3">
          <div className="mb-1 inline-flex items-center gap-2 font-semibold text-emerald-100">
            <i className="fa-solid fa-rotate text-xs" />
            Respawns
          </div>
          <p>
            How many additional lifecycle cycles happen after the first one
            finishes.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function TourForestPreview({
  workspace,
  integrationStoriesByIngredient,
  onIngredientInspect,
}: TourForestPreviewProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isExpanded = searchParams.get("forest3d") === "expanded";
  const openedExpandedFromPreviewRef = useRef(false);
  const [isCyclePanelOpen, setIsCyclePanelOpen] = useState(false);
  const [isCycleInfoOpen, setIsCycleInfoOpen] = useState(false);
  const [speciesCountConfig, setSpeciesCountConfig] = useState<
    Record<string, number>
  >(workspace.speciesCountConfig ?? {});
  const [respawnConfig, setRespawnConfig] = useState<Record<string, number>>(
    workspace.respawnConfig ?? {},
  );
  const forceDarkMode = getWorkspaceUiDarkMode(workspace);
  const workspaceSpeciesCountConfig = workspace.speciesCountConfig;
  const workspaceRespawnConfig = workspace.respawnConfig;
  const workspaceSignature = useMemo(
    () =>
      JSON.stringify({
        ids: getWorkspaceSpeciesIds(workspace),
        counts: workspaceSpeciesCountConfig ?? {},
        respawns: workspaceRespawnConfig ?? {},
      }),
    [workspace, workspaceRespawnConfig, workspaceSpeciesCountConfig],
  );
  const cycleItems = useMemo(
    () => getLifecycleCycleItems(workspace, speciesCountConfig, respawnConfig),
    [workspace, speciesCountConfig, respawnConfig],
  );

  const openExpanded = useCallback(() => {
    if (isExpanded) return;

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("forest3d", "expanded");
    openedExpandedFromPreviewRef.current = true;
    setSearchParams(nextParams);
  }, [isExpanded, searchParams, setSearchParams]);

  const closeExpanded = useCallback(() => {
    if (!isExpanded) return;

    if (openedExpandedFromPreviewRef.current) {
      openedExpandedFromPreviewRef.current = false;
      navigate(-1);
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("forest3d");
    setSearchParams(nextParams, { replace: true });
  }, [isExpanded, navigate, searchParams, setSearchParams]);

  useEffect(() => {
    if (isExpanded) return;
    openedExpandedFromPreviewRef.current = false;
  }, [isExpanded]);

  useEffect(() => {
    if (isExpanded) return;
    setIsCyclePanelOpen(false);
    setIsCycleInfoOpen(false);
  }, [isExpanded]);

  useEffect(() => {
    if (isCyclePanelOpen) return;
    setIsCycleInfoOpen(false);
  }, [isCyclePanelOpen]);

  useEffect(() => {
    setSpeciesCountConfig(workspaceSpeciesCountConfig ?? {});
    setRespawnConfig(workspaceRespawnConfig ?? {});
  }, [workspaceRespawnConfig, workspaceSignature, workspaceSpeciesCountConfig]);

  const adjustCount = (ingredientId: string, delta: number) => {
    setSpeciesCountConfig((prev) => {
      const current = prev[ingredientId] ?? 1;
      const next = Math.max(1, current + delta);
      if (next === 1) {
        if (prev[ingredientId] === undefined) return prev;
        const rest = { ...prev };
        delete rest[ingredientId];
        return rest;
      }
      return { ...prev, [ingredientId]: next };
    });
  };

  const adjustRespawns = (speciesId: string, delta: number) => {
    setRespawnConfig((prev) => {
      const current = prev[speciesId] ?? 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        if (prev[speciesId] === undefined) return prev;
        const rest = { ...prev };
        delete rest[speciesId];
        return rest;
      }
      return { ...prev, [speciesId]: next };
    });
  };

  useEffect(() => {
    if (!isExpanded || typeof window === "undefined") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      closeExpanded();
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () =>
      window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [closeExpanded, isExpanded]);

  if (getWorkspaceSpeciesIds(workspace).length === 0) {
    return null;
  }

  return (
    <>
      <div
        className={`mt-3 overflow-hidden rounded-lg border shadow-[inset_0_0_0_1px_rgba(16,185,129,0.08)] ${
          forceDarkMode
            ? "border-emerald-300/25 bg-neutral-950"
            : "border-neutral-200 bg-neutral-100"
        }`}
      >
        <div className="relative h-[380px] overflow-hidden sm:h-[430px]">
          {isExpanded ? (
            <div
              className={`h-full w-full ${
                forceDarkMode ? "bg-neutral-950" : "bg-neutral-100"
              }`}
              aria-hidden="true"
            />
          ) : (
            <ForestPreviewWorkspace
              workspace={workspace}
              initialIntegrationCockpitOpen
              compactPreviewMode
              forceIntegrationPanelMobile
              speciesCountConfig={speciesCountConfig}
              respawnConfig={respawnConfig}
              integrationStoriesByIngredient={integrationStoriesByIngredient}
              onCollapsedIntegrationPanelClick={openExpanded}
              onIngredientInspect={onIngredientInspect}
            />
          )}
          <div className="pointer-events-none absolute bottom-2.5 right-2.5 z-[100010] flex items-center justify-end">
            <button
              type="button"
              className="pointer-events-auto inline-flex h-8 w-8 items-center justify-center rounded-full border border-emerald-100/30 bg-black/55 text-emerald-50/90 backdrop-blur transition hover:border-emerald-100/55 hover:bg-black/75"
              onClick={(event) => {
                event.stopPropagation();
                openExpanded();
              }}
              aria-label="Expand 3D greenhouse preview"
              title="Expand 3D preview"
            >
              <i className="fa-solid fa-up-right-and-down-left-from-center text-xs" />
            </button>
          </div>
        </div>
      </div>

      {typeof document !== "undefined"
        ? createPortal(
            <AnimatePresence>
              {isExpanded ? (
                <motion.div
                  className="pt-forest-preview-expanded fixed inset-0 z-[150000]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={(event) => event.stopPropagation()}
                >
                  <button
                    type="button"
                    className="absolute inset-0 border-0 bg-black/65 backdrop-blur-[2px]"
                    aria-label="Close expanded 3D greenhouse preview"
                    onClick={(event) => {
                      event.stopPropagation();
                      closeExpanded();
                    }}
                  />
                  <div
                    className={`absolute ${FOREST_WORKSPACE_STAGE_INSET_CLASSES} z-[1]`}
                  >
                    <motion.div
                      className={`${FOREST_WORKSPACE_SHELL_FRAME_CLASSES} shadow-[0_22px_70px_rgba(0,0,0,0.58)] ${
                        forceDarkMode
                          ? "border-emerald-100/25 bg-neutral-950"
                          : "border-neutral-200 bg-neutral-100"
                      }`}
                      initial={{ y: 14, scale: 0.985, opacity: 0 }}
                      animate={{ y: 0, scale: 1, opacity: 1 }}
                      exit={{ y: 10, scale: 0.99, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <ForestPreviewWorkspace
                        workspace={workspace}
                        initialIntegrationCockpitOpen
                        readOnly
                        allowReposition
                        speciesCountConfig={speciesCountConfig}
                        respawnConfig={respawnConfig}
                        integrationStoriesByIngredient={
                          integrationStoriesByIngredient
                        }
                      />
                      <div className="pointer-events-none absolute right-2 top-1/2 z-[100020] -translate-y-1/2 sm:right-3">
                        <div className="pointer-events-auto flex w-[96px] flex-col items-stretch overflow-hidden rounded-2xl border border-white/20 bg-black/55 text-emerald-50 shadow-[0_6px_18px_rgba(0,0,0,0.32)] backdrop-blur-md sm:w-[118px]">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              closeExpanded();
                            }}
                            className="w-full px-2.5 py-2 text-left text-[11px] font-medium uppercase tracking-[0.16em] text-white/75 transition-colors hover:bg-black/20 hover:text-white sm:px-3 sm:text-xs sm:tracking-[0.2em]"
                            aria-label="Back to panoramic tour"
                          >
                            <span className="inline-flex items-center gap-2">
                              <span
                                aria-hidden
                                className="relative -top-px text-sm leading-none"
                              >
                                ←
                              </span>
                              <span>Back</span>
                            </span>
                          </button>
                        </div>
                      </div>
                      <div className="pointer-events-none absolute right-3 top-[4.75rem] z-[100015] flex items-center gap-2 sm:bottom-[9rem] sm:right-4 sm:top-auto">
                        <button
                          type="button"
                          className={`hide-feature pointer-events-auto inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] backdrop-blur transition ${
                            forceDarkMode
                              ? "border-emerald-100/35 bg-black/55 text-emerald-50/92 hover:bg-black/75"
                              : "border-emerald-200 bg-white/92 text-emerald-800 hover:bg-white"
                          }`}
                          onClick={(event) => {
                            event.stopPropagation();
                            setIsCyclePanelOpen((prev) => !prev);
                          }}
                          aria-label="Toggle lifecycle cycle panel"
                        >
                          <i className="fa-solid fa-sliders text-[0.65rem]" />
                          Lifecycle
                          <i
                            className={`fa-solid ${isCyclePanelOpen ? "fa-chevron-up" : "fa-chevron-down"} text-[0.65rem]`}
                          />
                        </button>
                      </div>
                      <AnimatePresence>
                        {isCyclePanelOpen ? (
                          <motion.section
                            className={`hide-feature pointer-events-auto absolute right-3 top-[7.75rem] z-[100015] w-[min(92vw,430px)] overflow-hidden rounded-xl border p-3 backdrop-blur-xl sm:bottom-[12.25rem] sm:right-4 sm:top-auto ${
                              forceDarkMode
                                ? "border-emerald-100/30 bg-black/65 text-emerald-50/92"
                                : "border-neutral-300/90 bg-white/96 text-neutral-900"
                            }`}
                            initial={{ opacity: 0, y: -6, scale: 0.985 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.99 }}
                            transition={{ duration: 0.18, ease: "easeOut" }}
                          >
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="text-xs font-semibold uppercase tracking-[0.1em] opacity-80">
                                Lifecycle
                              </div>
                              <button
                                type="button"
                                className={clsx(
                                  "inline-flex h-7 w-7 items-center justify-center rounded-full border transition",
                                  forceDarkMode
                                    ? "border-emerald-100/35 bg-white/10 text-emerald-50 hover:bg-white/20"
                                    : "border-neutral-300 bg-neutral-100 text-neutral-700 hover:bg-neutral-200",
                                )}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  setIsCycleInfoOpen((prev) => !prev);
                                }}
                                aria-label="Explain lifecycle cycle values"
                              >
                                <i className="fa-regular fa-circle-question text-xs" />
                              </button>
                            </div>
                            <div className="grid max-h-[40dvh] gap-1.5 overflow-auto pr-1 scrollbar-thin">
                              {cycleItems.map((item) => (
                                <div
                                  key={item.speciesId}
                                  className={clsx(
                                    "grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-2 rounded-lg border px-2.5 py-2 text-xs",
                                    forceDarkMode
                                      ? "border-emerald-100/20 bg-white/[0.06]"
                                      : "border-neutral-200 bg-neutral-50",
                                  )}
                                >
                                  <span className="min-w-0 truncate font-medium capitalize">
                                    {item.label}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      className={clsx(
                                        "inline-flex h-6 w-6 items-center justify-center rounded border text-[11px] font-semibold",
                                        forceDarkMode
                                          ? "border-sky-200/30 bg-sky-400/12 text-sky-100"
                                          : "border-sky-300 bg-sky-50 text-sky-800",
                                      )}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        adjustCount(item.speciesId, -1);
                                      }}
                                      aria-label={`Decrease ${item.label} count`}
                                    >
                                      <i className="fa-solid fa-minus" />
                                    </button>
                                    <span
                                      className={clsx(
                                        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5",
                                        forceDarkMode
                                          ? "border-sky-200/20 bg-sky-400/10 text-sky-100"
                                          : "border-sky-300 bg-sky-50 text-sky-800",
                                      )}
                                    >
                                      <i className="fa-solid fa-hashtag text-[0.58rem]" />
                                      {item.count}
                                    </span>
                                    <button
                                      type="button"
                                      className={clsx(
                                        "inline-flex h-6 w-6 items-center justify-center rounded border text-[11px] font-semibold",
                                        forceDarkMode
                                          ? "border-sky-200/30 bg-sky-400/12 text-sky-100"
                                          : "border-sky-300 bg-sky-50 text-sky-800",
                                      )}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        adjustCount(item.speciesId, 1);
                                      }}
                                      aria-label={`Increase ${item.label} count`}
                                    >
                                      <i className="fa-solid fa-plus" />
                                    </button>
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      className={clsx(
                                        "inline-flex h-6 w-6 items-center justify-center rounded border text-[11px] font-semibold",
                                        forceDarkMode
                                          ? "border-emerald-200/25 bg-emerald-400/12 text-emerald-100"
                                          : "border-emerald-300 bg-emerald-50 text-emerald-800",
                                      )}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        adjustRespawns(item.speciesId, -1);
                                      }}
                                      aria-label={`Decrease ${item.label} respawns`}
                                    >
                                      <i className="fa-solid fa-minus" />
                                    </button>
                                    <span
                                      className={clsx(
                                        "inline-flex items-center gap-1 rounded border px-1.5 py-0.5",
                                        forceDarkMode
                                          ? "border-emerald-200/20 bg-emerald-400/10 text-emerald-100"
                                          : "border-emerald-300 bg-emerald-50 text-emerald-800",
                                      )}
                                    >
                                      <i className="fa-solid fa-rotate text-[0.58rem]" />
                                      {item.respawns}
                                    </span>
                                    <button
                                      type="button"
                                      className={clsx(
                                        "inline-flex h-6 w-6 items-center justify-center rounded border text-[11px] font-semibold",
                                        forceDarkMode
                                          ? "border-emerald-200/25 bg-emerald-400/12 text-emerald-100"
                                          : "border-emerald-300 bg-emerald-50 text-emerald-800",
                                      )}
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        adjustRespawns(item.speciesId, 1);
                                      }}
                                      aria-label={`Increase ${item.label} respawns`}
                                    >
                                      <i className="fa-solid fa-plus" />
                                    </button>
                                  </span>
                                </div>
                              ))}
                            </div>
                          </motion.section>
                        ) : null}
                      </AnimatePresence>
                      <AnimatePresence>
                        {isCycleInfoOpen ? (
                          <LifecycleCycleInfo
                            onClose={() => setIsCycleInfoOpen(false)}
                            positionClassName="right-3 top-[7.75rem] sm:bottom-[12.25rem] sm:right-4 sm:top-auto"
                          />
                        ) : null}
                      </AnimatePresence>
                    </motion.div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </>
  );
}
