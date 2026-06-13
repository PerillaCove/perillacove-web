import { describe, expect, it } from "vitest";
import {
  animalLifecycleOpacity,
  animalLifecycleScale,
  getGrazingMotionState,
  minPairwiseDistance,
  resolveSeparatedAnimalPositions,
  smoothAnimalPositions,
} from "./animalMotion";

describe("animalMotion", () => {
  it("separates moving animal positions by the configured minimum distance", () => {
    const anchors = [
      { x: 0, z: 0 },
      { x: 0, z: 0 },
      { x: 0.1, z: 0.1 },
    ];
    const offsets = [
      { x: 0, z: 0 },
      { x: 0, z: 0 },
      { x: 0, z: 0 },
    ];
    const positions = resolveSeparatedAnimalPositions(
      anchors,
      offsets,
      2.8,
      3.2,
    );

    expect(minPairwiseDistance(positions)).toBeGreaterThanOrEqual(2.8 - 1e-6);
    expect(resolveSeparatedAnimalPositions(anchors, offsets, 2.8, 3.2)).toEqual(
      positions,
    );
  });

  it("returns deterministic staggered grazing state", () => {
    const first = getGrazingMotionState(12.5, 1, 3.2, 7.5, [2.4, 4.8]);
    const second = getGrazingMotionState(12.5, 1, 3.2, 7.5, [2.4, 4.8]);

    expect(second).toEqual(first);
    expect(Number.isFinite(first.offset.x)).toBe(true);
    expect(Number.isFinite(first.offset.z)).toBe(true);
    expect(Math.hypot(first.offset.x, first.offset.z)).toBeLessThanOrEqual(3.2);
  });

  it("pushes animal positions outside tree obstacle radii", () => {
    const positions = resolveSeparatedAnimalPositions(
      [
        { x: 0, z: 0 },
        { x: 4, z: 0 },
      ],
      [
        { x: 0, z: 0 },
        { x: 0, z: 0 },
      ],
      2.2,
      3.2,
      [{ x: 0, z: 0, radius: 2.6 }],
    );

    expect(Math.hypot(positions[0].x, positions[0].z)).toBeGreaterThanOrEqual(
      2.6 - 1e-6,
    );
    expect(minPairwiseDistance(positions)).toBeGreaterThanOrEqual(2.2 - 1e-6);
  });

  it("keeps calves visible while slowing growth to adult scale", () => {
    expect(animalLifecycleScale(0, 0.42, 3.5)).toBeCloseTo(0.42);
    expect(animalLifecycleScale(1, 0.42, 3.5)).toBeGreaterThan(0.42);
    expect(animalLifecycleScale(1, 0.42, 3.5)).toBeLessThan(0.62);
    expect(animalLifecycleScale(3.5, 0.42, 3.5)).toBeCloseTo(1);
  });

  it("keeps growing animals fully visible and fades only after growth", () => {
    expect(animalLifecycleOpacity(0.15, false, 1, 3.5)).toBeCloseTo(1);
    expect(animalLifecycleOpacity(0.15, true, 1, 3.5)).toBeCloseTo(0.95);
    expect(animalLifecycleOpacity(1, false, 4, 3.5)).toBeCloseTo(1);
    expect(animalLifecycleOpacity(0.15, false, 4, 3.5)).toBeCloseTo(0.15);
    expect(animalLifecycleOpacity(0, false)).toBeCloseTo(0.03);
    expect(animalLifecycleOpacity(0.15, true, 4, 3.5)).toBeCloseTo(0.1425);
  });

  it("eases animal positions toward corrected targets without overshooting", () => {
    const current = [{ x: 0, z: 0 }];
    const target = [{ x: 10, z: -4 }];

    const firstStep = smoothAnimalPositions(current, target, 1 / 60, 6);
    const secondStep = smoothAnimalPositions(firstStep, target, 1 / 60, 6);

    expect(firstStep[0].x).toBeGreaterThan(0);
    expect(firstStep[0].x).toBeLessThan(10);
    expect(firstStep[0].z).toBeLessThan(0);
    expect(firstStep[0].z).toBeGreaterThan(-4);
    expect(secondStep[0].x).toBeGreaterThan(firstStep[0].x);
    expect(secondStep[0].x).toBeLessThan(10);
  });

  it("caps smoothed animal catch-up speed", () => {
    const current = [{ x: 0, z: 0 }];
    const target = [{ x: 10, z: 0 }];
    const maxSpeedMetersPerSecond = 0.3;
    const deltaSeconds = 1 / 30;

    const next = smoothAnimalPositions(
      current,
      target,
      deltaSeconds,
      20,
      maxSpeedMetersPerSecond,
    );

    expect(Math.hypot(next[0].x, next[0].z)).toBeLessThanOrEqual(
      maxSpeedMetersPerSecond * deltaSeconds + 1e-6,
    );
  });
});
