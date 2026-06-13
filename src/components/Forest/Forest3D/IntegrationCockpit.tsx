import {
  Suspense,
  lazy,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import clsx from "clsx";
import { useSetAtom } from "jotai";
import type { Ingredient } from "../../IngredientsPage/types";
import type {
  DimensionGrouping,
  PositionOverrides,
  RespawnConfig,
  SpeciesCountConfig,
} from "../types";
import { IsSacredScrollOpenAtom } from "../../../state";
import Forest3D from "./index";
import {
  ELEMENT_COLORS,
  ELEMENT_ICONS,
  ELEMENT_LABELS,
} from "../substrate/labels";
import type { ElementId } from "../substrate/types";
import { buildIntegrationScene } from "../substrate/scene";
import { resolveIntegrationScene } from "../substrate/engine";
import { explainIntegrationReading } from "../substrate/explain";
import { arrangeIntegrationScene } from "../substrate/scene/placement";
import {
  getOverallIntegrationColor,
  INTEGRATION_HIGH_THRESHOLD,
  INTEGRATION_POOR_THRESHOLD,
} from "./integrationColors";

const Modal = lazy(() => import("../../Modal"));
const ElementIntegrationDetailsModal = lazy(
  () => import("./ElementIntegrationDetailsModal"),
);

interface IntegrationCockpitProps {
  ingredients: Ingredient[];
  year: number;
  isDraggingTime?: boolean;
  isSimulating?: boolean;
  isDarkMode: boolean;
  soilGrouping?: DimensionGrouping;
  respawnConfig?: RespawnConfig;
  speciesCountConfig?: SpeciesCountConfig;
  positionOverrides: PositionOverrides;
  onPositionChange?: (
    volumeId: string,
    position: { x: number; z: number },
  ) => void;
  onArrange: (positionOverrides: PositionOverrides) => void;
  onClose: () => void;
  canClose?: boolean;
  readOnly?: boolean;
  showGroundDressing?: boolean;
  cameraDistanceScale?: number;
  controlsDefaultExpanded?: boolean;
  onVolumeClick?: (ingredientId: string) => void;
  showOverlays?: boolean;
  forceMobilePanel?: boolean;
  onCollapsedPanelClick?: () => void;
}

const RADAR_ORDER: ElementId[] = ["fire", "water", "earth", "air"];
const LIVE_RESOLVE_INTERVAL_MS = 250;
const DISPLAY_EASING_PER_SECOND = 8;

interface IntegrationDisplayValues extends Record<ElementId, number> {
  overall: number;
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;
  const r = parseInt(expanded.slice(0, 2), 16);
  const g = parseInt(expanded.slice(2, 4), 16);
  const b = parseInt(expanded.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function scoreClasses(score: number, isDarkMode: boolean): string {
  if (score >= INTEGRATION_HIGH_THRESHOLD) {
    return isDarkMode
      ? "bfg-emerald-500/20 text-emerald-300 border-emerald-500/40"
      : "bfg-emerald-50 text-emerald-700 border-emerald-200";
  }
  if (score >= INTEGRATION_POOR_THRESHOLD) {
    return isDarkMode
      ? "bfg-amber-500/20 text-amber-300 border-amber-500/40"
      : "bfg-amber-50 text-amber-700 border-amber-200";
  }
  return isDarkMode
    ? "bfg-red-500/20 text-red-300 border-red-500/40"
    : "bfg-red-50 text-red-700 border-red-200";
}

function getElementGradient(element: ElementId | null): string {
  if (!element) {
    return `linear-gradient(90deg, ${getOverallIntegrationColor(
      0,
    )} 0%, ${getOverallIntegrationColor(
      INTEGRATION_POOR_THRESHOLD,
    )} 42%, ${getOverallIntegrationColor(
      INTEGRATION_HIGH_THRESHOLD,
    )} 72%, ${getOverallIntegrationColor(1)} 100%)`;
  }

  const color = ELEMENT_COLORS[element];
  return `linear-gradient(90deg, ${hexToRgba(color, 0.12)} 0%, ${hexToRgba(
    color,
    0.46,
  )} 52%, ${color} 100%)`;
}

function displayValuesFromReading(
  reading: ReturnType<typeof resolveIntegrationScene>,
): IntegrationDisplayValues {
  return {
    overall: reading.overallIntegration,
    fire: reading.elements.fire.integration,
    water: reading.elements.water.integration,
    earth: reading.elements.earth.integration,
    air: reading.elements.air.integration,
  };
}

function useAnimatedIntegrationValues(
  target: IntegrationDisplayValues,
): IntegrationDisplayValues {
  const [display, setDisplay] = useState(target);
  const targetRef = useRef(target);
  const displayRef = useRef(target);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    targetRef.current = target;
    if (typeof window === "undefined") {
      setDisplay(target);
      return;
    }

    if (animationRef.current !== null) {
      window.cancelAnimationFrame(animationRef.current);
    }

    let lastTime = window.performance.now();

    const tick = (now: number) => {
      const deltaSeconds = Math.min(0.05, (now - lastTime) / 1000);
      lastTime = now;
      const easing = 1 - Math.exp(-DISPLAY_EASING_PER_SECOND * deltaSeconds);
      const current = displayRef.current;
      const latest = targetRef.current;
      const next = { ...current };
      let maxDelta = 0;

      for (const key of ["overall", ...RADAR_ORDER] as const) {
        const value = current[key] + (latest[key] - current[key]) * easing;
        const delta = Math.abs(value - latest[key]);
        maxDelta = Math.max(maxDelta, delta);
        if (delta > 0.001) {
          next[key] = value;
        } else {
          next[key] = latest[key];
        }
      }

      displayRef.current = next;
      setDisplay(next);

      if (maxDelta <= 0.001) {
        animationRef.current = null;
        return;
      }

      animationRef.current = window.requestAnimationFrame(tick);
    };

    animationRef.current = window.requestAnimationFrame(tick);
    return () => {
      if (animationRef.current !== null) {
        window.cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [target]);

  return display;
}

function RadarChart({
  values,
  isDarkMode,
  selectedElement,
  onSelect,
}: {
  values: Record<ElementId, number>;
  isDarkMode: boolean;
  selectedElement: ElementId | null;
  onSelect: (element: ElementId, event: MouseEvent) => void;
}) {
  const size = 220;
  const center = size / 2;
  const radius = 76;
  const points = RADAR_ORDER.map((element, index) => {
    const angle = -Math.PI / 2 + (index / RADAR_ORDER.length) * Math.PI * 2;
    const value = values[element];
    return {
      element,
      x: center + Math.cos(angle) * radius * value,
      y: center + Math.sin(angle) * radius * value,
      axisX: center + Math.cos(angle) * radius,
      axisY: center + Math.sin(angle) * radius,
      labelX: center + Math.cos(angle) * (radius + 24),
      labelY: center + Math.sin(angle) * (radius + 24),
    };
  });
  const polygon = points.map((point) => `${point.x},${point.y}`).join(" ");
  const selectedPoint = selectedElement
    ? points.find((point) => point.element === selectedElement)
    : null;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="h-[220px] w-full">
      {[0.33, 0.66, 1].map((ring) => (
        <circle
          key={ring}
          cx={center}
          cy={center}
          r={radius * ring}
          fill="none"
          stroke={isDarkMode ? "rgba(148,163,184,0.7)" : "rgba(15,23,42,0.52)"}
          strokeWidth="1.7"
        />
      ))}
      {selectedPoint ? (
        <g>
          <line
            x1={center}
            y1={center}
            x2={selectedPoint.axisX}
            y2={selectedPoint.axisY}
            stroke={
              isDarkMode ? "rgba(148,163,184,0.42)" : "rgba(15,23,42,0.32)"
            }
            strokeWidth="1.4"
          />
          <line
            x1={center}
            y1={center}
            x2={selectedPoint.x}
            y2={selectedPoint.y}
            stroke={ELEMENT_COLORS[selectedPoint.element]}
            strokeLinecap="round"
            strokeWidth="4"
          />
          <circle
            cx={selectedPoint.x}
            cy={selectedPoint.y}
            r="6"
            fill={ELEMENT_COLORS[selectedPoint.element]}
            onClick={(event) => onSelect(selectedPoint.element, event)}
            style={{ cursor: "pointer" }}
          />
          <foreignObject
            x={selectedPoint.labelX - 11}
            y={selectedPoint.labelY - 11}
            width={22}
            height={22}
          >
            <button
              type="button"
              title={ELEMENT_LABELS[selectedPoint.element]}
              aria-label={`${ELEMENT_LABELS[selectedPoint.element]} axis`}
              onClick={(event) => onSelect(selectedPoint.element, event)}
              className={clsx(
                "h-[22px] w-[22px] border-0 bg-transparent p-0 transition-transform hover:scale-110",
                "flex items-center justify-center",
                isDarkMode ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" : "",
              )}
              style={{
                color: ELEMENT_COLORS[selectedPoint.element],
                cursor: "pointer",
              }}
            >
              <i
                className={`fa-regular ${ELEMENT_ICONS[selectedPoint.element]} text-lg`}
              />
            </button>
          </foreignObject>
        </g>
      ) : (
        <>
          {points.map((point) => (
            <line
              key={point.element}
              x1={center}
              y1={center}
              x2={point.axisX}
              y2={point.axisY}
              stroke={
                isDarkMode ? "rgba(148,163,184,0.58)" : "rgba(15,23,42,0.4)"
              }
              strokeWidth="1.35"
            />
          ))}
          <polygon
            points={polygon}
            fill="rgba(16,185,129,0.28)"
            stroke="#22d3a7"
            strokeWidth="2"
          />
          {points.map((point) => (
            <g key={point.element}>
              <circle
                cx={point.x}
                cy={point.y}
                r="5"
                fill={ELEMENT_COLORS[point.element]}
                onClick={(event) => onSelect(point.element, event)}
                style={{ cursor: "pointer" }}
              />
              <foreignObject
                x={point.labelX - 9}
                y={point.labelY - 9}
                width={18}
                height={18}
              >
                <button
                  type="button"
                  title={ELEMENT_LABELS[point.element]}
                  aria-label={`${ELEMENT_LABELS[point.element]} axis`}
                  onClick={(event) => onSelect(point.element, event)}
                  className={clsx(
                    "h-[18px] w-[18px] border-0 bg-transparent p-0 transition-transform hover:scale-110",
                    "flex items-center justify-center",
                    isDarkMode ? "drop-shadow-[0_1px_2px_rgba(0,0,0,0.7)]" : "",
                  )}
                  style={{
                    color: ELEMENT_COLORS[point.element],
                    cursor: "pointer",
                  }}
                >
                  <i
                    className={`fa-regular ${ELEMENT_ICONS[point.element]} text-lg`}
                  />
                </button>
              </foreignObject>
            </g>
          ))}
        </>
      )}
    </svg>
  );
}

export default function IntegrationCockpit({
  ingredients,
  year,
  isDraggingTime = false,
  isSimulating = false,
  isDarkMode,
  soilGrouping,
  respawnConfig,
  speciesCountConfig,
  positionOverrides,
  onPositionChange,
  onArrange,
  onClose,
  canClose = true,
  readOnly = false,
  showGroundDressing = true,
  cameraDistanceScale,
  controlsDefaultExpanded,
  onVolumeClick,
  showOverlays = true,
  forceMobilePanel = false,
  onCollapsedPanelClick,
}: IntegrationCockpitProps) {
  const [settledYear, setSettledYear] = useState(year);
  const latestYearRef = useRef(year);
  const lastLiveResolveRef = useRef(0);
  const trailingLiveResolveRef = useRef<number | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementId | null>(
    null,
  );
  const [infoElement, setInfoElement] = useState<ElementId | null>(null);
  const [isPanelExpanded, setIsPanelExpanded] = useState(() =>
    forceMobilePanel
      ? false
      : typeof window === "undefined"
        ? true
        : window.matchMedia("(min-width: 768px)").matches,
  );
  const setIsSacredScrollOpen = useSetAtom(IsSacredScrollOpenAtom);

  useEffect(() => {
    latestYearRef.current = year;
    if (typeof window === "undefined") {
      setSettledYear(year);
      return;
    }

    if (isDraggingTime) return;

    if (!isSimulating) {
      if (trailingLiveResolveRef.current !== null) {
        window.clearTimeout(trailingLiveResolveRef.current);
        trailingLiveResolveRef.current = null;
      }
      const timer = window.setTimeout(() => {
        lastLiveResolveRef.current = window.performance.now();
        setSettledYear(latestYearRef.current);
      }, 80);
      return () => window.clearTimeout(timer);
    }

    const now = window.performance.now();
    const elapsed = now - lastLiveResolveRef.current;
    if (elapsed >= LIVE_RESOLVE_INTERVAL_MS) {
      if (trailingLiveResolveRef.current !== null) {
        window.clearTimeout(trailingLiveResolveRef.current);
        trailingLiveResolveRef.current = null;
      }
      lastLiveResolveRef.current = now;
      setSettledYear(year);
      return;
    }

    if (trailingLiveResolveRef.current === null) {
      trailingLiveResolveRef.current = window.setTimeout(() => {
        trailingLiveResolveRef.current = null;
        lastLiveResolveRef.current = window.performance.now();
        setSettledYear(latestYearRef.current);
      }, LIVE_RESOLVE_INTERVAL_MS - elapsed);
    }
  }, [isDraggingTime, isSimulating, year]);

  useEffect(
    () => () => {
      if (trailingLiveResolveRef.current !== null) {
        window.clearTimeout(trailingLiveResolveRef.current);
      }
    },
    [],
  );

  useEffect(() => {
    if (forceMobilePanel) {
      setIsPanelExpanded(false);
      return;
    }
    if (typeof window === "undefined") return;
    const mediaQuery = window.matchMedia("(min-width: 768px)");
    const syncPanelState = () => setIsPanelExpanded(mediaQuery.matches);

    syncPanelState();
    mediaQuery.addEventListener("change", syncPanelState);
    return () => mediaQuery.removeEventListener("change", syncPanelState);
  }, [forceMobilePanel]);

  const scene = useMemo(
    () =>
      buildIntegrationScene({
        ingredients,
        year: settledYear,
        soilGrouping,
        respawnConfig,
        speciesCountConfig,
        positionOverrides,
      }),
    [
      ingredients,
      positionOverrides,
      respawnConfig,
      settledYear,
      soilGrouping,
      speciesCountConfig,
    ],
  );

  const reading = useMemo(
    () => resolveIntegrationScene(scene, settledYear),
    [scene, settledYear],
  );
  const targetDisplayValues = useMemo(
    () => displayValuesFromReading(reading),
    [reading],
  );
  const displayValues = useAnimatedIntegrationValues(targetDisplayValues);
  const explanation = useMemo(
    () => explainIntegrationReading(reading),
    [reading],
  );
  const radarValues = useMemo(
    () => ({
      fire: displayValues.fire,
      water: displayValues.water,
      earth: displayValues.earth,
      air: displayValues.air,
    }),
    [displayValues],
  );
  const selectedReading = selectedElement
    ? reading.elements[selectedElement]
    : null;

  const handleArrange = () => {
    onArrange(arrangeIntegrationScene(scene, positionOverrides));
  };

  const handleElementToggle = (element: ElementId) => {
    setSelectedElement((current) => (current === element ? null : element));
  };

  const handleElementSelect = (element: ElementId, event: MouseEvent) => {
    event.stopPropagation();
    handleElementToggle(element);
  };

  const selectedIntegration = selectedReading
    ? displayValues[selectedElement!]
    : displayValues.overall;

  const selectedHeading = selectedElement
    ? `${ELEMENT_LABELS[selectedElement]} Integration`
    : "Integration";
  const accentColor = selectedElement
    ? ELEMENT_COLORS[selectedElement]
    : getOverallIntegrationColor(selectedIntegration);
  const scoreBadgeStyle = {
    borderColor: hexToRgba(accentColor, 0.6),
    // backgroundColor: hexToRgba(accentColor, 0.2),
    color: accentColor,
  };
  const integrationGradient = getElementGradient(selectedElement);
  const roundedScore = Math.round(selectedIntegration * 100);
  const isPanelCollapsed = !isPanelExpanded;

  return (
    <div
      className={clsx(
        "relative h-full overflow-hidden rounded-xl",
        forceMobilePanel ? "min-h-0" : "min-h-[500px]",
      )}
    >
      <Forest3D
        ingredients={ingredients}
        year={year}
        structures={{ separateSoil: soilGrouping?.enabled ?? false }}
        isDarkMode={isDarkMode}
        isSimulating={isSimulating}
        soilGrouping={soilGrouping}
        respawnConfig={respawnConfig}
        speciesCountConfig={speciesCountConfig}
        positionOverrides={positionOverrides}
        onPositionChange={onPositionChange}
        readOnly={readOnly}
        showGroundDressing={showGroundDressing}
        cameraDistanceScale={cameraDistanceScale}
        controlsDefaultExpanded={controlsDefaultExpanded}
        showOverlays={showOverlays}
        className="rounded-none"
        onVolumeClick={onVolumeClick}
        integrationOverlay={{ reading, element: selectedElement }}
      />

      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col justify-between gap-3 p-3 lg:p-4">
        <div className="flex items-start justify-between gap-3">
          <section
            className={clsx(
              "pointer-events-auto overflow-hidden rounded-xl border shadow-xl backdrop-blur-md transition-[height,width,padding] duration-300",
              "border-white/10 bg-neutral-900/82 text-neutral-100",
              isPanelCollapsed
                ? "h-20 w-20 p-2"
                : "w-[min(380px,calc(100vw-2rem))] p-3",
            )}
            onClick={(event) => {
              event.stopPropagation();
              if (isPanelCollapsed) {
                if (onCollapsedPanelClick) {
                  onCollapsedPanelClick();
                } else {
                  setIsPanelExpanded(true);
                }
                return;
              }
              if (selectedElement) {
                setSelectedElement(null);
              }
            }}
            onKeyDown={(event) => {
              if (!isPanelCollapsed) return;
              if (event.key !== "Enter" && event.key !== " ") return;
              event.preventDefault();
              event.stopPropagation();
              if (onCollapsedPanelClick) {
                onCollapsedPanelClick();
              } else {
                setIsPanelExpanded(true);
              }
            }}
            role={isPanelCollapsed ? "button" : undefined}
            tabIndex={isPanelCollapsed ? 0 : undefined}
            style={{
              borderColor: hexToRgba(accentColor, 0.42),
              backgroundColor: hexToRgba("#0f172a", 0.84),
            }}
          >
            {isPanelCollapsed ? (
              <div className="flex h-full w-full flex-col items-center justify-around gap-1">
                <i
                  className="fa-regular fa-chart-radar text-2xl"
                  style={{ color: accentColor }}
                />
                <span className="text-xl font-bold leading-none tabular-nums">
                  {roundedScore}
                </span>
              </div>
            ) : (
              <>
                <div className="relative mb-3 w-full">
                  <div className="mx-auto flex flex-col items-center text-center w-full">
                    <div className="flex w-full items-center justify-center gap-2 text-lg font-semibold uppercase tracking-wide opacity-70">
                      <span>{selectedHeading}</span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setIsSacredScrollOpen(true);
                        }}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-amber-100/80 transition-colors hover:bg-white/10 hover:text-amber-50"
                        aria-label="Open sacred scroll"
                      >
                        <i
                          className="fa-regular fa-scroll-old text-lg"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                    <div
                      className={clsx(
                        "my-1 gap-2 flex justify-center items-end w-full",
                        !selectedElement &&
                          scoreClasses(selectedIntegration, true),
                      )}
                      style={scoreBadgeStyle}
                    >
                      <span className="text-4xl font-bold tabular-nums">
                        {roundedScore}
                      </span>
                      <span className="pb-1 text-sm font-semibold">/ 100</span>
                    </div>
                  </div>
                  <div className="absolute right-0 top-0 flex items-start gap-1">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setIsPanelExpanded((current) => !current);
                      }}
                      className={clsx(
                        "rounded-lg p-2 transition-colors",
                        !forceMobilePanel && "md:hidden",
                        isDarkMode
                          ? "text-neutral-300 hover:bg-white/10"
                          : "text-neutral-600 hover:bg-neutral-100",
                      )}
                      aria-label={
                        isPanelExpanded
                          ? "Collapse integration panel"
                          : "Expand integration panel"
                      }
                      aria-expanded={isPanelExpanded}
                    >
                      <i
                        className={clsx(
                          "fa-solid fa-chevron-down text-sm transition-transform duration-300",
                          isPanelExpanded && "rotate-180",
                        )}
                      />
                    </button>
                    {canClose ? (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onClose();
                        }}
                        className={clsx(
                          "rounded-lg p-2 transition-colors",
                          isDarkMode
                            ? "text-neutral-300 hover:bg-white/10"
                            : "text-neutral-600 hover:bg-neutral-100",
                        )}
                        aria-label="Close integration cockpit"
                      >
                        <i className="fa-solid fa-xmark" />
                      </button>
                    ) : null}
                  </div>
                </div>
                <div
                  className="mt-3 h-2.5 rounded-full border border-white/10 shadow-inner"
                  style={{ backgroundImage: integrationGradient }}
                  aria-hidden="true"
                />
                <div
                  className={clsx(
                    "grid transition-[grid-template-rows] duration-300 ease-out",
                    isPanelExpanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
                  )}
                >
                  <div className="overflow-hidden">
                    <div className="mt-3 grid grid-cols-4 gap-2">
                      {RADAR_ORDER.map((element) => (
                        <button
                          key={element}
                          type="button"
                          onClick={(event) =>
                            handleElementSelect(element, event)
                          }
                          title={ELEMENT_LABELS[element]}
                          aria-label={`${ELEMENT_LABELS[element]} integration`}
                          className={clsx(
                            "min-h-[66px] rounded-lg border px-2 py-2 text-sm transition-colors",
                            "flex items-center justify-center text-center",
                            selectedElement === element
                              ? "text-neutral-100"
                              : isDarkMode
                                ? "border-white/10 bg-white/5 hover:bg-white/10"
                                : "border-white/10 bg-white/5 hover:bg-white/10",
                          )}
                          style={
                            selectedElement === element
                              ? {
                                  borderColor: hexToRgba(
                                    ELEMENT_COLORS[element],
                                    0.7,
                                  ),
                                  backgroundColor: hexToRgba(
                                    ELEMENT_COLORS[element],
                                    0.24,
                                  ),
                                }
                              : undefined
                          }
                        >
                          <i
                            className={`fa-regular ${ELEMENT_ICONS[element]} text-2xl`}
                            style={{ color: ELEMENT_COLORS[element] }}
                          />
                        </button>
                      ))}
                    </div>
                    <div className="mt-3 w-full">
                      <RadarChart
                        values={radarValues}
                        isDarkMode={isDarkMode}
                        selectedElement={selectedElement}
                        onSelect={handleElementSelect}
                      />
                    </div>
                    {selectedElement && (
                      <div className="mt-3 flex justify-center">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setInfoElement(selectedElement);
                          }}
                          className={clsx(
                            "rounded-lg px-3 py-2 text-sm font-semibold",
                            isDarkMode
                              ? "hover:bg-white/10"
                              : "hover:bg-neutral-50",
                          )}
                        >
                          <i className="fa-regular fa-circle-info mr-1.5 text-xs" />
                          Details
                        </button>
                      </div>
                    )}
                    {!readOnly && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleArrange();
                        }}
                        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-500"
                      >
                        <i className="fa-solid fa-wand-magic-sparkles text-xs" />
                        Arrange this for me
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {infoElement && typeof document !== "undefined"
        ? createPortal(
            <Suspense fallback={null}>
              <Modal
                widthClasses="w-[min(92vw,720px)]"
                heightClasses="max-h-[86vh]"
                backgroundColorClasses="bg-neutral-950/95"
                zIndexClasses="z-[200000]"
                backdropOpacity={0.46}
                onDismiss={() => setInfoElement(null)}
              >
                <ElementIntegrationDetailsModal
                  element={infoElement}
                  currentReading={explanation.byElement[infoElement]}
                  bundle={reading.elements[infoElement].bundle}
                  onClose={() => setInfoElement(null)}
                />
              </Modal>
            </Suspense>,
            document.body,
          )
        : null}
    </div>
  );
}
