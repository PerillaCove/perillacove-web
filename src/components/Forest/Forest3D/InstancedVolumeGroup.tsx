/**
 * INSTANCED VOLUME GROUP
 *
 * Renders multiple copies of the same species using THREE.InstancedMesh
 * for dramatically reduced draw calls. All instances share identical visual
 * properties (color, opacity, growthMaturity) — only position differs.
 *
 * Two rendering paths mirror VolumeRenderer's logic:
 * - Path A: Custom GLB models — one InstancedMesh per mesh in the GLB
 * - Path B: Default geometry — instanced sphere+cylinder, disc, vine, etc.
 *
 * FruitParticles are rendered per-instance in positioned groups (they're
 * already internally instanced, so this is cheap).
 *
 * IMPORTANT — FRUIT ALIGNMENT:
 * Unlike VolumeRenderer (where FruitParticles are children of the plant's
 * scaled group and inherit transforms automatically), instanced fruit groups
 * are SIBLINGS of the InstancedMesh. They must explicitly receive:
 * - rotation={[0, instanceAngles[idx], 0]} — matches per-instance Y-rotation
 * - scale={lifeScale} — matches lifecycle scaling in the instance matrix
 * Without both, fruits float off the tree's bark surface.
 *
 * DRAG-TO-REPOSITION:
 * Uses inline hold-to-drag logic (not the useDragToReposition hook) because
 * InstancedMesh doesn't have per-instance group refs. Instead, the dragged
 * instance's position override is stored in `dragOverridePosRef` and applied
 * in the useFrame loop when composing instance matrices. Fruit groups for the
 * dragged instance are also synced in the same useFrame.
 * See useDragToReposition.ts for the shared `createGroundRaycaster` utility.
 *
 * HOVER HIGHLIGHTING:
 * Uses THREE.js `instanceColor` (InstancedBufferAttribute) for per-instance
 * visual feedback. All instances share one material, so emissive/color changes
 * on the material would affect ALL instances equally. Instead:
 * - Hovered instance: instanceColor = (1.5, 1.4, 1.2) — warm brightness boost
 * - All others: instanceColor = (1, 1, 1) — unchanged
 * instanceColor multiplies with the material color in the shader. Values > 1
 * brighten beyond the base color. This is set per-frame in the useFrame loop.
 *
 * BOUNDING SPHERE INVALIDATION:
 * After updating instance matrices (position changes from drag, breathing
 * animation), `meshRef.boundingSphere = null` forces Three.js to recompute
 * the bounding sphere on the next raycast. Without this, instances dragged
 * outside the original bounds become unhittable from certain camera angles.
 */

import { useRef, useState, useMemo } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import {
  type SpatialVolume,
  ENABLE_LIFECYCLE_SCALE,
  LIFECYCLE_SCALE_EXPONENT,
} from "../spatial";
import type { SegmentStatus } from "../util";
import FruitParticles from "./FruitParticles";
import { getSpeciesConfig } from "./SpeciesRenderConfig";
import { useTreeModelMeshes } from "./TreeModelLoader";
import { createGroundRaycaster } from "./useDragToReposition";

function grazingOffset(
  t: number,
  index: number,
  phase: number,
  radius: number,
  speed: number,
): { x: number; z: number } {
  const instanceBias = 0.72 + ((index * 37) % 17) / 80;
  const primary = t * speed + phase;
  const secondary = t * speed * 0.37 + phase * 1.73;
  return {
    x:
      Math.cos(primary) * radius * 0.62 * instanceBias +
      Math.cos(secondary) * radius * 0.28,
    z:
      Math.sin(primary) * radius * 0.62 * instanceBias +
      Math.sin(secondary) * radius * 0.28,
  };
}

interface InstancedVolumeGroupProps {
  /** All volumes for this species (same sourceIngredientId, 2+ entries) */
  volumes: SpatialVolume[];
  isDarkMode: boolean;
  isSimulating?: boolean;
  onClick?: (ingredientId: string) => void;
  onHover?: (ingredientId: string | null) => void;
  groundRadius?: number;
  onDragStart?: () => void;
  onDragEnd?: (volumeId: string, position: { x: number; z: number }) => void;
  /** Reports display name on hover for the scene-level overlay */
  onHoverName?: (name: string | null) => void;
}

/**
 * Renders multiple copies of a single species as instanced meshes.
 * Handles both custom GLB models and default procedural geometry.
 */
export default function InstancedVolumeGroup({
  volumes,
  isDarkMode,
  isSimulating = false,
  onClick,
  onHover,
  groundRadius: groundRadiusProp,
  onDragStart,
  onDragEnd,
  onHoverName,
}: InstancedVolumeGroupProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // All volumes share the same species — use first for shared properties.
  // sourceIngredientId preserves the original ingredient ID (no runtime suffixes).
  const representative = volumes[0];
  const speciesId =
    representative.sourceIngredientId ?? representative.ingredientId;

  // Species-specific rendering config
  const speciesConfig = getSpeciesConfig(speciesId);
  const { meshes: treeMeshes, attachPoints } = useTreeModelMeshes(speciesId);
  const hasCustomModel = Boolean(
    treeMeshes.length > 0 && speciesConfig?.treeModel,
  );

  // Parse color (shared across all instances)
  const color = useMemo(() => {
    const baseColor = new THREE.Color(representative.layerColor);
    if (isDarkMode) {
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);
      baseColor.setHSL(
        hsl.h,
        Math.min(1, hsl.s * 1.2),
        Math.min(0.7, hsl.l * 1.4),
      );
    }
    return baseColor;
  }, [representative.layerColor, isDarkMode]);

  // Shared properties from representative (identical across all instances)
  const {
    heightRange,
    canopyRadius,
    opacity,
    layer,
    growthMaturity,
    status,
    intensity,
  } = representative;

  const crownRadius = canopyRadius;

  // Layer classification
  const isCanopyLayer = layer === "canopy" || layer === "midstory";
  const isGroundLayer = layer === "groundcover" || layer === "root";
  const isClimber = layer === "climber";
  const isShrubOrHerb = layer === "shrub" || layer === "herbaceous";

  // Opacity & emissive (shared)
  const baseOpacity = isDarkMode ? Math.min(opacity * 1.3, 0.95) : opacity;
  const darkModeEmissive = isDarkMode ? 0.25 : 0;
  const emissiveIntensity = darkModeEmissive;
  const trunkColor = isDarkMode ? "#8a7050" : "#8b7355";

  // ---- CUSTOM GLB MODEL PATH ----
  if (hasCustomModel && speciesConfig?.treeModel) {
    return (
      <InstancedGLBGroup
        volumes={volumes}
        treeMeshes={treeMeshes}
        attachPoints={attachPoints}
        speciesConfig={speciesConfig}
        speciesId={speciesId}
        heightRange={heightRange}
        growthMaturity={growthMaturity}
        crownRadius={crownRadius}
        status={status}
        intensity={intensity}
        color={color}
        isDarkMode={isDarkMode}
        isSimulating={isSimulating}
        hoveredIdx={hoveredIdx}
        setHoveredIdx={setHoveredIdx}
        onClick={onClick}
        onHover={onHover}
        layer={layer}
        groundRadius={groundRadiusProp}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onHoverName={onHoverName}
      />
    );
  }

  // ---- DEFAULT GEOMETRY PATH ----
  return (
    <InstancedDefaultGroup
      volumes={volumes}
      speciesId={speciesId}
      layer={layer}
      isCanopyLayer={isCanopyLayer}
      isGroundLayer={isGroundLayer}
      isClimber={isClimber}
      isShrubOrHerb={isShrubOrHerb}
      heightRange={heightRange}
      crownRadius={crownRadius}
      growthMaturity={growthMaturity}
      color={color}
      trunkColor={trunkColor}
      baseOpacity={baseOpacity}
      emissiveIntensity={emissiveIntensity}
      status={status}
      intensity={intensity}
      isDarkMode={isDarkMode}
      isSimulating={isSimulating}
      hoveredIdx={hoveredIdx}
      setHoveredIdx={setHoveredIdx}
      onClick={onClick}
      onHover={onHover}
      speciesConfig={getSpeciesConfig(speciesId)}
      attachPoints={attachPoints}
      groundRadius={groundRadiusProp}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onHoverName={onHoverName}
    />
  );
}

// ============================================================================
// CUSTOM GLB INSTANCED GROUP
// ============================================================================

interface InstancedGLBGroupProps {
  volumes: SpatialVolume[];
  treeMeshes: {
    geometry: THREE.BufferGeometry;
    material: THREE.Material | THREE.Material[];
  }[];
  attachPoints: THREE.Vector3[];
  speciesConfig: NonNullable<ReturnType<typeof getSpeciesConfig>>;
  speciesId: string;
  heightRange: [number, number];
  growthMaturity: number;
  crownRadius: number;
  status: SegmentStatus;
  intensity: number;
  color: THREE.Color;
  isDarkMode: boolean;
  isSimulating: boolean;
  hoveredIdx: number | null;
  setHoveredIdx: (idx: number | null) => void;
  onClick?: (ingredientId: string) => void;
  onHover?: (ingredientId: string | null) => void;
  layer: string;
  groundRadius?: number;
  onDragStart?: () => void;
  onDragEnd?: (volumeId: string, position: { x: number; z: number }) => void;
  onHoverName?: (name: string | null) => void;
}

function InstancedGLBGroup({
  volumes,
  treeMeshes,
  attachPoints,
  speciesConfig,
  speciesId,
  heightRange,
  growthMaturity,
  crownRadius,
  status,
  intensity,
  color,
  isDarkMode,
  isSimulating,
  hoveredIdx,
  setHoveredIdx,
  onClick,
  onHover,
  layer,
  groundRadius: groundRadiusProp,
  onDragStart,
  onDragEnd,
  onHoverName,
}: InstancedGLBGroupProps) {
  const groupRef = useRef<THREE.Group>(null);
  const instancedRefs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const count = volumes.length;

  // ---- Drag-to-reposition state ----
  // Inline hold-to-drag (not the hook) because InstancedMesh has no per-instance refs.
  // dragInstanceIdxRef: which instance index is currently being dragged (null = none)
  // dragOverridePosRef: current ground position override for the dragged instance
  // justDraggedRef: click guard — true for 100ms after drag ends to suppress onClick
  // fruitGroupRefs: refs to per-instance fruit <group> nodes, synced during drag in useFrame
  const { camera, gl, events } = useThree();
  const raycastToGround = useMemo(
    () => createGroundRaycaster(camera, gl.domElement),
    [camera, gl],
  );
  const dragInstanceIdxRef = useRef<number | null>(null);
  const dragOverridePosRef = useRef<{ x: number; z: number } | null>(null);
  const justDraggedRef = useRef(false);
  const fruitGroupRefs = useRef<(THREE.Group | null)[]>([]);
  const grazeMotion =
    speciesConfig.motion?.kind === "graze" ? speciesConfig.motion : null;

  const matureHeight = speciesConfig.matureHeight ?? heightRange[1];
  const modelScale = growthMaturity * matureHeight;
  const modelTopY = modelScale;

  // Life scale: uniform shrink/grow driven by intensity (see VolumeRenderer.tsx
  // for full explanation). Toggle: ENABLE_LIFECYCLE_SCALE, exponent: LIFECYCLE_SCALE_EXPONENT.
  const lifeScale = ENABLE_LIFECYCLE_SCALE
    ? Math.max(0.01, Math.pow(intensity, LIFECYCLE_SCALE_EXPONENT))
    : 1.0;

  // Scaled attach points for fruit placement
  const scaledAttachPoints = useMemo(
    () => attachPoints.map((pt) => pt.clone().multiplyScalar(modelScale)),
    [attachPoints, modelScale],
  );

  // Per-instance Y-axis rotation angle for visual variety (deterministic from ingredientId).
  // Uses ingredientId hash instead of position so rotation stays stable after drag.
  // Used for BOTH tree instance matrices AND fruit group rotations so fruits stay
  // aligned with the rotated tree geometry.
  const instanceAngles = useMemo(() => {
    return volumes.map((vol) => {
      let h = 0;
      for (let c = 0; c < vol.ingredientId.length; c++)
        h = (h * 31 + vol.ingredientId.charCodeAt(c)) | 0;
      return ((Math.abs(h) % 10000) / 10000) * Math.PI * 2;
    });
  }, [volumes]);

  // Convert angles to quaternions for instance matrix composition
  const instanceRotations = useMemo(() => {
    const yAxis = new THREE.Vector3(0, 1, 0);
    return instanceAngles.map((angle) =>
      new THREE.Quaternion().setFromAxisAngle(yAxis, angle),
    );
  }, [instanceAngles]);

  // Per-instance fruit time offset for staggered dropping (0–2 seconds)
  const fruitTimeOffsets = useMemo(() => {
    return volumes.map((vol) => {
      let h = 0;
      for (let c = 0; c < vol.ingredientId.length; c++)
        h = (h * 31 + vol.ingredientId.charCodeAt(c) + 47) | 0;
      return ((Math.abs(h) % 1000) / 1000) * 2.0;
    });
  }, [volumes]);

  // Reusable objects to avoid GC pressure in animation loop
  const tempMat = useMemo(() => new THREE.Matrix4(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempScale = useMemo(() => new THREE.Vector3(), []);
  const tempRotation = useMemo(() => new THREE.Quaternion(), []);
  const yAxis = useMemo(() => new THREE.Vector3(0, 1, 0), []);

  // ---- Per-frame animation loop (GLB path) ----
  // Updates ALL instance matrices every frame for breathing + lifeScale + drag position.
  // Also sets per-instance hover colors via instanceColor.
  useFrame((state) => {
    const t = state.clock.elapsedTime;

    for (const meshRef of instancedRefs.current) {
      if (!meshRef) continue;
      // Lazily initialize per-instance color buffer for hover highlighting.
      // instanceColor multiplies with material color in the shader (RGB, 3 floats per instance).
      if (!meshRef.instanceColor) {
        meshRef.instanceColor = new THREE.InstancedBufferAttribute(
          new Float32Array(count * 3).fill(1),
          3,
        );
      }
      for (let i = 0; i < count; i++) {
        const vol = volumes[i];
        const isDragTarget =
          dragInstanceIdxRef.current === i && dragOverridePosRef.current;
        const px = isDragTarget
          ? dragOverridePosRef.current!.x
          : vol.position.x;
        const pz = isDragTarget
          ? dragOverridePosRef.current!.z
          : vol.position.z;
        const graze =
          grazeMotion && !isDragTarget
            ? grazingOffset(
                t,
                i,
                instanceAngles[i],
                grazeMotion.radius,
                grazeMotion.speed,
              )
            : null;
        const nextGraze =
          grazeMotion && !isDragTarget
            ? grazingOffset(
                t + 0.35,
                i,
                instanceAngles[i],
                grazeMotion.radius,
                grazeMotion.speed,
              )
            : null;
        const finalX = px + (graze?.x ?? 0);
        const finalZ = pz + (graze?.z ?? 0);
        const py = isDragTarget ? 0.3 : 0;
        const breathe = Math.sin(t * 0.5 + vol.position.x) * 0.015;
        const s = modelScale * lifeScale * (1 + breathe);
        tempPos.set(finalX, py, finalZ);
        tempScale.set(s, s, s);
        const rotation =
          graze && nextGraze
            ? tempRotation.setFromAxisAngle(
                yAxis,
                Math.atan2(nextGraze.x - graze.x, nextGraze.z - graze.z),
              )
            : instanceRotations[i];
        tempMat.compose(tempPos, rotation, tempScale);
        meshRef.setMatrixAt(i, tempMat);
        // Per-instance hover: brighten only the hovered instance
        if (hoveredIdx !== null && i === hoveredIdx) {
          meshRef.instanceColor.setXYZ(i, 1.5, 1.4, 1.2);
        } else {
          meshRef.instanceColor.setXYZ(i, 1, 1, 1);
        }
      }
      meshRef.instanceMatrix.needsUpdate = true;
      meshRef.instanceColor.needsUpdate = true;
      // Invalidate bounding sphere so Three.js recomputes it on next raycast.
      // Without this, dragged instances outside the original bounds become
      // unhittable from certain camera angles (stale broad-phase rejection).
      meshRef.boundingSphere = null;
    }

    // Sync fruit group position during drag
    if (
      dragInstanceIdxRef.current !== null &&
      dragOverridePosRef.current &&
      fruitGroupRefs.current[dragInstanceIdxRef.current]
    ) {
      const fg = fruitGroupRefs.current[dragInstanceIdxRef.current]!;
      fg.position.x = dragOverridePosRef.current.x;
      fg.position.z = dragOverridePosRef.current.z;
    }
  });

  // Pointer events via instanceId
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const idx = e.instanceId;
    if (idx !== undefined) {
      setHoveredIdx(idx);
      onHover?.(speciesId);
      onHoverName?.(volumes[idx].displayName);
      document.body.style.cursor = "pointer";
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredIdx(null);
    onHover?.(null);
    onHoverName?.(null);
    document.body.style.cursor = "";
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (justDraggedRef.current) return;
    onClick?.(speciesId);
  };

  // ---- Hold-to-drag for per-instance repositioning ----
  // Same state machine as useDragToReposition but inline because InstancedMesh
  // has no per-instance group refs. The dragged instance's position override is
  // stored in dragOverridePosRef and consumed by useFrame above.
  // Flow: pointerDown → hold timer → (if fires) set dragInstanceIdxRef →
  //   pointermove updates dragOverridePosRef → pointerup commits via onDragEnd.
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    const idx = e.instanceId;
    if (idx === undefined || !onDragEnd) return;

    const startPos = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
    const isTouchEvent = e.nativeEvent.pointerType === "touch";
    const delay = isTouchEvent ? 500 : 300;
    let holdFired = false;

    const timer = setTimeout(() => {
      holdFired = true;
      dragInstanceIdxRef.current = idx;
      dragOverridePosRef.current = {
        x: volumes[idx].position.x,
        z: volumes[idx].position.z,
      };
      onDragStart?.();
      document.body.style.cursor = "grabbing";
    }, delay);

    const onMove = (me: PointerEvent) => {
      if (!holdFired) {
        // Pointer moved >5px before hold timer fired → cancel (orbit takes over)
        if (Math.hypot(me.clientX - startPos.x, me.clientY - startPos.y) > 5) {
          clearTimeout(timer);
          cleanup();
        }
        return;
      }
      const pos = raycastToGround(
        me.clientX,
        me.clientY,
        groundRadiusProp ?? 20,
      );
      if (pos) dragOverridePosRef.current = pos;
    };

    const onUp = () => {
      clearTimeout(timer);
      if (holdFired && dragOverridePosRef.current != null) {
        const volumeId = volumes[dragInstanceIdxRef.current!].ingredientId;
        onDragEnd(volumeId, dragOverridePosRef.current);
        justDraggedRef.current = true;
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 100);

        // Force R3F to re-raycast — see useDragToReposition.ts header comment
        document.body.style.cursor = "";
        requestAnimationFrame(() => {
          events.update?.();
        });
      } else {
        document.body.style.cursor = "";
      }
      dragInstanceIdxRef.current = null;
      dragOverridePosRef.current = null;
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("blur", onWindowBlur);
    };

    const onCancel = () => {
      onUp();
    };

    const onWindowBlur = () => {
      onUp();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("blur", onWindowBlur);
  };

  return (
    <group ref={groupRef}>
      {/* Instanced tree meshes — one InstancedMesh per mesh in the GLB */}
      {treeMeshes.map((meshData, meshIdx) => (
        <instancedMesh
          key={meshIdx}
          ref={(el) => {
            instancedRefs.current[meshIdx] = el;
          }}
          args={[meshData.geometry, undefined, count]}
          castShadow
          receiveShadow
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        >
          {Array.isArray(meshData.material) ? (
            meshData.material.map((mat, matIdx) => (
              <primitive
                key={matIdx}
                object={mat}
                attach={`material-${matIdx}`}
              />
            ))
          ) : (
            <primitive object={meshData.material} attach="material" />
          )}
        </instancedMesh>
      ))}

      {/* Fruit particles — one per instance, with staggered drop timing.
          scale={lifeScale} keeps fruits attached as tree shrinks/grows.
          rotation matches the per-instance Y-rotation so fruits stay on the
          rotated tree's bark surface (without this, fruits float in the air). */}
      {volumes.map((vol, idx) => (
        <group
          key={vol.ingredientId}
          ref={(el) => {
            fruitGroupRefs.current[idx] = el;
          }}
          position={[vol.position.x, 0, vol.position.z]}
          scale={lifeScale}
          rotation={[0, instanceAngles[idx], 0]}
        >
          <FruitParticles
            canopyRadius={crownRadius}
            crownHeight={modelTopY * 0.7}
            status={status}
            intensity={intensity}
            baseColor={color}
            isDarkMode={isDarkMode}
            layer={layer}
            isPlaying={isSimulating}
            ingredientId={speciesId}
            speciesConfig={speciesConfig}
            attachPoints={scaledAttachPoints}
            productiveProgress={intensity}
            modelScale={modelScale}
            timeOffset={fruitTimeOffsets[idx]}
          />
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// DEFAULT GEOMETRY INSTANCED GROUP
// ============================================================================

interface InstancedDefaultGroupProps {
  volumes: SpatialVolume[];
  speciesId: string;
  layer: string;
  isCanopyLayer: boolean;
  isGroundLayer: boolean;
  isClimber: boolean;
  isShrubOrHerb: boolean;
  heightRange: [number, number];
  crownRadius: number;
  growthMaturity: number;
  color: THREE.Color;
  trunkColor: string;
  baseOpacity: number;
  emissiveIntensity: number;
  status: SegmentStatus;
  intensity: number;
  isDarkMode: boolean;
  isSimulating: boolean;
  hoveredIdx: number | null;
  setHoveredIdx: (idx: number | null) => void;
  onClick?: (ingredientId: string) => void;
  onHover?: (ingredientId: string | null) => void;
  speciesConfig: ReturnType<typeof getSpeciesConfig>;
  attachPoints: THREE.Vector3[];
  groundRadius?: number;
  onDragStart?: () => void;
  onDragEnd?: (volumeId: string, position: { x: number; z: number }) => void;
  onHoverName?: (name: string | null) => void;
}

function InstancedDefaultGroup({
  volumes,
  speciesId,
  layer,
  isCanopyLayer,
  isGroundLayer,
  isClimber,
  isShrubOrHerb,
  heightRange,
  crownRadius,
  growthMaturity,
  color,
  trunkColor,
  baseOpacity,
  emissiveIntensity,
  status,
  intensity,
  isDarkMode,
  isSimulating,
  hoveredIdx,
  setHoveredIdx,
  onClick,
  onHover,
  speciesConfig,
  attachPoints,
  groundRadius: groundRadiusProp,
  onDragStart,
  onDragEnd,
  onHoverName,
}: InstancedDefaultGroupProps) {
  const crownRef = useRef<THREE.InstancedMesh>(null);
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const count = volumes.length;

  // ---- Drag-to-reposition state (same pattern as InstancedGLBGroup) ----
  const { camera, gl, events } = useThree();
  const raycastToGround = useMemo(
    () => createGroundRaycaster(camera, gl.domElement),
    [camera, gl],
  );
  const dragInstanceIdxRef = useRef<number | null>(null);
  const dragOverridePosRef = useRef<{ x: number; z: number } | null>(null);
  const justDraggedRef = useRef(false);
  const fruitGroupRefs = useRef<(THREE.Group | null)[]>([]);

  // Life scale: uniform shrink/grow driven by intensity (see VolumeRenderer.tsx
  // for full explanation). Toggle: ENABLE_LIFECYCLE_SCALE, exponent: LIFECYCLE_SCALE_EXPONENT.
  const lifeScale = ENABLE_LIFECYCLE_SCALE
    ? Math.max(0.01, Math.pow(intensity, LIFECYCLE_SCALE_EXPONENT))
    : 1.0;

  // Compute geometry parameters (shared across all instances — from representative)
  const matureTrunkHeight =
    heightRange[0] + (heightRange[1] - heightRange[0]) * 0.3;
  const trunkHeight = Math.max(0.2, matureTrunkHeight * growthMaturity);
  const actualSphereRadius = isCanopyLayer ? crownRadius : crownRadius * 0.85;
  const crownCenterHeight = trunkHeight + actualSphereRadius * 0.5;

  // Trunk dimensions
  const trunkTopRadius = Math.max(0.03, crownRadius * 0.08);
  const trunkBottomRadius = Math.max(0.05, crownRadius * 0.12);

  // Shrub dimensions
  const matureShrubHeight = heightRange[1] * 0.5;
  const shrubHeight = Math.max(0.15, matureShrubHeight * growthMaturity);
  const stemHeight = Math.max(0.05, 0.3 * growthMaturity);

  // Climber dimensions
  const matureVineHeight = heightRange[1] * 0.8;
  const vineHeight = Math.max(0.3, matureVineHeight * growthMaturity);

  // Ground layer y-offset
  const groundBaseY = isGroundLayer ? 0.05 : 0;

  // Geometries (created once, shared across instances)
  const crownGeometry = useMemo(() => {
    if (isGroundLayer) {
      return new THREE.CylinderGeometry(
        crownRadius,
        crownRadius * 1.1,
        0.15,
        24,
      );
    }
    if (isClimber) {
      return new THREE.CylinderGeometry(
        0.08 * growthMaturity + 0.02,
        0.12 * growthMaturity + 0.03,
        vineHeight,
        8,
      );
    }
    if (isShrubOrHerb) {
      return new THREE.SphereGeometry(
        crownRadius,
        16,
        12,
        0,
        Math.PI * 2,
        0,
        Math.PI * 0.6,
      );
    }
    // Tree crown
    return new THREE.SphereGeometry(
      actualSphereRadius,
      isCanopyLayer ? 20 : 16,
      isCanopyLayer ? 16 : 12,
    );
  }, [
    isGroundLayer,
    isClimber,
    isShrubOrHerb,
    isCanopyLayer,
    crownRadius,
    actualSphereRadius,
    growthMaturity,
    vineHeight,
  ]);

  const trunkGeometry = useMemo(() => {
    if (isGroundLayer || isClimber) return null;
    if (isShrubOrHerb) {
      return new THREE.CylinderGeometry(
        crownRadius * 0.15,
        crownRadius * 0.2,
        stemHeight,
        8,
      );
    }
    return new THREE.CylinderGeometry(
      trunkTopRadius,
      trunkBottomRadius,
      trunkHeight,
      8,
    );
  }, [
    isGroundLayer,
    isClimber,
    isShrubOrHerb,
    crownRadius,
    stemHeight,
    trunkTopRadius,
    trunkBottomRadius,
    trunkHeight,
  ]);

  // Compute crown Y offset for each layer type
  const crownYOffset = useMemo(() => {
    if (isGroundLayer) return groundBaseY;
    if (isClimber) return vineHeight / 2;
    if (isShrubOrHerb) return shrubHeight * 0.4;
    return crownCenterHeight;
  }, [
    isGroundLayer,
    isClimber,
    isShrubOrHerb,
    groundBaseY,
    vineHeight,
    shrubHeight,
    crownCenterHeight,
  ]);

  const trunkYOffset = useMemo(() => {
    if (isShrubOrHerb) return stemHeight / 2;
    return trunkHeight / 2;
  }, [isShrubOrHerb, stemHeight, trunkHeight]);

  // Fruit rendering params
  const fruitCanopyRadius = isClimber
    ? 0.5
    : isGroundLayer
      ? crownRadius
      : isShrubOrHerb
        ? crownRadius
        : actualSphereRadius;
  const fruitCrownHeight = isGroundLayer
    ? 0.2
    : isClimber
      ? vineHeight * 0.7
      : isShrubOrHerb
        ? shrubHeight * 0.6
        : crownCenterHeight;

  // Per-instance Y-axis rotation angle for visual variety (deterministic from ingredientId).
  // Uses ingredientId hash instead of position so rotation stays stable after drag.
  // Used for BOTH tree instance matrices AND fruit group rotations so fruits stay
  // aligned with the rotated tree geometry.
  const instanceAngles = useMemo(() => {
    return volumes.map((vol) => {
      let h = 0;
      for (let c = 0; c < vol.ingredientId.length; c++)
        h = (h * 31 + vol.ingredientId.charCodeAt(c)) | 0;
      return ((Math.abs(h) % 10000) / 10000) * Math.PI * 2;
    });
  }, [volumes]);

  // Convert angles to quaternions for instance matrix composition
  const instanceRotations = useMemo(() => {
    const yAxis = new THREE.Vector3(0, 1, 0);
    return instanceAngles.map((angle) =>
      new THREE.Quaternion().setFromAxisAngle(yAxis, angle),
    );
  }, [instanceAngles]);

  // Per-instance fruit time offset for staggered dropping (0–2 seconds)
  const fruitTimeOffsets = useMemo(() => {
    return volumes.map((vol) => {
      let h = 0;
      for (let c = 0; c < vol.ingredientId.length; c++)
        h = (h * 31 + vol.ingredientId.charCodeAt(c) + 47) | 0;
      return ((Math.abs(h) % 1000) / 1000) * 2.0;
    });
  }, [volumes]);

  // Reusable objects to avoid GC pressure in animation loop
  const tempMat = useMemo(() => new THREE.Matrix4(), []);
  const tempPos = useMemo(() => new THREE.Vector3(), []);
  const tempScl = useMemo(() => new THREE.Vector3(), []);

  // ---- Per-frame animation loop (default geometry path) ----
  // Updates crown + trunk instance matrices every frame for breathing + lifeScale + drag.
  // Y-offsets also scaled by lifeScale so crowns stay connected to trunks as plant shrinks.
  // Also sets per-instance hover colors via instanceColor (same pattern as GLB path).
  useFrame((state) => {
    if (!crownRef.current) return;
    const t = state.clock.elapsedTime;

    // Lazily initialize per-instance color buffer for hover highlighting
    if (!crownRef.current.instanceColor) {
      crownRef.current.instanceColor = new THREE.InstancedBufferAttribute(
        new Float32Array(count * 3).fill(1),
        3,
      );
    }

    for (let i = 0; i < count; i++) {
      const vol = volumes[i];
      const isDragTarget =
        dragInstanceIdxRef.current === i && dragOverridePosRef.current;
      const px = isDragTarget ? dragOverridePosRef.current!.x : vol.position.x;
      const pz = isDragTarget ? dragOverridePosRef.current!.z : vol.position.z;
      const py = isDragTarget ? 0.3 : 0;
      const breathe = Math.sin(t * 0.5 + vol.position.x) * 0.015;
      const s = lifeScale * (1 + breathe);
      tempPos.set(px, py + crownYOffset * lifeScale, pz);
      tempScl.set(s, s, s);
      tempMat.compose(tempPos, instanceRotations[i], tempScl);
      crownRef.current.setMatrixAt(i, tempMat);
      // Per-instance hover: brighten only the hovered instance
      if (hoveredIdx !== null && i === hoveredIdx) {
        crownRef.current.instanceColor.setXYZ(i, 1.5, 1.4, 1.2);
      } else {
        crownRef.current.instanceColor.setXYZ(i, 1, 1, 1);
      }
    }
    crownRef.current.instanceMatrix.needsUpdate = true;
    crownRef.current.instanceColor.needsUpdate = true;
    // Invalidate bounding sphere so Three.js recomputes it on next raycast.
    // Without this, dragged instances outside the original bounds become
    // unhittable from certain camera angles (stale broad-phase rejection).
    crownRef.current.boundingSphere = null;

    // Trunk instances (if applicable)
    if (trunkRef.current && trunkGeometry) {
      if (!trunkRef.current.instanceColor) {
        trunkRef.current.instanceColor = new THREE.InstancedBufferAttribute(
          new Float32Array(count * 3).fill(1),
          3,
        );
      }
      for (let i = 0; i < count; i++) {
        const vol = volumes[i];
        const isDragTarget =
          dragInstanceIdxRef.current === i && dragOverridePosRef.current;
        const px = isDragTarget
          ? dragOverridePosRef.current!.x
          : vol.position.x;
        const pz = isDragTarget
          ? dragOverridePosRef.current!.z
          : vol.position.z;
        const py = isDragTarget ? 0.3 : 0;
        const breathe = Math.sin(t * 0.5 + vol.position.x) * 0.015;
        const s = lifeScale * (1 + breathe);
        tempPos.set(px, py + trunkYOffset * lifeScale, pz);
        tempScl.set(s, s, s);
        tempMat.compose(tempPos, instanceRotations[i], tempScl);
        trunkRef.current.setMatrixAt(i, tempMat);
        if (hoveredIdx !== null && i === hoveredIdx) {
          trunkRef.current.instanceColor.setXYZ(i, 1.5, 1.4, 1.2);
        } else {
          trunkRef.current.instanceColor.setXYZ(i, 1, 1, 1);
        }
      }
      trunkRef.current.instanceMatrix.needsUpdate = true;
      trunkRef.current.instanceColor.needsUpdate = true;
    }

    // Sync fruit group position during drag
    if (
      dragInstanceIdxRef.current !== null &&
      dragOverridePosRef.current &&
      fruitGroupRefs.current[dragInstanceIdxRef.current]
    ) {
      const fg = fruitGroupRefs.current[dragInstanceIdxRef.current]!;
      fg.position.x = dragOverridePosRef.current.x;
      fg.position.z = dragOverridePosRef.current.z;
    }
  });

  // Pointer events
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    const idx = e.instanceId;
    if (idx !== undefined) {
      setHoveredIdx(idx);
      onHover?.(speciesId);
      onHoverName?.(volumes[idx].displayName);
      document.body.style.cursor = "pointer";
    }
  };

  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setHoveredIdx(null);
    onHover?.(null);
    onHoverName?.(null);
    document.body.style.cursor = "";
  };

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (justDraggedRef.current) return;
    onClick?.(speciesId);
  };

  // ---- Hold-to-drag (same as InstancedGLBGroup — see comment there) ----
  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    const idx = e.instanceId;
    if (idx === undefined || !onDragEnd) return;

    const startPos = { x: e.nativeEvent.clientX, y: e.nativeEvent.clientY };
    const isTouchEvent = e.nativeEvent.pointerType === "touch";
    const delay = isTouchEvent ? 500 : 300;
    let holdFired = false;

    const timer = setTimeout(() => {
      holdFired = true;
      dragInstanceIdxRef.current = idx;
      dragOverridePosRef.current = {
        x: volumes[idx].position.x,
        z: volumes[idx].position.z,
      };
      onDragStart?.();
      document.body.style.cursor = "grabbing";
    }, delay);

    const onMove = (me: PointerEvent) => {
      if (!holdFired) {
        if (Math.hypot(me.clientX - startPos.x, me.clientY - startPos.y) > 5) {
          clearTimeout(timer);
          cleanup();
        }
        return;
      }
      const pos = raycastToGround(
        me.clientX,
        me.clientY,
        groundRadiusProp ?? 20,
      );
      if (pos) dragOverridePosRef.current = pos;
    };

    const onUp = () => {
      clearTimeout(timer);
      if (holdFired && dragOverridePosRef.current != null) {
        const volumeId = volumes[dragInstanceIdxRef.current!].ingredientId;
        onDragEnd(volumeId, dragOverridePosRef.current);
        justDraggedRef.current = true;
        setTimeout(() => {
          justDraggedRef.current = false;
        }, 100);

        document.body.style.cursor = "";
        requestAnimationFrame(() => {
          events.update?.();
        });
      } else {
        document.body.style.cursor = "";
      }
      dragInstanceIdxRef.current = null;
      dragOverridePosRef.current = null;
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("blur", onWindowBlur);
    };

    const onCancel = () => {
      onUp();
    };

    const onWindowBlur = () => {
      onUp();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("blur", onWindowBlur);
  };

  return (
    <group>
      {/* Crown / main body instanced mesh */}
      <instancedMesh
        ref={crownRef}
        args={[crownGeometry, undefined, count]}
        castShadow
        receiveShadow
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={baseOpacity}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={isGroundLayer ? 0.7 : isClimber ? 0.6 : 0.5}
          side={isShrubOrHerb ? THREE.DoubleSide : THREE.FrontSide}
        />
      </instancedMesh>

      {/* Trunk / stem instanced mesh */}
      {trunkGeometry && (
        <instancedMesh
          ref={trunkRef}
          args={[trunkGeometry, undefined, count]}
          castShadow
        >
          <meshStandardMaterial
            color={trunkColor}
            roughness={0.85}
            emissive={isDarkMode ? trunkColor : undefined}
            emissiveIntensity={isDarkMode ? 0.1 : 0}
          />
        </instancedMesh>
      )}

      {/* Fruit particles per instance, with staggered drop timing.
          scale={lifeScale} keeps fruits attached as tree shrinks/grows.
          rotation matches the per-instance Y-rotation so fruits stay on the
          rotated tree's bark surface (without this, fruits float in the air). */}
      {volumes.map((vol, idx) => (
        <group
          key={vol.ingredientId}
          ref={(el) => {
            fruitGroupRefs.current[idx] = el;
          }}
          position={[vol.position.x, groundBaseY, vol.position.z]}
          scale={lifeScale}
          rotation={[0, instanceAngles[idx], 0]}
        >
          <FruitParticles
            canopyRadius={fruitCanopyRadius}
            crownHeight={fruitCrownHeight}
            status={status}
            intensity={intensity}
            baseColor={color}
            isDarkMode={isDarkMode}
            layer={layer}
            isPlaying={isSimulating}
            ingredientId={speciesId}
            speciesConfig={speciesConfig}
            attachPoints={attachPoints}
            productiveProgress={intensity}
            timeOffset={fruitTimeOffsets[idx]}
          />
        </group>
      ))}
    </group>
  );
}
