/**
 * UNDERGROUND VIEWING EFFECT
 *
 * Computes an "underground factor" (0–1) each frame from the camera's Y
 * position relative to the ground plane (Y=0) and imperatively drives:
 *   - Underground dome  → large BackSide sphere with warm earthy color that
 *                         fades in to replace the bright Environment skybox
 *   - factorRef         → shared with GroundDressing (material opacity)
 *   - overlayRef        → earthy vignette div opacity
 *   - badgeRef          → "Underground View" badge opacity
 *
 * All updates are imperative (refs + direct DOM/material manipulation) — zero
 * React re-renders per frame.
 *
 * The dome is a plain mesh — no mutation of scene.background, no conflict
 * with the Environment component. When above ground its opacity is 0
 * (transparent, Environment shows through). When underground it fades to
 * opaque, covering the skybox with warm soil tones.
 *
 * The earthy color represents living soil: humus, clay, organic matter —
 * a natural backdrop for future fungal networks and root systems.
 */

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ---------------------------------------------------------------------------
// Tuning constants
// ---------------------------------------------------------------------------

/** Camera Y above which factor = 0 (start fading slightly above ground) */
const START_Y = 1.5;
/** Camera Y at which factor = 1 (full underground effect) */
const END_Y = -2.0;

/** Warm medium-brown — rich topsoil, organic matter, clay */
const DOME_COLOR = 0x4a3222;

/** GLSL-style smoothstep: hermite interpolation between edge0 and edge1 */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

interface UndergroundEffectProps {
  /** DOM ref for the earthy vignette overlay div */
  overlayRef: React.RefObject<HTMLDivElement | null>;
  /** DOM ref for the "Underground View" badge div */
  badgeRef: React.RefObject<HTMLDivElement | null>;
  /** Shared factor ref read by GroundDressing */
  factorRef: React.MutableRefObject<number>;
}

export default function UndergroundEffect({
  overlayRef,
  badgeRef,
  factorRef,
}: UndergroundEffectProps) {
  const domeMatRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(({ camera }) => {
    const cameraY = camera.position.y;

    // Underground factor based on camera height relative to ground plane (Y=0)
    // START_Y (1.5m above) → 0, END_Y (-2m below) → 1
    const raw = (START_Y - cameraY) / (START_Y - END_Y);
    const factor = smoothstep(0, 1, Math.max(0, Math.min(1, raw)));

    // Write shared factor for GroundDressing
    factorRef.current = factor;

    // ---- Underground dome: fade earthy sphere over Environment skybox ----
    if (domeMatRef.current) {
      domeMatRef.current.opacity = factor;
    }

    // ---- DOM overlays ----
    if (overlayRef.current) {
      overlayRef.current.style.opacity = String(factor);
    }

    // Badge fades in faster (visible at 50% underground)
    if (badgeRef.current) {
      const badgeOpacity = Math.min(1, factor * 2);
      badgeRef.current.style.opacity = String(badgeOpacity);
    }
  });

  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[60, 16, 16]} />
      <meshBasicMaterial
        ref={domeMatRef}
        color={DOME_COLOR}
        side={THREE.BackSide}
        transparent
        opacity={0}
        depthWrite={false}
      />
    </mesh>
  );
}
