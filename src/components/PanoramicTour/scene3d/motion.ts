import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type * as THREE from "three";

export const prefersReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Evaluated once per mount — ambient motion is decorative, no live tracking needed. */
export function useReducedMotionPref(): boolean {
  return useMemo(prefersReducedMotion, []);
}

/**
 * Gentle foliage sway: small rotation + scale oscillation with a per-tree
 * phase offset. Same idiom as the Forest3D breathing animation
 * (1 + sin(t * 0.5 + phase) * 0.015), applied to a foliage group.
 */
export function useFoliageSway(
  ref: React.RefObject<THREE.Group>,
  phase: number,
  amount = 0.015,
): void {
  const reduced = useReducedMotionPref();
  const baseRotationRef = useRef<number | null>(null);

  useFrame(({ clock }) => {
    const node = ref.current;
    if (reduced || !node) return;
    if (baseRotationRef.current === null) {
      baseRotationRef.current = node.rotation.z;
    }
    const t = clock.elapsedTime;
    node.rotation.z =
      baseRotationRef.current + Math.sin(t * 0.5 + phase) * amount * 1.6;
    node.scale.setScalar(1 + Math.sin(t * 0.45 + phase * 1.3) * amount);
  });
}
