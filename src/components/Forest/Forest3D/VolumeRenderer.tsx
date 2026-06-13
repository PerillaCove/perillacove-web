import { useRef, useState, useMemo, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  type SpatialVolume,
  ENABLE_LIFECYCLE_SCALE,
  LIFECYCLE_SCALE_EXPONENT,
} from "../spatial";
import FruitParticles from "./FruitParticles";
import { getSpeciesConfig } from "./SpeciesRenderConfig";
import { useTreeModel } from "./TreeModelLoader";
import { useDragToReposition } from "./useDragToReposition";

interface VolumeRendererProps {
  volume: SpatialVolume;
  isDarkMode: boolean;
  /**
   * Whether time simulation is active (auto-play OR user dragging timeline).
   * Passed to FruitParticles to control fruit behavior:
   * - false: Fruits hang static, attached to canopy
   * - true: Fruits fall with gravity
   */
  isSimulating?: boolean;
  onClick?: () => void;
  onHover?: (hovered: boolean) => void;
  groundRadius?: number;
  onDragStart?: () => void;
  onDragEnd?: (position: { x: number; z: number }) => void;
  /** Reports display name on hover for the scene-level overlay */
  onHoverName?: (name: string | null) => void;
}

/**
 * VolumeRenderer - Renders a single species as an organic 3D volume.
 *
 * All volumes are grounded - trunks connect to ground level.
 * Species grow gradually from seedling to full size based on growthMaturity.
 */
export default function VolumeRenderer({
  volume,
  isDarkMode,
  isSimulating = false,
  onClick,
  onHover,
  groundRadius: groundRadiusProp,
  onDragStart,
  onDragEnd,
  onHoverName,
}: VolumeRendererProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  // Drag-to-reposition: hold pointer 300ms (desktop) / 500ms (mobile) to
  // activate drag mode. Plant lifts 0.3m, follows pointer on ground plane,
  // commits final position on release. See useDragToReposition.ts for details.
  const { handlePointerDown, dragGroupRef, justDraggedRef } =
    useDragToReposition({
      groundRadius: groundRadiusProp ?? 20,
      onDragStart: onDragStart ?? (() => {}),
      onDragEnd: onDragEnd ?? (() => {}),
      enabled: Boolean(onDragEnd),
    });

  // Both the breathing useFrame and the drag hook need to mutate the same
  // <group> node. Callback ref writes to both refs on mount.
  const mergedGroupRef = useCallback(
    (node: THREE.Group | null) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (groupRef as any).current = node;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (dragGroupRef as any).current = node;
    },
    [dragGroupRef],
  );

  // Click guard: the drag hook sets justDraggedRef=true for 100ms after
  // releasing a drag. Without this, pointerup would fire onClick and open
  // the inspect panel immediately after repositioning.
  const handleClick = useCallback(() => {
    if (justDraggedRef.current) return;
    onClick?.();
  }, [onClick, justDraggedRef]);

  // Parse color - brighten for dark mode visibility
  const color = useMemo(() => {
    const baseColor = new THREE.Color(volume.layerColor);
    if (isDarkMode) {
      // Boost saturation and lightness for dark mode
      const hsl = { h: 0, s: 0, l: 0 };
      baseColor.getHSL(hsl);
      baseColor.setHSL(
        hsl.h,
        Math.min(1, hsl.s * 1.2),
        Math.min(0.7, hsl.l * 1.4),
      );
    }
    return baseColor;
  }, [volume.layerColor, isDarkMode]);

  const {
    ingredientId,
    sourceIngredientId,
    position,
    heightRange,
    canopyRadius,
    opacity,
    layer,
    growthMaturity,
    status,
    intensity,
  } = volume;

  // Spatial volume IDs can include runtime suffixes (__instance, __groupId).
  // Use the original ingredient ID for config/model lookup.
  const speciesId = sourceIngredientId ?? ingredientId;

  // Species-specific rendering config (null = use defaults)
  const speciesConfig = getSpeciesConfig(speciesId);
  const { scene: treeScene, attachPoints } = useTreeModel(speciesId);

  // ---- GROWTH-SCALED DIMENSIONS ----
  // Everything scales with growthMaturity (0.05 = seedling, 1 = mature)
  // Crown radius already incorporates growth maturity from spatial.ts
  const crownRadius = canopyRadius;

  // Trunk height grows with maturity - young plants have short trunks
  const matureTrunkHeight =
    heightRange[0] + (heightRange[1] - heightRange[0]) * 0.3;
  const trunkHeight = matureTrunkHeight * growthMaturity;

  // Shape variations based on layer
  const isCanopyLayer = layer === "canopy" || layer === "midstory";
  const isGroundLayer = layer === "groundcover" || layer === "root";
  const isClimber = layer === "climber";
  const isShrubOrHerb = layer === "shrub" || layer === "herbaceous";

  // Breathing animation + lifeScale: both applied per-frame via group scale.
  // This drives growth-in AND shrink-out for ALL rendering paths (GLB, default geometry).
  useFrame((state) => {
    if (!groupRef.current) return;
    const breathe =
      Math.sin(state.clock.elapsedTime * 0.5 + position.x) * 0.015;
    groupRef.current.scale.setScalar(lifeScale * (1 + breathe));
  });

  // HOVER HIGHLIGHT — GLB model path (single-instance only).
  // Sets warm emissive (#665533) on all MeshStandardMaterial meshes in the
  // cloned scene. Safe for single-instance because each VolumeRenderer owns
  // its own cloned scene (via useTreeModel). For multi-instance species,
  // see InstancedVolumeGroup which uses per-instance `instanceColor` instead
  // (shared materials can't be modified per-instance).
  // Must be above conditional returns (React hooks rule).
  useEffect(() => {
    if (!treeScene) return;
    treeScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mats = Array.isArray(child.material)
          ? child.material
          : [child.material];
        for (const mat of mats) {
          if ("emissive" in mat) {
            const stdMat = mat as THREE.MeshStandardMaterial;
            if (hovered) {
              stdMat.emissive.set("#665533");
              stdMat.emissiveIntensity = 0.4;
            } else {
              stdMat.emissive.set("#000000");
              stdMat.emissiveIntensity = 0;
            }
          }
        }
      }
    });
  }, [treeScene, hovered]);

  // Handle pointer events
  const handlePointerOver = () => {
    setHovered(true);
    onHover?.(true);
    onHoverName?.(volume.displayName);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setHovered(false);
    onHover?.(false);
    onHoverName?.(null);
    document.body.style.cursor = "";
  };

  // Compute final opacity - higher in dark mode for visibility
  const baseOpacity = isDarkMode ? Math.min(opacity * 1.3, 0.95) : opacity;
  const finalOpacity = hovered
    ? Math.min(baseOpacity + 0.15, 0.98)
    : baseOpacity;

  // Emissive glow - stronger in dark mode for visibility
  const darkModeEmissive = isDarkMode ? 0.25 : 0;
  const emissiveIntensity = hovered
    ? 0.5 // Strong highlight glow on hover
    : darkModeEmissive;

  // Trunk color - lighter in dark mode
  const trunkColor = isDarkMode ? "#8a7050" : "#8b7355";

  // ---- LIFE SCALE (smooth grow-in / shrink-out) ----
  // Derives a uniform scale from intensity so the plant visually grows during
  // establishing and shrinks back down during decline — the death animation is
  // the mirror image of the birth animation.
  //
  // Uses pow(LIFECYCLE_SCALE_EXPONENT) for a gentle curve:
  //   intensity 1.0 → scale 1.0  (full size at peak productivity)
  //   intensity 0.5 → scale 0.76 (mid-decline, still clearly visible)
  //   intensity 0.15 → scale 0.50 (harvestEnd, half size)
  //   intensity 0.01 → scale 0.25 (nearly gone)
  // Applied in useFrame below, multiplied with the breathing animation.
  //
  // IMPORTANT: no status conditional — intensity is a continuous curve from
  // getSpeciesIntensityAtYear() (0→0.3→1→0.15→0). Using status would create
  // discontinuities at phase boundaries. See util.ts for the intensity curve.
  //
  // Toggle: ENABLE_LIFECYCLE_SCALE (spatial.ts). When false, lifeScale = 1.0
  // and plants stay full size until removed (instant disappear).
  // Exponent: LIFECYCLE_SCALE_EXPONENT (spatial.ts). Lower = stays large longer.
  const lifeScale = ENABLE_LIFECYCLE_SCALE
    ? Math.max(0.01, Math.pow(intensity, LIFECYCLE_SCALE_EXPONENT))
    : 1.0;

  // ---- CUSTOM TREE MODEL ----
  // If species has a custom GLB model, render it instead of default geometry
  if (treeScene && speciesConfig?.treeModel) {
    // Use species-specific height override, or fall back to layer heightRange
    const matureHeight = speciesConfig.matureHeight ?? heightRange[1];
    const modelScale = growthMaturity * matureHeight;
    const modelTopY = modelScale;

    // Attach points are in model-local coords (unit scale) — scale to match rendered size
    const scaledAttachPoints = attachPoints.map((pt) =>
      pt.clone().multiplyScalar(modelScale),
    );

    return (
      <group ref={mergedGroupRef} position={[position.x, 0, position.z]}>
        <primitive
          object={treeScene}
          scale={[modelScale, modelScale, modelScale]}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
        />

        {/* Fruit particles (unless behavior is "integrated" — FruitParticles handles that) */}
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
        />
      </group>
    );
  }

  // Ground layer - flat disc on ground
  if (isGroundLayer) {
    return (
      <group ref={mergedGroupRef} position={[position.x, 0.05, position.z]}>
        <mesh
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          receiveShadow
          castShadow
        >
          <cylinderGeometry args={[crownRadius, crownRadius * 1.1, 0.15, 24]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={finalOpacity}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            roughness={0.7}
          />
        </mesh>
        <FruitParticles
          canopyRadius={crownRadius}
          crownHeight={0.2}
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
        />
      </group>
    );
  }

  // Climber - thin vine growing from ground (grows with maturity)
  if (isClimber) {
    const matureVineHeight = heightRange[1] * 0.8;
    const vineHeight = Math.max(0.3, matureVineHeight * growthMaturity);
    return (
      <group ref={mergedGroupRef} position={[position.x, 0, position.z]}>
        <mesh
          position={[0, vineHeight / 2, 0]}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          castShadow
        >
          <cylinderGeometry
            args={[
              0.08 * growthMaturity + 0.02,
              0.12 * growthMaturity + 0.03,
              vineHeight,
              8,
            ]}
          />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={finalOpacity}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            roughness={0.6}
          />
        </mesh>
        <FruitParticles
          canopyRadius={0.5}
          crownHeight={vineHeight * 0.7}
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
        />
      </group>
    );
  }

  // Shrub/Herbaceous - short mound shape, grounded (grows with maturity)
  if (isShrubOrHerb) {
    const matureShrubHeight = heightRange[1] * 0.5;
    const shrubHeight = Math.max(0.15, matureShrubHeight * growthMaturity);
    const stemHeight = Math.max(0.05, 0.3 * growthMaturity);
    return (
      <group ref={mergedGroupRef} position={[position.x, 0, position.z]}>
        {/* Main shrub body - half-sphere sitting on ground */}
        <mesh
          position={[0, shrubHeight * 0.4, 0]}
          onClick={handleClick}
          onPointerDown={handlePointerDown}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          castShadow
          receiveShadow
        >
          <sphereGeometry
            args={[crownRadius, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6]}
          />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={finalOpacity}
            emissive={color}
            emissiveIntensity={emissiveIntensity}
            roughness={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Small stem */}
        <mesh position={[0, stemHeight / 2, 0]} castShadow>
          <cylinderGeometry
            args={[crownRadius * 0.15, crownRadius * 0.2, stemHeight, 8]}
          />
          <meshStandardMaterial color={trunkColor} roughness={0.8} />
        </mesh>
        <FruitParticles
          canopyRadius={crownRadius}
          crownHeight={shrubHeight * 0.6}
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
        />
      </group>
    );
  }

  // Tree (canopy, midstory, understory) - trunk from ground + crown on top
  // Young trees are small seedlings, growing gradually to full size
  const effectiveTrunkHeight = Math.max(0.2, trunkHeight);
  const trunkTopRadius = Math.max(0.03, crownRadius * 0.08);
  const trunkBottomRadius = Math.max(0.05, crownRadius * 0.12);

  // Actual rendered sphere radius (smaller for non-canopy layers)
  const actualSphereRadius = isCanopyLayer ? crownRadius : crownRadius * 0.85;
  // Crown center height (where the sphere is positioned)
  const crownCenterHeight = effectiveTrunkHeight + actualSphereRadius * 0.5;

  return (
    <group ref={mergedGroupRef} position={[position.x, 0, position.z]}>
      {/* Trunk - starts at ground (y=0), grows with maturity */}
      <mesh position={[0, effectiveTrunkHeight / 2, 0]} castShadow>
        <cylinderGeometry
          args={[trunkTopRadius, trunkBottomRadius, effectiveTrunkHeight, 8]}
        />
        <meshStandardMaterial
          color={trunkColor}
          roughness={0.85}
          emissive={isDarkMode ? trunkColor : undefined}
          emissiveIntensity={isDarkMode ? 0.1 : 0}
        />
      </mesh>

      {/* Crown/canopy - sits on top of trunk, scales with growth */}
      <mesh
        position={[0, crownCenterHeight, 0]}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        castShadow
        receiveShadow
      >
        <sphereGeometry
          args={[
            actualSphereRadius,
            isCanopyLayer ? 20 : 16,
            isCanopyLayer ? 16 : 12,
          ]}
        />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={finalOpacity}
          emissive={color}
          emissiveIntensity={emissiveIntensity}
          roughness={0.5}
        />
      </mesh>

      {/* Fruit particles - appear during productive phase
          isPlaying controls animation:
          - false (paused): fruits hang static on canopy
          - true (simulating/dragging): fruits fall with gravity */}
      <FruitParticles
        canopyRadius={actualSphereRadius}
        crownHeight={crownCenterHeight}
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
      />
    </group>
  );
}
