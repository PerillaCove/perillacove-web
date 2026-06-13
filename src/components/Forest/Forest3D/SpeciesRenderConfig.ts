/**
 * SPECIES RENDER CONFIG
 *
 * Central registry that drives all species-specific rendering decisions:
 * tree structure, fruit behavior, ripening colors, and fruit attachment.
 *
 * See plans/species_accurate_rendering.plan.md for the abstract framework.
 * See plans/banana_rendering.plan.md (etc.) for species-specific details.
 *
 * USAGE:
 * - getSpeciesConfig("banana") returns the config for banana
 * - Returns null for unmapped species (fall through to default behavior)
 * - Lookup is exact by key in SPECIES_RENDER_CONFIGS
 * - Runtime volume IDs should be normalized before lookup
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Controls what fruits DO during the productive phase.
 *
 * - "drop": Fruits hang when paused, fall when simulating (current default)
 * - "hang": Fruits stay attached, never fall (cacao pods, jackfruit)
 * - "ripen_drop": Hang while unripe, only drop when ripe + simulating (banana)
 * - "none": No fruit particles at all (underground crops)
 * - "integrated": Fruit is baked into the tree model (pigeon pea bush)
 */
export type FruitBehavior =
  | "drop"
  | "hang"
  | "ripen_drop"
  | "none"
  | "integrated";

/**
 * A single color stage in the ripening progression.
 */
export interface RipeningStage {
  /** 0-1 progress through productive phase when this color appears */
  at: number;
  /** Hex color at this stage */
  color: string;
}

/**
 * Controls fruit color change over the productive phase.
 * Colors interpolate linearly between stages.
 */
export interface RipeningConfig {
  /** Color stages from earliest to latest in productive phase */
  stages: RipeningStage[];
  /** At what ripeness (0-1) can fruits start dropping? (for "ripen_drop") */
  dropThreshold?: number;
  /** 0-1 fraction of eligible fruits that actually drop (default 1.0 = all drop) */
  dropRatio?: number;
  /** Max fruits that can be falling simultaneously (default: no limit) */
  maxSimultaneousDrops?: number;
}

/**
 * Controls fruit size over ripening/productive progress.
 * Multipliers apply on top of fruitScale, where 1.0 is full mature size.
 */
export interface FruitGrowthConfig {
  /** Scale multiplier before growth starts */
  startScale: number;
  /** Scale multiplier once growth completes */
  endScale: number;
  /** Ripening/productive progress where size growth begins (default 0) */
  startAt?: number;
  /** Ripening/productive progress where size growth completes (default 1) */
  endAt?: number;
}

/**
 * Available attachment locations for fruit placement.
 * Works for any plant type — trees, shrubs, herbs.
 */
export type AttachmentLocation =
  | "foliage_surface" // Default: random on lower foliage hemisphere
  | "model_points" // From named empties in the plant GLB ("fruit_attach_*")
  | "trunk" // Lower trunk (50-80% height), protruding outward (cauliflory)
  | "branches" // Upper trunk zone (top 20-50%), more horizontal spread
  | "cluster"; // Grouped in clusters at specific points (banana bunch)

/**
 * Weighted zone for multi-location fruit distribution.
 * Weights are normalized — [0.6, 0.4] and [3, 2] produce the same 60/40 split.
 */
export interface AttachmentZone {
  /** Where to place fruits */
  location: AttachmentLocation;
  /** Relative weight for this zone (higher = more fruits here) */
  weight: number;
}

/**
 * Controls WHERE fruits appear on the tree.
 * Supports single location (method) or multiple weighted zones.
 */
export interface AttachmentConfig {
  /** Single attachment method (simple case, backward compatible) */
  method?: AttachmentLocation;
  /** Multiple weighted zones for mixed placement (e.g., trunk + branches) */
  zones?: AttachmentZone[];
  /** For "cluster" method: how many fruits per cluster */
  clusterSize?: number;
  /** For "foliage_surface": bias toward bottom (0=equator, 1=bottom pole) */
  hangBias?: number;
}

export interface SpeciesMotionConfig {
  kind: "graze";
  radius: number;
  speed: number;
  minSeparation?: number;
}

export interface SpeciesSkeletalAnimationConfig {
  mode: "skinned";
  clips: {
    walk: string;
    graze: string;
    idle: string;
    chew?: string;
  };
  minSeparation: number;
  moveDurationSeconds: number;
  pauseDurationSeconds: [number, number];
  headingOffsetRadians?: number;
  juvenileScale?: number;
  growthDurationYears?: number;
}

/**
 * Complete rendering configuration for a species.
 * Drives tree model, fruit behavior, ripening, and attachment.
 */
export interface SpeciesRenderConfig {
  /** URL to custom GLB for the whole tree/plant. Replaces default sphere+cylinder. */
  treeModel?: string;
  /** Override mature height in meters (instead of layer's heightRange[1]) */
  matureHeight?: number;
  /** How fruits behave during the productive phase */
  fruitBehavior: FruitBehavior;
  /** Scale multiplier for fruit instances */
  fruitScale?: number;
  /** Optional per-species size growth over time */
  fruitGrowth?: FruitGrowthConfig;
  /** [min, max] visible fruits (default [2, 10]) */
  fruitCount?: [number, number];
  /** Color progression over productive phase */
  ripening?: RipeningConfig;
  /** Where/how fruits attach to the tree */
  attachment?: AttachmentConfig;
  /** Show a short stem/peduncle connecting each fruit to the tree */
  showStems?: boolean;
  /** Length of stems relative to fruit scale (default 0.5) */
  stemLength?: number;
  /** Optional living motion applied by the instanced GLB renderer. */
  motion?: SpeciesMotionConfig;
  /** Optional skeletal animation path for small-count living animal models. */
  animation?: SpeciesSkeletalAnimationConfig;
}

// ============================================================================
// REGISTRY
// ============================================================================

/**
 * Per-species rendering configs.
 * Species plans populate this (e.g., banana_rendering.plan.md).
 * Unmapped species fall through to default behavior.
 */

const ASSETS_BASE_URL = "https://assets.perillacove.com";

const appleSpeciesConfigObject: SpeciesRenderConfig = {
  treeModel: `${ASSETS_BASE_URL}/tree_apple.glb`,
  matureHeight: 6, // Medium orchard tree (typically ~4-8m)
  fruitBehavior: "ripen_drop", // Apples hang while ripening, then some drop
  fruitScale: 1.6,
  fruitCount: [6, 14],
  ripening: {
    stages: [
      { at: 0.0, color: "#3f6f2f" }, // Green (young fruit)
      { at: 0.35, color: "#6f8a35" }, // Yellow-green (growing)
      { at: 0.7, color: "#a5693a" }, // Warm red-gold onset
      { at: 0.9, color: "#c63b2f" }, // Ripe red
      { at: 1.0, color: "#8b2a20" }, // Dark red-brown (overripe)
    ],
    dropThreshold: 0.85,
    dropRatio: 0.35,
    maxSimultaneousDrops: 2,
  },
  attachment: {
    method: "model_points", // Uses fruit_attach_* empties from tree_apple.glb
  },
  showStems: true,
  stemLength: 0.28,
};

const grapeSpeciesConfigObject: SpeciesRenderConfig = {
  treeModel: `${ASSETS_BASE_URL}/tree_grape.glb`,
  matureHeight: 3, // Vine trained on trellis (2-3m)
  fruitBehavior: "ripen_drop", // Grapes hang in bunches, drop when ripe
  fruitScale: 1.2,
  fruitCount: [8, 16],
  ripening: {
    stages: [
      { at: 0.0, color: "#3a6b2a" }, // Small green berries
      { at: 0.3, color: "#4a7a3a" }, // Growing green
      { at: 0.6, color: "#5a4a5a" }, // Veraison (color change)
      { at: 0.85, color: "#3a1a4a" }, // Deep purple (ripe)
      { at: 1.0, color: "#2a0a3a" }, // Dark purple-black (overripe)
    ],
    dropThreshold: 0.85,
    dropRatio: 0.3,
    maxSimultaneousDrops: 2,
  },
  attachment: {
    method: "model_points", // 20 attach points on underside of canes
  },
  showStems: true,
  stemLength: 0.25, // Short peduncle to grape bunch
};

const cherrySpeciesConfigObject: SpeciesRenderConfig = {
  treeModel: `${ASSETS_BASE_URL}/tree_cherry.glb`,
  matureHeight: 6, // Medium orchard tree (typically ~4-8m)
  fruitBehavior: "ripen_drop", // Cherries hang while ripening, then some drop
  fruitScale: 1.1, // Small fruit relative to apples
  fruitCount: [10, 24], // Cherry trees carry many fruits per season
  ripening: {
    stages: [
      { at: 0.0, color: "#3a6a2a" }, // Green (young cherry)
      { at: 0.35, color: "#6a8a35" }, // Yellow-green (maturing)
      { at: 0.7, color: "#b8462a" }, // Red onset
      { at: 0.9, color: "#c61f28" }, // Bright ripe red
      { at: 1.0, color: "#7a0f18" }, // Deep overripe red
    ],
    dropThreshold: 0.88,
    dropRatio: 0.35,
    maxSimultaneousDrops: 3,
  },
  attachment: {
    method: "model_points", // Uses fruit_attach_* empties from tree_cherry.glb
  },
  showStems: true,
  stemLength: 0.2,
};

const pearSpeciesConfigObject: SpeciesRenderConfig = {
  treeModel: `${ASSETS_BASE_URL}/tree_pear.glb`,
  matureHeight: 6, // Medium orchard tree (typically ~4-8m)
  fruitBehavior: "ripen_drop", // Pears hang while ripening, then some drop
  fruitScale: 1.4,
  fruitCount: [6, 14],
  ripening: {
    stages: [
      { at: 0.0, color: "#3f6f2f" }, // Green (young pear)
      { at: 0.4, color: "#7a9a45" }, // Yellow-green (maturing)
      { at: 0.8, color: "#d4c469" }, // Warm yellow (ripe)
      { at: 1.0, color: "#8a6a3f" }, // Brown-gold (overripe)
    ],
    dropThreshold: 0.86,
    dropRatio: 0.35,
    maxSimultaneousDrops: 2,
  },
  attachment: {
    method: "model_points", // Uses fruit_attach_* empties from tree_pear.glb
  },
  showStems: true,
  stemLength: 0.24,
};

const kiwiSpeciesConfigObject: SpeciesRenderConfig = {
  treeModel: `${ASSETS_BASE_URL}/plant_kiwi.glb`,
  matureHeight: 3, // Kiwi is a climbing vine typically trained on a trellis
  fruitBehavior: "hang", // Fruits stay attached on the vine (no drop animation)
  fruitScale: 1.1,
  fruitCount: [10, 24],
  ripening: {
    stages: [
      { at: 0.0, color: "#4a6f2e" }, // Firm green fruit
      { at: 0.45, color: "#7a7a3e" }, // Yellow-green transition
      { at: 0.8, color: "#8a6a3a" }, // Browning skin as fruit matures
      { at: 1.0, color: "#6a4f2a" }, // Fully mature brown skin
    ],
  },
  attachment: {
    method: "model_points", // Uses fruit_attach_* empties from plant_kiwi.glb
  },
  showStems: true,
  stemLength: 0.16,
};

const strawberrySpeciesConfigObject: SpeciesRenderConfig = {
  treeModel: `${ASSETS_BASE_URL}/plant_strawberry.glb`,
  matureHeight: 0.35, // Low-growing herbaceous perennial (~20-40cm)
  fruitBehavior: "ripen_drop", // Berries hang while ripening, some drop when ripe
  fruitScale: 0.8,
  fruitCount: [8, 16],
  ripening: {
    stages: [
      { at: 0.0, color: "#5f8a3f" }, // Green (immature berry)
      { at: 0.45, color: "#d6d8b0" }, // Pale/whitish transition
      { at: 0.8, color: "#cf2d2d" }, // Ripe red
      { at: 1.0, color: "#7f1b1b" }, // Deep red overripe
    ],
    dropThreshold: 0.9,
    dropRatio: 0.2,
    maxSimultaneousDrops: 2,
  },
  attachment: {
    method: "model_points", // Uses fruit_attach_* empties from plant_strawberry.glb
  },
  showStems: true,
  stemLength: 0.18,
};

const thymeSpeciesConfigObject: SpeciesRenderConfig = {
  treeModel: `${ASSETS_BASE_URL}/plant_thyme.glb`,
  matureHeight: 0.35, // Low woody herb, typically ~20-40cm
  fruitBehavior: "none", // Leaf harvest crop; no fruit particle spawning
  attachment: {
    method: "model_points",
  },
  showStems: false,
};

const carrotSpeciesConfigObject: SpeciesRenderConfig = {
  treeModel: `${ASSETS_BASE_URL}/plant_carrot.glb`,
  matureHeight: 0.45, // Low herbaceous root crop, foliage typically ~30-50cm
  fruitBehavior: "none", // Root harvest crop; no fruit particle spawning
  attachment: {
    method: "model_points",
  },
  showStems: false,
};

const garlicSpeciesConfigObject: SpeciesRenderConfig = {
  treeModel: `${ASSETS_BASE_URL}/plant_garlic.glb`,
  matureHeight: 0.45, // Low herbaceous bulb crop, foliage typically ~30-50cm
  fruitBehavior: "none", // Bulb harvest crop; no fruit particle spawning
  attachment: {
    method: "model_points",
  },
  showStems: false,
};

const redOnionSpeciesConfigObject: SpeciesRenderConfig = {
  treeModel: `${ASSETS_BASE_URL}/plant_onion_red.glb`,
  // treeModel: "/plant_onion_red.glb",
  matureHeight: 0.42, // Slightly reduced peak scale for greenhouse onion scenes
  fruitBehavior: "none", // Bulb harvest crop; the plant GLB owns bulb + foliage
  attachment: {
    method: "model_points",
  },
  showStems: false,
};

const spanishOnionSpeciesConfigObject: SpeciesRenderConfig = {
  treeModel: `${ASSETS_BASE_URL}/plant_onion_gold.glb`,
  // treeModel: "/plant_onion_gold.glb",
  matureHeight: 0.5, // Slightly reduced peak scale while keeping larger sweet-onion profile
  fruitBehavior: "none", // Bulb harvest crop; no separate fruit particles
  attachment: {
    method: "model_points",
  },
  showStems: false,
};

const jalapenoSpeciesConfigObject: SpeciesRenderConfig = {
  treeModel: `${ASSETS_BASE_URL}/plant_jalapeno.glb`,
  // treeModel: "/plant_jalapeno.glb",
  matureHeight: 0.75, // Compact pepper plant, typically ~60-90cm
  fruitBehavior: "ripen_drop",
  fruitScale: 1.25,
  fruitCount: [6, 14],
  ripening: {
    stages: [
      { at: 0.0, color: "#2e6b2a" }, // Young green pepper
      { at: 0.45, color: "#3f7f2e" }, // Full glossy green
      { at: 0.75, color: "#5b5a24" }, // Color break
      { at: 0.92, color: "#b52a24" }, // Ripe red
      { at: 1.0, color: "#7a1717" }, // Deep overripe red
    ],
    dropThreshold: 0.9,
    dropRatio: 0.25,
    maxSimultaneousDrops: 2,
  },
  attachment: {
    method: "model_points",
  },
  showStems: true,
  stemLength: 0.18,
};

const blackMagicJalapenoSpeciesConfigObject: SpeciesRenderConfig = {
  ...jalapenoSpeciesConfigObject,
  ripening: {
    stages: [
      { at: 0.0, color: "#31512a" }, // Young green-black fruit
      { at: 0.35, color: "#2d2845" }, // Anthocyanin purple onset
      { at: 0.65, color: "#211327" }, // Black-purple mature stage
      { at: 0.9, color: "#8f2024" }, // Red ripe finish
      { at: 1.0, color: "#5f1419" }, // Deep overripe red
    ],
    dropThreshold: 0.92,
    dropRatio: 0.2,
    maxSimultaneousDrops: 2,
  },
};

const blackPepperSpeciesConfigObject: SpeciesRenderConfig = {
  treeModel: `${ASSETS_BASE_URL}/plant_black_pepper.glb`,
  // treeModel: "/plant_black_pepper.glb",
  matureHeight: 0.85, // Compact greenhouse-scale pepper vine
  fruitBehavior: "integrated", // Pepper spikes/berries are baked into the plant GLB
  attachment: {
    method: "model_points",
  },
  showStems: false,
};

const SPECIES_RENDER_CONFIGS: Record<string, SpeciesRenderConfig> = {
  cow: {
    treeModel: `${ASSETS_BASE_URL}/animal_cow.glb`,
    matureHeight: 1.5,
    fruitBehavior: "none",
    motion: {
      kind: "graze",
      radius: 3.2,
      speed: 0.08,
      minSeparation: 2.8,
    },
    animation: {
      mode: "skinned",
      clips: {
        walk: "walk",
        graze: "graze",
        idle: "idle",
        chew: "chew",
      },
      minSeparation: 2.8,
      moveDurationSeconds: 7.5,
      pauseDurationSeconds: [2.4, 4.8],
      headingOffsetRadians: Math.PI,
      juvenileScale: 0.42,
      growthDurationYears: 3.5,
    },
  },

  banana: {
    treeModel: `${ASSETS_BASE_URL}/tree_banana.glb`,
    matureHeight: 2.5, // Banana is herbaceous, not a tree — ~2.5m tall
    fruitBehavior: "ripen_drop",
    fruitScale: 2.5,
    fruitCount: [5, 8],
    ripening: {
      stages: [
        { at: 0.0, color: "#3d6b2e" }, // Dark green (just fruiting)
        { at: 0.4, color: "#5a8a3a" }, // Medium green (growing)
        { at: 0.7, color: "#8fad3e" }, // Yellow-green (maturing)
        { at: 0.85, color: "#f5d742" }, // Yellow (ripe)
        { at: 1.0, color: "#d4a017" }, // Golden-brown (overripe)
      ],
      dropThreshold: 0.85,
    },
    attachment: {
      method: "cluster",
      clusterSize: 6,
    },
  },
  cacao: {
    treeModel: `${ASSETS_BASE_URL}/tree_cacao.glb`,
    matureHeight: 5, // Midstory-ish: taller than banana, shorter than durian/jackfruit
    fruitBehavior: "hang", // Pods stay attached, never fall (hand-harvested)
    fruitScale: 2.0,
    fruitGrowth: { startScale: 0.45, endScale: 1, startAt: 0.3, endAt: 0.8 },
    fruitCount: [4, 10],
    ripening: {
      stages: [
        { at: 0.0, color: "#2d5a1e" }, // Dark green (young pod)
        { at: 0.3, color: "#4a7a2e" }, // Medium green (growing)
        { at: 0.6, color: "#7a9a3e" }, // Light green-yellow (maturing)
        { at: 0.8, color: "#c4a832" }, // Yellow-gold (nearly ripe)
        { at: 1.0, color: "#d4a017" }, // Gold (ripe)
      ],
    },
    attachment: {
      method: "model_points", // Attach points placed in Blender (fruit_attach_*)
    },
    showStems: true,
    stemLength: 0.6,
  },
  durian: {
    treeModel: `${ASSETS_BASE_URL}/tree_durian.glb`,
    matureHeight: 10, // Canopy tree — tall (can reach 25-50m, but 15m for visualization)
    fruitBehavior: "ripen_drop", // Hang when green, drop when ripe (famously dangerous!)
    fruitScale: 3.0, // Durians are large
    fruitGrowth: { startScale: 0.35, endScale: 1, startAt: 0.3, endAt: 0.85 },
    fruitCount: [4, 12],
    ripening: {
      stages: [
        { at: 0.0, color: "#4a5a3a" }, // Green with grayish-olive tinge (young)
        { at: 0.3, color: "#5a6a3e" }, // Greenish (growing)
        { at: 0.6, color: "#6a7040" }, // Brownish-green (maturing)
        { at: 0.85, color: "#8a7a45" }, // Yellowish-brown/tawny (ripe)
        { at: 1.0, color: "#9a8550" }, // Fully ripe, muted earthy
      ],
      dropThreshold: 0.85, // Only ripe durians drop
      dropRatio: 0.8, // Most ripe durians drop
      maxSimultaneousDrops: 3, // Heavy dropper
    },
    attachment: {
      method: "model_points", // Attach points on branches in Blender
    },
    showStems: true,
    stemLength: 0.8, // Long stems visible in reference photo
  },
  jackfruit: {
    treeModel: `${ASSETS_BASE_URL}/tree_jackfruit.glb`,
    // Keep jackfruit at a managed agroforestry height so immersive map scenes
    // stay readable without giant canopy dominance.
    matureHeight: 6,
    fruitBehavior: "hang", // Jackfruit stay attached, hand-harvested (like cacao)
    fruitScale: 3.5, // Jackfruit are very large (biggest tree-borne fruit)
    fruitGrowth: { startScale: 0.3, endScale: 1, startAt: 0.3, endAt: 0.85 },
    fruitCount: [3, 8],
    ripening: {
      stages: [
        { at: 0.0, color: "#3a5a28" }, // Dark green (young fruit)
        { at: 0.3, color: "#4a6a30" }, // Green (growing)
        { at: 0.6, color: "#6a7a3a" }, // Yellow-green (maturing)
        { at: 0.85, color: "#9a8a40" }, // Brownish-yellow (ripe)
        { at: 1.0, color: "#b3a050" }, // Golden-brown (fully ripe)
      ],
    },
    attachment: {
      method: "model_points", // 20 attach points: 10 trunk (cauliflory) + 10 under branches
    },
    showStems: true,
    stemLength: 0.4, // Short, sturdy stems
  },
  peanut: {
    treeModel: `${ASSETS_BASE_URL}/plant_peanut.glb`,
    matureHeight: 0.45, // Low bushy herb, ~45cm tall
    fruitBehavior: "hang", // Pods stay attached underground — harvested by pulling plant
    fruitScale: 2.0,
    fruitCount: [8, 20],
    ripening: {
      stages: [
        { at: 0.0, color: "#e8e0c8" }, // Pale cream-white (young pod, just forming)
        { at: 0.25, color: "#d4c8a0" }, // Light tan (pod filling out)
        { at: 0.5, color: "#c4a870" }, // Tan-brown (shell hardening)
        { at: 0.75, color: "#a08050" }, // Medium brown (maturing)
        { at: 1.0, color: "#7a6040" }, // Dark brown (fully mature, ready to harvest)
      ],
    },
    attachment: {
      method: "model_points", // 20 attach points below ground (at gynophore tips)
    },
  },
  mango: {
    treeModel: `${ASSETS_BASE_URL}/tree_mango.glb`,
    // Managed orchard-scale canopy height for mixed food-forest balance.
    matureHeight: 5,
    fruitBehavior: "ripen_drop", // Mangoes hang green, drop when ripe
    fruitScale: 2.0,
    fruitCount: [4, 10],
    ripening: {
      stages: [
        { at: 0.0, color: "#2d5a1e" }, // Dark green (young fruit)
        { at: 0.3, color: "#4a7a2e" }, // Medium green (growing)
        { at: 0.6, color: "#8a9a3e" }, // Yellow-green (maturing)
        { at: 0.85, color: "#e8c040" }, // Yellow-orange (ripe)
        { at: 1.0, color: "#d48020" }, // Deep orange (overripe)
      ],
      dropThreshold: 0.8,
      dropRatio: 0.6,
      maxSimultaneousDrops: 2,
    },
    attachment: {
      method: "model_points", // 20 attach points beneath branches in Blender
    },
    showStems: true,
    stemLength: 0.5,
  },
  turmeric: {
    treeModel: `${ASSETS_BASE_URL}/plant_turmeric.glb`,
    matureHeight: 0.9, // Herbaceous perennial, ~60-90cm tall
    fruitBehavior: "hang", // Rhizomes stay attached underground — harvested by digging
    fruitScale: 2.0,
    fruitCount: [1, 1], // Single rhizome cluster — the GLB already has multiple fingers
    ripening: {
      stages: [
        { at: 0.0, color: "#e8e0c0" }, // Pale cream (young rhizome)
        { at: 0.25, color: "#d4c080" }, // Light yellow (growing)
        { at: 0.5, color: "#c8a040" }, // Golden yellow (filling out)
        { at: 0.75, color: "#d48820" }, // Deep orange-yellow (maturing)
        { at: 1.0, color: "#c06010" }, // Rich orange (mature, ready to harvest)
      ],
    },
    attachment: {
      method: "model_points", // 8 attach points below ground (rhizome fingers)
    },
  },
  ginger: {
    treeModel: `${ASSETS_BASE_URL}/plant_ginger.glb`,
    matureHeight: 1.0, // Herbaceous perennial, ~60-120cm tall
    fruitBehavior: "hang", // Rhizomes stay attached underground — harvested by digging
    fruitCount: [1, 1],
    ripening: {
      stages: [
        { at: 0.0, color: "#e8e0c8" }, // Pale cream (young rhizome)
        { at: 0.25, color: "#d8c890" }, // Light tan (growing)
        { at: 0.5, color: "#c8b070" }, // Warm tan (filling out)
        { at: 0.75, color: "#b89858" }, // Tan-brown (maturing)
        { at: 1.0, color: "#a08040" }, // Medium brown (mature, ready to harvest)
      ],
    },
    attachment: {
      method: "model_points", // 8 attach points below ground (rhizome fingers)
    },
  },
  pigeon_pea: {
    treeModel: `${ASSETS_BASE_URL}/plant_pigeon_pea.glb`,
    matureHeight: 2.0, // Shrubby legume, ~1.5-2m tall, wide vase form
    fruitBehavior: "drop", // Pods dry on plant, drop when mature
    fruitScale: 1.5,
    fruitCount: [6, 14],
    ripening: {
      stages: [
        { at: 0.0, color: "#3a6a28" }, // Green (young pod)
        { at: 0.3, color: "#5a7a30" }, // Medium green (filling out)
        { at: 0.6, color: "#7a8a3a" }, // Yellow-green (maturing)
        { at: 0.85, color: "#a08040" }, // Tan-brown (drying)
        { at: 1.0, color: "#6a5030" }, // Dark brown (dry, ready to harvest)
      ],
      dropThreshold: 0.85,
      dropRatio: 0.5,
      maxSimultaneousDrops: 2,
    },
    attachment: {
      method: "model_points", // 20 attach points along stems and branches
    },
  },
  orange: {
    treeModel: `${ASSETS_BASE_URL}/tree_orange.glb`,
    matureHeight: 6, // Medium tree (can reach 5-10m)
    fruitBehavior: "ripen_drop", // Oranges hang green, drop when ripe
    fruitScale: 2.0,
    fruitCount: [6, 14],
    ripening: {
      stages: [
        { at: 0.0, color: "#2d5a1e" }, // Dark green (young fruit)
        { at: 0.3, color: "#4a7a2e" }, // Medium green (growing)
        { at: 0.6, color: "#8a9a3e" }, // Yellow-green (maturing)
        { at: 0.85, color: "#e8a020" }, // Orange (ripe)
        { at: 1.0, color: "#d47010" }, // Deep orange (overripe)
      ],
      dropThreshold: 0.85,
      dropRatio: 0.4,
      maxSimultaneousDrops: 2,
    },
    attachment: {
      method: "model_points", // 20 attach points throughout canopy
    },
    showStems: true,
    stemLength: 0.3, // Short stems
  },
  lemon: {
    treeModel: `${ASSETS_BASE_URL}/tree_lemon.glb`,
    matureHeight: 5, // Small-medium tree (3-6m)
    fruitBehavior: "ripen_drop", // Lemons hang green, drop when ripe
    fruitScale: 1.8,
    fruitCount: [6, 14],
    ripening: {
      stages: [
        { at: 0.0, color: "#2d5a1e" }, // Dark green (young fruit)
        { at: 0.3, color: "#4a7a2e" }, // Medium green (growing)
        { at: 0.6, color: "#8aaa3e" }, // Yellow-green (maturing)
        { at: 0.85, color: "#e8d830" }, // Bright yellow (ripe)
        { at: 1.0, color: "#d4c020" }, // Deep yellow (overripe)
      ],
      dropThreshold: 0.85,
      dropRatio: 0.3,
      maxSimultaneousDrops: 2,
    },
    attachment: {
      method: "model_points", // 20 attach points throughout canopy
    },
    showStems: true,
    stemLength: 0.3, // Short stems
  },

  apple: appleSpeciesConfigObject,
  apple__red: appleSpeciesConfigObject,
  apple__gold: appleSpeciesConfigObject,
  apple__green: appleSpeciesConfigObject,
  cherry__sweet: cherrySpeciesConfigObject,
  pear: pearSpeciesConfigObject,
  pear__green: pearSpeciesConfigObject,
  pear__yellow: pearSpeciesConfigObject,

  fig: {
    treeModel: `${ASSETS_BASE_URL}/tree_fig.glb`,
    matureHeight: 8, // Medium tree (6-10m), wide spreading canopy
    fruitBehavior: "ripen_drop", // Figs hang green, drop when ripe
    fruitScale: 1.5,
    fruitCount: [8, 18],
    ripening: {
      stages: [
        { at: 0.0, color: "#3a6b2a" }, // Green (young fig)
        { at: 0.3, color: "#5a7a3a" }, // Yellow-green (growing)
        { at: 0.6, color: "#6b4a3a" }, // Brown-purple (maturing)
        { at: 0.85, color: "#4a1a3a" }, // Deep purple (ripe)
        { at: 1.0, color: "#3a0a2a" }, // Dark purple-black (overripe)
      ],
      dropThreshold: 0.85,
      dropRatio: 0.4,
      maxSimultaneousDrops: 3,
    },
    attachment: {
      method: "model_points", // 20 attach points at leaf axils on branches
    },
    showStems: false, // Figs grow directly from branches (no visible stem)
  },

  blueberry: {
    treeModel: `${ASSETS_BASE_URL}/plant_blueberry.glb`,
    matureHeight: 1.8, // Fruiting shrub (typically ~1-2m)
    fruitBehavior: "hang", // Berries stay attached; no dropping
    fruitScale: 0.55, // Small berries relative to shrub size
    fruitCount: [14, 28], // Blueberry shrubs carry many fruits
    ripening: {
      stages: [
        { at: 0.0, color: "#6a7f4f" }, // Green immature berry
        { at: 0.45, color: "#5e6f86" }, // Turning blue-gray
        { at: 0.8, color: "#4b5f9b" }, // Blue
        { at: 1.0, color: "#394c88" }, // Deep ripe blueberry blue
      ],
    },
    attachment: {
      method: "model_points", // Uses fruit_attach_* empties from plant_blueberry.glb
    },
    showStems: false,
  },

  raspberry: {
    treeModel: `${ASSETS_BASE_URL}/plant_raspberry.glb`,
    matureHeight: 1.6, // Cane-forming deciduous shrub (~1.2-2m)
    fruitBehavior: "ripen_drop", // Hang while ripening, then some berries drop
    fruitScale: 0.7, // Small aggregate berries
    fruitCount: [12, 24], // Productive canes can carry many berries
    ripening: {
      stages: [
        { at: 0.0, color: "#6f8f42" }, // Green immature drupelets
        { at: 0.5, color: "#b8687c" }, // Pink-red transition
        { at: 0.82, color: "#cf2945" }, // Bright ripe raspberry red
        { at: 1.0, color: "#7f1930" }, // Deep red-burgundy overripe
      ],
      dropThreshold: 0.82,
      dropRatio: 0.45,
      maxSimultaneousDrops: 3,
    },
    attachment: {
      method: "model_points", // Uses fruit_attach_* empties from plant_raspberry.glb
    },
    showStems: true,
    stemLength: 0.16,
  },

  grape: grapeSpeciesConfigObject,
  grape__kishmish: grapeSpeciesConfigObject,
  grape__purple: grapeSpeciesConfigObject,
  grape__white: grapeSpeciesConfigObject,
  grape__trebbiano: grapeSpeciesConfigObject,
  kiwi: kiwiSpeciesConfigObject,
  kiwi__green: kiwiSpeciesConfigObject,
  strawberry: strawberrySpeciesConfigObject,

  pomegranate: {
    treeModel: `${ASSETS_BASE_URL}/tree_pomegranate.glb`,
    matureHeight: 5, // Small multi-stemmed tree (3-6m)
    fruitBehavior: "ripen_drop", // Pomegranates hang, drop when ripe
    fruitScale: 2.2,
    fruitCount: [5, 12],
    ripening: {
      stages: [
        { at: 0.0, color: "#3a6b2a" }, // Green (young fruit)
        { at: 0.3, color: "#6b7a2a" }, // Yellow-green (growing)
        { at: 0.6, color: "#8b4a2a" }, // Orange-red (coloring)
        { at: 0.85, color: "#a52020" }, // Deep red (ripe)
        { at: 1.0, color: "#7a1515" }, // Dark crimson (overripe)
      ],
      dropThreshold: 0.85,
      dropRatio: 0.3,
      maxSimultaneousDrops: 2,
    },
    attachment: {
      method: "model_points", // 20 attach points at branch tips/junctions
    },
    showStems: true,
    stemLength: 0.2, // Short stem with calyx
  },

  persimmon__asian: {
    treeModel: `${ASSETS_BASE_URL}/tree_persimmon__asian.glb`,
    matureHeight: 7, // Medium orchard tree with rounded-vase canopy (typically ~4-10m)
    fruitBehavior: "ripen_drop", // Persimmons hang while ripening, then some drop when fully ripe
    fruitScale: 1.2,
    fruitCount: [6, 14],
    ripening: {
      stages: [
        { at: 0.0, color: "#3f6f2f" }, // Green (young fruit)
        { at: 0.35, color: "#7a8a35" }, // Yellow-green (maturing)
        { at: 0.7, color: "#c07a30" }, // Orange onset
        { at: 0.88, color: "#d46422" }, // Ripe orange
        { at: 1.0, color: "#8a4520" }, // Deep orange-brown (overripe)
      ],
      dropThreshold: 0.86,
      dropRatio: 0.4,
      maxSimultaneousDrops: 2,
    },
    attachment: {
      method: "model_points", // Uses fruit_attach_* empties from tree_persimmon__asian.glb
    },
    showStems: true,
    stemLength: 0.24,
  },

  fennel: {
    treeModel: `${ASSETS_BASE_URL}/fennel.glb`,
    matureHeight: 1.0, // Herbaceous plant (0.6-1.2m)
    fruitBehavior: "none", // Edible part is the bulb, not a hanging fruit
    attachment: {
      method: "model_points", // 20 attach points on bulb surface and stalk bases
    },
    showStems: false,
  },

  oregano: {
    treeModel: `${ASSETS_BASE_URL}/plant_oregano.glb`,
    matureHeight: 0.5, // Low bushy herb (0.3-0.6m)
    fruitBehavior: "none", // Harvested as leaves, no fruit
    attachment: {
      method: "model_points",
    },
    showStems: false,
  },

  rosemary: {
    treeModel: `${ASSETS_BASE_URL}/plant_rosemary.glb`,
    matureHeight: 1.0, // Woody herb / small shrub (0.5-1.5m)
    fruitBehavior: "none", // Harvested as leaves, no fruit
    attachment: {
      method: "model_points",
    },
    showStems: false,
  },
  thyme: thymeSpeciesConfigObject,
  carrot: carrotSpeciesConfigObject,
  garlic: garlicSpeciesConfigObject,
  onion__red: redOnionSpeciesConfigObject,
  spanish_onion: spanishOnionSpeciesConfigObject,
  onion__gold: spanishOnionSpeciesConfigObject,
  jalapeno: jalapenoSpeciesConfigObject,
  black_magic_jalapeno: blackMagicJalapenoSpeciesConfigObject,
  black_pepper: blackPepperSpeciesConfigObject,

  // ── Nut trees ──────────────────────────────────────────────────────────
  chestnut: {
    treeModel: `${ASSETS_BASE_URL}/tree_chestnut.glb`,
    matureHeight: 15, // Large deciduous tree (15-25m)
    fruitBehavior: "ripen_drop", // Spiny burs drop when ripe
    ripening: {
      stages: [
        { at: 0.0, color: "#4a7a2e" }, // Green bur
        { at: 0.5, color: "#8B7a30" }, // Yellowing
        { at: 0.8, color: "#7a5020" }, // Brown bur splitting
        { at: 1.0, color: "#5c3a1a" }, // Dark brown, ready to fall
      ],
    },
    attachment: {
      method: "model_points",
    },
    fruitScale: 2.0,
    showStems: true,
    stemLength: 0.15,
  },

  walnut: {
    treeModel: `${ASSETS_BASE_URL}/tree_walnut.glb`,
    matureHeight: 25, // Large deciduous tree (15-30m)
    fruitBehavior: "ripen_drop", // Green husk drops when ripe
    ripening: {
      stages: [
        { at: 0.0, color: "#5a8a2a" }, // Green husk
        { at: 0.4, color: "#6a7a28" }, // Yellowing husk
        { at: 0.7, color: "#5a5020" }, // Browning, husk splitting
        { at: 1.0, color: "#4a3a18" }, // Dark brown shell exposed
      ],
    },
    attachment: {
      method: "model_points",
    },
    fruitScale: 1.8,
    showStems: true,
    stemLength: 0.12,
  },

  hazelnut: {
    treeModel: `${ASSETS_BASE_URL}/tree_hazelnut.glb`,
    matureHeight: 5, // Large shrub / small tree (3-8m)
    fruitBehavior: "ripen_drop", // Nuts in husks drop when ripe
    ripening: {
      stages: [
        { at: 0.0, color: "#6a9a30" }, // Green involucre
        { at: 0.5, color: "#8a8a30" }, // Yellowing
        { at: 0.8, color: "#7a5a28" }, // Brown, husk drying
        { at: 1.0, color: "#5a3a15" }, // Dark brown, nut exposed
      ],
    },
    attachment: {
      method: "model_points",
    },
    fruitScale: 1.2,
    showStems: true,
    stemLength: 0.1,
  },
};

// ============================================================================
// LOOKUP
// ============================================================================

/**
 * Look up the render config for a species.
 * Returns null for unmapped species (use default behavior).
 */
export function getSpeciesConfig(
  ingredientId: string | undefined,
): SpeciesRenderConfig | null {
  if (!ingredientId) return null;
  return SPECIES_RENDER_CONFIGS[ingredientId] ?? null;
}

// ============================================================================
// RIPENING HELPERS
// ============================================================================

/**
 * Interpolate between ripening color stages based on productive progress.
 *
 * @param config - Ripening config with color stages
 * @param progress - 0-1 progress through productive phase
 * @returns Interpolated color for the current ripeness
 */
export function getRipeningColor(
  config: RipeningConfig,
  progress: number,
): [number, number, number] {
  const { stages } = config;
  if (stages.length === 0) return [1, 0, 0]; // Fallback red

  // Clamp to stage boundaries
  if (progress <= stages[0].at) {
    return hexToRgb(stages[0].color);
  }
  if (progress >= stages[stages.length - 1].at) {
    return hexToRgb(stages[stages.length - 1].color);
  }

  // Find the two stages we're between and interpolate
  for (let i = 0; i < stages.length - 1; i++) {
    if (progress >= stages[i].at && progress <= stages[i + 1].at) {
      const t = (progress - stages[i].at) / (stages[i + 1].at - stages[i].at);
      const a = hexToRgb(stages[i].color);
      const b = hexToRgb(stages[i + 1].color);
      return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
      ];
    }
  }

  return hexToRgb(stages[stages.length - 1].color);
}

/** Convert hex color string to [r, g, b] in 0-1 range */
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  return [r, g, b];
}
