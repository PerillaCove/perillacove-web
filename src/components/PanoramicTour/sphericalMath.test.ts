import { describe, expect, it } from "vitest";
import {
  cartesianToYawPitch,
  isEquirectangularAspect,
  percentToYawPitch,
  yawPitchToCartesian,
  yawPitchToPercent,
} from "./sphericalMath";

describe("sphericalMath", () => {
  it("converts percent to yaw/pitch and back within tolerance", () => {
    const source = { x: 73.42, y: 38.11 };
    const spherical = percentToYawPitch(source.x, source.y);
    const percent = yawPitchToPercent(spherical.yaw, spherical.pitch);

    expect(percent.x).toBeCloseTo(source.x, 2);
    expect(percent.y).toBeCloseTo(source.y, 2);
  });

  it("round-trips yaw/pitch through cartesian coordinates", () => {
    const source = { yaw: -41.5, pitch: 23.2 };
    const xyz = yawPitchToCartesian(source.yaw, source.pitch, 7);
    const resolved = cartesianToYawPitch(xyz.x, xyz.y, xyz.z);

    expect(resolved.yaw).toBeCloseTo(source.yaw, 3);
    expect(resolved.pitch).toBeCloseTo(source.pitch, 3);
  });

  it("validates equirectangular 2:1 dimensions with tolerance", () => {
    expect(isEquirectangularAspect(8000, 4000)).toBe(true);
    expect(isEquirectangularAspect(4096, 2048)).toBe(true);
    expect(isEquirectangularAspect(3000, 1600)).toBe(false);
  });
});
