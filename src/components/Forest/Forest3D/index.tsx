import { Suspense, useMemo, useRef, useState, useCallback } from "react";
import { Canvas } from "@react-three/fiber";
import { MapControls, Environment, PerspectiveCamera } from "@react-three/drei";
import clsx from "clsx";
import type { Ingredient } from "../../IngredientsPage/types";
import { computeSpatialVolumes, type StructureSettings } from "../spatial";
import type {
  DimensionGrouping,
  PositionOverrides,
  RespawnConfig,
  SpeciesCountConfig,
} from "../types";
import VolumeRenderer from "./VolumeRenderer";
import InstancedVolumeGroup from "./InstancedVolumeGroup";
import AnimatedAnimalGroup from "./AnimatedAnimalGroup";
import GroundPlane from "./GroundPlane";
import GroundDressing from "./GroundDressing";
import UndergroundEffect from "./UndergroundEffect";
import ControlsLegend from "../../ControlsLegend";
import FieldOverlay from "./FieldOverlay";
import type { ElementId, IntegrationSceneReading } from "../substrate/types";
import { getSpeciesConfig } from "./SpeciesRenderConfig";

/**
 * When true, multi-copy species (2+ instances) use InstancedMesh for fewer
 * draw calls. When false, every volume gets its own VolumeRenderer (simpler,
 * easier to debug). Flip to `false` to disable instancing entirely.
 */
const ENABLE_INSTANCING = true;

/** Must match the maxPolarAngle on MapControls (~104°) */
const MAX_POLAR_ANGLE = Math.PI * 0.58;

interface Forest3DProps {
  /** Selected ingredients to visualize */
  ingredients: Ingredient[];
  /** Current year (can be fractional for smooth animation) */
  year: number;
  /** Structure settings */
  structures: StructureSettings;
  /** Whether dark mode is enabled */
  isDarkMode: boolean;
  /**
   * Whether time is actively changing (simulation OR dragging).
   * Controls fruit particle behavior:
   * - false: Fruits hang static, attached to trees (paused state)
   * - true: Fruits fall with gravity (time is moving)
   */
  isSimulating?: boolean;
  /** Optional class name for container */
  className?: string;
  /** Soil grouping configuration for visualizing separate soil zones */
  soilGrouping?: DimensionGrouping;
  /** Respawn configuration - maps ingredient ID to number of respawn cycles */
  respawnConfig?: RespawnConfig;
  /** Species count configuration - maps ingredient ID to number of instances */
  speciesCountConfig?: SpeciesCountConfig;
  /** Callback when a species volume is clicked */
  onVolumeClick?: (ingredientId: string) => void;
  /** Callback when a species volume is hovered */
  onVolumeHover?: (ingredientId: string | null) => void;
  /** Custom position overrides from drag-to-reposition */
  positionOverrides?: PositionOverrides;
  /** Callback when a plant is dragged to a new position */
  onPositionChange?: (
    volumeId: string,
    position: { x: number; z: number },
  ) => void;
  /** When true, disables drag-to-reposition interactions */
  readOnly?: boolean;
  /** Hide instructional overlays for compact embedded previews */
  showOverlays?: boolean;
  /** Toggle ambient floor decoration such as grass, litter, and rocks. */
  showGroundDressing?: boolean;
  /** Multiplier for the initial camera distance. Lower values start closer. */
  cameraDistanceScale?: number;
  /** Controls legend collapsed/expanded initial state. */
  controlsDefaultExpanded?: boolean;
  /** Optional integration field overlay shown only by the cockpit. */
  integrationOverlay?: {
    reading: IntegrationSceneReading;
    element: ElementId | null;
  };
}

/**
 * Forest3D - Main 3D visualization component for the food forest.
 *
 * This is a spatial snapshot at Year N, answering:
 * "If I stood inside this forest at year N, what would I see and feel?"
 *
 * Visual principles:
 * - No photorealism - smooth organic volumes only
 * - Color by layer (reuses VERTICAL_LAYER_COLORS)
 * - Opacity by intensity - declining species fade naturally
 * - Structures modify space, not add objects
 */
export default function Forest3D({
  ingredients,
  year,
  structures,
  isDarkMode,
  isSimulating = false,
  className,
  soilGrouping,
  respawnConfig,
  speciesCountConfig,
  onVolumeClick,
  onVolumeHover,
  positionOverrides,
  onPositionChange,
  // readOnly: _readOnly = false,
  showOverlays = true,
  showGroundDressing = true,
  cameraDistanceScale = 1,
  controlsDefaultExpanded,
  integrationOverlay,
}: Forest3DProps) {
  // Compute spatial volumes for this year
  const sceneData = useMemo(() => {
    return computeSpatialVolumes(
      ingredients,
      year,
      structures,
      soilGrouping,
      respawnConfig,
      speciesCountConfig,
    );
  }, [
    ingredients,
    year,
    structures,
    soilGrouping,
    respawnConfig,
    speciesCountConfig,
  ]);

  // Apply position overrides from drag-to-reposition.
  // Overrides map volumeId → {x, z}. They only affect rendered positions — bounds
  // are computed from ALL species' original positions (see spatial.ts stable bounds)
  // so the ground plane, water ring, and camera stay constant when plants are moved.
  // Override keys are full ingredientIds (e.g. "banana__0") for per-instance targeting.
  const effectiveVolumes = useMemo(() => {
    if (!positionOverrides || Object.keys(positionOverrides).length === 0)
      return sceneData.volumes;
    return sceneData.volumes.map((vol) => {
      const override = positionOverrides[vol.ingredientId];
      if (!override) return vol;
      return { ...vol, position: override };
    });
  }, [sceneData.volumes, positionOverrides]);

  // ---- Drag-to-reposition orchestration ----
  // isDraggingPlant disables MapControls so pointer events go to the plant,
  // not camera rotation. Set to true by onDragStart from VolumeRenderer or
  // InstancedVolumeGroup when a hold timer fires. Reset on drag end.
  const [isDraggingPlant, setIsDraggingPlant] = useState(false);

  // hoveredPlantName drives the top-center overlay that shows species name +
  // "Click to inspect / Hold to move" hints. Null = overlay hidden.
  const [hoveredPlantName, setHoveredPlantName] = useState<string | null>(null);

  const canReposition = Boolean(onPositionChange);
  const showActionHint =
    hoveredPlantName !== null || (canReposition && isDraggingPlant);
  const desktopControlHints = canReposition
    ? [
        {
          iconClassName: "fa-solid fa-hand-pointer",
          label: "Click to inspect",
        },
        {
          iconClassName: "fa-solid fa-arrows-up-down-left-right",
          label: "Drag to pan",
        },
        {
          iconClassName: "fa-solid fa-arrows-rotate",
          label: "Right-drag to rotate",
        },
        { iconClassName: "fa-solid fa-hand", label: "Hold to reposition" },
      ]
    : [
        {
          iconClassName: "fa-solid fa-hand-pointer",
          label: "Click to inspect",
        },
        {
          iconClassName: "fa-solid fa-arrows-up-down-left-right",
          label: "Drag to pan",
        },
        {
          iconClassName: "fa-solid fa-arrows-rotate",
          label: "Right-drag to rotate",
        },
      ];
  const mobileControlHints = canReposition
    ? [
        { iconClassName: "fa-solid fa-hand-pointer", label: "Tap to inspect" },
        {
          iconClassName: "fa-solid fa-arrows-up-down-left-right",
          label: "Drag to pan",
        },
        {
          iconClassName: "fa-solid fa-arrows-rotate",
          label: "Two-finger rotate",
        },
        { iconClassName: "fa-solid fa-hand", label: "Hold to reposition" },
      ]
    : [
        { iconClassName: "fa-solid fa-hand-pointer", label: "Tap to inspect" },
        {
          iconClassName: "fa-solid fa-arrows-up-down-left-right",
          label: "Drag to pan",
        },
        {
          iconClassName: "fa-solid fa-arrows-rotate",
          label: "Two-finger rotate",
        },
      ];

  const handlePlantDragStart = useCallback(() => {
    setIsDraggingPlant(true);
  }, []);

  // Commits the new position to parent state and re-enables orbit controls.
  // Parent (Forest/index.tsx) stores overrides in `positionOverrides` state.
  const handlePlantDragEnd = useCallback(
    (volumeId: string, pos: { x: number; z: number }) => {
      setIsDraggingPlant(false);
      onPositionChange?.(volumeId, pos);
    },
    [onPositionChange],
  );

  // Calculate camera position based on scene bounds.
  // Bounds are stable (computed from ALL species positions in spatial.ts),
  // so camera distance stays constant during simulation.
  const cameraPosition = useMemo(() => {
    const { bounds } = sceneData;
    const sceneRadius =
      Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) / 2;
    const clampedDistanceScale = Math.min(
      2,
      Math.max(0.45, cameraDistanceScale),
    );
    const distance = Math.max(sceneRadius * 1.4, 12) * clampedDistanceScale;
    return [distance * 0.7, distance * 0.35, distance * 0.7] as [
      number,
      number,
      number,
    ];
  }, [cameraDistanceScale, sceneData]);

  // Scene center for camera target — fixed at origin since the Fermat spiral
  // is always centered there. Using bounds-derived center causes the view to
  // jump when species appear/disappear during simulation.
  const sceneCenter = useMemo(
    () => [0, -2.5, 0] as [number, number, number],
    [],
  );

  // Group volumes by source ingredient ID (original ID from ingredients.ts)
  // for instanced rendering.
  // When ENABLE_INSTANCING is true:
  //   Single-instance species → VolumeRenderer (zero regression)
  //   Multi-instance species → InstancedVolumeGroup (fewer draw calls)
  // When false: all volumes → VolumeRenderer (original behavior)
  const { singleVolumes, instancedGroups, animatedGroups } = useMemo(() => {
    if (!ENABLE_INSTANCING) {
      return {
        singleVolumes: effectiveVolumes,
        instancedGroups: [],
        animatedGroups: [],
      };
    }

    const groupMap = new Map<string, typeof effectiveVolumes>();
    for (const vol of effectiveVolumes) {
      const speciesId = vol.sourceIngredientId ?? vol.ingredientId;
      const group = groupMap.get(speciesId);
      if (group) {
        group.push(vol);
      } else {
        groupMap.set(speciesId, [vol]);
      }
    }

    const singles: typeof effectiveVolumes = [];
    const instanced: { speciesId: string; volumes: typeof effectiveVolumes }[] =
      [];
    const animated: { speciesId: string; volumes: typeof effectiveVolumes }[] =
      [];

    for (const [speciesId, vols] of groupMap) {
      const speciesConfig = getSpeciesConfig(speciesId);
      if (speciesConfig?.animation?.mode === "skinned") {
        animated.push({ speciesId, volumes: vols });
      } else if (vols.length === 1) {
        singles.push(vols[0]);
      } else {
        instanced.push({ speciesId, volumes: vols });
      }
    }

    return {
      singleVolumes: singles,
      instancedGroups: instanced,
      animatedGroups: animated,
    };
  }, [effectiveVolumes]);

  // Underground effect refs — shared between UndergroundEffect, GroundPlane, GroundDressing
  const undergroundFactorRef = useRef(0);
  const undergroundOverlayRef = useRef<HTMLDivElement>(null);
  const undergroundBadgeRef = useRef<HTMLDivElement>(null);

  // Ground radius for ground cover placement (matches GroundPlane sizing).
  // Bounds are stable (computed from ALL species positions in spatial.ts,
  // not just visible ones), so this value stays constant during simulation.
  const groundRadius = useMemo(() => {
    const { bounds } = sceneData;
    return (
      Math.max(
        Math.abs(bounds.maxX - bounds.minX) + 10,
        Math.abs(bounds.maxZ - bounds.minZ) + 10,
        20,
      ) / 2
    );
  }, [sceneData]);

  return (
    <div
      className={clsx(
        "w-full h-full min-h-[400px] rounded-xl overflow-hidden",
        isDarkMode
          ? "bg-gradient-to-b from-neutral-800 to-neutral-900"
          : "bg-gradient-to-b from-sky-100 to-emerald-50",
        className,
      )}
    >
      <Canvas shadows>
        <Suspense fallback={null}>
          {/* Camera */}
          <PerspectiveCamera
            makeDefault
            position={cameraPosition}
            fov={45}
            near={0.1}
            far={1000}
          />

          {/* Controls */}
          <MapControls
            target={sceneCenter}
            enabled={!isDraggingPlant}
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
            // Polar angle: 0 = above, π/2 = horizontal, π = below
            minPolarAngle={Math.PI / 6} // ~30° - prevent looking straight down
            maxPolarAngle={MAX_POLAR_ANGLE} // ~104° - allow peeking below ground plane
            zoomSpeed={0.5} // Reduced from default 1.0 for less sensitive scroll zoom
            enableDamping={true} // Smooth motion
            dampingFactor={0.05} // Subtle damping
            screenSpacePanning={true} // MapControls: left-drag = pan, right-drag = rotate (matches MapLibre conventions)
          />

          {/* Underground viewing effect — computes factor and updates DOM overlay */}
          <UndergroundEffect
            overlayRef={undergroundOverlayRef}
            badgeRef={undergroundBadgeRef}
            factorRef={undergroundFactorRef}
          />

          {/* Lighting - brighter in dark mode for visibility */}
          <ambientLight intensity={isDarkMode ? 0.6 : 0.5} />
          <directionalLight
            position={[10, 15, 10]}
            intensity={isDarkMode ? 1.2 : 1}
            color={isDarkMode ? "#e8e0d0" : "#ffffff"}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={50}
            shadow-camera-left={-20}
            shadow-camera-right={20}
            shadow-camera-top={20}
            shadow-camera-bottom={-20}
            shadow-normalBias={0.02}
          />
          {/* Extra fill light for dark mode */}
          {isDarkMode && (
            <pointLight
              position={[-8, 8, -8]}
              intensity={0.4}
              color="#a0c0ff"
              distance={30}
            />
          )}

          {/* Environment for reflections */}
          <Environment preset={isDarkMode ? "night" : "forest"} />

          {/* Ground plane */}
          <GroundPlane
            bounds={sceneData.bounds}
            isDarkMode={isDarkMode}
            separateSoil={structures.separateSoil}
            volumes={effectiveVolumes}
            soilGrouping={soilGrouping}
          />

          {integrationOverlay ? (
            <FieldOverlay
              reading={integrationOverlay.reading}
              element={integrationOverlay.element}
              isDarkMode={isDarkMode}
            />
          ) : null}

          {/* Ambient ground dressing (grass, litter, rocks) */}
          {showGroundDressing ? (
            <GroundDressing
              groundRadius={groundRadius}
              volumes={effectiveVolumes}
              isDarkMode={isDarkMode}
              year={year}
              undergroundFactorRef={undergroundFactorRef}
              isSimulating={isSimulating}
            />
          ) : null}

          {/* Single-instance species — standard VolumeRenderer */}
          {singleVolumes.map((volume) => {
            const speciesId = volume.sourceIngredientId ?? volume.ingredientId;
            return (
              <VolumeRenderer
                key={volume.ingredientId}
                volume={volume}
                isDarkMode={isDarkMode}
                isSimulating={isSimulating}
                onClick={() => onVolumeClick?.(speciesId)}
                onHover={(hovered) =>
                  onVolumeHover?.(hovered ? speciesId : null)
                }
                groundRadius={groundRadius}
                onDragStart={canReposition ? handlePlantDragStart : undefined}
                onDragEnd={
                  canReposition
                    ? (pos) => handlePlantDragEnd(volume.ingredientId, pos)
                    : undefined
                }
                onHoverName={setHoveredPlantName}
              />
            );
          })}

          {/* Multi-instance species — instanced rendering */}
          {instancedGroups.map(({ speciesId, volumes }) => (
            <InstancedVolumeGroup
              key={speciesId}
              volumes={volumes}
              isDarkMode={isDarkMode}
              isSimulating={isSimulating}
              onClick={(id) => onVolumeClick?.(id)}
              onHover={(id) => onVolumeHover?.(id)}
              groundRadius={groundRadius}
              onDragStart={canReposition ? handlePlantDragStart : undefined}
              onDragEnd={
                canReposition
                  ? (volumeId, pos) => handlePlantDragEnd(volumeId, pos)
                  : undefined
              }
              onHoverName={setHoveredPlantName}
            />
          ))}

          {/* Animated low-count animals — skeletal clones keep leg animation intact. */}
          {animatedGroups.map(({ speciesId, volumes }) => (
            <AnimatedAnimalGroup
              key={speciesId}
              volumes={volumes}
              isDarkMode={isDarkMode}
              isSimulating={isSimulating}
              onClick={(id) => onVolumeClick?.(id)}
              onHover={(id) => onVolumeHover?.(id)}
              obstacleVolumes={effectiveVolumes.filter((volume) => {
                const sourceId =
                  volume.sourceIngredientId ?? volume.ingredientId;
                return (
                  sourceId !== speciesId &&
                  ["canopy", "midstory", "understory", "shrub"].includes(
                    volume.layer,
                  )
                );
              })}
              groundRadius={groundRadius}
              onDragStart={canReposition ? handlePlantDragStart : undefined}
              onDragEnd={
                canReposition
                  ? (volumeId, pos) => handlePlantDragEnd(volumeId, pos)
                  : undefined
              }
              onHoverName={setHoveredPlantName}
            />
          ))}
        </Suspense>
      </Canvas>

      {/* Action hints overlay — always show hover identity; move hints only when editable */}
      {showOverlays || showActionHint ? (
        <div
          className={clsx(
            "absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none",
            "px-4 py-2 rounded-xl",
            "backdrop-blur-md shadow-lg",
            "transition-all duration-300 ease-out",
            canReposition && isDraggingPlant
              ? "opacity-100 translate-y-0"
              : showActionHint
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2",
            canReposition && isDraggingPlant
              ? isDarkMode
                ? "bg-amber-700/90 text-white"
                : "bg-amber-100/90 text-amber-900"
              : isDarkMode
                ? "bg-neutral-700/90 text-white"
                : "bg-white/90 text-neutral-800",
          )}
        >
          {canReposition && isDraggingPlant ? (
            <div className="flex items-center gap-2 text-sm font-medium">
              <i className="fa-solid fa-arrows-up-down-left-right text-xs" />
              <span>Release to place</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1">
              <span
                className={clsx(
                  "text-sm font-semibold",
                  isDarkMode ? "text-emerald-400" : "text-emerald-600",
                )}
              >
                {hoveredPlantName}
              </span>
              <div className="flex items-center gap-3 text-xs font-medium opacity-75">
                <div className="flex items-center gap-1.5">
                  <i
                    className={clsx(
                      "fa-solid fa-hand-pointer text-[10px]",
                      isDarkMode ? "text-sky-400" : "text-sky-500",
                    )}
                  />
                  <span>Click to inspect that</span>
                </div>
                {canReposition && (
                  <>
                    <div
                      className={clsx(
                        "w-px h-3 self-center",
                        isDarkMode ? "bg-neutral-500" : "bg-neutral-300",
                      )}
                    />
                    <div className="flex items-center gap-1.5">
                      <i
                        className={clsx(
                          "fa-solid fa-hand text-[10px]",
                          isDarkMode ? "text-amber-400" : "text-amber-500",
                        )}
                      />
                      <span>Hold it to move</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* Year indicator overlay */}
      {showOverlays ? (
        <div
          className={clsx(
            "absolute bottom-4 left-4 px-3 py-1.5 rounded-lg",
            "backdrop-blur-sm",
            isDarkMode
              ? "bg-neutral-800/80 text-neutral-200"
              : "bg-white/80 text-neutral-800",
          )}
        >
          <span className="text-sm font-medium">Year </span>
          <span className="text-lg font-bold tabular-nums">
            {Math.round(year)}
          </span>
        </div>
      ) : null}

      {showOverlays ? (
        <ControlsLegend
          className="absolute top-4 right-4"
          isDarkMode={isDarkMode}
          desktopHints={desktopControlHints}
          mobileHints={mobileControlHints}
          defaultExpanded={controlsDefaultExpanded}
        />
      ) : null}

      {/* Underground vignette overlay — subtle edge tint, center stays clear for visibility */}
      <div
        ref={undergroundOverlayRef}
        className="absolute inset-0 pointer-events-none"
        style={{
          opacity: 0,
          zIndex: 10,
          background:
            "radial-gradient(ellipse at center, rgba(40,25,12,0) 0%, rgba(40,25,12,0) 40%, rgba(30,18,8,0.3) 70%, rgba(20,12,5,0.55) 100%)",
        }}
      />

      {/* Underground badge — appears when tilted below horizontal */}
      {showOverlays ? (
        <div
          ref={undergroundBadgeRef}
          className="absolute bottom-4 right-4 pointer-events-none flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{
            opacity: 0,
            zIndex: 11,
            backgroundColor: "rgba(180,130,60,0.85)",
            color: "#fff",
            backdropFilter: "blur(4px)",
          }}
        >
          <span>🌱</span>
          <span>Underground View</span>
        </div>
      ) : (
        <div ref={undergroundBadgeRef} className="hidden" />
      )}
    </div>
  );
}
