import type { ViewerMetrics } from "./types";

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 2.25;

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const clampZoom = (zoom: number): number =>
  clamp(zoom, MIN_ZOOM, MAX_ZOOM);

export const getBaseScale = (metrics: ViewerMetrics): number =>
  metrics.containerHeight / metrics.imageNaturalHeight;

export const getScaledImageWidth = (
  metrics: ViewerMetrics,
  zoom: number,
): number => metrics.imageNaturalWidth * getBaseScale(metrics) * zoom;

export const getScaledImageHeight = (
  metrics: ViewerMetrics,
  zoom: number,
): number => metrics.imageNaturalHeight * getBaseScale(metrics) * zoom;

export const getOffsetBounds = (
  metrics: ViewerMetrics,
  zoom: number,
): { min: number; max: number } => {
  const scaledWidth = getScaledImageWidth(metrics, zoom);

  if (scaledWidth <= metrics.containerWidth) {
    const centered = (metrics.containerWidth - scaledWidth) / 2;
    return { min: centered, max: centered };
  }

  return {
    min: metrics.containerWidth - scaledWidth,
    max: 0,
  };
};

export const clampOffsetX = (
  offsetX: number,
  metrics: ViewerMetrics,
  zoom: number,
): number => {
  const bounds = getOffsetBounds(metrics, zoom);
  return clamp(offsetX, bounds.min, bounds.max);
};

export const getCenteredOffsetX = (
  metrics: ViewerMetrics,
  zoom: number,
): number => {
  const bounds = getOffsetBounds(metrics, zoom);
  return (bounds.min + bounds.max) / 2;
};

interface ZoomAtAnchorParams {
  metrics: ViewerMetrics;
  oldZoom: number;
  newZoom: number;
  oldOffsetX: number;
  anchorX: number;
}

export const zoomOffsetAtAnchor = ({
  metrics,
  oldZoom,
  newZoom,
  oldOffsetX,
  anchorX,
}: ZoomAtAnchorParams): number => {
  if (oldZoom <= 0) {
    return clampOffsetX(oldOffsetX, metrics, newZoom);
  }

  const ratio = newZoom / oldZoom;
  const nextOffset = anchorX - (anchorX - oldOffsetX) * ratio;
  return clampOffsetX(nextOffset, metrics, newZoom);
};

export const centerOffsetForHotspot = (
  metrics: ViewerMetrics,
  zoom: number,
  hotspotXPercent: number,
): number => {
  const baseScale = getBaseScale(metrics);
  const xPixels = (hotspotXPercent / 100) * metrics.imageNaturalWidth;
  const hotspotScreenX = xPixels * baseScale * zoom;
  const targetOffset = metrics.containerWidth * 0.5 - hotspotScreenX;
  return clampOffsetX(targetOffset, metrics, zoom);
};

export const screenPointToImagePercent = (
  clientX: number,
  clientY: number,
  rect: Pick<DOMRect, "left" | "top">,
  metrics: ViewerMetrics,
  zoom: number,
  offsetX: number,
): { x: number; y: number } => {
  const baseScale = getBaseScale(metrics);
  const scaled = baseScale * zoom;

  const localX = clientX - rect.left;
  const localY = clientY - rect.top;

  const imageX = (localX - offsetX) / scaled;
  const imageY = localY / scaled;

  return {
    x: clamp((imageX / metrics.imageNaturalWidth) * 100, 0, 100),
    y: clamp((imageY / metrics.imageNaturalHeight) * 100, 0, 100),
  };
};

interface InertiaStepInput {
  velocityPxPerMs: number;
  deltaMs: number;
  decayPerFrame?: number;
  stopThreshold?: number;
}

export const stepInertia = ({
  velocityPxPerMs,
  deltaMs,
  decayPerFrame = 0.92,
  stopThreshold = 0.02,
}: InertiaStepInput): {
  velocityPxPerMs: number;
  deltaPx: number;
  done: boolean;
} => {
  const frames = Math.max(1, deltaMs / 16.67);
  const decay = Math.pow(decayPerFrame, frames);
  const nextVelocity = velocityPxPerMs * decay;
  const averageVelocity = (velocityPxPerMs + nextVelocity) * 0.5;
  const deltaPx = averageVelocity * deltaMs;

  const done = Math.abs(nextVelocity) < stopThreshold;
  return {
    velocityPxPerMs: done ? 0 : nextVelocity,
    deltaPx,
    done,
  };
};
