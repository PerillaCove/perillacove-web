import type {
  Growth,
  Ingredient,
  LightPreferenceType,
} from "../IngredientsPage/types";
import { formatIngredientIdForDisplay } from "../../util/functions";
import type {
  SuccessionPhase,
  SuccessionProfile,
  VerticalLayer,
  LayerPlacement,
  CanopyClosure,
  RespawnConfig,
  SpeciesCountConfig,
  SpeciesLifetimeSegment,
} from "./types";
import { VERTICAL_LAYER_ORDER } from "./types";

// Re-export for older imports in chart modules.
export type { SpeciesLifetimeSegment } from "./types";

interface NarrativeFinding {
  id: string;
  severity: "info" | "warning" | "critical";
}

// =============================================================================
// LIFECYCLE SCALE CONFIG
// =============================================================================

/**
 * ENABLE_LIFECYCLE_SCALE — smooth scale-down as plants die.
 *
 * true  = plants shrink gradually during decline (mirror of growth animation).
 *         Uses extended intensity curve (0.85 decline coeff, 2-year fade),
 *         simplified opacity, and lifeScale in renderers.
 * false = original behavior. Plants stay full size, canopyRadius shrinks via
 *         intensity factor, status-based opacity multipliers, 1-year fade.
 *         Plants disappear instantly when intensity drops below threshold.
 *
 * This flag gates ALL related changes across util.ts, spatial.ts, and renderers.
 * See the "Lifecycle Scale" section in CLAUDE.md for full docs.
 */
export const ENABLE_LIFECYCLE_SCALE = true;

/**
 * Controls how aggressively plants shrink during decline (only when ENABLE_LIFECYCLE_SCALE = true).
 *   Lower (e.g. 0.2) = plant stays large longer, shrinks fast at the end
 *   Higher (e.g. 0.7) = plant shrinks more quickly and linearly
 *   0.4 = gentle curve (default): half size at harvestEnd, then continues to ~0
 */
export const LIFECYCLE_SCALE_EXPONENT = 0.4;

/*
    Given a set of ingredients, you want to:

    Decide which phase each one belongs to.

    Sort by that phase.

    Optionally show approximate calendar years and lifetimes.
*/

export function getSuccessionProfile(
  ingredient: Ingredient,
): SuccessionProfile | null {
  if (ingredient.properties.succession) {
    return ingredient.properties.succession;
  }

  const animal = ingredient.properties.animalIntegration;
  if (!animal) return null;

  const startYear = Math.max(0, animal.lifecycle.startYear);
  const maturityYears = Math.max(0.1, animal.lifecycle.maturityYears);
  const lifespanYears = Math.max(
    maturityYears + 0.1,
    animal.lifecycle.lifespanYears,
  );

  return {
    successionalPhase: "early",
    recommendedPlantYearFromStart: [startYear, startYear],
    establishmentLight: "full_sun",
    yearsToFirstHarvest: [maturityYears, maturityYears],
    productiveLifespanYears: [
      lifespanYears - maturityYears,
      lifespanYears - maturityYears,
    ],
    managementRotation: "medium_rotation",
  };
}

/*
    We can derive a phase index from recommendedPlantYearFromStart by using the minimum year. 
    For example, anything that wants to be planted between years 0 and 1 can be phase 0, years 1 to 3 can be phase 1, and so on.
  */

export function phaseIndexFromSuccession(s: SuccessionProfile): number {
  const [minYear] = s.recommendedPlantYearFromStart;

  if (minYear <= 0.25) return 0; // pioneer, plant immediately
  if (minYear <= 1.5) return 1; // early
  if (minYear <= 3) return 2; // mid
  if (minYear <= 7) return 3; // late
  return 4; // legacy
}

/*
    Feed it banana, cacao, coconut, durian and you get something like:

    Phase 0, year 0 to 0
    Banana

    Phase 1, year 0.5 to 2
    Cacao

    Phase 2, year 1 to 3
    Coconut

    Phase 3, year 2 to 5
    Durian

    You can present this in the UI as a simple “waves” timeline:

    Wave 1 (year 0)
    Wave 2 (year 0.5 to 2)
    Wave 3 (year 1 to 3)
    Wave 4 (year 2 to 5)
  */
export function buildSuccessionTimeline(
  ingredients: Ingredient[],
): SuccessionPhase[] {
  const withProfiles = ingredients
    .map((i) => {
      const s = getSuccessionProfile(i);
      return s ? { ingredient: i, s } : null;
    })
    .filter((x): x is { ingredient: Ingredient; s: SuccessionProfile } => !!x);

  // group by phaseIndex
  const phaseMap = new Map<
    number,
    { ingredient: Ingredient; s: SuccessionProfile }[]
  >();

  for (const entry of withProfiles) {
    const idx = phaseIndexFromSuccession(entry.s);
    if (!phaseMap.has(idx)) phaseMap.set(idx, []);
    phaseMap.get(idx)!.push(entry);
  }

  const sortedPhaseIndices = Array.from(phaseMap.keys()).sort((a, b) => a - b);

  const phases: SuccessionPhase[] = [];

  for (const idx of sortedPhaseIndices) {
    const entries = phaseMap.get(idx)!;

    // time window for this phase based on min and max of all species in it
    const fromYear = Math.min(
      ...entries.map((e) => e.s.recommendedPlantYearFromStart[0]),
    );
    const toYear = Math.max(
      ...entries.map((e) => e.s.recommendedPlantYearFromStart[1]),
    );

    phases.push({
      phaseIndex: idx,
      fromYear,
      toYear,
      ingredients: entries.map((e) => e.ingredient),
    });
  }

  return phases;
}

/**
 * Build simple "lifetime segments" (plant → first harvest → end of productive window)
 * for any ingredients that have an explicit `properties.succession` profile.
 *
 * ## What this function is (and is not)
 * - **It is a planner visualization helper**: you can render the result as a stacked
 *   timeline / Gantt chart to communicate *when* each species wants to be planted and
 *   how long it will be productive.
 * - **It is intentionally conservative**: it always chooses the **earliest** (min)
 *   values from the profile's `[min,max]` ranges.
 * - **It does not infer** missing profiles. If an ingredient has no succession block,
 *   it is simply skipped.
 * - **It does not sort**; segments are returned in the same order as the input array.
 *
 * ## Contract (the exact math)
 * Given a `SuccessionProfile`:
 * - `plantYear = recommendedPlantYearFromStart[0]`
 * - `harvestStartYear = plantYear + yearsToFirstHarvest[0]`
 * - `harvestEndYear = harvestStartYear + productiveLifespanYears[0]`
 *
 * ## Respawning
 * When `respawnConfig` is provided, additional segments are created for each respawn cycle.
 * Each respawn cycle starts immediately after the previous cycle ends.
 *
 * ## Executable example (mirrors tests)
 * Using these simplified profiles:
 * - Banana: plant 0, first harvest 0.8, productive 2 → harvest window 0.8..2.8
 * - Cacao: plant 0.5, first harvest 3, productive 20 → harvest window 3.5..23.5
 * - Coconut: plant 1, first harvest 5, productive 40 → harvest window 6..46
 * - Durian: plant 2, first harvest 7, productive 40 → harvest window 9..49
 */
export function buildLifetimeSegments(
  ingredients: Ingredient[],
  respawnConfig?: RespawnConfig,
): SpeciesLifetimeSegment[] {
  const segments: SpeciesLifetimeSegment[] = [];

  for (const ingredient of ingredients) {
    const s = getSuccessionProfile(ingredient);
    if (!s) continue;

    const [plantMin] = s.recommendedPlantYearFromStart;
    const [maturityMin] = s.yearsToFirstHarvest;
    const [lifeMin] = s.productiveLifespanYears;

    // Calculate single lifecycle duration (from planting to end of harvest)
    const lifecycleDuration = maturityMin + lifeMin;

    // Get respawn count for this ingredient (0 = no respawning, just original)
    const respawnCount = respawnConfig?.[ingredient.id] ?? 0;
    const totalCycles = 1 + respawnCount;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      // Each cycle starts after the previous one ends
      const cycleOffset = cycle * lifecycleDuration;
      const plantYear = plantMin + cycleOffset;
      const harvestStartYear = plantYear + maturityMin;
      const harvestEndYear = harvestStartYear + lifeMin;

      segments.push({
        ingredient,
        plantYear,
        harvestStartYear,
        harvestEndYear,
        respawnCycle: cycle,
      });
    }
  }

  return segments;
}

export function getSpeciesInstanceCount(
  speciesCountConfig: SpeciesCountConfig | undefined,
  ingredientId: string,
): number {
  const rawCount = speciesCountConfig?.[ingredientId] ?? 1;
  if (!Number.isFinite(rawCount)) return 1;
  return Math.max(1, Math.floor(rawCount));
}

export function applySpeciesCountToSegments(
  segments: SpeciesLifetimeSegment[],
  speciesCountConfig?: SpeciesCountConfig,
): SpeciesLifetimeSegment[] {
  if (!speciesCountConfig || Object.keys(speciesCountConfig).length === 0) {
    return segments;
  }

  return segments.map((segment) => {
    const instanceCount = getSpeciesInstanceCount(
      speciesCountConfig,
      segment.ingredient.id,
    );

    if (instanceCount === 1 && !segment.instanceCount) {
      return segment;
    }

    return {
      ...segment,
      instanceCount,
    };
  });
}

export type SegmentStatus =
  | "establishing"
  | "productive"
  | "declining"
  | "ended";

export interface ActiveSegmentAtYear {
  segment: SpeciesLifetimeSegment;
  status: SegmentStatus;
  /** 0..1 intensity at this year (matches wave generation logic) */
  intensity: number;
}

/**
 * Query which segments are active at a specific year, with their status and intensity.
 * This is the "drill into the mix" function that lets you explain what's contributing
 * to the wave at any point in time.
 */
export function getActiveSegmentsAtYear(
  segments: SpeciesLifetimeSegment[],
  year: number,
): ActiveSegmentAtYear[] {
  const results: ActiveSegmentAtYear[] = [];

  for (const segment of segments) {
    const { plantYear, harvestStartYear, harvestEndYear } = segment;

    // Before planting: not active
    if (year < plantYear) continue;

    // After harvest end + fade window: not active
    const fadeWindow = ENABLE_LIFECYCLE_SCALE ? 2 : 1;
    if (year > harvestEndYear + fadeWindow) continue;

    let status: SegmentStatus;
    let intensity: number;

    if (year >= plantYear && year < harvestStartYear) {
      // Establishing phase
      status = "establishing";
      const progress =
        (year - plantYear) / Math.max(harvestStartYear - plantYear, 0.1);
      intensity = progress * progress * 0.3;
    } else if (year >= harvestStartYear && year <= harvestEndYear) {
      const harvestDuration = harvestEndYear - harvestStartYear;
      const fullProductivityStart = harvestStartYear + harvestDuration * 0.1;
      const declineStart = harvestStartYear + harvestDuration * 0.9;

      if (year < fullProductivityStart) {
        // Quick ramp to full productivity
        status = "productive";
        const progress =
          (year - harvestStartYear) /
          Math.max(fullProductivityStart - harvestStartYear, 0.1);
        intensity = 0.3 + progress * 0.7;
      } else if (year < declineStart) {
        // Full productivity
        status = "productive";
        intensity = 1.0;
      } else {
        // Decline phase (last 10% of harvest) — must match getSpeciesIntensityAtYear
        status = "declining";
        const declineCoeff = ENABLE_LIFECYCLE_SCALE ? 0.85 : 0.7;
        const progress =
          (year - declineStart) / Math.max(harvestEndYear - declineStart, 0.1);
        intensity = 1.0 - progress * progress * declineCoeff;
      }
    } else {
      // After harvest end: fade (matches getSpeciesIntensityAtYear)
      status = "ended";
      const declineCoeff = ENABLE_LIFECYCLE_SCALE ? 0.85 : 0.7;
      const fadeStart = 1.0 - declineCoeff;
      const fadeTime = Math.min((year - harvestEndYear) / fadeWindow, 1);
      if (ENABLE_LIFECYCLE_SCALE) {
        intensity = Math.max(0, fadeStart * (1 - fadeTime * fadeTime));
      } else {
        intensity = Math.max(0, fadeStart * (1 - fadeTime));
      }
    }

    results.push({ segment, status, intensity });
  }

  // Sort by intensity descending so most active species come first
  return results.sort((a, b) => b.intensity - a.intensity);
}

/*
    If some ingredients do not yet have a succession block, you can infer a rough one from growth so the system is still usable.
  */

export function inferSuccessionFromGrowth(g: Growth): SuccessionProfile {
  const isAnnual =
    g.lifeCycles?.includes("annual") || g.lifeCycles?.includes("self_seeding");
  const isCanopy =
    g.growthForms?.includes("canopy") || g.heightClasses?.includes("emergent");
  const wantsFullSun = g.lightPreferences?.includes("full_sun");
  const isUnderstory = g.growthForms?.includes("understory");
  const shadeLoving =
    g.lightPreferences?.includes("shade_loving") ||
    g.lightPreferences?.includes("shade_tolerant");

  // Extremely rough defaults, just to avoid nulls

  if (isAnnual || g.growthForms?.includes("herbaceous")) {
    return {
      successionalPhase: "pioneer",
      recommendedPlantYearFromStart: [0, 1],
      establishmentLight: wantsFullSun ? "full_sun" : "filtered_light",
      yearsToFirstHarvest: [0.3, 1.5],
      productiveLifespanYears: [0.5, 2],
      managementRotation: "short_rotation",
    };
  }

  if (isCanopy && wantsFullSun) {
    return {
      successionalPhase: "late",
      recommendedPlantYearFromStart: [2, 5],
      establishmentLight: "full_sun",
      yearsToFirstHarvest: [5, 10],
      productiveLifespanYears: [30, 60],
      managementRotation: "keep",
    };
  }

  if (isUnderstory || shadeLoving) {
    return {
      successionalPhase: "mid",
      recommendedPlantYearFromStart: [0.5, 3],
      establishmentLight: shadeLoving ? "deep_shade" : "filtered_light",
      yearsToFirstHarvest: [2, 5],
      productiveLifespanYears: [10, 30],
      managementRotation: "keep",
    };
  }

  // fallback
  return {
    successionalPhase: "early",
    recommendedPlantYearFromStart: [0, 2],
    establishmentLight: wantsFullSun ? "full_sun" : "filtered_light",
    yearsToFirstHarvest: [1, 3],
    productiveLifespanYears: [5, 20],
    managementRotation: "medium_rotation",
  };
}

// ---------- Vertical Layer Assignment ----------

/**
 * Assigns a vertical layer based on Growth properties.
 * Priority order:
 * 1. Explicit growthForms (most reliable)
 * 2. Height classes as fallback
 * 3. Default to herbaceous if unknown
 */
export function assignVerticalLayer(growth: Growth): VerticalLayer {
  const forms = growth.growthForms || [];
  const heights = growth.heightClasses || [];

  // Direct mapping from growthForms to vertical layers
  if (forms.includes("canopy")) return "canopy";
  if (forms.includes("midstory")) return "midstory";
  if (forms.includes("understory")) return "understory";
  if (forms.includes("climber")) return "climber";
  if (forms.includes("bushShrub")) return "shrub";
  if (forms.includes("groundcover")) return "groundcover";
  if (forms.includes("root")) return "root";
  if (forms.includes("herbaceous")) return "herbaceous";

  // Fallback to height classes if no growthForm
  if (heights.includes("emergent")) return "canopy";
  if (heights.includes("high")) return "midstory";
  if (heights.includes("medium")) return "shrub";
  if (heights.includes("low")) return "groundcover";

  // Default
  return "herbaceous";
}

/**
 * Determines if a plant needs relocation as shade increases.
 * Full sun plants in the lower layers will need to move to gaps.
 */
function needsRelocationAsShadeIncreases(
  layer: VerticalLayer,
  lightPrefs: LightPreferenceType[] | undefined,
): boolean {
  // Canopy and midstory trees don't need relocation - they ARE the shade
  if (layer === "canopy" || layer === "midstory") return false;

  // Climbers attached to structure stay in place
  if (layer === "climber") return false;

  // Root crops are underground and less affected
  if (layer === "root") return false;

  // Full sun plants in lower layers will struggle as canopy closes
  if (lightPrefs?.includes("full_sun")) {
    return ["understory", "shrub", "herbaceous", "groundcover"].includes(layer);
  }

  return false;
}

/**
 * Estimates when shade becomes problematic for a full-sun plant.
 * Based on when canopy closure reaches ~50%.
 */
function estimateRelocationYear(
  canopySpeciesCount: number,
  midstorySpeciesCount: number,
): number {
  // More canopy/midstory = faster shade buildup
  // Rough estimate: 3-7 years depending on tree density
  const treeDensity = canopySpeciesCount + midstorySpeciesCount * 0.5;
  if (treeDensity >= 3) return 3;
  if (treeDensity >= 2) return 4;
  if (treeDensity >= 1) return 5;
  return 7;
}

/**
 * Generates placement notes for a species based on its layer and light needs.
 */
function generatePlacementNotes(
  layer: VerticalLayer,
  lightPrefs: LightPreferenceType[] | undefined,
  ecologicalRole: string | undefined,
): string[] {
  const notes: string[] = [];

  // Layer-specific placement guidance
  switch (layer) {
    case "canopy":
      notes.push(
        "Place as structural anchor - will define final shade pattern",
      );
      if (lightPrefs?.includes("full_sun")) {
        notes.push("Position for maximum light exposure at maturity");
      }
      break;

    case "midstory":
      notes.push(
        "Position between canopy gaps or where partial shade will develop",
      );
      break;

    case "understory":
      notes.push("Place where canopy shade will eventually exist");
      if (
        lightPrefs?.includes("filtered_light") ||
        lightPrefs?.includes("shade_tolerant")
      ) {
        notes.push("Thrives under dappled canopy light");
      }
      break;

    case "shrub":
      notes.push("Position on edges or between young trees");
      if (lightPrefs?.includes("full_sun")) {
        notes.push("Keep on sunny edges as canopy develops");
      }
      break;

    case "herbaceous":
      if (ecologicalRole === "pioneer") {
        notes.push("Plant everywhere early for biomass and ground cover");
        notes.push("Shift to sunnier gaps as shade increases");
      } else {
        notes.push("Fill gaps between perennial plantings");
      }
      break;

    case "groundcover":
      notes.push("Spread beneath and between all other layers");
      if (
        lightPrefs?.includes("shade_tolerant") ||
        lightPrefs?.includes("shade_loving")
      ) {
        notes.push("Good for long-term soil protection under canopy");
      } else {
        notes.push("May need to transition to shade-tolerant species later");
      }
      break;

    case "climber":
      notes.push(
        "Attach to structures (trees, trellis) - must respect future shade",
      );
      if (lightPrefs?.includes("full_sun")) {
        notes.push("Position to climb toward light as canopy develops");
      }
      break;

    case "root":
      notes.push("Plant in gaps where cultivation is possible");
      notes.push("Harvest timing should avoid root competition with trees");
      break;
  }

  return notes;
}

/**
 * Builds layer placements for a set of ingredients.
 * This is the main function for Step 2: "Place by vertical layer and light needs"
 */
export function buildLayerPlacements(
  ingredients: Ingredient[],
  speciesCountConfig?: SpeciesCountConfig,
): LayerPlacement[] {
  const placements: LayerPlacement[] = [];

  // Count canopy/midstory for shade estimation
  const canopyCount = ingredients.reduce((total, ingredient) => {
    if (!ingredient.properties.growth?.growthForms?.includes("canopy")) {
      return total;
    }
    return total + getSpeciesInstanceCount(speciesCountConfig, ingredient.id);
  }, 0);
  const midstoryCount = ingredients.reduce((total, ingredient) => {
    if (!ingredient.properties.growth?.growthForms?.includes("midstory")) {
      return total;
    }
    return total + getSpeciesInstanceCount(speciesCountConfig, ingredient.id);
  }, 0);

  for (const ingredient of ingredients) {
    const growth = ingredient.properties.growth;
    const animal = ingredient.properties.animalIntegration;
    if (!growth && !animal) continue;

    const layer = growth ? assignVerticalLayer(growth) : animal!.layer;
    const succession =
      getSuccessionProfile(ingredient) ||
      (growth ? inferSuccessionFromGrowth(growth) : null);
    if (!succession) continue;

    // Calculate active years from succession data
    const plantYear = succession.recommendedPlantYearFromStart[0];
    const harvestStart = plantYear + succession.yearsToFirstHarvest[0];
    const harvestEnd = harvestStart + succession.productiveLifespanYears[0];

    const needsRelocation = needsRelocationAsShadeIncreases(
      layer,
      growth?.lightPreferences,
    );
    const relocationYear = needsRelocation
      ? estimateRelocationYear(canopyCount, midstoryCount)
      : undefined;

    const placementNotes = generatePlacementNotes(
      layer,
      growth?.lightPreferences,
      succession.successionalPhase,
    );

    placements.push({
      ingredient,
      layer,
      instanceCount: getSpeciesInstanceCount(speciesCountConfig, ingredient.id),
      activeYears: [plantYear, harvestEnd],
      needsRelocation,
      relocationYear,
      placementNotes,
    });
  }

  // Sort by vertical layer order (canopy first, root last)
  return placements.sort(
    (a, b) =>
      VERTICAL_LAYER_ORDER.indexOf(a.layer) -
      VERTICAL_LAYER_ORDER.indexOf(b.layer),
  );
}

/**
 * Groups layer placements by their vertical layer for display.
 */
export function groupPlacementsByLayer(
  placements: LayerPlacement[],
): Map<VerticalLayer, LayerPlacement[]> {
  const grouped = new Map<VerticalLayer, LayerPlacement[]>();

  for (const placement of placements) {
    if (!grouped.has(placement.layer)) {
      grouped.set(placement.layer, []);
    }
    grouped.get(placement.layer)!.push(placement);
  }

  return grouped;
}

// ---------- Shade Simulation (Canopy Closure Index) ----------

/**
 * Simulates canopy closure over time.
 * Returns a timeline of closure indices from year 0 to maxYear.
 *
 * The closure index represents how much of the sky is blocked:
 * - 0.0 = fully open (bare ground)
 * - 0.5 = partial shade (young orchard)
 * - 0.8 = mostly closed (mature food forest)
 * - 1.0 = fully closed canopy (rare in food forests due to management)
 *
 * This is a simple proxy, not a physics simulation.
 */
export function simulateCanopyClosure(
  placements: LayerPlacement[],
  maxYear: number = 20,
): CanopyClosure[] {
  const timeline: CanopyClosure[] = [];

  // Group by layer
  const canopyTrees = placements.filter((p) => p.layer === "canopy");
  const midstoryTrees = placements.filter((p) => p.layer === "midstory");
  const understoryTrees = placements.filter((p) => p.layer === "understory");

  for (let year = 0; year <= maxYear; year++) {
    // Count trees that are active (planted and productive) at this year
    const activeCanopy = canopyTrees.filter(
      (p) => year >= p.activeYears[0] && year <= p.activeYears[1],
    ).length;
    const activeMidstory = midstoryTrees.filter(
      (p) => year >= p.activeYears[0] && year <= p.activeYears[1],
    ).length;
    const activeUnderstory = understoryTrees.filter(
      (p) => year >= p.activeYears[0] && year <= p.activeYears[1],
    ).length;

    // Simple shade model:
    // Each canopy tree contributes ~15% closure at maturity
    // Each midstory tree contributes ~8% closure
    // Each understory tree contributes ~3% closure
    // Trees take ~5 years to reach significant shade contribution

    const canopyMaturityFactor = Math.min(1, year / 7);
    const midstoryMaturityFactor = Math.min(1, year / 5);
    const understoryMaturityFactor = Math.min(1, year / 3);

    const canopyContribution = activeCanopy * 0.15 * canopyMaturityFactor;
    const midstoryContribution = activeMidstory * 0.08 * midstoryMaturityFactor;
    const understoryContribution =
      activeUnderstory * 0.03 * understoryMaturityFactor;

    // Sum contributions, cap at 0.9 (never fully closed in managed system)
    const closureIndex = Math.min(
      0.9,
      canopyContribution + midstoryContribution + understoryContribution,
    );

    // Determine dominant layer
    let dominantLayer: VerticalLayer = "herbaceous";
    if (
      canopyContribution > midstoryContribution &&
      canopyContribution > understoryContribution
    ) {
      dominantLayer = "canopy";
    } else if (midstoryContribution > understoryContribution) {
      dominantLayer = "midstory";
    } else if (understoryContribution > 0) {
      dominantLayer = "understory";
    }

    timeline.push({
      year,
      closureIndex,
      dominantLayer,
    });
  }

  return timeline;
}

/**
 * Returns shade status description for a given closure index.
 */
export function describeShadeLevel(closureIndex: number): string {
  if (closureIndex < 0.2) return "Full sun";
  if (closureIndex < 0.4) return "Light shade";
  if (closureIndex < 0.6) return "Partial shade";
  if (closureIndex < 0.8) return "Mostly shaded";
  return "Deep shade";
}

/**
 * Checks if a plant's light preferences are compatible with a given shade level.
 * Returns true if the plant can thrive, false if it will struggle.
 */
export function isLightCompatible(
  lightPrefs: LightPreferenceType[] | undefined,
  closureIndex: number,
): boolean {
  if (!lightPrefs || lightPrefs.length === 0) return true;

  // Full sun plants struggle above 50% closure
  if (lightPrefs.includes("full_sun") && closureIndex > 0.5) return false;

  // Filtered light plants are fine between 20-70%
  if (lightPrefs.includes("filtered_light")) return true;

  // Shade tolerant plants are fine above 30%
  if (lightPrefs.includes("shade_tolerant") && closureIndex >= 0.3) return true;

  // Shade loving plants prefer above 50%
  if (lightPrefs.includes("shade_loving") && closureIndex < 0.5) return false;

  return true;
}

// ---------- Time-based Dominance Chart ----------

/**
 * Simplified display layers for the dominance chart.
 * Consolidates 8 vertical layers into 4 for cleaner visualization.
 */
export type DisplayLayer =
  | "canopy"
  | "understory"
  | "herbShrub"
  | "groundcover";

export const DISPLAY_LAYER_ORDER: DisplayLayer[] = [
  "canopy",
  "understory",
  "herbShrub",
  "groundcover",
];

export const DISPLAY_LAYER_LABELS: Record<DisplayLayer, string> = {
  canopy: "Canopy",
  understory: "Understory",
  herbShrub: "Herb & Shrub",
  groundcover: "Groundcover",
};

export const DISPLAY_LAYER_COLORS: Record<DisplayLayer, string> = {
  canopy: "#166534", // dark green
  understory: "#22c55e", // green
  herbShrub: "#84cc16", // lime
  groundcover: "#bef264", // pale lime
};

/**
 * Time phases for succession visualization.
 */
export type SuccessionPhaseLabel = "establishment" | "transition" | "maturity";

export const SUCCESSION_PHASES: {
  id: SuccessionPhaseLabel;
  label: string;
  yearRange: [number, number];
}[] = [
  { id: "establishment", label: "Establishment", yearRange: [0, 2] },
  { id: "transition", label: "Transition", yearRange: [3, 7] },
  { id: "maturity", label: "Maturity", yearRange: [8, 20] },
];

/**
 * Maps the 8 vertical layers to 4 display layers.
 */
function mapToDisplayLayer(layer: VerticalLayer): DisplayLayer {
  switch (layer) {
    case "canopy":
    case "midstory":
      return "canopy";
    case "understory":
      return "understory";
    case "shrub":
    case "herbaceous":
      return "herbShrub";
    case "groundcover":
    case "root":
    case "climber":
      return "groundcover";
    default:
      return "herbShrub";
  }
}

/**
 * Species contribution to a layer at a specific phase.
 */
export interface SpeciesContribution {
  ingredient: Ingredient;
  intensity: number;
  instanceCount?: number;
}

/**
 * Dominance data for one layer at one phase.
 */
export interface LayerPhaseDominance {
  layer: DisplayLayer;
  phase: SuccessionPhaseLabel;
  dominance: number; // 0-1 normalized dominance
  rawDominance: number; // sum of intensities
  species: SpeciesContribution[];
}

/**
 * HOW PRODUCTIVE IS A PLANT AT A GIVEN YEAR?
 *
 * Think of a plant's life like a story with 5 chapters:
 *
 * 1. BEFORE PLANTING (intensity = 0)
 *    The plant doesn't exist yet. Nothing happening.
 *
 * 2. ESTABLISHMENT (intensity ramps 0 → 0.3)
 *    The plant is young and growing. Like a teenager learning their craft.
 *    It's there but not really producing much yet.
 *
 * 3. RAMP UP (intensity 0.3 → 1.0)
 *    The plant starts producing! First fruits appear.
 *    Quickly gets up to full speed in the first 10% of its harvest period.
 *
 * 4. PEAK PRODUCTIVITY (intensity = 1.0)
 *    The plant is in its prime - full production mode.
 *    This lasts for most of its productive life (80% of harvest period).
 *
 * 5. DECLINE + FADE (intensity 1.0 → 0.15 → 0)
 *    The plant is getting old. Production tapers off (quadratic, coeff 0.85).
 *    After harvestEnd, fades over 2 years (quadratic ease-out from 0.15).
 *
 * This curve MUST be continuous (no jumps between phases) because the 3D
 * renderers derive `lifeScale = pow(intensity, 0.4)` directly from it to
 * smoothly scale plants up during growth and back down during death.
 * See VolumeRenderer.tsx and InstancedVolumeGroup.tsx.
 *
 * TUNING CONSTANTS:
 *   - Decline coeff (0.85): how much intensity drops during last 10% of harvest.
 *     Higher = drops further. At 0.85, reaches 0.15 at harvestEnd.
 *   - Fade window (2 years): how long the post-harvest fade lasts.
 *   - Fade start (0.15): must match 1.0 - declineCoeff for continuity.
 *
 * Returns a number from 0 to 1 representing how "active" the plant is.
 */
export function getSpeciesIntensityAtYear(
  plantYear: number,
  harvestStart: number,
  harvestEnd: number,
  year: number,
): number {
  // Chapter 1: Before planting - nothing exists yet
  if (year < plantYear) return 0;

  // Chapter 2: Establishment - young plant growing, not yet producing
  if (year >= plantYear && year < harvestStart) {
    const progress =
      (year - plantYear) / Math.max(harvestStart - plantYear, 0.1);
    // Slow start (squared curve), maxes out at 0.3 when harvest begins
    return progress * progress * 0.3;
  }

  // Chapter 3: Ramp up - first harvests, quickly reaching full production
  const harvestDuration = harvestEnd - harvestStart;
  const fullProductivityStart = harvestStart + harvestDuration * 0.1;

  if (year >= harvestStart && year < fullProductivityStart) {
    const progress =
      (year - harvestStart) /
      Math.max(fullProductivityStart - harvestStart, 0.1);
    return 0.3 + progress * 0.7; // Goes from 0.3 to 1.0
  }

  // Chapter 4: Peak productivity - the golden years
  const declineStart = harvestStart + harvestDuration * 0.9;
  if (year >= fullProductivityStart && year < declineStart) {
    return 1.0; // Full production!
  }

  // Chapter 5a: Decline - production tapering off (last 10% of harvest window)
  // ENABLE_LIFECYCLE_SCALE:  coeff 0.85, drops to 0.15 (extended fade follows)
  // Classic:                 coeff 0.7,  drops to 0.3  (short 1-year fade follows)
  const declineCoeff = ENABLE_LIFECYCLE_SCALE ? 0.85 : 0.7;
  if (year >= declineStart && year <= harvestEnd) {
    const progress =
      (year - declineStart) / Math.max(harvestEnd - declineStart, 0.1);
    return 1.0 - progress * progress * declineCoeff;
  }

  // Chapter 5b: Fade out - post-harvest wind-down
  // ENABLE_LIFECYCLE_SCALE:  2 years from 0.15, quadratic ease-out (smooth scale-down)
  // Classic:                 1 year  from 0.3,  linear fade (instant disappear at end)
  if (year > harvestEnd) {
    const fadeStart = 1.0 - declineCoeff; // 0.15 or 0.3 — matches decline end
    const fadeWindow = ENABLE_LIFECYCLE_SCALE ? 2 : 1;
    const fadeTime = Math.min((year - harvestEnd) / fadeWindow, 1);
    if (ENABLE_LIFECYCLE_SCALE) {
      return Math.max(0, fadeStart * (1 - fadeTime * fadeTime));
    }
    return Math.max(0, fadeStart * (1 - fadeTime));
  }

  return 0;
}

/**
 * WHAT'S THE AVERAGE PRODUCTIVITY OVER A TIME PERIOD?
 *
 * Instead of asking "how productive is this plant in year 5?",
 * this asks "how productive is this plant on average from year 3 to 7?"
 *
 * It samples multiple points across the time range and averages them.
 * Like checking in on a plant 6 times over several years and averaging
 * how well it was doing each time you visited.
 *
 * This is useful for the dominance chart where we want to know
 * "who's doing the work during the Establishment phase (years 0-2)?"
 */
function getAverageIntensityForRange(
  plantYear: number,
  harvestStart: number,
  harvestEnd: number,
  yearRange: [number, number],
): number {
  const [startYear, endYear] = yearRange;
  const samples = 5; // Check 6 points across the range (0, 1, 2, 3, 4, 5)
  let totalIntensity = 0;

  for (let i = 0; i <= samples; i++) {
    const year = startYear + (endYear - startYear) * (i / samples);
    totalIntensity += getSpeciesIntensityAtYear(
      plantYear,
      harvestStart,
      harvestEnd,
      year,
    );
  }

  return totalIntensity / (samples + 1);
}

/**
 * Layer Dominance - Plain English Explanation:
 *
 * In a natural food forest, sun-loving plants (like Banana) eventually get
 * shaded out as the canopy trees (like Durian) grow tall and close overhead.
 * The sun-lovers fade and die because they can't get enough light.
 *
 * In a manually managed food forest, the gardener can keep sun-lovers productive by:
 * 1. Planting them on forest edges where they still get sunlight
 * 2. Pruning the canopy trees to let light through
 *
 * When managedLight=true:
 * - Sun-lover lifespans extend
 * - Their productivity is cappped (edges/pruning aren't ideal conditions)
 * - The narrative changes to reflect human stewardship rather than natural succession
 *
 * ---
 *
 * Computes layer dominance by phase for the dominance chart.
 *
 * @param placements - Layer placements from buildLayerPlacements()
 * @param managedLight - When true, sun-loving plants stay productive longer
 *                        via edge planting or canopy pruning (capped at 75%)
 * @returns Array of LayerPhaseDominance for each layer/phase combination
 */
export function computeLayerDominanceByPhase(
  placements: LayerPlacement[],
  managedLight: boolean = false,
): LayerPhaseDominance[] {
  const results: LayerPhaseDominance[] = [];

  // Track max raw dominance for normalization
  let maxRawDominance = 0;

  // First pass: compute raw dominance values
  const rawResults: {
    layer: DisplayLayer;
    phase: SuccessionPhaseLabel;
    rawDominance: number;
    species: SpeciesContribution[];
  }[] = [];

  for (const displayLayer of DISPLAY_LAYER_ORDER) {
    // Get all placements for this display layer
    const layerPlacements = placements.filter(
      (p) => mapToDisplayLayer(p.layer) === displayLayer,
    );

    for (const phase of SUCCESSION_PHASES) {
      const speciesContributions: SpeciesContribution[] = [];
      let totalIntensity = 0;

      for (const placement of layerPlacements) {
        const succession =
          placement.ingredient.properties.succession ||
          (placement.ingredient.properties.growth
            ? inferSuccessionFromGrowth(placement.ingredient.properties.growth)
            : null);

        if (!succession) continue;

        const plantYear = succession.recommendedPlantYearFromStart[0];
        const harvestStart = plantYear + succession.yearsToFirstHarvest[0];
        let harvestEnd = harvestStart + succession.productiveLifespanYears[0];

        // In managed-light mode, extend sun-lovers' productive lifespan
        // when edge planting or canopy pruning keeps them productive.
        const isSunLoverManagedMode = managedLight && placement.needsRelocation;

        if (isSunLoverManagedMode) {
          // Extend productive lifespan to 20+ years (edge conditions persist)
          harvestEnd = Math.max(harvestEnd, 25);
        }

        let intensity = getAverageIntensityForRange(
          plantYear,
          harvestStart,
          harvestEnd,
          phase.yearRange,
        );

        // Cap intensity for managed sun-lovers (edges/pruning aren't ideal conditions)
        if (isSunLoverManagedMode && intensity > 0.75) {
          intensity = 0.75;
        }

        if (intensity > 0.01) {
          const instanceCount = placement.instanceCount ?? 1;
          speciesContributions.push({
            ingredient: placement.ingredient,
            intensity,
            instanceCount,
          });
          totalIntensity += intensity * instanceCount;
        }
      }

      // Sort species by weighted contribution descending
      speciesContributions.sort(
        (a, b) =>
          b.intensity * (b.instanceCount ?? 1) -
          a.intensity * (a.instanceCount ?? 1),
      );

      rawResults.push({
        layer: displayLayer,
        phase: phase.id,
        rawDominance: totalIntensity,
        species: speciesContributions,
      });

      if (totalIntensity > maxRawDominance) {
        maxRawDominance = totalIntensity;
      }
    }
  }

  // Second pass: normalize dominance values
  for (const raw of rawResults) {
    results.push({
      layer: raw.layer,
      phase: raw.phase,
      dominance: maxRawDominance > 0 ? raw.rawDominance / maxRawDominance : 0,
      rawDominance: raw.rawDominance,
      species: raw.species,
    });
  }

  return results;
}

// ---------- Dynamic Narrative Generator ----------

/**
 * Narrative data for a single phase.
 */
export interface PhaseNarrative {
  phase: SuccessionPhaseLabel;
  phaseLabel: string;
  sentences: string[];
}

/**
 * Tracks species intensity across phases for detecting rising/fading.
 */
interface SpeciesPhaseTracker {
  id: string;
  name: string;
  layer: DisplayLayer;
  intensities: Record<SuccessionPhaseLabel, number>;
}

/**
 * Capitalizes the first letter of a string.
 */
function capitalizeFirst(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Joins a list of names naturally with commas and "and".
 * Capitalizes the first name since it starts a sentence.
 */
function joinNames(names: string[]): string {
  if (names.length === 0) return "";
  if (names.length === 1) return capitalizeFirst(names[0]);
  if (names.length === 2) return `${capitalizeFirst(names[0])} and ${names[1]}`;
  return `${capitalizeFirst(names[0])}, ${names.slice(1, -1).join(", ")}, and ${names[names.length - 1]}`;
}

/**
 * Generates a dynamic narrative based on the dominance data.
 * Describes who's doing the work, who's rising, who's fading at each phase.
 * Optionally incorporates narrative findings to surface missing turnover in the narrative.
 *
 * @param dominanceData - Layer dominance data from computeLayerDominanceByPhase
 * @param placements - Layer placements from buildLayerPlacements
 * @param managedLight - Whether canopy is managed
 * @param enableCanopyLayerNarrative - Whether filtered sun layering is enabled
 * @param ingredientCount - Number of ingredients (affects terminology: "forest" vs "planting")
 * @param narrativeFindings - Optional narrative findings to weave into narrative
 * @param separateSoil - Whether plants are in separate soil volumes
 */
// ---------- Dynamic Timeline Duration ----------

/**
 * Compute the maximum year needed to show all ingredient lifecycles.
 * Returns the highest harvestEndYear across all segments, rounded appropriately.
 * - For short lifecycles (<= 2 years): rounds to nearest 1 year
 * - For medium lifecycles (<= 10 years): rounds to nearest 2 years
 * - For long lifecycles (> 10 years): rounds to nearest 5 years
 * Minimum of 1 year to ensure a usable timeline.
 */
export function computeTimelineDuration(
  segments: SpeciesLifetimeSegment[],
  minYears: number = 1,
): number {
  if (segments.length === 0) return Math.max(minYears, 5); // Default to 5 for empty
  const maxEndYear = Math.max(...segments.map((s) => s.harvestEndYear));

  // Smart rounding based on timeline length
  let rounded: number;
  if (maxEndYear <= 2) {
    // Short lifecycles: round up to nearest 1
    rounded = Math.ceil(maxEndYear);
  } else if (maxEndYear <= 10) {
    // Medium lifecycles: round up to nearest 2
    rounded = Math.ceil(maxEndYear / 2) * 2;
  } else {
    // Long lifecycles: round up to nearest 5
    rounded = Math.ceil(maxEndYear / 5) * 5;
  }

  return Math.max(minYears, rounded);
}

/**
 * Compute the shortest ingredient lifecycle (for smart zoom options).
 * Returns the duration of the shortest-lived ingredient (excluding respawn cycles).
 */
export function computeShortestLifecycle(
  segments: SpeciesLifetimeSegment[],
): number {
  if (segments.length === 0) return 5;
  // Group by ingredient to get per-species lifecycle (not per-respawn-cycle)
  const byIngredient = new Map<string, number>();
  for (const seg of segments) {
    if (seg.respawnCycle === 0) {
      const duration = seg.harvestEndYear - seg.plantYear;
      byIngredient.set(seg.ingredient.id, duration);
    }
  }
  if (byIngredient.size === 0) return 5;
  return Math.min(...byIngredient.values());
}

export interface DurationOption {
  label: string;
  value: number;
}

/**
 * Generate smart duration options based on ingredient lifecycles.
 * Shows contextual zoom options based on what makes sense for the forest composition.
 *
 * Strategy:
 * - Always show 1 year option if any ingredient has lifecycle <= 2 years (annuals)
 * - Always show 5, 10, 20 year options when full duration exceeds them
 * - Always show Full as the last option
 */
export function computeDurationOptions(
  segments: SpeciesLifetimeSegment[],
): DurationOption[] {
  const fullDuration = computeTimelineDuration(segments);
  const shortestLifecycle = computeShortestLifecycle(segments);

  const options: DurationOption[] = [];

  // Add 1 year option only if there's a short-lived species (annuals)
  // This allows detailed view of quick-cycling plants
  if (shortestLifecycle <= 2) {
    options.push({ label: "1 year", value: 1 });
  }

  // Add standard zoom levels when full duration exceeds them
  // These are useful for seeing establishment phases of any forest
  if (fullDuration > 5) {
    options.push({ label: "5 years", value: 5 });
  }
  if (fullDuration > 10) {
    options.push({ label: "10 years", value: 10 });
  }
  if (fullDuration > 20) {
    options.push({ label: "20 years", value: 20 });
  }

  // Always add full duration as the last option
  options.push({ label: `Full (${fullDuration} yrs)`, value: fullDuration });

  return options;
}

/**
 * Compute dynamic phase positions based on selected duration.
 * Returns positions as fractions of the timeline (0-1).
 * Formula: Establishment ~10%, Transition ~30%, Maturity ~60%
 */
export function computePhasePositions(duration: number): {
  establishment: { start: number; end: number };
  transition: { start: number; end: number };
  maturity: { start: number; end: number };
} {
  // For very short timelines (1 year), use different proportions
  if (duration <= 1) {
    return {
      establishment: { start: 0, end: 0.2 },
      transition: { start: 0.2, end: 0.5 },
      maturity: { start: 0.5, end: 1 },
    };
  }

  // For short timelines (up to 5 years), scale proportionally
  if (duration <= 5) {
    return {
      establishment: { start: 0, end: 0.2 },
      transition: { start: 0.2, end: 0.5 },
      maturity: { start: 0.5, end: 1 },
    };
  }

  // For medium timelines (up to 20 years), use standard food forest phases
  if (duration <= 20) {
    return {
      establishment: { start: 0, end: 2 / duration },
      transition: { start: 2 / duration, end: 7 / duration },
      maturity: { start: 7 / duration, end: 1 },
    };
  }

  // For long timelines (50+ years), scale phases proportionally
  // Establishment: ~10%, Transition: ~20%, Maturity: ~70%
  const establishmentEnd = Math.max(0.1, 5 / duration);
  const transitionEnd = Math.max(0.3, 15 / duration);

  return {
    establishment: { start: 0, end: establishmentEnd },
    transition: { start: establishmentEnd, end: transitionEnd },
    maturity: { start: transitionEnd, end: 1 },
  };
}

export function generateSuccessionNarrative(
  dominanceData: LayerPhaseDominance[],
  placements: LayerPlacement[] = [],
  managedLight: boolean = false,
  enableCanopyLayerNarrative: boolean = false,
  ingredientCount: number = 2,
  narrativeFindings: NarrativeFinding[] = [],
  separateSoil: boolean = false,
): PhaseNarrative[] {
  // Use "forest" terminology only when multiple ingredients
  const systemLabel = ingredientCount > 1 ? "forest" : "planting";
  const isSingle = ingredientCount === 1;

  // Group narrative findings by category for easy lookup
  const hasFinding = (id: string) => narrativeFindings.some((f) => f.id === id);
  const getCriticalFindings = () =>
    narrativeFindings.filter((f) => f.severity === "critical");
  const getWarningFindings = () =>
    narrativeFindings.filter((f) => f.severity === "warning");
  // Build a map of species that need relocation (sun-lovers)
  const sunLovers = new Set(
    placements.filter((p) => p.needsRelocation).map((p) => p.ingredient.id),
  );

  // Check if there are actual canopy-forming trees that would cause shade
  const hasCanopyTrees = placements.some(
    (p) => p.layer === "canopy" || p.layer === "midstory",
  );

  // Detect complementary light pairings when layered light is enabled
  const lightComplementaryPairs: Array<{
    provider: string;
    receiver: string;
  }> = [];

  if (enableCanopyLayerNarrative && placements.length >= 2) {
    // Simple detection: canopy plants providing for understory plants
    const canopyPlants = placements.filter((p) =>
      p.ingredient.properties.growth?.growthForms?.includes("canopy"),
    );
    const understoryPlants = placements.filter(
      (p) =>
        p.ingredient.properties.growth?.growthForms?.includes("understory") ||
        p.ingredient.properties.growth?.growthForms?.includes("midstory"),
    );

    for (const canopy of canopyPlants) {
      for (const understory of understoryPlants) {
        // Check if canopy provides light for understory
        const canopyLight =
          canopy.ingredient.properties.growth?.lightPreferences?.[0];
        const understoryLight =
          understory.ingredient.properties.growth?.lightPreferences?.[0];

        // full_sun canopy creates filtered_light for understory
        if (
          canopyLight === "full_sun" &&
          (understoryLight === "filtered_light" ||
            understoryLight === "partial_sun")
        ) {
          lightComplementaryPairs.push({
            provider: formatIngredientIdForDisplay(canopy.ingredient.id),
            receiver: formatIngredientIdForDisplay(understory.ingredient.id),
          });
        }
      }
    }
  }

  // Build a tracker for each species across phases
  const speciesTrackers = new Map<string, SpeciesPhaseTracker>();

  for (const data of dominanceData) {
    for (const sp of data.species) {
      const id = sp.ingredient.id;
      if (!speciesTrackers.has(id)) {
        speciesTrackers.set(id, {
          id,
          name: formatIngredientIdForDisplay(id),
          layer: data.layer,
          intensities: {
            establishment: 0,
            transition: 0,
            maturity: 0,
          },
        });
      }
      speciesTrackers.get(id)!.intensities[data.phase] = sp.intensity;
    }
  }

  const trackers = Array.from(speciesTrackers.values());
  const narratives: PhaseNarrative[] = [];

  // Generate narrative for each phase
  for (const phase of SUCCESSION_PHASES) {
    const sentences: string[] = [];

    // Get species active in this phase
    const activeInPhase = trackers.filter((t) => t.intensities[phase.id] > 0.1);

    // Categorize species by their role in this phase
    const dominant = activeInPhase
      .filter((t) => t.intensities[phase.id] > 0.7)
      .sort((a, b) => b.intensities[phase.id] - a.intensities[phase.id]);

    const establishing = activeInPhase
      .filter(
        (t) =>
          t.intensities[phase.id] > 0.1 &&
          t.intensities[phase.id] <= 0.4 &&
          (phase.id === "establishment" ||
            t.intensities[phase.id] >
              (t.intensities[
                phase.id === "transition" ? "establishment" : "transition"
              ] || 0)),
      )
      .sort((a, b) => b.intensities[phase.id] - a.intensities[phase.id]);

    // Detect rising species (intensity increasing from previous phase)
    const rising =
      phase.id !== "establishment"
        ? activeInPhase
            .filter((t) => {
              const prevPhase =
                phase.id === "transition" ? "establishment" : "transition";
              const prevIntensity = t.intensities[prevPhase] || 0;
              const currIntensity = t.intensities[phase.id];
              return currIntensity > prevIntensity + 0.2 && currIntensity > 0.4;
            })
            .sort((a, b) => b.intensities[phase.id] - a.intensities[phase.id])
        : [];

    // Detect fading species (intensity decreasing significantly)
    const fading =
      phase.id !== "establishment"
        ? trackers
            .filter((t) => {
              const prevPhase =
                phase.id === "transition" ? "establishment" : "transition";
              const prevIntensity = t.intensities[prevPhase] || 0;
              const currIntensity = t.intensities[phase.id];
              return prevIntensity > 0.4 && currIntensity < prevIntensity - 0.3;
            })
            .sort(
              (a, b) =>
                b.intensities[
                  phase.id === "transition" ? "establishment" : "transition"
                ] -
                a.intensities[
                  phase.id === "transition" ? "establishment" : "transition"
                ],
            )
        : [];

    // Build sentences based on phase
    if (phase.id === "establishment") {
      // Establishment phase: focus on who's dominant and who's establishing
      if (dominant.length > 0) {
        const dominantNames = dominant.slice(0, 3).map((t) => t.name);
        const canopyDominant = dominant.filter((t) => t.layer === "canopy");
        const groundDominant = dominant.filter(
          (t) => t.layer === "groundcover" || t.layer === "herbShrub",
        );

        if (canopyDominant.length > 0 && groundDominant.length > 0) {
          sentences.push(
            `${joinNames(groundDominant.map((t) => t.name))} ${groundDominant.length === 1 ? "spreads" : "spread"} across the ground while ${joinNames(canopyDominant.map((t) => t.name))} ${canopyDominant.length === 1 ? "builds" : "build"} early structure.`,
          );
        } else if (dominantNames.length > 0) {
          sentences.push(
            `${joinNames(dominantNames)} ${dominantNames.length === 1 ? "dominates" : "dominate"} the early stage, building fertility and structure.`,
          );
        }
      }

      if (establishing.length > 0) {
        const estNames = establishing.slice(0, 3).map((t) => t.name);
        sentences.push(
          `${joinNames(estNames)} ${estNames.length === 1 ? "establishes" : "establish"} quietly beneath.`,
        );
      }

      // Add narrative-aware sentences for establishment phase
      if (hasFinding("fertility-no-nitrogen")) {
        sentences.push("The system lacks nitrogen cycling species.");
      }
      if (hasFinding("structure-no-groundcover")) {
        sentences.push("Exposed soil awaits groundcover protection.");
      }

      // Add separate soil narrative for establishment phase
      if (separateSoil && ingredientCount > 1) {
        sentences.push(
          "Separate beds allow each plant to establish without root competition.",
        );
      }

      // Fallback for establishment: always generate a sentence
      if (sentences.length === 0) {
        if (trackers.length > 0) {
          // Species exist but have low intensity (late-maturing trees just planted)
          const allSpeciesNames = trackers.slice(0, 3).map((t) => t.name);
          sentences.push(
            `${joinNames(allSpeciesNames)} ${allSpeciesNames.length === 1 ? "establishes its roots" : "establish their roots"} as the ${systemLabel} takes shape.`,
          );
        } else {
          sentences.push("The land awaits its first plantings.");
        }
      }
    } else if (phase.id === "transition") {
      // Transition phase: focus on who's fading and who's rising
      if (fading.length > 0) {
        // Separate sun-lovers from regular fading plants
        const fadingSunLovers = fading.filter((t) => sunLovers.has(t.id));
        const fadingRegular = fading.filter((t) => !sunLovers.has(t.id));

        if (managedLight && fadingSunLovers.length > 0) {
          // In managed mode, sun-lovers continue on edges
          const sunLoverNames = fadingSunLovers.slice(0, 2).map((t) => t.name);
          sentences.push(
            `Edge planting and canopy management keep light-hungry species productive. ${joinNames(sunLoverNames)} ${sunLoverNames.length === 1 ? "continues" : "continue"} on edges and in managed light gaps.`,
          );
        } else if (fadingSunLovers.length > 0 && !managedLight) {
          // Normal Mode - sun-lovers fade
          const sunLoverNames = fadingSunLovers.slice(0, 2).map((t) => t.name);
          if (hasCanopyTrees) {
            // There are canopy trees that will shade out the sun-lovers
            sentences.push(
              `${joinNames(sunLoverNames)} ${sunLoverNames.length === 1 ? "fades" : "fade"} as canopy closes.`,
            );
          } else {
            // No canopy trees - sun-lovers fade naturally (short-lived)
            sentences.push(
              `${joinNames(sunLoverNames)} ${sunLoverNames.length === 1 ? "completes its cycle" : "complete their cycles"}.`,
            );
          }
        }

        if (fadingRegular.length > 0) {
          const regularNames = fadingRegular.slice(0, 2).map((t) => t.name);
          sentences.push(
            `${joinNames(regularNames)} ${regularNames.length === 1 ? "fades" : "fade"} after ${regularNames.length === 1 ? "its" : "their"} work is done.`,
          );
        }
      }

      // Add layered light narrative in transition phase
      if (enableCanopyLayerNarrative && lightComplementaryPairs.length > 0) {
        const pair = lightComplementaryPairs[0];
        sentences.push(
          `The forest's layered structure filters sunlight down through the canopy. ${capitalizeFirst(pair.provider)} provides filtered light for ${pair.receiver} beneath.`,
        );
      } else if (enableCanopyLayerNarrative && hasCanopyTrees) {
        // Layered light enabled but no complementary pairs detected yet
        sentences.push(
          "The forest's layered structure begins to filter sunlight through the developing canopy.",
        );
      }

      if (rising.length > 0) {
        const risingNames = rising.slice(0, 2).map((t) => t.name);
        const risingUnderstory = rising.filter((t) => t.layer === "understory");
        const risingCanopy = rising.filter((t) => t.layer === "canopy");

        if (risingUnderstory.length > 0) {
          sentences.push(
            `${joinNames(risingUnderstory.map((t) => t.name))} ${risingUnderstory.length === 1 ? "rises" : "rise"} into filtered light.`,
          );
        }
        if (risingCanopy.length > 0) {
          sentences.push(
            `${joinNames(risingCanopy.map((t) => t.name))} ${risingCanopy.length === 1 ? "grows" : "grow"} steadily toward the canopy.`,
          );
        }
        if (risingUnderstory.length === 0 && risingCanopy.length === 0) {
          sentences.push(
            `${joinNames(risingNames)} ${risingNames.length === 1 ? "gains" : "gain"} strength.`,
          );
        }
      }

      // Add narrative-aware sentences for transition phase
      if (hasFinding("cashflow-years-0-3")) {
        sentences.push("Early cashflow remains a gap during establishment.");
      }
      if (hasFinding("microclimate-no-early-shade")) {
        sentences.push(
          "Young transplants face harsh conditions without pioneer shade.",
        );
      }

      // Add separate soil narrative for transition phase
      if (separateSoil && ingredientCount > 1) {
        sentences.push(
          "Separated soil volumes prevent underground competition as plants mature.",
        );
      }

      if (sentences.length === 0 && activeInPhase.length > 0) {
        sentences.push(
          isSingle
            ? "The planting transitions through its phases."
            : "The forest transitions as pioneers give way.",
        );
      }

      // Unconditional fallback: ensure Transition phase always has content
      if (sentences.length === 0) {
        sentences.push(
          isSingle
            ? "The planting continues its quiet transition."
            : "The forest continues its quiet transition.",
        );
      }
    } else {
      // Maturity phase: focus on the stable state
      const canopyMature = dominant.filter((t) => t.layer === "canopy");
      const understoryMature = dominant.filter((t) => t.layer === "understory");
      const groundMature = activeInPhase.filter(
        (t) =>
          (t.layer === "groundcover" || t.layer === "herbShrub") &&
          t.intensities[phase.id] > 0.3,
      );

      if (canopyMature.length > 0) {
        sentences.push(
          `${joinNames(canopyMature.map((t) => t.name))} ${canopyMature.length === 1 ? "defines" : "define"} the canopy.`,
        );
      }

      if (understoryMature.length > 0) {
        sentences.push(
          `${joinNames(understoryMature.map((t) => t.name))} ${understoryMature.length === 1 ? "thrives" : "thrive"} in the understory beneath.`,
        );
      }

      // Layered Light narrative for maturity phase
      if (
        enableCanopyLayerNarrative &&
        lightComplementaryPairs.length > 0 &&
        canopyMature.length > 0 &&
        understoryMature.length > 0
      ) {
        sentences.push(
          "The forest's layered structure filters sunlight down through the canopy. The vertical layers work in harmony, each receiving the light it needs.",
        );
      } else if (enableCanopyLayerNarrative && canopyMature.length > 0) {
        sentences.push(
          "The forest's layered structure filters sunlight, creating diverse light conditions throughout the vertical layers.",
        );
      }

      if (groundMature.length > 0) {
        // In managed mode, highlight sun-lovers that persist on edges
        const managedSunLovers = groundMature.filter(
          (t) => managedLight && sunLovers.has(t.id),
        );
        const regularGround = groundMature.filter(
          (t) => !managedLight || !sunLovers.has(t.id),
        );

        if (managedSunLovers.length > 0) {
          const sunLoverNames = managedSunLovers.slice(0, 2).map((t) => t.name);
          sentences.push(
            `Edge planting and canopy management keep light-hungry species productive. ${joinNames(sunLoverNames)} ${sunLoverNames.length === 1 ? "thrives" : "thrive"} on edges with canopy management.`,
          );
        }
        if (regularGround.length > 0) {
          const groundNames = regularGround.slice(0, 2).map((t) => t.name);
          sentences.push(
            `${joinNames(groundNames)} ${groundNames.length === 1 ? "persists" : "persist"} at ground level.`,
          );
        }
      }

      // Add narrative-aware sentences for maturity phase
      if (hasFinding("resilience-single-canopy")) {
        sentences.push("Canopy redundancy would strengthen resilience.");
      }
      if (getCriticalFindings().length > 0 && sentences.length === 0) {
        sentences.push(
          "Critical gaps remain that could limit long-term stability.",
        );
      } else if (getWarningFindings().length > 0 && sentences.length === 0) {
        sentences.push(
          "Some structural gaps could be addressed for greater resilience.",
        );
      }

      // Add separate soil narrative for maturity phase
      if (separateSoil && ingredientCount > 1) {
        sentences.push(
          "Separate beds keep root systems independent, allowing peaceful coexistence.",
        );
      }

      if (sentences.length > 0) {
        sentences.push(
          managedLight
            ? isSingle
              ? "The planting thrives with active stewardship."
              : "The forest thrives with active stewardship."
            : isSingle
              ? "The planting is established."
              : "The forest is calm.",
        );
      } else if (activeInPhase.length > 0) {
        sentences.push(
          isSingle
            ? "The planting reaches a stable state with little intervention needed."
            : "The forest reaches a stable state with little intervention needed.",
        );
      }

      // Unconditional fallback: ensure Maturity phase always has content
      if (sentences.length === 0) {
        sentences.push(
          isSingle
            ? "The planting matures into a stable system."
            : "The forest matures into a stable, self-sustaining system.",
        );
      }
    }

    narratives.push({
      phase: phase.id,
      phaseLabel: phase.label,
      sentences,
    });
  }

  return narratives;
}
