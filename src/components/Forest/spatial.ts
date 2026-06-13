/**
 * SPATIAL VOLUME COMPUTATION FOR 3D FOREST VISUALIZATION
 *
 * This module derives 3D spatial primitives from existing succession,
 * layer, and structure data at a specific Year N.
 *
 * It answers: "What would I see if I stood inside this forest at Year N?"
 *
 * =============================================================================
 * SOIL GROUPING & SPATIAL LAYOUT
 * =============================================================================
 *
 * When `separateSoil` structure is enabled, plants are positioned based on
 * their soil group membership. The layout logic works as follows:
 *
 * 1. GROUP CLUSTERING (computeGroupClusters):
 *    - Each soil group gets a "cluster" - a center point in 3D space
 *    - Groups are positioned along a horizontal line, spaced apart so circles
 *      don't overlap
 *    - Single group → centered at origin
 *    - Multiple groups → laid out left-to-right with gaps between them
 *
 * 2. PLANT POSITIONING (computePosition):
 *    - Within each group, plants are arranged in a spiral pattern starting
 *      from the group's center
 *    - Uses golden angle for natural-looking distribution
 *    - First plant at center, subsequent plants spiral outward
 *
 * 3. MULTI-GROUP MEMBERSHIP:
 *    - A species can belong to multiple soil groups
 *    - When this happens, we REPLICATE the plant - it appears once in each
 *      group it belongs to
 *    - Each instance gets a unique ID: "ingredientId__groupId"
 *
 * 4. VOLUME IDs:
 *    - Simple case: "banana" (single group or no grouping)
 *    - Multi-group: "banana__group1", "banana__group2" (one per group)
 *
 * =============================================================================
 * KEY PRINCIPLES
 * =============================================================================
 *
 * - Maps existing data to spatial primitives (volumes, not botanical models)
 * - Structures are spatial modifiers, not objects
 * - No new data needed - derives everything from existing profiles
 * - Groups are spatially separated to prevent visual overlap
 * - Plants grow from center outward within their group
 */

import type { Ingredient } from "../IngredientsPage/types";
import type {
  VerticalLayer,
  DimensionGrouping,
  RespawnConfig,
  SpeciesCountConfig,
  SpeciesLifetimeSegment,
} from "./types";
import { VERTICAL_LAYER_COLORS, VERTICAL_LAYER_ORDER } from "./types";
import {
  buildLayerPlacements,
  buildLifetimeSegments,
  inferSuccessionFromGrowth,
  getSuccessionProfile,
  getSpeciesIntensityAtYear,
  ENABLE_LIFECYCLE_SCALE,
  LIFECYCLE_SCALE_EXPONENT,
  type SegmentStatus,
} from "./util";

// Re-export so renderers can import from spatial.ts (avoids circular deps)
export { ENABLE_LIFECYCLE_SCALE, LIFECYCLE_SCALE_EXPONENT };

// ============================================================================
// TYPES
// ============================================================================

/**
 * Footprint type describes how a species occupies horizontal space.
 */
export type FootprintType = "isolated" | "clustered" | "spreading";

/**
 * SpatialVolume represents a single species in 3D space at a specific year.
 *
 * This is not a botanical model - it's an abstract volume that conveys:
 * - Where the species sits vertically (layer)
 * - How much space it occupies (radius, height)
 * - How present/active it is (intensity, opacity)
 * - How it coexists with others (footprint type)
 */
export interface SpatialVolume {
  /** Ingredient ID for data lookup and hover interactions */
  ingredientId: string;
  /** Original ingredient ID from ingredients.ts (without runtime suffixes) */
  sourceIngredientId: string;

  /** Display name for UI */
  displayName: string;

  // ---- Vertical Envelope ----

  /** Vertical layer assignment */
  layer: VerticalLayer;

  /**
   * Height range in meters [min, max] derived from layer.
   * Canopy: 10-15m, Midstory: 5-10m, Understory: 2-5m, etc.
   */
  heightRange: [number, number];

  /**
   * Canopy/crown radius derived from dominance at Year N.
   * Larger = more dominant in that year.
   */
  canopyRadius: number;

  // ---- Horizontal Footprint ----

  /**
   * How this species spreads horizontally:
   * - isolated: separate soil or container (no root interaction)
   * - clustered: clumping habit (banana, bamboo)
   * - spreading: expanding radius over time (jackfruit, fig)
   */
  footprintType: FootprintType;

  /** Ground footprint radius in meters */
  footprintRadius: number;

  /** Position offset for spreading/clustering */
  position: { x: number; z: number };

  // ---- Presence / Intensity ----

  /**
   * 0-1 intensity from getSpeciesIntensityAtYear.
   * Controls opacity and visual weight.
   */
  intensity: number;

  /**
   * Lifecycle status at this year.
   * Declining species fade naturally.
   */
  status: SegmentStatus;

  // ---- Structure Effects ----

  // ---- Visual Properties ----

  /** Base color from VERTICAL_LAYER_COLORS */
  layerColor: string;

  /**
   * Computed opacity based on intensity and status.
   * Range: 0.1 (faded) to 0.9 (peak).
   */
  opacity: number;

  /**
   * Growth maturity 0-1 based on age since planting.
   * 0 = just planted (tiny seedling)
   * 1 = fully mature
   * Grows gradually based on species lifespan.
   */
  growthMaturity: number;

  /**
   * Age in years since this species was planted.
   */
  ageYears: number;
}

/**
 * Scene-level metadata computed from all volumes.
 */
export interface SpatialSceneData {
  /** All species volumes for this year */
  volumes: SpatialVolume[];

  /** Whether canopy has formed (affects light flow) */
  hasCanopy: boolean;

  /** Canopy closure index 0-1 */
  canopyClosure: number;

  /** Scene bounds for camera positioning */
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    maxHeight: number;
  };
}

/**
 * Structure settings that modify spatial behavior.
 */
export interface StructureSettings {
  /** Plants in separate beds; roots cannot compete */
  separateSoil: boolean;
}

/**
 * Computed group position for cluster-based layout.
 */
interface GroupCluster {
  groupId: string;
  groupIndex: number;
  centerX: number;
  centerZ: number;
  ingredientIds: string[];
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Height ranges in meters for each vertical layer.
 * Used to position volumes in 3D space.
 */
const LAYER_HEIGHT_RANGES: Record<VerticalLayer, [number, number]> = {
  canopy: [10, 15],
  midstory: [5, 10],
  understory: [2, 5],
  shrub: [1, 2],
  herbaceous: [0.3, 1],
  groundcover: [0, 0.3],
  climber: [0, 12], // Can span multiple layers
  root: [-0.5, 0], // Underground
};

/**
 * Base footprint radius in meters for each layer.
 * Actual radius scales with intensity/dominance.
 */
const LAYER_BASE_RADIUS: Record<VerticalLayer, number> = {
  canopy: 4,
  midstory: 3,
  understory: 2,
  shrub: 1.5,
  herbaceous: 0.8,
  groundcover: 1.2,
  climber: 0.5,
  root: 0.6,
};

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function hashToUnit(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function getLocalInstanceSpacing(
  ingredient: Ingredient,
  layer: VerticalLayer,
): number {
  const animal = ingredient.properties.animalIntegration;
  if (animal?.kind === "grazer") {
    return Math.max(2.8, animal.movement.grazingRadius * 0.85);
  }
  return Math.max(1.2, LAYER_BASE_RADIUS[layer] * 0.7);
}

function computeInstancePosition(
  ingredient: Ingredient,
  layer: VerticalLayer,
  basePosition: { x: number; z: number },
  instanceIdx: number,
  instanceCount: number,
): { x: number; z: number } {
  const animal = ingredient.properties.animalIntegration;
  if (animal?.kind === "grazer" && instanceCount > 1) {
    const radius = Math.max(
      animal.movement.grazingRadius * 2.8,
      getLocalInstanceSpacing(ingredient, layer) *
        Math.sqrt(instanceCount) *
        1.35,
    );
    const seed = `${ingredient.id}:animal-anchor:${instanceIdx}`;
    const sector = (Math.PI * 2 * instanceIdx) / instanceCount;
    const sectorJitter =
      (hashToUnit(`${seed}:angle`) - 0.5) * (Math.PI / instanceCount);
    const herdRotation =
      hashToUnit(`${ingredient.id}:herd-rotation`) * Math.PI * 2;
    const angle = sector + sectorJitter + herdRotation;
    const distance =
      radius * (0.42 + 0.58 * Math.sqrt(hashToUnit(`${seed}:distance`)));
    const centerX = basePosition.x * 0.2;
    const centerZ = basePosition.z * 0.2;

    return {
      x: centerX + Math.cos(angle) * distance,
      z: centerZ + Math.sin(angle) * distance,
    };
  }

  if (instanceIdx === 0) return basePosition;

  const localSpacing = getLocalInstanceSpacing(ingredient, layer);
  const localRadius = Math.sqrt(instanceIdx) * localSpacing;
  const localAngle = instanceIdx * GOLDEN_ANGLE;
  return {
    x: basePosition.x + Math.cos(localAngle) * localRadius,
    z: basePosition.z + Math.sin(localAngle) * localRadius,
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Determines footprint type based on ingredient properties and structures.
 */
function determineFootprintType(
  ingredient: Ingredient,
  separateSoil: boolean,
): FootprintType {
  // Separate soil forces isolated footprints
  if (separateSoil) return "isolated";

  // Check soil interaction for spread behavior
  const soilInteraction = ingredient.properties.growth?.soilInteraction;
  if (soilInteraction) {
    const rootStrategy = soilInteraction.root.strategy;
    if (rootStrategy === "surface_spreader") return "spreading";
    if (rootStrategy === "storage_bulker") return "clustered";
  }

  // Check growth forms for clumping behavior
  const growth = ingredient.properties.growth;
  if (growth) {
    // Bananas, bamboo form clumps
    if (
      ingredient.id.includes("banana") ||
      ingredient.id.includes("bamboo") ||
      ingredient.id.includes("ginger") ||
      ingredient.id.includes("turmeric")
    ) {
      return "clustered";
    }

    // Large trees with spreading canopies
    if (
      growth.growthForms?.includes("canopy") &&
      growth.heightClasses?.includes("emergent")
    ) {
      return "spreading";
    }
  }

  return "spreading"; // Default for food forest plants
}

/**
 * Estimates the radius needed for a group of plants.
 *
 * Used to calculate how much space a group needs so we can position
 * multiple groups without overlap. The estimate is based on a grid layout
 * assumption, though actual positioning uses a spiral.
 *
 * @param numPlants - Number of plants in the group
 * @param spacing - Distance between adjacent plants (in meters)
 * @returns Estimated radius that would contain all plants
 */
function estimateGroupRadius(numPlants: number, spacing: number): number {
  if (numPlants <= 1) return spacing;
  const cols = Math.ceil(Math.sqrt(numPlants));
  const rows = Math.ceil(numPlants / cols);
  // Radius is half the diagonal of the grid plus some padding
  const width = (cols - 1) * spacing;
  const height = (rows - 1) * spacing;
  return Math.sqrt(width * width + height * height) / 2 + spacing;
}

/**
 * Computes group clusters for soil grouping.
 * Places each group in a separate non-overlapping region.
 *
 * LAYOUT STRATEGY:
 * ----------------
 * Groups are positioned along a horizontal line (X-axis) with enough spacing
 * between them to prevent overlap. This ensures each soil zone has its own
 * distinct visual area in the 3D scene.
 *
 * Example with 3 groups:
 *
 *     [Group A]     [Group B]     [Group C]
 *        ○             ○             ○
 *       /|\           /|\           /|\
 *      / | \         / | \         / | \
 *    ←───────────────────────────────────→ X-axis
 *
 * Each group's center is calculated based on:
 * 1. Its estimated radius (how much space its plants need)
 * 2. The radii of groups to its left
 * 3. A gap between groups (3 meters)
 *
 * @param soilGrouping - The soil grouping configuration
 * @param ingredientIds - All ingredient IDs currently in the scene
 * @returns Array of GroupCluster objects with center positions
 */
function computeGroupClusters(
  soilGrouping: DimensionGrouping | undefined,
  ingredientIds: string[],
): GroupCluster[] {
  // No grouping enabled - return single default cluster at origin
  if (!soilGrouping?.enabled || !soilGrouping.groups.length) {
    return [
      {
        groupId: "__default__",
        groupIndex: 0,
        centerX: 0,
        centerZ: 0,
        ingredientIds,
      },
    ];
  }

  // First pass: calculate each group's ingredients and estimated radius
  // Only include groups that have at least one ingredient in the scene
  const groupData: Array<{
    group: (typeof soilGrouping.groups)[0];
    groupIndex: number;
    ingredientIds: string[];
    radius: number;
  }> = [];

  const spacing = 3; // Meters between adjacent plants

  soilGrouping.groups.forEach((group, groupIndex) => {
    // Filter to only ingredients that exist in the current scene
    const groupIngredients = group.ingredientIds.filter((id) =>
      ingredientIds.includes(id),
    );
    if (groupIngredients.length === 0) return;

    groupData.push({
      group,
      groupIndex,
      ingredientIds: groupIngredients,
      radius: estimateGroupRadius(groupIngredients.length, spacing),
    });
  });

  if (groupData.length === 0) return [];

  // Single group - center at origin for simplicity
  if (groupData.length === 1) {
    return [
      {
        groupId: groupData[0].group.id,
        groupIndex: groupData[0].groupIndex,
        centerX: 0,
        centerZ: 0,
        ingredientIds: groupData[0].ingredientIds,
      },
    ];
  }

  // Multiple groups - position them along a line with enough spacing
  const clusters: GroupCluster[] = [];
  const GAP_BETWEEN_GROUPS = 3; // Meters of empty space between group circles

  // Calculate total width needed for all groups
  let totalWidth = 0;
  for (const g of groupData) {
    totalWidth += g.radius * 2; // Diameter of each group
  }
  totalWidth += (groupData.length - 1) * GAP_BETWEEN_GROUPS;

  // Position groups left-to-right, centered around origin
  let currentX = -totalWidth / 2;

  for (const g of groupData) {
    currentX += g.radius; // Move to center of this group

    clusters.push({
      groupId: g.group.id,
      groupIndex: g.groupIndex,
      centerX: currentX,
      centerZ: 0, // All groups on same Z-plane (horizontal line)
      ingredientIds: g.ingredientIds,
    });

    currentX += g.radius + GAP_BETWEEN_GROUPS; // Move past this group
  }

  return clusters;
}

/**
 * Computes position offset for a species based on index and footprint type.
 * Creates organic, non-overlapping layouts.
 *
 * POSITIONING STRATEGY:
 * ---------------------
 * Plants are positioned using a SPIRAL PATTERN starting from the center.
 * This creates a natural, organic distribution where:
 * - First plant (index 0) is at the center
 * - Subsequent plants spiral outward using the golden angle
 * - Distance from center increases with sqrt(index) for even density
 *
 * Visual representation (numbers = plant index):
 *
 *           4
 *        2     5
 *     6     0     3
 *        1     7
 *           8
 *
 * The golden angle (~137.5°) ensures plants don't line up in rows,
 * creating a sunflower-seed-like natural distribution.
 *
 * @param _ingredientId - The ingredient ID (currently unused, reserved for future)
 * @param indexInGroup - This plant's index within its group (0 = first plant)
 * @param totalInGroup - Total number of plants in the group
 * @param footprintType - How the plant spreads (affects non-separateSoil layout)
 * @param layer - Vertical layer (affects non-separateSoil layout)
 * @param separateSoil - Whether separate soil structure is enabled
 * @param groupCluster - The cluster this plant belongs to (contains center position)
 * @returns {x, z} position in 3D space (y is determined by layer height)
 */
function computePosition(
  _ingredientId: string,
  indexInGroup: number,
  totalInGroup: number,
  footprintType: FootprintType,
  layer: VerticalLayer,
  separateSoil: boolean,
  groupCluster: GroupCluster | undefined,
): { x: number; z: number } {
  // Golden angle in radians - creates natural spiral patterns
  // This is the same angle found in sunflower seeds, pine cones, etc.
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ≈ 2.4 radians ≈ 137.5°
  const spacing = 3; // Base spacing between plants in meters

  // === SEPARATE SOIL WITH GROUPING ===
  // Plants are positioned within their group's circle
  if (separateSoil && groupCluster) {
    if (totalInGroup === 1) {
      // Single plant in group - place exactly at group center
      return {
        x: groupCluster.centerX,
        z: groupCluster.centerZ,
      };
    }

    // Multiple plants - use Fermat spiral from center
    // radius = sqrt(n) gives even density (area grows with n)
    // The 0.7 factor controls how tightly packed plants are
    const radius = Math.sqrt(indexInGroup) * spacing * 0.7;
    const angle = indexInGroup * goldenAngle;

    return {
      x: groupCluster.centerX + Math.cos(angle) * radius,
      z: groupCluster.centerZ + Math.sin(angle) * radius,
    };
  }

  // === SEPARATE SOIL WITHOUT GROUPING ===
  // Fallback: spiral arrangement centered at origin
  if (separateSoil) {
    if (totalInGroup === 1) {
      return { x: 0, z: 0 };
    }
    const radius = Math.sqrt(indexInGroup) * spacing * 0.7;
    const angle = indexInGroup * goldenAngle;
    return {
      x: Math.cos(angle) * radius,
      z: Math.sin(angle) * radius,
    };
  }

  // === SHARED SOIL (no separation) ===
  // Plants intermingle based on their layer and footprint type
  const clusterOffset = footprintType === "clustered" ? 0.5 : 1.0;

  // Layer affects positioning - lower layers are placed differently
  const layerIndex = VERTICAL_LAYER_ORDER.indexOf(layer);
  const radius = (2 + indexInGroup * 0.8 + layerIndex * 0.5) * clusterOffset;
  const angle = indexInGroup * goldenAngle + layerIndex * Math.PI * 0.3;

  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius,
  };
}

/**
 * Computes material opacity for default geometry (sphere+cylinder, disc, etc.).
 *
 * ENABLE_LIFECYCLE_SCALE = true:
 *   Simplified — lifeScale handles the visual fade via uniform scale-down.
 *   Opacity stays high (floor 0.3) so plants remain visible while shrinking.
 *
 * ENABLE_LIFECYCLE_SCALE = false (classic):
 *   Status-based multipliers reduce opacity during decline/ended phases.
 *   This was the original opacity behavior before lifecycle scale was added.
 */
function computeOpacity(intensity: number, status: SegmentStatus): number {
  let opacity = 0.3 + intensity * 0.6;
  if (ENABLE_LIFECYCLE_SCALE) {
    if (status === "establishing") opacity *= 0.85;
    return Math.max(0.3, Math.min(0.9, opacity));
  }
  // Classic: status-based multipliers
  if (status === "declining") opacity *= 0.7;
  else if (status === "ended") opacity *= 0.3;
  else if (status === "establishing") opacity *= 0.8;
  return Math.max(0.1, Math.min(0.9, opacity));
}

/**
 * Computes growth maturity (0-1) based on age and expected lifespan.
 * Plants grow from seedling to mature size gradually.
 *
 * Growth follows a sigmoid curve - slow start, rapid middle, plateau at maturity.
 */
function computeGrowthMaturity(
  ageYears: number,
  yearsToFirstHarvest: number,
  productiveLifespanYears: number,
): number {
  if (ageYears <= 0) return 0;

  // Plants reach roughly 30% size by first harvest, 90% by mid-productive life
  // Use the midpoint of productive life as "full maturity"
  const maturityAge = yearsToFirstHarvest + productiveLifespanYears * 0.3;

  // Sigmoid growth curve for natural feel
  // At age 0: ~0.05, at maturityAge: ~0.95
  const k = 4 / maturityAge; // Steepness
  const midpoint = maturityAge * 0.5;
  const sigmoid = 1 / (1 + Math.exp(-k * (ageYears - midpoint)));

  // Scale to 0.05 - 1.0 range (seedlings are tiny but visible)
  return 0.05 + sigmoid * 0.95;
}

/**
 * Determines segment status from intensity and year position.
 */
function getStatusFromIntensity(
  year: number,
  plantYear: number,
  harvestStart: number,
  harvestEnd: number,
): SegmentStatus {
  if (year < plantYear) return "ended";
  if (year < harvestStart) return "establishing";
  if (year <= harvestEnd) return "productive";
  const fadeWindow = ENABLE_LIFECYCLE_SCALE ? 2 : 1;
  if (year <= harvestEnd + fadeWindow) return "declining";
  return "ended";
}

// ============================================================================
// MAIN COMPUTATION
// ============================================================================

/**
 * Computes all spatial volumes for a set of ingredients at a specific year.
 *
 * This is the main entry point for deriving 3D primitives from existing data.
 *
 * @param ingredients - The selected ingredients
 * @param year - The year to compute for (can be fractional)
 * @param structures - Structure settings that modify spatial behavior
 * @param soilGrouping - Optional soil grouping for clustering plants by group
 * @param respawnConfig - Optional respawn configuration for extended lifecycles
 * @param speciesCountConfig - Optional species count configuration for multiple instances
 * @returns SpatialSceneData with all volumes and scene metadata
 */
export function computeSpatialVolumes(
  ingredients: Ingredient[],
  year: number,
  structures: StructureSettings,
  soilGrouping?: DimensionGrouping,
  respawnConfig?: RespawnConfig,
  speciesCountConfig?: SpeciesCountConfig,
): SpatialSceneData {
  const { separateSoil } = structures;

  // Build layer placements (reuses existing logic)
  const placements = buildLayerPlacements(ingredients);

  // ==========================================================================
  // DETERMINISTIC POSITION ASSIGNMENT
  // ==========================================================================
  // Pre-compute position indices for ALL placements (regardless of visibility).
  // This ensures positions are stable as species fade in/out during time scrubbing.
  // Indices are based on sorted ingredient IDs, not iteration order.

  // Build lifetime segments for timing data (including respawns)
  const segments = buildLifetimeSegments(ingredients, respawnConfig);

  // Create a map of ingredient ID -> all segments for that ingredient
  // (with respawning, there can be multiple segments per ingredient)
  const segmentsByIngredient = new Map<string, SpeciesLifetimeSegment[]>();
  for (const seg of segments) {
    const existing = segmentsByIngredient.get(seg.ingredient.id) || [];
    existing.push(seg);
    segmentsByIngredient.set(seg.ingredient.id, existing);
  }

  /**
   * Find the active segment for an ingredient at the given year.
   * Plant behavior keeps the original first-active segment rule. Grazing
   * animals cross-fade into the strongest visible respawn cycle so the cow
   * herd does not pop from a fully faded adult cycle into an older calf cycle.
   */
  function findActiveSegment(
    ingredientId: string,
  ): SpeciesLifetimeSegment | undefined {
    const segs = segmentsByIngredient.get(ingredientId);
    if (!segs || segs.length === 0) return undefined;

    // Find segment where this year falls within its lifecycle (with fade buffer)
    const fadeBuf = ENABLE_LIFECYCLE_SCALE ? 2 : 1;
    const isGrazer =
      segs[0].ingredient.properties.animalIntegration?.kind === "grazer";

    if (isGrazer) {
      let bestAnimalSegment: SpeciesLifetimeSegment | undefined;
      let bestAnimalIntensity = 0;
      for (const seg of segs) {
        if (year < seg.plantYear || year > seg.harvestEndYear + fadeBuf) {
          continue;
        }
        const segIntensity = getSpeciesIntensityAtYear(
          seg.plantYear,
          seg.harvestStartYear,
          seg.harvestEndYear,
          year,
        );
        if (segIntensity > bestAnimalIntensity) {
          bestAnimalIntensity = segIntensity;
          bestAnimalSegment = seg;
        }
      }
      return bestAnimalSegment;
    }

    for (const seg of segs) {
      if (year >= seg.plantYear && year <= seg.harvestEndYear + fadeBuf) {
        return seg;
      }
    }
    return undefined;
  }

  // ==========================================================================
  // SOIL GROUPING SETUP
  // ==========================================================================
  // When separateSoil is enabled, we need to:
  // 1. Compute where each group's center should be (so groups don't overlap)
  // 2. Map each ingredient to the group(s) it belongs to
  // 3. Handle multi-group membership by creating multiple volumes

  // Step 1: Compute group clusters (center positions for each soil group)
  const allIngredientIds = placements.map((p) => p.ingredient.id);
  const groupClusters = separateSoil
    ? computeGroupClusters(soilGrouping, allIngredientIds)
    : [];

  // Step 2: Build reverse lookup - ingredient → clusters it belongs to
  // NOTE: An ingredient can be in MULTIPLE groups. When this happens,
  // we create a separate volume for each group (the plant is "replicated")
  const ingredientToClusters = new Map<string, GroupCluster[]>();
  for (const cluster of groupClusters) {
    for (const id of cluster.ingredientIds) {
      const existing = ingredientToClusters.get(id) || [];
      existing.push(cluster);
      ingredientToClusters.set(id, existing);
    }
  }

  // Step 3: Pre-compute deterministic position indices within each cluster
  // Indices are based on sorted ingredient IDs, not visibility or iteration order.
  // This ensures positions are stable as species fade in/out during time scrubbing.
  const clusterPositionIndices = new Map<string, Map<string, number>>();

  // For each cluster, sort its ingredients and assign fixed indices
  for (const cluster of groupClusters) {
    const sortedIngredients = [...cluster.ingredientIds].sort();
    const indexMap = new Map<string, number>();
    let currentIndex = 0;
    for (const id of sortedIngredients) {
      // One position per species — instances scatter locally around this base position
      indexMap.set(id, currentIndex);
      currentIndex += 1;
    }
    clusterPositionIndices.set(cluster.groupId, indexMap);
  }

  // Also handle the default cluster (when no soil grouping)
  if (
    groupClusters.length === 0 ||
    groupClusters[0].groupId === "__default__"
  ) {
    const sortedIngredients = [...allIngredientIds].sort();
    const indexMap = new Map<string, number>();
    let currentIndex = 0;
    for (const id of sortedIngredients) {
      indexMap.set(id, currentIndex);
      currentIndex += 1;
    }
    clusterPositionIndices.set("__default__", indexMap);
  }

  // ── STABLE BOUNDS: Pre-compute ALL species positions ──────────────────────
  // Positions are year-independent (they depend on ingredient ID, cluster, and
  // instance count — NOT on intensity or growth). By computing them for ALL
  // species regardless of visibility, the scene bounds stay constant across
  // the entire timeline. This prevents the ground plane, water ring, and
  // camera from shifting/resizing during simulation.
  const stablePositions: { x: number; z: number }[] = [];
  placements.forEach((placement) => {
    const { ingredient, layer } = placement;
    const footprintType = determineFootprintType(ingredient, separateSoil);
    const instanceCount = speciesCountConfig?.[ingredient.id] ?? 1;
    const clusters = ingredientToClusters.get(ingredient.id) || [undefined];

    for (const cluster of clusters) {
      const clusterKey = cluster?.groupId ?? "__default__";
      const clusterIndices = clusterPositionIndices.get(clusterKey);
      const baseIndexInCluster = clusterIndices?.get(ingredient.id) ?? 0;
      const totalInCluster = cluster
        ? cluster.ingredientIds.length
        : placements.length;

      const basePos = computePosition(
        ingredient.id,
        baseIndexInCluster,
        totalInCluster,
        footprintType,
        layer,
        separateSoil,
        cluster,
      );

      for (let instanceIdx = 0; instanceIdx < instanceCount; instanceIdx++) {
        stablePositions.push(
          computeInstancePosition(
            ingredient,
            layer,
            basePos,
            instanceIdx,
            instanceCount,
          ),
        );
      }
    }
  });

  // Compute volumes for each placement
  const volumes: SpatialVolume[] = [];
  let hasCanopy = false;
  let totalCanopyIntensity = 0;

  placements.forEach((placement) => {
    const { ingredient, layer } = placement;
    const segment = findActiveSegment(ingredient.id);

    // Get succession profile (infer if needed)
    const succession =
      getSuccessionProfile(ingredient) ||
      (ingredient.properties.growth
        ? inferSuccessionFromGrowth(ingredient.properties.growth)
        : null);

    if (!succession || !segment) return;

    const { plantYear, harvestStartYear, harvestEndYear } = segment;

    // Compute intensity at this year
    const intensity = getSpeciesIntensityAtYear(
      plantYear,
      harvestStartYear,
      harvestEndYear,
      year,
    );

    // Skip species with negligible intensity
    if (intensity < 0.01) return;

    // Determine status
    const status = getStatusFromIntensity(
      year,
      plantYear,
      harvestStartYear,
      harvestEndYear,
    );

    // Determine footprint type
    const footprintType = determineFootprintType(ingredient, separateSoil);

    // ==========================================================================
    // SPECIES INSTANCE COUNT
    // ==========================================================================
    // Get the number of instances for this species (default 1)
    const instanceCount = speciesCountConfig?.[ingredient.id] ?? 1;

    // ==========================================================================
    // MULTI-GROUP REPLICATION
    // ==========================================================================
    // Get all clusters this ingredient belongs to.
    // If the ingredient is in multiple soil groups, we create a SEPARATE volume
    // for each group - effectively "replicating" the plant visually.
    //
    // Example: If "banana" is in both "Group A" and "Group B":
    //   - We create volume "banana__groupA" positioned in Group A's circle
    //   - We create volume "banana__groupB" positioned in Group B's circle
    //
    // This visual replication makes sense because the user explicitly chose
    // to place the same species in multiple soil zones.
    const clusters = ingredientToClusters.get(ingredient.id) || [undefined];

    // For each cluster this ingredient belongs to, create volumes
    for (const cluster of clusters) {
      const clusterKey = cluster?.groupId ?? "__default__";

      // Get deterministic base index for this ingredient within the cluster
      // This is pre-computed and stable regardless of visibility
      const clusterIndices = clusterPositionIndices.get(clusterKey);
      const baseIndexInCluster = clusterIndices?.get(ingredient.id) ?? 0;

      // Count unique species in cluster (NOT total instances).
      // Instance copies scatter locally around their species' base position,
      // so the global spiral only needs to account for unique species.
      const totalInCluster = cluster
        ? cluster.ingredientIds.length
        : placements.length;

      // Compute species' base position in the global spiral (one per species)
      const speciesBasePosition = computePosition(
        ingredient.id,
        baseIndexInCluster,
        totalInCluster,
        footprintType,
        layer,
        separateSoil,
        cluster,
      );

      // Create a volume for each instance of this species
      for (let instanceIdx = 0; instanceIdx < instanceCount; instanceIdx++) {
        const position = computeInstancePosition(
          ingredient,
          layer,
          speciesBasePosition,
          instanceIdx,
          instanceCount,
        );

        // Get height range for layer
        const heightRange = LAYER_HEIGHT_RANGES[layer];

        // Calculate age and growth maturity
        const ageYears = Math.max(0, year - plantYear);
        const yearsToHarvest = harvestStartYear - plantYear;
        const productiveLifespan = harvestEndYear - harvestStartYear;
        const growthMaturity = computeGrowthMaturity(
          ageYears,
          yearsToHarvest,
          productiveLifespan,
        );

        // ENABLE_LIFECYCLE_SCALE = true:
        //   canopyRadius = growthScaledRadius only. Intensity-based shrinking
        //   happens in renderers via lifeScale (frame-rate-independent).
        // Classic (false):
        //   canopyRadius includes (0.5 + intensity * 0.5) so canopy shrinks
        //   during decline via the spatial volume data itself.
        const baseRadius = LAYER_BASE_RADIUS[layer];
        const growthScaledRadius = baseRadius * growthMaturity;
        const canopyRadius = ENABLE_LIFECYCLE_SCALE
          ? growthScaledRadius
          : growthScaledRadius * (0.5 + intensity * 0.5);
        const footprintRadius = canopyRadius * 0.8;

        const isCanopyLayer = layer === "canopy" || layer === "midstory";

        // Track canopy formation
        if (isCanopyLayer && intensity > 0.3) {
          hasCanopy = true;
          totalCanopyIntensity += intensity;
        }

        // Get layer color
        const layerColor = VERTICAL_LAYER_COLORS[layer];

        // Compute opacity
        const opacity = computeOpacity(intensity, status);

        // Format display name
        const displayName = ingredient.id
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

        // Build unique volume ID:
        // - If multiple instances: "banana__0", "banana__1", etc.
        // - If in a group: "banana__0__groupId" or "banana__groupId" (single instance)
        let volumeId: string;
        if (instanceCount > 1) {
          volumeId = cluster
            ? `${ingredient.id}__${instanceIdx}__${cluster.groupId}`
            : `${ingredient.id}__${instanceIdx}`;
        } else {
          volumeId = cluster
            ? `${ingredient.id}__${cluster.groupId}`
            : ingredient.id;
        }

        volumes.push({
          ingredientId: volumeId,
          sourceIngredientId: ingredient.id,
          displayName,
          layer,
          heightRange,
          canopyRadius,
          footprintType,
          footprintRadius,
          position,
          intensity,
          status,
          layerColor,
          opacity,
          growthMaturity,
          ageYears,
        });
      }

      // Note: No counter update needed - indices are deterministic from pre-computed map
    }
  });

  // Compute scene bounds from stablePositions (ALL species, not just visible).
  // This ensures bounds don't shift during simulation as species appear/disappear.
  // A fixed margin covers the maximum possible canopy footprint at full maturity.
  const maxFootprint = Math.max(...Object.values(LAYER_BASE_RADIUS)) * 0.8;
  const bounds = {
    minX: Math.min(...stablePositions.map((p) => p.x - maxFootprint), -5),
    maxX: Math.max(...stablePositions.map((p) => p.x + maxFootprint), 5),
    minZ: Math.min(...stablePositions.map((p) => p.z - maxFootprint), -5),
    maxZ: Math.max(...stablePositions.map((p) => p.z + maxFootprint), 5),
    maxHeight: Math.max(...volumes.map((v) => v.heightRange[1]), 5),
  };

  // Compute canopy closure (0-1)
  const canopyClosure = Math.min(1, totalCanopyIntensity * 0.3);

  return {
    volumes,
    hasCanopy,
    canopyClosure,
    bounds,
  };
}

/**
 * Gets the active layer at a specific height.
 * Used for light flow calculations.
 */
export function getLayerAtHeight(height: number): VerticalLayer | null {
  for (const layer of VERTICAL_LAYER_ORDER) {
    const [min, max] = LAYER_HEIGHT_RANGES[layer];
    if (height >= min && height <= max) {
      return layer;
    }
  }
  return null;
}

/**
 * Computes light intensity at a given height based on canopy closure.
 * Returns 0-1 where 1 is full sun, 0 is deep shade.
 */
export function computeLightAtHeight(
  height: number,
  canopyClosure: number,
): number {
  // Max height where full sun exists
  const fullSunHeight = 15;

  // Base light from height (higher = more light)
  const heightFactor = Math.min(1, height / fullSunHeight);

  // Canopy blocks light for lower layers
  const canopyBlockage = canopyClosure * (1 - heightFactor);
  return Math.max(0.1, 1 - canopyBlockage);
}
