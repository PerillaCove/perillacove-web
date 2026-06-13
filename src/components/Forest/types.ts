import type { Ingredient } from "../IngredientsPage/types";

export type SuccessionalPhase =
  | "pioneer" // fast, short lived, build shade and biomass
  | "early" // early fruiting or shrub layer
  | "mid" // midstory, stable structure
  | "late" // canopy or long lived midstory
  | "legacy"; // very long lived, defines final structure

export type EstablishmentLight =
  | "full_sun" // wants full exposure even as a seedling
  | "filtered_light" // wants nurse shade at establishment
  | "deep_shade" // understory, never wants strong direct sun
  | "partial_sun"; // wants some sun but not full sun

export interface SuccessionProfile {
  successionalPhase: SuccessionalPhase;

  // Recommended time window to plant, relative to system start, in years
  // e.g. cacao [0.5, 2], durian [2, 5]
  recommendedPlantYearFromStart: [number, number];

  establishmentLight: EstablishmentLight;

  // Years from planting to first meaningful yield
  yearsToFirstHarvest: [number, number];

  // Approximate productive lifespan (not total biological lifespan)
  // For true perennials you can just pick a reasonable planning window
  productiveLifespanYears: [number, number];

  // Optional: how aggressively this species should be pruned or culled
  // "short_rotation" for pigeon pea, "keep" for durian etc
  managementRotation?: "short_rotation" | "medium_rotation" | "keep";
}

export interface SuccessionPhase {
  phaseIndex: number; // 0, 1, 2, ...
  fromYear: number;
  toYear: number;
  ingredients: Ingredient[];
}

export interface SpeciesLifetimeSegment {
  ingredient: Ingredient;
  plantYear: number;
  harvestStartYear: number;
  harvestEndYear: number;
  /** Which respawn cycle this is (0 = original, 1 = first repeat, etc.) */
  respawnCycle?: number;
  /** Number of species instances represented by this segment. */
  instanceCount?: number;
}

/**
 * Configuration for repeating species after their lifespan ends.
 * Plants and animals both use this deterministic repeat-cycle math.
 * Maps species ID to number of times to repeat.
 */
export type RespawnConfig = Record<string, number>;

/**
 * Configuration for species instance counts.
 * Maps species ID to number of living instances.
 * Default is 1 if not specified.
 */
export type SpeciesCountConfig = Record<string, number>;

/** Maps volume ingredientId → custom {x, z} position from drag-to-reposition */
export type PositionOverrides = Record<string, { x: number; z: number }>;

export interface ClimateProfile {
  // Optional, for deciduous temperate things
  chillHours?: [number, number]; // winter chill requirement

  // Approximate optimal annual mean temp range, in Celsius
  optimalTempRangeC?: [number, number];

  sunlightHours?: [number, number]; // annual mean sunlight hours
}

// ---------- Vertical Layer System ----------

/**
 * VerticalLayer describes where a plant sits spatially in the food forest.
 * This maps to the 7-layer model commonly used in permaculture:
 *
 * 1. canopy      - Tall trees forming the roof (coconut, durian, mango)
 * 2. midstory    - Medium trees between canopy and understory (citrus, cacao)
 * 3. understory  - Short trees living beneath canopy shade (coffee, papaya)
 * 4. shrub       - Woody plants below tree height (currants, blueberry)
 * 5. herbaceous  - Soft-stemmed plants (herbs, vegetables, perennial greens)
 * 6. groundcover - Low spreaders protecting soil (strawberry, mint, clover)
 * 7. climber     - Vines using other layers as support (passionfruit, grapes)
 * 8. root        - Plants grown for underground parts (turmeric, ginger)
 */
export type VerticalLayer =
  | "canopy"
  | "midstory"
  | "understory"
  | "shrub"
  | "herbaceous"
  | "groundcover"
  | "climber"
  | "root";

/**
 * Vertical ordering from top to bottom for display purposes.
 * Lower index = higher in the canopy.
 */
export const VERTICAL_LAYER_ORDER: VerticalLayer[] = [
  "canopy",
  "midstory",
  "understory",
  "shrub",
  "herbaceous",
  "groundcover",
  "climber",
  "root",
];

export const VERTICAL_LAYER_LABELS: Record<VerticalLayer, string> = {
  canopy: "Canopy",
  midstory: "Midstory",
  understory: "Understory",
  shrub: "Shrub",
  herbaceous: "Herbaceous",
  groundcover: "Groundcover",
  climber: "Climber/Vine",
  root: "Root",
};

export const VERTICAL_LAYER_COLORS: Record<VerticalLayer, string> = {
  canopy: "#166534", // dark green - tallest trees
  midstory: "#15803d", // forest green
  understory: "#22c55e", // green
  shrub: "#84cc16", // lime
  herbaceous: "#a3e635", // light lime
  groundcover: "#bef264", // pale lime
  climber: "#7c3aed", // purple - distinct since they climb across layers
  root: "#a16207", // amber/brown - underground
};

/**
 * Represents an ingredient placed in its vertical layer with timing info.
 */
export interface LayerPlacement {
  ingredient: Ingredient;
  layer: VerticalLayer;
  /** Number of planted instances represented by this placement. */
  instanceCount?: number;
  /** Years from system start when this plant is active */
  activeYears: [number, number];
  /** Whether this plant needs to be relocated as shade increases */
  needsRelocation: boolean;
  /** If needs relocation, when (year) does shade become problematic */
  relocationYear?: number;
  /** Notes about placement strategy */
  placementNotes: string[];
}

/**
 * Canopy closure represents how much shade the system produces over time.
 * 0 = fully open (day zero), 1 = fully closed canopy
 */
export interface CanopyClosure {
  year: number;
  closureIndex: number; // 0..1
  dominantLayer: VerticalLayer;
}

// Stable, species-level traits that describe how a plant interacts with soil resources.
// Intentionally excludes any traits that depend on how many plants you add, spacing, or bed size.

export type SoilInteraction = {
  /** Where the plant primarily forages, not just how deep a single root can reach. */
  root: {
    depthBand: "very_shallow" | "shallow" | "medium" | "deep" | "very_deep";
    feederZone: "surface" | "mid" | "deep";
    strategy:
      | "diffuse_forager" // leafy greens, many herbs
      | "surface_spreader" // strawberry, some groundcovers
      | "taproot_seeker" // carrot, dandelion, many perennials
      | "storage_bulker" // potato, sweet potato (tubers/storage organs)
      | "woody_structural"; // shrubs/trees that build persistent root mass
  };

  /** Relative pull on shared soil resources when grown in a typical container/bed context. */
  demand: {
    nutrientPull: "low" | "medium" | "high";
    waterPull: "low" | "medium" | "high";
    /** How badly the plant suffers when soil is compacted / waterlogged / low-oxygen. */
    oxygenSensitivity: "low" | "medium" | "high";
  };

  /** How the plant behaves when another species is drawing from the same soil volume. */
  competitionTolerance: "intolerant" | "tolerant" | "dominant";

  /** Optional short structural notes for humans. */
  notes?: string[];
};

// =============================================================================
// ELEMENTAL GROUPING SYSTEM
// =============================================================================
//
// A generic abstraction for modeling distinct environmental zones within
// a food forest. While we start with soil (separate beds/containers), the
// same logic will later support light pockets, humidity zones, etc.
//
// KEY INSIGHT: Separation in nature is a gradient, not binary. This model
// supports future coupling factors between groups.
// =============================================================================

/** Supported dimensions for elemental grouping */
export type ElementalDimension = "soil"; // Future: | "light" | "air" | "humidity"

/**
 * A single named group within a dimension.
 *
 * @example
 * { id: "bed1", label: "Main Raised Bed", ingredientIds: ["potato", "tomato"] }
 */
export interface ElementalGroup {
  /** Unique identifier for this group */
  id: string;
  /** Human-readable label for UI display */
  label: string;
  /** IDs of ingredients assigned to this group */
  ingredientIds: string[];
  /**
   * Future: Coupling factors to other groups.
   * Maps otherGroupId -> coupling factor where:
   *   0 = fully separate (no interaction)
   *   1 = fully shared (full interaction)
   *
   * This supports modeling gradient separation (e.g., adjacent beds
   * with some root intermixing, water seepage between zones).
   * NOT IMPLEMENTED YET - reserved for future use.
   */
  // coupling?: Record<string, number>;
}

/**
 * Grouping configuration for a single elemental dimension.
 * Contains named groups and knows which ingredients belong where.
 */
export interface DimensionGrouping {
  /** Whether grouping is enabled for this dimension */
  enabled: boolean;
  /** Named groups (order matters for UI display) */
  groups: ElementalGroup[];
  /**
   * Implicit default group ID for unassigned ingredients.
   * All unassigned ingredients share this group and compete with each other.
   */
  defaultGroupId: string;
}

/**
 * Full elemental grouping context used by Forest authoring and the integration
 * substrate. Each dimension can have its own grouping configuration.
 */
export interface ElementalGroupContext {
  /** Soil grouping: separate beds, containers, root zones */
  soil?: DimensionGrouping;
  // Future dimensions:
  // light?: DimensionGrouping;  // light pockets, shaded areas
  // air?: DimensionGrouping;    // sheltered vs exposed zones
  // humidity?: DimensionGrouping; // humid vs dry microclimates
}

/** Default group ID used for unassigned ingredients */
export const DEFAULT_GROUP_ID = "__default__";

/**
 * Shared group ID - represents the main shared soil group.
 * All ingredients start here and can be removed if they should ONLY be in custom zones.
 */
export const SHARED_GROUP_ID = "__shared__";

/**
 * Creates a new empty DimensionGrouping for a given dimension.
 * Useful for initializing state.
 */
export function createEmptyDimensionGrouping(): DimensionGrouping {
  return {
    enabled: false,
    groups: [],
    defaultGroupId: DEFAULT_GROUP_ID,
  };
}

/**
 * Creates a DimensionGrouping with the shared group initialized with given ingredient IDs.
 * Used when enabling grouping - all ingredients start in the shared zone.
 */
export function createDimensionGroupingWithShared(
  ingredientIds: string[],
): DimensionGrouping {
  return {
    enabled: true,
    groups: [
      {
        id: SHARED_GROUP_ID,
        label: "Default Group",
        ingredientIds: [...ingredientIds],
      },
    ],
    defaultGroupId: DEFAULT_GROUP_ID,
  };
}
