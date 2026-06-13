import { useRef, useMemo, useEffect, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { SegmentStatus } from "../util";
import { useFruitGeometry, hasFruitModel } from "./FruitModelLoader";
import type {
  SpeciesRenderConfig,
  AttachmentLocation,
  AttachmentZone,
  FruitGrowthConfig,
} from "./SpeciesRenderConfig";
import { getRipeningColor } from "./SpeciesRenderConfig";

// ============================================================================
// TYPES
// ============================================================================

/**
 * Internal state for each fruit particle.
 * Tracks both dynamic (falling) and static (hanging) positions.
 */
interface FruitParticle {
  /** Current position - used during animated mode */
  position: THREE.Vector3;
  /** Velocity vector for physics simulation */
  velocity: THREE.Vector3;
  /** Current opacity (fades when hitting ground) */
  opacity: number;
  /** Size multiplier for this fruit */
  scale: number;
  /** Time since spawn in seconds */
  age: number;
  /** Max lifetime before respawn */
  lifespan: number;
  /** Fixed position on canopy surface - used during static mode */
  staticPosition: THREE.Vector3;
  /** Random rotation for natural variation (Euler angles) */
  rotation: THREE.Euler;
  /** Whether this fruit is eligible to drop (determined by dropRatio at spawn) */
  canDrop: boolean;
  /** Seconds to wait before this fruit starts falling (stagger across instances) */
  dropDelay: number;
  /** Original attach point position (for model_points attachment, used for stem direction) */
  attachPoint?: THREE.Vector3;
  /** Position in model-local (unscaled) coords, for recomputing as tree grows */
  modelLocalPos?: THREE.Vector3;
}

interface FruitParticlesProps {
  /** Radius of the plant's foliage bounding volume (used for default fruit placement) */
  canopyRadius: number;
  /** Height of the foliage center above ground (LOCAL y-coordinate) */
  crownHeight: number;
  /** Current lifecycle status of the plant */
  status: SegmentStatus;
  /** 0-1 intensity during productive phase (affects fruit count) */
  intensity: number;
  /** Base color of the plant (fruits will be a warmer variant) */
  baseColor: THREE.Color;
  /** Whether in dark mode (affects emissive glow) */
  isDarkMode: boolean;
  /** Plant layer type - affects fruit size */
  layer: string;
  /**
   * Whether time simulation is active (true = fruits fall, false = fruits hang static).
   *
   * BEHAVIOR:
   * - false (paused): Fruits hang motionless from lower canopy surface, attached to tree
   * - true (simulating): Fruits detach and fall with gravity, fade on ground, respawn
   *
   * This is set to true when EITHER:
   * - User clicks "Simulate" button (auto-play)
   * - User drags the timeline slider (manual scrubbing)
   */
  isPlaying?: boolean;
  /**
   * Ingredient ID for species-specific fruit model.
   * Used to load custom 3D fruit geometry (e.g., banana shape vs sphere).
   * Falls back to sphere if no model exists for this ingredient.
   */
  ingredientId?: string;
  /**
   * Species render config from SpeciesRenderConfig registry.
   * When provided, drives fruit behavior, ripening, and attachment.
   * When null/undefined, falls through to default behavior.
   */
  speciesConfig?: SpeciesRenderConfig | null;
  /**
   * Fruit attachment points extracted from the tree model.
   * Used with "model_points" and "cluster" attachment methods.
   */
  attachPoints?: THREE.Vector3[];
  /**
   * 0-1 progress through productive phase.
   * Used for ripening color interpolation.
   * Falls back to intensity if not provided.
   */
  productiveProgress?: number;
  /** Current tree model scale — used to keep fruits tracking tree growth */
  modelScale?: number;
  /** Time offset in seconds to stagger fruit dropping across instances (0 = immediate) */
  timeOffset?: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/** Gravity acceleration for falling fruits (m/s^2) */
const GRAVITY = -2.5;

/** Maximum number of visible fruits per plant */
const MAX_FRUITS = 10;

/** Base interval between fruit spawns in seconds */
const SPAWN_INTERVAL = 0.8;

/** Scale multiplier for custom 3D models (they need to be larger than spheres) */
const CUSTOM_MODEL_SCALE = 3.0;

/**
 * Species-specific fruit colors.
 * These override the default plant-derived color for realistic appearance.
 */
const FRUIT_COLORS: Record<string, string> = {
  banana: "#f5d742", // Bright yellow
  cacao: "#80201a", // Deep reddish-brown pod
  durian: "#a6993f", // Yellow-green/olive
  jackfruit: "#b3bf66", // Light yellow-green
  jalapeno: "#3f7f2e", // Glossy green pepper
  black_magic_jalapeno: "#2b1738", // Purple-black jalapeno
  black_pepper: "#2a2018", // Mature dark peppercorn
  peanut: "#b89e78", // Tan shell
  mango: "#e8c040", // Yellow-orange ripe mango
  turmeric: "#c06010", // Rich orange rhizome
  ginger: "#a08040", // Tan-brown rhizome
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generates a random position on the LOWER hemisphere of the plant's foliage volume.
 * This mimics where real fruits hang — works for any plant type (tree, shrub, herb).
 *
 * COORDINATE SYSTEM:
 * - All positions are LOCAL to the plant (parent group handles world transform)
 * - (0, 0, 0) is the base of the plant
 * - Y is up, X/Z are horizontal
 *
 * SPHERICAL COORDINATES:
 * - theta: angle around Y axis (0 to 2*PI)
 * - phi: angle from top of sphere (PI/2 to PI for lower hemisphere)
 * - r: distance from center (slightly inside surface where branches are)
 *
 * @param foliageRadius - Radius of the plant's foliage bounding sphere
 * @param foliageHeight - Y position of the foliage center
 * @returns LOCAL position vector for fruit placement
 */
function getStaticFruitPosition(
  foliageRadius: number,
  foliageHeight: number,
): THREE.Vector3 {
  // Random angle around the plant (full 360 degrees)
  const theta = Math.random() * Math.PI * 2;

  // Bias toward lower hemisphere where fruits naturally hang
  // phi = PI/2 is equator, phi = PI is bottom pole
  // Range: slightly below equator to about 3/4 down the sphere
  const phi = Math.PI / 2 + Math.random() * Math.PI * 0.35;

  // Fruits hang slightly INSIDE the foliage surface (80-95% of radius)
  // This ensures they appear attached to branches, not floating outside
  const r = foliageRadius * (0.8 + Math.random() * 0.15);

  // Convert spherical to cartesian (LOCAL coordinates)
  const x = r * Math.sin(phi) * Math.cos(theta);
  const y = foliageHeight + r * Math.cos(phi); // cos(phi) is negative for lower hemisphere
  const z = r * Math.sin(phi) * Math.sin(theta);

  // Ensure fruit doesn't go below ground
  return new THREE.Vector3(x, Math.max(0.1, y), z);
}

/**
 * Determines fruit size based on plant layer type.
 * Larger plants = larger fruits for visual balance.
 */
function getFruitSizeForLayer(layer: string): number {
  switch (layer) {
    case "canopy":
    case "midstory":
      return 0.15 + Math.random() * 0.1; // Large tree fruits
    case "understory":
      return 0.12 + Math.random() * 0.08;
    case "shrub":
    case "herbaceous":
      return 0.08 + Math.random() * 0.06; // Berry-sized
    case "groundcover":
    case "root":
      return 0.05 + Math.random() * 0.04; // Tiny
    default:
      return 0.1;
  }
}

function getFruitGrowthScale(
  config: FruitGrowthConfig | undefined,
  progress: number,
): number {
  if (!config) return 1;

  const startAt = config.startAt ?? 0;
  const endAt = config.endAt ?? 1;
  const t = THREE.MathUtils.clamp(
    (progress - startAt) / Math.max(endAt - startAt, 0.001),
    0,
    1,
  );
  const eased = t * t * (3 - 2 * t);
  return THREE.MathUtils.lerp(config.startScale, config.endScale, eased);
}

/**
 * Sets an instance to its static (hanging) position with full opacity.
 * Extracted to avoid duplication between static mode and ripen_drop hanging fruits.
 */
function setInstanceStatic(
  p: FruitParticle,
  index: number,
  mesh: THREE.InstancedMesh,
  hasCustomModel: boolean,
  tempQuaternion: THREE.Quaternion,
  tempMatrix: THREE.Matrix4,
  tempColor: THREE.Color,
  fruitColor: THREE.Color,
  fruitGrowthScale: number,
): void {
  const renderScale = p.scale * fruitGrowthScale;
  if (hasCustomModel) {
    tempQuaternion.setFromEuler(p.rotation);
    tempMatrix.compose(
      p.staticPosition,
      tempQuaternion,
      new THREE.Vector3(renderScale, renderScale, renderScale),
    );
  } else {
    tempMatrix.makeScale(renderScale, renderScale, renderScale);
    tempMatrix.setPosition(p.staticPosition);
  }
  mesh.setMatrixAt(index, tempMatrix);
  tempColor.copy(fruitColor);
  mesh.setColorAt(index, tempColor);
}

/**
 * Picks a location from weighted zones using random selection.
 * Normalizes weights so they don't need to sum to 1.
 */
function pickZoneLocation(zones: AttachmentZone[]): AttachmentLocation {
  const totalWeight = zones.reduce((sum, z) => sum + z.weight, 0);
  let r = Math.random() * totalWeight;
  for (const zone of zones) {
    r -= zone.weight;
    if (r <= 0) return zone.location;
  }
  return zones[zones.length - 1].location;
}

/**
 * Dispatches fruit spawn position based on attachment location.
 * Each location places fruits differently on/around the plant:
 * - "foliage_surface": Default — random on lower foliage hemisphere (any plant type)
 * - "trunk": Lower trunk (30-80% height), protruding outward (cauliflory — cacao)
 * - "branches": Upper trunk zone (60-95% height), more horizontal spread
 * - "cluster": Grouped at attach points (banana bunch)
 * - "model_points": From named empties in tree GLB
 */
function getSpawnPosition(
  location: AttachmentLocation,
  attachPoints: THREE.Vector3[],
  canopyRadius: number,
  crownHeight: number,
  index: number,
  total: number,
  clusterSize?: number,
): THREE.Vector3 {
  switch (location) {
    case "model_points": {
      // Pick RANDOM attach point (not sequential) for better distribution
      if (attachPoints.length === 0) {
        console.log(
          "[FruitParticles] model_points: no attach points, using fallback",
        );
        return getStaticFruitPosition(canopyRadius, crownHeight);
      }
      const ptIndex = Math.floor(Math.random() * attachPoints.length);
      const pt = attachPoints[ptIndex];
      // GEOCARPIC JITTER FIX: For underground attach points (Y < 0), jitter
      // only goes downward (deeper). Bidirectional jitter can push shallow
      // underground fruits toward or above Y=0, making them visible. This
      // works with the geocarpic depth clamping in spawnFruit() — see below.
      const yJitter =
        pt.y < 0 ? -Math.random() * 0.1 : (Math.random() - 0.5) * 0.1;
      const result = pt
        .clone()
        .add(
          new THREE.Vector3(
            (Math.random() - 0.5) * 0.1,
            yJitter,
            (Math.random() - 0.5) * 0.1,
          ),
        );
      return result;
    }

    case "trunk": {
      // Lower trunk (30-80% height) for main trunk cauliflory
      const trunkFraction = 0.3 + Math.random() * 0.5;
      const angle = Math.random() * Math.PI * 2;
      // Pods spawn ~0.4-0.55 units from center
      const podDistance = 0.4 + Math.random() * 0.15;
      return new THREE.Vector3(
        Math.cos(angle) * podDistance,
        crownHeight * trunkFraction,
        Math.sin(angle) * podDistance,
      );
    }

    case "branches": {
      // Upper trunk zone (60-95% height) with more horizontal spread
      // Simulates fruits on branches without needing model attach points
      const branchFraction = 0.6 + Math.random() * 0.35;
      const angle = Math.random() * Math.PI * 2;
      // More horizontal spread than trunk — branches extend outward
      const branchDistance = 0.5 + Math.random() * 0.3;
      return new THREE.Vector3(
        Math.cos(angle) * branchDistance,
        crownHeight * branchFraction,
        Math.sin(angle) * branchDistance,
      );
    }

    case "cluster": {
      // Group around first attach point (or crown center)
      const center =
        attachPoints.length > 0
          ? attachPoints[0]
          : new THREE.Vector3(0, crownHeight, 0);
      const a =
        (index / (clusterSize ?? Math.max(1, total))) * Math.PI * 2 +
        Math.random() * 0.3;
      const r = 0.15 + Math.random() * 0.1;
      const yOff = -index * 0.08;
      return new THREE.Vector3(
        center.x + Math.cos(a) * r,
        Math.max(0.1, center.y + yOff),
        center.z + Math.sin(a) * r,
      );
    }

    case "foliage_surface":
    default:
      // Default: random on lower foliage hemisphere (works for trees, shrubs, herbs)
      return getStaticFruitPosition(canopyRadius, crownHeight);
  }
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * FruitParticles - Renders fruit indicators around productive plants.
 *
 * VISUAL BEHAVIOR:
 * - Only visible during "productive" or "declining" lifecycle phases
 * - Fruit color/model driven by speciesConfig (ripening, custom GLB, etc.)
 * - Number of fruits scales with plant intensity
 *
 * SPECIES-SPECIFIC FEATURES (via speciesConfig):
 * ┌─────────────────────────────────────────────────────────────────────────┐
 * │ FRUIT BEHAVIOR (fruitBehavior)                                          │
 * │ - "drop": Hang when paused, fall when simulating (default)              │
 * │ - "hang": Always attached, never fall (cacao pods, jackfruit)           │
 * │ - "ripen_drop": Hang while unripe, drop when ripe + simulating (banana) │
 * │ - "none"/"integrated": No particles (underground crops, built-in fruit) │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ RIPENING (ripening)                                                     │
 * │ - Color interpolates through stages as productiveProgress advances      │
 * │ - e.g., green → yellow → brown over the productive phase                │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ FRUIT GROWTH (fruitGrowth)                                              │
 * │ - Optional size interpolation over the same productiveProgress value    │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ ATTACHMENT (attachment.method OR attachment.zones)                      │
 * │ Single location:                                                        │
 * │ - "foliage_surface": Random on lower foliage hemisphere (default)       │
 * │ - "trunk": Lower trunk (30-80% height), protruding outward              │
 * │ - "branches": Upper trunk zone (60-95% height), more horizontal spread  │
 * │ - "cluster": Grouped at specific points (banana bunch)                  │
 * │ - "model_points": From named empties in tree GLB                        │
 * │ Weighted zones (for mixed placement):                                   │
 * │ - zones: [{ location: "trunk", weight: 0.6 }, { location: "branches", weight: 0.4 }] │
 * ├─────────────────────────────────────────────────────────────────────────┤
 * │ STEMS (showStems, stemLength)                                           │
 * │ - When enabled, renders peduncle cylinders connecting fruits to tree    │
 * │ - Stem points from fruit toward tree's central axis                     │
 * └─────────────────────────────────────────────────────────────────────────┘
 *
 * ANIMATION MODES (controlled by isPlaying prop):
 * - false (paused): Fruits hang motionless, attached to tree
 * - true (simulating): Fruits detach and fall (if behavior allows)
 *
 * IMPLEMENTATION:
 * - Uses THREE.InstancedMesh for fruit rendering (single draw call)
 * - Stems rendered as individual meshes (driven by stemData state)
 * - Positions are in LOCAL coordinates (parent group handles world transform)
 */
export default function FruitParticles({
  canopyRadius,
  crownHeight,
  status,
  intensity,
  baseColor,
  isDarkMode,
  layer,
  isPlaying = false,
  ingredientId,
  speciesConfig,
  attachPoints,
  productiveProgress,
  modelScale,
  timeOffset = 0,
}: FruitParticlesProps) {
  // Determine fruit behavior from species config (default: "drop")
  const behavior = speciesConfig?.fruitBehavior ?? "drop";

  // Whether to render stems (peduncles) connecting fruits to tree
  const showStems = speciesConfig?.showStems ?? false;
  const stemLengthFactor = speciesConfig?.stemLength ?? 0.5;

  // Refs for mutable state that shouldn't trigger re-renders
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<FruitParticle[]>([]);
  const spawnTimerRef = useRef(0);
  const wasPlayingRef = useRef(isPlaying);
  // Track previous canopy dimensions to detect changes
  const prevCanopyRef = useRef({ radius: canopyRadius, height: crownHeight });
  // Ref for modelScale — read in useFrame without triggering re-renders
  const modelScaleRef = useRef(modelScale);
  modelScaleRef.current = modelScale;
  // Ref for stem InstancedMesh (updated imperatively in useFrame, no React state)
  const stemMeshRef = useRef<THREE.InstancedMesh>(null);

  // Reusable objects to avoid GC pressure in animation loop
  const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const tempQuaternion = useMemo(() => new THREE.Quaternion(), []);
  // Stem cylinder geometry — shared by all stems via InstancedMesh
  const stemGeometry = useMemo(
    () => new THREE.CylinderGeometry(0.04, 0.025, 1, 5),
    [],
  );

  // Load species-specific fruit geometry (or fallback to sphere)
  const fruitGeometry = useFruitGeometry(ingredientId);
  const hasCustomModel = hasFruitModel(ingredientId);

  // Get base ingredient ID for color lookup (handles "banana__group1" -> "banana")
  const baseIngredientId = ingredientId?.split("__")[0];

  // Ripening progress: use explicit prop, fall back to intensity
  const ripeProgress = productiveProgress ?? intensity;
  const fruitGrowthScale = getFruitGrowthScale(
    speciesConfig?.fruitGrowth,
    ripeProgress,
  );

  // Derive fruit color: ripening config > static species color > plant-derived
  const fruitColor = useMemo(() => {
    // 1. Ripening config takes priority (color changes over productive phase)
    if (speciesConfig?.ripening) {
      const [r, g, b] = getRipeningColor(speciesConfig.ripening, ripeProgress);
      return new THREE.Color(r, g, b);
    }

    // 2. Static species-specific color
    if (baseIngredientId && FRUIT_COLORS[baseIngredientId]) {
      return new THREE.Color(FRUIT_COLORS[baseIngredientId]);
    }

    // 3. Default: shift plant color toward warm (orange/red)
    const color = baseColor.clone();
    const hsl = { h: 0, s: 0, l: 0 };
    color.getHSL(hsl);
    const warmHue = (hsl.h + 0.08) % 1;
    color.setHSL(
      warmHue,
      Math.min(1, hsl.s * 1.3 + 0.2),
      Math.min(0.75, hsl.l * 1.2 + 0.1),
    );
    return color;
  }, [baseColor, baseIngredientId, speciesConfig?.ripening, ripeProgress]);

  // Cache fruit size for this layer type
  const fruitSize = useMemo(() => getFruitSizeForLayer(layer), [layer]);

  // Determine visibility based on lifecycle phase
  const isProducing = status === "productive";
  const isDeclining = status === "declining";
  const shouldShowFruits = isProducing || isDeclining;

  /**
   * Creates a new fruit particle with randomized properties.
   * Initializes both static (hanging) and dynamic (falling) positions.
   */
  // Resolve attachment zones/method and max fruit count from config
  const attachmentZones = speciesConfig?.attachment?.zones;
  const attachmentMethod: AttachmentLocation =
    speciesConfig?.attachment?.method ?? "foliage_surface";
  const maxFruitCount = speciesConfig?.fruitCount
    ? speciesConfig.fruitCount[1]
    : MAX_FRUITS;

  const spawnFruit = useCallback((): FruitParticle => {
    const currentCount = particlesRef.current.length;
    // Pick location: zones (weighted random) or single method
    const location = attachmentZones
      ? pickZoneLocation(attachmentZones)
      : attachmentMethod;
    const staticPos = getSpawnPosition(
      location,
      attachPoints ?? [],
      canopyRadius,
      crownHeight,
      currentCount,
      maxFruitCount,
      speciesConfig?.attachment?.clusterSize,
    );
    const dynamicPos = staticPos.clone();

    // For model_points, store the static position as attach point reference for stem direction
    let attachPoint: THREE.Vector3 | undefined;
    if (
      location === "model_points" &&
      attachPoints &&
      attachPoints.length > 0
    ) {
      attachPoint = staticPos.clone();
    }

    // Scale: config override > custom model default > sphere default
    const baseScale = fruitSize * (0.8 + Math.random() * 0.4);
    const scaleMultiplier =
      speciesConfig?.fruitScale ?? (hasCustomModel ? CUSTOM_MODEL_SCALE : 1);
    const scale = baseScale * scaleMultiplier;

    // ── GEOCARPIC (UNDERGROUND) FRUIT DEPTH CLAMPING ──
    //
    // Problem: Small plants like peanut (matureHeight=0.45) have attach points
    // only ~5cm underground at rendered scale. But the fruit model (normalized
    // to 1 unit) at fruitScale ~0.2 extends ±0.1 from center — the top of
    // the fruit pokes above the ground plane (Y=0).
    //
    // Fix: When the attach point is below ground (Y < 0), clamp the fruit
    // center deep enough that the ENTIRE model stays hidden. The normalized
    // fruit model extends ±(scale * 0.5) from center, so we need:
    //   center_y + scale * 0.5 < 0  →  center_y < -(scale * 0.5)
    // We use -(scale * 0.6) for a 20% safety margin.
    //
    // This works with parent group scale={lifeScale} because the condition
    // factors out: (center_y + half_extent) * lifeScale < 0 iff
    // center_y + half_extent < 0 (lifeScale is always positive).
    //
    // IMPORTANT: This must also be re-applied in the useFrame recomputation
    // loop (see "Re-apply geocarpic clamping" below) because modelScale
    // changes as the plant grows, which can make positions shallower.
    //
    // Only affects geocarpic species (peanut, etc.) — above-ground fruits
    // (Y >= 0) are completely unaffected.
    if (staticPos.y < 0) {
      const minCenterY = -(scale * 0.6);
      if (staticPos.y > minCenterY) {
        staticPos.y = minCenterY;
      }
    }

    // Store model-local (unscaled) position so useFrame can recompute as tree grows.
    // Computed AFTER geocarpic clamping so the stored position includes the depth fix.
    const ms = modelScaleRef.current;
    const modelLocalPos =
      ms && ms > 0.001 ? staticPos.clone().multiplyScalar(1 / ms) : undefined;

    // Random rotation for natural variation
    const rotation = new THREE.Euler(
      (Math.random() - 0.5) * 0.5,
      Math.random() * Math.PI * 2,
      Math.PI / 2 + (Math.random() - 0.5) * 0.3,
    );

    // Determine if this fruit can drop (based on dropRatio, default 1.0 = all can drop)
    const dropRatio = speciesConfig?.ripening?.dropRatio ?? 1.0;
    const canDrop = Math.random() < dropRatio;

    return {
      position: dynamicPos,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        0,
        (Math.random() - 0.5) * 0.3,
      ),
      opacity: 1,
      scale,
      age: 0,
      lifespan: 3 + Math.random() * 4,
      staticPosition: staticPos,
      rotation,
      canDrop,
      dropDelay: timeOffset + Math.random() * 0.5,
      attachPoint,
      modelLocalPos,
    };
  }, [
    canopyRadius,
    crownHeight,
    fruitSize,
    hasCustomModel,
    attachmentZones,
    attachmentMethod,
    attachPoints,
    maxFruitCount,
    speciesConfig?.fruitScale,
    speciesConfig?.attachment?.clusterSize,
    speciesConfig?.ripening?.dropRatio,
    timeOffset,
  ]);

  // Initialize particles when fruits should first appear
  useEffect(() => {
    if (shouldShowFruits && particlesRef.current.length === 0) {
      const minCount = speciesConfig?.fruitCount?.[0] ?? 2;
      const fruitCount = Math.max(
        minCount,
        Math.floor(maxFruitCount * intensity * 0.7),
      );
      for (let i = 0; i < fruitCount; i++) {
        particlesRef.current.push(spawnFruit());
      }
    }
  }, [
    shouldShowFruits,
    intensity,
    spawnFruit,
    maxFruitCount,
    speciesConfig?.fruitCount,
  ]);

  // When canopy dimensions change (plant grows), carry existing fruit attachment
  // points along with the canopy instead of respawning. Respawning used to
  // randomize fruit positions on every simulation tick, which made expanded
  // panoramic scenes look like fruits were blinking and jumping.
  useEffect(() => {
    const prev = prevCanopyRef.current;
    const radiusChanged = Math.abs(prev.radius - canopyRadius) > 0.001;
    const heightChanged = Math.abs(prev.height - crownHeight) > 0.001;

    if ((radiusChanged || heightChanged) && particlesRef.current.length > 0) {
      const radiusRatio =
        Math.abs(prev.radius) > 0.001 ? canopyRadius / prev.radius : 1;
      const heightDelta = crownHeight - prev.height;

      for (const p of particlesRef.current) {
        // Model-point fruits already track modelScale from modelLocalPos in
        // useFrame, so avoid double-scaling them here.
        if (p.modelLocalPos) continue;

        const wasFalling =
          Math.abs(p.velocity.y) > 0.001 ||
          p.position.y < p.staticPosition.y - 0.1;

        p.staticPosition.x *= radiusRatio;
        p.staticPosition.z *= radiusRatio;
        p.staticPosition.y += heightDelta;
        if (p.staticPosition.y >= 0) {
          p.staticPosition.y = Math.max(0.1, p.staticPosition.y);
        }

        if (p.attachPoint) {
          p.attachPoint.x *= radiusRatio;
          p.attachPoint.z *= radiusRatio;
          p.attachPoint.y += heightDelta;
        }

        if (!wasFalling) {
          p.position.copy(p.staticPosition);
        }
      }
    }

    prevCanopyRef.current = { radius: canopyRadius, height: crownHeight };
  }, [canopyRadius, crownHeight]);

  // Handle play/pause transitions - reset fruits to hanging positions when paused
  useEffect(() => {
    if (
      wasPlayingRef.current &&
      !isPlaying &&
      particlesRef.current.length > 0
    ) {
      particlesRef.current.forEach((p) => {
        p.position.copy(p.staticPosition);
        p.velocity.set(0, 0, 0);
        p.opacity = 1;
        p.age = 0;
      });
    }
    // Reset drop delays when simulation starts (stagger fruit dropping)
    if (!wasPlayingRef.current && isPlaying) {
      particlesRef.current.forEach((p) => {
        p.dropDelay = timeOffset + Math.random() * 0.5;
      });
    }
    wasPlayingRef.current = isPlaying;
  }, [isPlaying, timeOffset]);

  // Main animation loop - runs every frame
  useFrame((_, delta) => {
    if (!meshRef.current || !shouldShowFruits) {
      if (particlesRef.current.length > 0 && !shouldShowFruits) {
        particlesRef.current = [];
      }
      return;
    }

    const particles = particlesRef.current;
    const mesh = meshRef.current;

    // ─── RECOMPUTE FROM MODEL-LOCAL COORDS ───
    // When tree grows (modelScale changes), update fruit hanging positions.
    // Runs every frame so fruits stay attached to the growing tree.
    const curScale = modelScaleRef.current;
    if (curScale && curScale > 0.001) {
      for (const p of particles) {
        if (p.modelLocalPos) {
          p.staticPosition.copy(p.modelLocalPos).multiplyScalar(curScale);
          // Re-apply geocarpic depth clamping after rescaling.
          // As modelScale grows, underground positions get deeper (good), but
          // at small modelScale (young plants) they can be too shallow. The
          // clamp ensures the fruit model never pokes above Y=0.
          // See "GEOCARPIC FRUIT DEPTH CLAMPING" in spawnFruit() for math.
          if (p.staticPosition.y < 0) {
            const minY = -(p.scale * 0.6);
            if (p.staticPosition.y > minY) {
              p.staticPosition.y = minY;
            }
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────────────
    // BEHAVIOR-AWARE RENDERING
    // ─────────────────────────────────────────────────────────────────────

    // Determine if fruits should be falling this frame
    const isRipe =
      behavior === "ripen_drop"
        ? ripeProgress >= (speciesConfig?.ripening?.dropThreshold ?? 1)
        : true;
    const shouldAnimate =
      behavior === "hang"
        ? false // "hang" never falls
        : behavior === "ripen_drop"
          ? isPlaying && isRipe // "ripen_drop" only falls when ripe + simulating
          : isPlaying; // "drop" falls when simulating

    if (shouldAnimate) {
      // ─────────────────────────────────────────────────────────────────────
      // ANIMATED MODE: Fruits fall with gravity
      // For "ripen_drop", only 1-2 fruits detach; rest stay hanging
      // ─────────────────────────────────────────────────────────────────────

      // Spawn new fruits periodically from canopy
      spawnTimerRef.current += delta;
      const spawnRate = isDeclining
        ? SPAWN_INTERVAL * 3
        : SPAWN_INTERVAL / intensity;

      if (
        spawnTimerRef.current > spawnRate &&
        particles.length < maxFruitCount * intensity
      ) {
        particles.push(spawnFruit());
        spawnTimerRef.current = 0;
      }

      // Limit simultaneous drops (configurable, default 2 for ripen_drop, unlimited for drop)
      const configMaxDrops = speciesConfig?.ripening?.maxSimultaneousDrops;
      const maxFalling =
        behavior === "ripen_drop"
          ? (configMaxDrops ?? 2)
          : (configMaxDrops ?? particles.length);
      let fallingCount = 0;

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        const isFalling =
          p.velocity.y !== 0 || p.position.y < p.staticPosition.y - 0.1;

        if (isFalling) {
          fallingCount++;
        }

        // Fruit can't drop: either not eligible (canDrop=false) or at max falling limit
        const atMaxFalling = fallingCount >= maxFalling;
        const cannotDrop = !p.canDrop || atMaxFalling;

        // For ripen_drop or limited drops: keep ineligible fruits static
        if (
          (behavior === "ripen_drop" || configMaxDrops) &&
          !isFalling &&
          cannotDrop
        ) {
          setInstanceStatic(
            p,
            i,
            mesh,
            hasCustomModel,
            tempQuaternion,
            tempMatrix,
            tempColor,
            fruitColor,
            fruitGrowthScale,
          );
          continue;
        }

        // Stagger drop timing per fruit (from timeOffset)
        if (!isFalling && p.dropDelay > 0) {
          p.dropDelay -= delta;
          setInstanceStatic(
            p,
            i,
            mesh,
            hasCustomModel,
            tempQuaternion,
            tempMatrix,
            tempColor,
            fruitColor,
            fruitGrowthScale,
          );
          continue;
        }

        // If this fruit can drop but hasn't started falling yet, give it a nudge
        if (
          (behavior === "ripen_drop" || configMaxDrops) &&
          !isFalling &&
          p.canDrop &&
          fallingCount < maxFalling
        ) {
          p.velocity.y = -0.1;
          fallingCount++;
        }

        p.age += delta;

        // Apply gravity
        p.velocity.y += GRAVITY * delta;
        p.position.add(p.velocity.clone().multiplyScalar(delta));

        // Ground collision - stop and fade
        if (p.position.y <= 0.05) {
          p.position.y = 0.05;
          p.velocity.set(0, 0, 0);
          p.opacity -= delta * 2;
        }

        // Remove dead particles
        if (p.opacity <= 0 || p.age > p.lifespan) {
          particles.splice(i, 1);
          continue;
        }

        // Update instance transform
        const renderScale = p.scale * fruitGrowthScale;
        if (hasCustomModel) {
          tempQuaternion.setFromEuler(p.rotation);
          tempMatrix.compose(
            p.position,
            tempQuaternion,
            new THREE.Vector3(renderScale, renderScale, renderScale),
          );
        } else {
          tempMatrix.makeScale(renderScale, renderScale, renderScale);
          tempMatrix.setPosition(p.position);
        }
        mesh.setMatrixAt(i, tempMatrix);

        // Update instance color (fades with opacity)
        tempColor.copy(fruitColor);
        tempColor.multiplyScalar(p.opacity);
        mesh.setColorAt(i, tempColor);
      }
    } else {
      // ─────────────────────────────────────────────────────────────────────
      // STATIC MODE: Fruits hang motionless
      // Used when paused, or "hang" behavior, or unripe "ripen_drop"
      // ─────────────────────────────────────────────────────────────────────

      for (let i = 0; i < particles.length; i++) {
        setInstanceStatic(
          particles[i],
          i,
          mesh,
          hasCustomModel,
          tempQuaternion,
          tempMatrix,
          tempColor,
          fruitColor,
          fruitGrowthScale,
        );
      }
    }

    // Hide unused instance slots
    for (let i = particles.length; i < maxFruitCount; i++) {
      tempMatrix.makeScale(0, 0, 0);
      mesh.setMatrixAt(i, tempMatrix);
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

    // ─── STEM RENDERING (imperative via InstancedMesh) ───
    // Updated every frame alongside fruits — no React state lag
    if (showStems && stemMeshRef.current) {
      const stemMesh = stemMeshRef.current;
      const baseLen = crownHeight * 0.08 * stemLengthFactor;
      const up = new THREE.Vector3(0, 1, 0);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Hide stem for actively falling fruits
        const isFalling =
          shouldAnimate &&
          p.canDrop &&
          (p.velocity.y < -0.05 || p.position.y < p.staticPosition.y - 0.15);

        if (isFalling) {
          tempMatrix.makeScale(0, 0, 0);
          stemMesh.setMatrixAt(i, tempMatrix);
          continue;
        }

        const fruitPos = p.staticPosition;
        // Stem points upward from fruit, slightly inward toward trunk
        const inwardFactor = 0.15;
        const targetPoint = new THREE.Vector3(
          fruitPos.x * (1 - inwardFactor),
          fruitPos.y + baseLen,
          fruitPos.z * (1 - inwardFactor),
        );

        const dir = targetPoint.clone().sub(fruitPos);
        const dist = dir.length();
        if (dist < 0.001) {
          tempMatrix.makeScale(0, 0, 0);
          stemMesh.setMatrixAt(i, tempMatrix);
          continue;
        }
        dir.normalize();
        const actualLen = Math.min(baseLen, dist * 0.95);
        const stemCenter = fruitPos
          .clone()
          .add(dir.clone().multiplyScalar(actualLen * 0.5));
        tempQuaternion.setFromUnitVectors(up, dir);
        tempMatrix.compose(
          stemCenter,
          tempQuaternion,
          new THREE.Vector3(1, actualLen, 1),
        );
        stemMesh.setMatrixAt(i, tempMatrix);
      }

      // Hide unused stem slots
      for (let i = particles.length; i < maxFruitCount; i++) {
        tempMatrix.makeScale(0, 0, 0);
        stemMesh.setMatrixAt(i, tempMatrix);
      }
      stemMesh.instanceMatrix.needsUpdate = true;
    }
  });

  // No particles for these behaviors or lifecycle phases
  if (!shouldShowFruits || behavior === "none" || behavior === "integrated") {
    return null;
  }

  return (
    <>
      <instancedMesh
        ref={meshRef}
        args={[fruitGeometry, undefined, maxFruitCount]}
        castShadow
      >
        <meshStandardMaterial
          color={fruitColor}
          transparent
          opacity={0.9}
          emissive={fruitColor}
          emissiveIntensity={isDarkMode ? 0.3 : 0.1}
          roughness={0.4}
        />
      </instancedMesh>

      {showStems && (
        <instancedMesh
          ref={stemMeshRef}
          args={[stemGeometry, undefined, maxFruitCount]}
        >
          <meshStandardMaterial color="#5a4030" roughness={0.85} />
        </instancedMesh>
      )}
    </>
  );
}
