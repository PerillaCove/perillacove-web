import { describe, expect, it } from "vitest";
import {
  centerOffsetForHotspot,
  clampOffsetX,
  getOffsetBounds,
  screenPointToImagePercent,
  stepInertia,
  zoomOffsetAtAnchor,
} from "./panMath";
import type { ViewerMetrics } from "./types";

const metrics: ViewerMetrics = {
  containerWidth: 1000,
  containerHeight: 500,
  imageNaturalWidth: 3000,
  imageNaturalHeight: 1000,
};

describe("panMath", () => {
  it("computes horizontal clamp bounds", () => {
    const bounds = getOffsetBounds(metrics, 1);
    expect(bounds.min).toBe(-500);
    expect(bounds.max).toBe(0);
  });

  it("clamps offsets into legal range", () => {
    expect(clampOffsetX(120, metrics, 1)).toBe(0);
    expect(clampOffsetX(-920, metrics, 1)).toBe(-500);
    expect(clampOffsetX(-220, metrics, 1)).toBe(-220);
  });

  it("keeps anchor point stable across zoom", () => {
    const oldZoom = 1;
    const newZoom = 1.8;
    const oldOffsetX = -160;
    const anchorX = 420;

    const baseScale = metrics.containerHeight / metrics.imageNaturalHeight;
    const imageXBefore = (anchorX - oldOffsetX) / (baseScale * oldZoom);

    const nextOffsetX = zoomOffsetAtAnchor({
      metrics,
      oldZoom,
      newZoom,
      oldOffsetX,
      anchorX,
    });

    const anchorAfter = nextOffsetX + imageXBefore * baseScale * newZoom;
    expect(anchorAfter).toBeCloseTo(anchorX, 4);
  });

  it("centers a hotspot by percent", () => {
    const offset = centerOffsetForHotspot(metrics, 1, 50);
    expect(offset).toBeCloseTo(-250, 4);
  });

  it("converts screen coordinates to image percentages", () => {
    const point = screenPointToImagePercent(
      520,
      250,
      { left: 20, top: 10 },
      metrics,
      1,
      -250,
    );

    expect(point.x).toBeCloseTo(50, 2);
    expect(point.y).toBeCloseTo(48, 0);
  });

  it("decays inertia velocity and eventually stops", () => {
    const first = stepInertia({ velocityPxPerMs: 0.8, deltaMs: 16 });
    expect(first.velocityPxPerMs).toBeLessThan(0.8);
    expect(first.deltaPx).toBeGreaterThan(0);
    expect(first.done).toBe(false);

    const final = stepInertia({
      velocityPxPerMs: 0.01,
      deltaMs: 16,
      stopThreshold: 0.02,
    });
    expect(final.velocityPxPerMs).toBe(0);
    expect(final.done).toBe(true);
  });
});
