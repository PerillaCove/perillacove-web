import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import HotspotMarker from "./HotspotMarker";
import {
  MIN_ZOOM,
  clampOffsetX,
  clampZoom,
  centerOffsetForHotspot,
  getBaseScale,
  getCenteredOffsetX,
  getOffsetBounds,
  screenPointToImagePercent,
  stepInertia,
  zoomOffsetAtAnchor,
} from "./panMath";
import ControlsLegend from "../ControlsLegend";
import type { ControlsLegendAction } from "../ControlsLegend";
import {
  PT_HOTSPOT_BADGE_DOT_SHADOW,
  PT_HOTSPOT_DOT_BACKGROUND,
} from "./uiClasses";
import type { PanView, ViewerMetrics } from "./types";

const AUTO_PAN_MS = 3400;
const CENTER_ANIMATE_MS = 460;
const CLICK_GUARD_MS = 120;
const DRAG_THRESHOLD_PX = 4;

type DragState = {
  active: boolean;
  pointerId: number | null;
  startX: number;
  startOffsetX: number;
  lastX: number;
  lastT: number;
  velocityPxPerMs: number;
  moved: boolean;
};

type PinchState = {
  distance: number;
  midX: number;
};

interface PanoramicViewerProps {
  imageSrc: string;
  hotspots: FlatViewerHotspot[];
  activeHotspotId?: string | null;
  onHotspotSelect?: (hotspotId: string) => void;
  onBackgroundSelect?: () => void;
  onCoordinatePick?: (point: {
    projection: "flat";
    x: number;
    y: number;
  }) => void;
  tourAction?: ControlsLegendAction | null;
  autoPanHint?: boolean;
  showControlsLegend?: boolean;
  className?: string;
}

export interface FlatViewerHotspot {
  id: string;
  speciesName: string;
  shortLabel: string;
  x: number;
  y: number;
}

export interface FlatPanoramicViewerHandle {
  focusHotspot: (xPercent: number, options?: { animate?: boolean }) => void;
  resetView: () => void;
}

function toPinchState(
  pointers: Map<number, { x: number; y: number }>,
): PinchState | null {
  const entries = [...pointers.values()];
  if (entries.length < 2) return null;

  const [a, b] = entries;
  const dx = a.x - b.x;
  const dy = a.y - b.y;

  return {
    distance: Math.hypot(dx, dy),
    midX: (a.x + b.x) * 0.5,
  };
}

function easeInOutSine(t: number): number {
  return -(Math.cos(Math.PI * t) - 1) * 0.5;
}

const FlatPanoramicViewer = forwardRef<
  FlatPanoramicViewerHandle,
  PanoramicViewerProps
>(function FlatPanoramicViewer(
  {
    imageSrc,
    hotspots,
    activeHotspotId = null,
    onHotspotSelect,
    onBackgroundSelect,
    onCoordinatePick,
    tourAction = null,
    autoPanHint = true,
    showControlsLegend = true,
    className,
  },
  ref,
) {
  const stageRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState>({
    active: false,
    pointerId: null,
    startX: 0,
    startOffsetX: 0,
    lastX: 0,
    lastT: 0,
    velocityPxPerMs: 0,
    moved: false,
  });

  const pointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStateRef = useRef<PinchState | null>(null);
  const suppressClickUntilRef = useRef(0);

  const inertiaRafRef = useRef<number | null>(null);
  const panAnimationRafRef = useRef<number | null>(null);

  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [imageNaturalSize, setImageNaturalSize] = useState({
    width: 0,
    height: 0,
  });

  const [view, setView] = useState<PanView>({
    zoom: MIN_ZOOM,
    offsetX: 0,
  });
  const [isLocatorHovered, setIsLocatorHovered] = useState(false);
  const [isLocatorPinned, setIsLocatorPinned] = useState(false);

  const viewRef = useRef(view);
  const userInteractedRef = useRef(false);
  const autoplayCompleteRef = useRef(false);
  const layoutResetKeyRef = useRef("");

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const metrics = useMemo<ViewerMetrics | null>(() => {
    if (
      containerSize.width <= 0 ||
      containerSize.height <= 0 ||
      imageNaturalSize.width <= 0 ||
      imageNaturalSize.height <= 0
    ) {
      return null;
    }

    return {
      containerWidth: containerSize.width,
      containerHeight: containerSize.height,
      imageNaturalWidth: imageNaturalSize.width,
      imageNaturalHeight: imageNaturalSize.height,
    };
  }, [containerSize, imageNaturalSize]);

  const stopInertia = useCallback(() => {
    if (inertiaRafRef.current !== null) {
      cancelAnimationFrame(inertiaRafRef.current);
      inertiaRafRef.current = null;
    }
  }, []);

  const stopPanAnimation = useCallback(() => {
    if (panAnimationRafRef.current !== null) {
      cancelAnimationFrame(panAnimationRafRef.current);
      panAnimationRafRef.current = null;
    }
  }, []);

  const stopAllMotion = useCallback(() => {
    stopInertia();
    stopPanAnimation();
  }, [stopInertia, stopPanAnimation]);

  const applyView = useCallback(
    (nextZoom: number, nextOffsetX: number) => {
      if (!metrics) return;

      const clampedZoom = clampZoom(nextZoom);
      const clampedOffsetX = clampOffsetX(nextOffsetX, metrics, clampedZoom);
      const next: PanView = { zoom: clampedZoom, offsetX: clampedOffsetX };

      viewRef.current = next;
      setView(next);
    },
    [metrics],
  );

  const animateOffsetTo = useCallback(
    (targetOffsetX: number, durationMs: number) => {
      if (!metrics) return;

      stopPanAnimation();
      const startOffsetX = viewRef.current.offsetX;
      const start = performance.now();

      const tick = (now: number) => {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / durationMs);
        const eased = easeInOutSine(progress);
        const offset = startOffsetX + (targetOffsetX - startOffsetX) * eased;

        applyView(viewRef.current.zoom, offset);

        if (progress < 1) {
          panAnimationRafRef.current = requestAnimationFrame(tick);
        } else {
          panAnimationRafRef.current = null;
        }
      };

      panAnimationRafRef.current = requestAnimationFrame(tick);
    },
    [applyView, metrics, stopPanAnimation],
  );

  const startInertia = useCallback(
    (initialVelocityPxPerMs: number) => {
      if (!metrics) return;

      stopInertia();

      let velocity = initialVelocityPxPerMs;
      let last = performance.now();

      const tick = (now: number) => {
        const deltaMs = Math.max(1, now - last);
        last = now;

        const step = stepInertia({
          velocityPxPerMs: velocity,
          deltaMs,
        });

        velocity = step.velocityPxPerMs;

        if (step.done) {
          inertiaRafRef.current = null;
          return;
        }

        const current = viewRef.current;
        const unclampedOffset = current.offsetX + step.deltaPx;
        const clampedOffset = clampOffsetX(
          unclampedOffset,
          metrics,
          current.zoom,
        );

        applyView(current.zoom, clampedOffset);

        if (Math.abs(unclampedOffset - clampedOffset) > 0.25) {
          inertiaRafRef.current = null;
          return;
        }

        inertiaRafRef.current = requestAnimationFrame(tick);
      };

      inertiaRafRef.current = requestAnimationFrame(tick);
    },
    [applyView, metrics, stopInertia],
  );

  useEffect(() => {
    const node = stageRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      setContainerSize({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!metrics) return;

    const layoutKey = [
      imageSrc,
      metrics.containerWidth,
      metrics.containerHeight,
      metrics.imageNaturalWidth,
      metrics.imageNaturalHeight,
    ].join(":");

    if (layoutResetKeyRef.current === layoutKey) return;
    layoutResetKeyRef.current = layoutKey;

    const centeredOffset = getCenteredOffsetX(metrics, MIN_ZOOM);

    viewRef.current = { zoom: MIN_ZOOM, offsetX: centeredOffset };
    setView({ zoom: MIN_ZOOM, offsetX: centeredOffset });
    stopAllMotion();

    autoplayCompleteRef.current = false;
    userInteractedRef.current = false;
  }, [imageSrc, metrics, stopAllMotion]);

  useEffect(() => {
    if (!metrics || !autoPanHint || autoplayCompleteRef.current) return;
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      autoplayCompleteRef.current = true;
      return;
    }

    if (userInteractedRef.current) return;

    const bounds = getOffsetBounds(metrics, viewRef.current.zoom);
    const panRange = Math.abs(bounds.max - bounds.min);

    if (panRange < 120) {
      autoplayCompleteRef.current = true;
      return;
    }

    autoplayCompleteRef.current = true;

    const startOffset = viewRef.current.offsetX;
    const targetOffset = clampOffsetX(
      startOffset - Math.min(180, panRange * 0.18),
      metrics,
      viewRef.current.zoom,
    );

    if (Math.abs(targetOffset - startOffset) < 1) return;

    stopPanAnimation();

    const start = performance.now();
    const tick = (now: number) => {
      if (userInteractedRef.current) {
        panAnimationRafRef.current = null;
        return;
      }

      const elapsed = now - start;
      const progress = Math.min(1, elapsed / AUTO_PAN_MS);
      const eased = easeInOutSine(progress);
      const offset = startOffset + (targetOffset - startOffset) * eased;

      applyView(viewRef.current.zoom, offset);

      if (progress < 1) {
        panAnimationRafRef.current = requestAnimationFrame(tick);
      } else {
        panAnimationRafRef.current = null;
      }
    };

    panAnimationRafRef.current = requestAnimationFrame(tick);
  }, [applyView, autoPanHint, metrics, stopPanAnimation]);

  useEffect(() => {
    return () => {
      stopAllMotion();
    };
  }, [stopAllMotion]);

  useImperativeHandle(
    ref,
    () => ({
      focusHotspot: (xPercent, options) => {
        if (!metrics) return;
        const targetOffset = centerOffsetForHotspot(
          metrics,
          viewRef.current.zoom,
          xPercent,
        );

        if (options?.animate === false) {
          applyView(viewRef.current.zoom, targetOffset);
          return;
        }

        animateOffsetTo(targetOffset, CENTER_ANIMATE_MS);
      },
      resetView: () => {
        if (!metrics) return;

        const centeredOffset = getCenteredOffsetX(metrics, MIN_ZOOM);
        applyView(MIN_ZOOM, centeredOffset);
      },
    }),
    [animateOffsetTo, applyView, metrics],
  );

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      if (!metrics) return;

      userInteractedRef.current = true;
      stopAllMotion();

      event.currentTarget.setPointerCapture(event.pointerId);

      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      const pinch = toPinchState(pointersRef.current);

      if (pinch) {
        pinchStateRef.current = pinch;
        dragStateRef.current.active = false;
        dragStateRef.current.pointerId = null;
        return;
      }

      dragStateRef.current = {
        active: true,
        pointerId: event.pointerId,
        startX: event.clientX,
        startOffsetX: viewRef.current.offsetX,
        lastX: event.clientX,
        lastT: performance.now(),
        velocityPxPerMs: 0,
        moved: false,
      };
    },
    [metrics, stopAllMotion],
  );

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!metrics) return;
      const stageRect = stageRef.current?.getBoundingClientRect();
      if (!stageRect) return;

      if (!pointersRef.current.has(event.pointerId)) return;
      pointersRef.current.set(event.pointerId, {
        x: event.clientX,
        y: event.clientY,
      });

      const pinch = toPinchState(pointersRef.current);
      if (pinch) {
        const previousPinch = pinchStateRef.current;
        pinchStateRef.current = pinch;
        const currentMidX = pinch.midX - stageRect.left;

        if (previousPinch && previousPinch.distance > 0) {
          const current = viewRef.current;
          const zoomRatio = pinch.distance / previousPinch.distance;
          const nextZoom = clampZoom(current.zoom * zoomRatio);
          const previousMidX = previousPinch.midX - stageRect.left;
          const offsetAfterPan = current.offsetX + (currentMidX - previousMidX);
          const anchoredOffset = zoomOffsetAtAnchor({
            metrics,
            oldZoom: current.zoom,
            newZoom: nextZoom,
            oldOffsetX: offsetAfterPan,
            anchorX: currentMidX,
          });

          applyView(nextZoom, anchoredOffset);
          dragStateRef.current.moved = true;
        }

        return;
      }

      pinchStateRef.current = null;

      const drag = dragStateRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId) return;

      const deltaX = event.clientX - drag.startX;
      const nextOffsetX = clampOffsetX(
        drag.startOffsetX + deltaX,
        metrics,
        viewRef.current.zoom,
      );

      applyView(viewRef.current.zoom, nextOffsetX);

      const now = performance.now();
      const dt = now - drag.lastT;
      if (dt > 0) {
        drag.velocityPxPerMs = (event.clientX - drag.lastX) / dt;
        drag.lastX = event.clientX;
        drag.lastT = now;
      }

      if (Math.abs(deltaX) > DRAG_THRESHOLD_PX) {
        drag.moved = true;
      }
    },
    [applyView, metrics],
  );

  const handlePointerEnd = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      pointersRef.current.delete(event.pointerId);
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // no-op: release can throw if capture already moved away.
      }

      const drag = dragStateRef.current;
      if (drag.active && drag.pointerId === event.pointerId) {
        if (drag.moved) {
          suppressClickUntilRef.current = performance.now() + CLICK_GUARD_MS;
        }

        if (metrics && drag.moved && Math.abs(drag.velocityPxPerMs) > 0.02) {
          startInertia(drag.velocityPxPerMs);
        }

        drag.active = false;
        drag.pointerId = null;
      }

      const pinch = toPinchState(pointersRef.current);
      if (pinch) {
        pinchStateRef.current = pinch;
        return;
      }

      pinchStateRef.current = null;

      if (pointersRef.current.size === 1) {
        const [pointerId, pointer] = [...pointersRef.current.entries()][0];
        dragStateRef.current = {
          active: true,
          pointerId,
          startX: pointer.x,
          startOffsetX: viewRef.current.offsetX,
          lastX: pointer.x,
          lastT: performance.now(),
          velocityPxPerMs: 0,
          moved: false,
        };
      }
    },
    [metrics, startInertia],
  );

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (!metrics || !stageRef.current) return;

      event.preventDefault();
      userInteractedRef.current = true;
      stopAllMotion();

      const rect = stageRef.current.getBoundingClientRect();
      const anchorX = event.clientX - rect.left;
      const current = viewRef.current;

      const zoomFactor = 1 - event.deltaY * 0.0015;
      const nextZoom = clampZoom(current.zoom * zoomFactor);

      if (Math.abs(nextZoom - current.zoom) < 0.0001) return;

      const nextOffsetX = zoomOffsetAtAnchor({
        metrics,
        oldZoom: current.zoom,
        newZoom: nextZoom,
        oldOffsetX: current.offsetX,
        anchorX,
      });

      applyView(nextZoom, nextOffsetX);
    },
    [applyView, metrics, stopAllMotion],
  );

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    stage.addEventListener("wheel", handleWheel, { passive: false });
    return () => {
      stage.removeEventListener("wheel", handleWheel);
    };
  }, [handleWheel]);

  const handleStageClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!metrics || !stageRef.current) return;
      if (performance.now() < suppressClickUntilRef.current) return;

      if (onCoordinatePick) {
        const rect = stageRef.current.getBoundingClientRect();
        const point = screenPointToImagePercent(
          event.clientX,
          event.clientY,
          rect,
          metrics,
          viewRef.current.zoom,
          viewRef.current.offsetX,
        );

        onCoordinatePick({
          projection: "flat",
          x: Number(point.x.toFixed(2)),
          y: Number(point.y.toFixed(2)),
        });
      }

      onBackgroundSelect?.();
    },
    [metrics, onBackgroundSelect, onCoordinatePick],
  );

  const baseScale = metrics ? getBaseScale(metrics) : 1;
  const renderWidth = metrics
    ? metrics.imageNaturalWidth * baseScale
    : undefined;
  const renderHeight = metrics
    ? metrics.imageNaturalHeight * baseScale
    : undefined;
  const contentTransform = `translate3d(${view.offsetX}px, 0, 0) scale(${view.zoom})`;

  const isSpeciesLocatorActive = isLocatorHovered || isLocatorPinned;
  const responsiveHeightClass = className
    ? ""
    : "h-[calc(100dvh-8.65rem)] md:h-auto";

  return (
    <div
      className={`relative z-10 min-h-0 flex-1 overflow-hidden rounded-2xl border border-emerald-200/25 bg-[rgba(5,11,8,0.88)] ${responsiveHeightClass} ${className ?? ""}`.trim()}
    >
      <div
        ref={stageRef}
        className="relative h-full w-full touch-none overflow-hidden cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={handleStageClick}
      >
        <div
          className="absolute left-0 top-0 origin-top-left will-change-transform"
          style={{
            width: renderWidth,
            height: renderHeight,
            transform: contentTransform,
          }}
        >
          <img
            src={imageSrc}
            alt="Panoramic food forest"
            className="pointer-events-none h-full w-full select-none object-contain"
            onLoad={(event) => {
              setImageNaturalSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
              });
            }}
            draggable={false}
          />

          <div className="absolute inset-0">
            {hotspots.map((hotspot) => (
              <HotspotMarker
                key={hotspot.id + hotspot.x + hotspot.y}
                hotspot={hotspot}
                isActive={hotspot.id === activeHotspotId}
                isDimmed={false}
                forceGlow={isSpeciesLocatorActive}
                onSelect={(id) => {
                  userInteractedRef.current = true;
                  onHotspotSelect?.(id);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        className={`hide-feature absolute bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-3 z-20 cursor-default rounded-lg border bg-[rgba(16,20,26,0.84)] px-2.5 py-1.5 lg:px-3 lg:py-1 text-neutral-100 shadow-lg backdrop-blur-md transition-colors md:bottom-auto md:left-4 md:top-4 md:rounded-xl  ${isSpeciesLocatorActive ? "border-red-300/75" : "border-red-400/35"}`}
        onPointerEnter={() => setIsLocatorHovered(true)}
        onPointerLeave={() => setIsLocatorHovered(false)}
        onFocus={() => setIsLocatorHovered(true)}
        onBlur={() => setIsLocatorHovered(false)}
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onClick={(event) => {
          event.stopPropagation();
          setIsLocatorPinned((previous) => !previous);
        }}
        aria-label="Toggle gems highlight"
        aria-pressed={isLocatorPinned}
        title="Highlight all gems"
      >
        <div className="flex items-center gap-1.5 md:gap-2">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{
              background: PT_HOTSPOT_DOT_BACKGROUND,
              boxShadow: PT_HOTSPOT_BADGE_DOT_SHADOW,
            }}
            aria-hidden="true"
          />
          <span
            className="text-base leading-none text-white/92 md:text-lg"
            style={{ fontFamily: "'Cormorant Garamond', serif" }}
          >
            Gems
          </span>
        </div>
      </button>

      {showControlsLegend ? (
        <ControlsLegend
          className="absolute right-4 top-4 z-20"
          desktopHints={[
            {
              iconClassName: "fa-solid fa-arrows-up-down-left-right",
              label: "Click and drag to pan",
            },
          ]}
          mobileHints={[
            {
              iconClassName: "fa-solid fa-arrows-up-down-left-right",
              label: "Touch and drag to move view",
            },
          ]}
          action={tourAction}
        />
      ) : null}
    </div>
  );
});

export default FlatPanoramicViewer;
