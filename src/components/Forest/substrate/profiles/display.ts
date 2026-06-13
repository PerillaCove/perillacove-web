import type {
  ElementId,
  IngredientIntegrationProfile,
  IntegrationProfileTransformation,
  IntegrationTransformationId,
} from "../types";
import { ELEMENT_IDS } from "../types";
import { ELEMENT_LABELS } from "../labels";
import { TRANSFORMATION_OUTPUTS } from "../transformations/constants";

export type IntegrationProfileDisplayMode = "potential" | "active";

export interface IntegrationProfileDisplayContext {
  mode?: IntegrationProfileDisplayMode;
  year?: number;
  intensity?: number;
}

export interface IntegrationTraitDisplay {
  token: string;
  label: string;
  summary: string;
  primaryElement: ElementId;
  relatedElements: ElementId[];
}

export interface CapacityDisplayValues {
  mode: IntegrationProfileDisplayMode;
  potential: number;
  active: number;
  display: number;
  intensity?: number;
}

export interface IntegrationTransformationDisplayRow {
  id: IntegrationTransformationId;
  label: string;
  definition: string;
  inputs: ElementId[];
  outputs: Partial<Record<ElementId, number>>;
  rate: number;
  requires: string[];
  persistence: "fast" | "medium" | "slow";
}

const TRAIT_DISPLAY_DEFINITIONS: Record<string, IntegrationTraitDisplay> = {
  full_sun: {
    token: "full_sun",
    label: "Full sun",
    summary:
      "Harnesses strong direct light and turns it into growth before it spills past the canopy.",
    primaryElement: "fire",
    relatedElements: [],
  },
  partial_sun: {
    token: "partial_sun",
    label: "Partial sun",
    summary:
      "Harnesses light arriving in pulses, with shade spacing the flow instead of shutting it down.",
    primaryElement: "fire",
    relatedElements: ["air"],
  },
  filtered_light: {
    token: "filtered_light",
    label: "Filtered light",
    summary:
      "Harnesses softened light after canopy structure has already shaped the flow.",
    primaryElement: "fire",
    relatedElements: ["air"],
  },
  shade_tolerant: {
    token: "shade_tolerant",
    label: "Shade tolerant",
    summary:
      "Keeps light turnover moving when taller structure has already caught the direct sun.",
    primaryElement: "fire",
    relatedElements: ["air"],
  },
  shade_loving: {
    token: "shade_loving",
    label: "Shade loving",
    summary:
      "Harnesses low-light niches where excess sun would become waste or stress.",
    primaryElement: "fire",
    relatedElements: ["air"],
  },
  hardy: {
    token: "hardy",
    label: "Hardy",
    summary:
      "Keeps fire turnover alive through deep cold and repeated freezing.",
    primaryElement: "fire",
    relatedElements: ["water"],
  },
  semi_hardy: {
    token: "semi_hardy",
    label: "Semi-hardy",
    summary:
      "Keeps fire turnover moving through light cold, while severe freezing can interrupt the loop.",
    primaryElement: "fire",
    relatedElements: ["water"],
  },
  frost_sensitive: {
    token: "frost_sensitive",
    label: "Frost sensitive",
    summary:
      "Harnesses warmth only when cold is buffered enough to keep living tissue in turnover.",
    primaryElement: "fire",
    relatedElements: ["water"],
  },
  frost_intolerant: {
    token: "frost_intolerant",
    label: "Frost intolerant",
    summary:
      "Harnesses a frost-free heat field; freezing turns the fire-water flow into damage.",
    primaryElement: "fire",
    relatedElements: ["water"],
  },
  warmth_window: {
    token: "warmth_window",
    label: "Warmth window",
    summary:
      "The temperature band where heat can be harnessed into growth cleanly.",
    primaryElement: "fire",
    relatedElements: ["air"],
  },
  sun_hours: {
    token: "sun_hours",
    label: "Sun hours",
    summary:
      "The daily duration of usable light the plant can keep turning over.",
    primaryElement: "fire",
    relatedElements: [],
  },
  cold_chill: {
    token: "cold_chill",
    label: "Cold and chill",
    summary:
      "The winter cold pattern that either resets growth cleanly or leaks fire out of the cycle.",
    primaryElement: "fire",
    relatedElements: ["water"],
  },
  low_water_pull: {
    token: "low_water_pull",
    label: "Low water pull",
    summary:
      "Harnesses a light water flow without becoming the main pump in the system.",
    primaryElement: "water",
    relatedElements: ["earth"],
  },
  medium_water_pull: {
    token: "medium_water_pull",
    label: "Medium water pull",
    summary:
      "Harnesses a steady water rhythm without exhausting the shared earth flow.",
    primaryElement: "water",
    relatedElements: ["earth"],
  },
  high_water_pull: {
    token: "high_water_pull",
    label: "High water pull",
    summary:
      "Harnesses a strong water current when the local field can keep feeding it.",
    primaryElement: "water",
    relatedElements: ["earth", "air"],
  },
  water_pull: {
    token: "water_pull",
    label: "Water pull",
    summary:
      "How strongly living tissue can draw water through the root zone into growth.",
    primaryElement: "water",
    relatedElements: ["earth"],
  },
  dry: {
    token: "dry",
    label: "Dry root zone",
    summary:
      "Harnesses earth that releases water quickly and keeps roots aerated.",
    primaryElement: "earth",
    relatedElements: ["water", "air"],
  },
  moist_well_drained: {
    token: "moist_well_drained",
    label: "Moist, well-drained",
    summary:
      "Harnesses earth that holds steady water while still leaving air in the pore space.",
    primaryElement: "earth",
    relatedElements: ["water", "air"],
  },
  water_edge: {
    token: "water_edge",
    label: "Water edge",
    summary:
      "Harnesses the edge where earth and water meet, with roots near persistent wetness.",
    primaryElement: "earth",
    relatedElements: ["water"],
  },
  deep_groundwater: {
    token: "deep_groundwater",
    label: "Deep groundwater",
    summary:
      "Reaches below the surface to connect earth structure with stored water.",
    primaryElement: "earth",
    relatedElements: ["water"],
  },
  standing_water: {
    token: "standing_water",
    label: "Standing water",
    summary:
      "Harnesses saturated earth where water is constant and air must still be accounted for.",
    primaryElement: "earth",
    relatedElements: ["water", "air"],
  },
  moisture_fit: {
    token: "moisture_fit",
    label: "Root-zone moisture",
    summary:
      "How well the current water-earth flow matches the plant's root-zone harnessing capacity.",
    primaryElement: "water",
    relatedElements: ["earth", "air"],
  },
  low_oxygen_sensitivity: {
    token: "low_oxygen_sensitivity",
    label: "Low oxygen sensitivity",
    summary:
      "Keeps turnover moving in tighter or wetter root zones where air is less available.",
    primaryElement: "earth",
    relatedElements: ["water", "air"],
  },
  medium_oxygen_sensitivity: {
    token: "medium_oxygen_sensitivity",
    label: "Medium oxygen sensitivity",
    summary:
      "Harnesses a balanced root zone where water and air both keep moving.",
    primaryElement: "earth",
    relatedElements: ["water", "air"],
  },
  high_oxygen_sensitivity: {
    token: "high_oxygen_sensitivity",
    label: "High oxygen sensitivity",
    summary:
      "Harnesses loose, breathable earth; waterlogging quickly turns water into waste.",
    primaryElement: "earth",
    relatedElements: ["water", "air"],
  },
  root_oxygen: {
    token: "root_oxygen",
    label: "Root oxygen",
    summary:
      "The air-water balance in the root zone that keeps wet earth from becoming stagnant.",
    primaryElement: "earth",
    relatedElements: ["water", "air"],
  },
  low_nutrient_pull: {
    token: "low_nutrient_pull",
    label: "Low nutrient pull",
    summary:
      "Harnesses a light fertility current and fits into leaner earth niches.",
    primaryElement: "earth",
    relatedElements: [],
  },
  medium_nutrient_pull: {
    token: "medium_nutrient_pull",
    label: "Medium nutrient pull",
    summary:
      "Harnesses a steady fertility current to keep growth turning cleanly.",
    primaryElement: "earth",
    relatedElements: ["water"],
  },
  high_nutrient_pull: {
    token: "high_nutrient_pull",
    label: "High nutrient pull",
    summary:
      "Harnesses rich fertility, while bare or hungry soil becomes a bottleneck.",
    primaryElement: "earth",
    relatedElements: ["water"],
  },
  fertility_pull: {
    token: "fertility_pull",
    label: "Fertility pull",
    summary:
      "How strongly roots can turn mineral and organic fertility into growth.",
    primaryElement: "earth",
    relatedElements: ["water"],
  },
  diffuse_forager: {
    token: "diffuse_forager",
    label: "Diffuse forager",
    summary:
      "Spreads fine roots broadly, touching many small pockets of fertility.",
    primaryElement: "earth",
    relatedElements: ["water"],
  },
  surface_spreader: {
    token: "surface_spreader",
    label: "Surface spreader",
    summary:
      "Works the top layer where litter, moisture, and new fertility arrive first.",
    primaryElement: "earth",
    relatedElements: ["water", "air"],
  },
  taproot_seeker: {
    token: "taproot_seeker",
    label: "Taproot seeker",
    summary:
      "Sends a deep root downward, linking surface growth to stored earth and water.",
    primaryElement: "earth",
    relatedElements: ["water"],
  },
  storage_bulker: {
    token: "storage_bulker",
    label: "Storage bulker",
    summary:
      "Turns earth capacity into swollen roots, bulbs, or tubers that hold reserves.",
    primaryElement: "earth",
    relatedElements: ["water"],
  },
  woody_structural: {
    token: "woody_structural",
    label: "Woody structural",
    summary:
      "Builds persistent root architecture that keeps holding and shaping earth over time.",
    primaryElement: "earth",
    relatedElements: ["air"],
  },
  very_shallow_root_depth: {
    token: "very_shallow_root_depth",
    label: "Very shallow roots",
    summary:
      "Lives near the surface, close to fresh litter, rain pulses, and drying air.",
    primaryElement: "earth",
    relatedElements: ["water", "air"],
  },
  shallow_root_depth: {
    token: "shallow_root_depth",
    label: "Shallow roots",
    summary:
      "Works the upper earth layer where moisture and fertility change quickly.",
    primaryElement: "earth",
    relatedElements: ["water", "air"],
  },
  medium_root_depth: {
    token: "medium_root_depth",
    label: "Medium roots",
    summary: "Bridges surface fertility with deeper stored moisture.",
    primaryElement: "earth",
    relatedElements: ["water"],
  },
  deep_root_depth: {
    token: "deep_root_depth",
    label: "Deep roots",
    summary:
      "Reaches into lower earth, helping the plant stay connected through dry spells.",
    primaryElement: "earth",
    relatedElements: ["water"],
  },
  very_deep_root_depth: {
    token: "very_deep_root_depth",
    label: "Very deep roots",
    summary:
      "Connects the plant to deep reserves and long-cycle earth turnover.",
    primaryElement: "earth",
    relatedElements: ["water"],
  },
  arid_air: {
    token: "arid_air",
    label: "Arid air",
    summary:
      "Harnesses air-water flow where moisture clears quickly from leaf surfaces.",
    primaryElement: "air",
    relatedElements: ["water"],
  },
  semi_arid_air: {
    token: "semi_arid_air",
    label: "Semi-arid air",
    summary: "Harnesses air that dries the system between moisture pulses.",
    primaryElement: "air",
    relatedElements: ["water"],
  },
  moderate_humidity: {
    token: "moderate_humidity",
    label: "Moderate humidity",
    summary:
      "Harnesses air carrying enough water to soften stress without becoming saturated.",
    primaryElement: "air",
    relatedElements: ["water"],
  },
  humid_air: {
    token: "humid_air",
    label: "Humid air",
    summary:
      "Harnesses air carrying water around leaves so growth does not dry out.",
    primaryElement: "air",
    relatedElements: ["water"],
  },
  saturated_air: {
    token: "saturated_air",
    label: "Saturated air",
    summary:
      "Harnesses air close to mist or cloud, where water stays wrapped around foliage.",
    primaryElement: "air",
    relatedElements: ["water"],
  },
  humidity_fit: {
    token: "humidity_fit",
    label: "Air-water humidity",
    summary:
      "How well the current air-water flow matches the plant's atmospheric harnessing capacity.",
    primaryElement: "air",
    relatedElements: ["water"],
  },
  wind_shelter: {
    token: "wind_shelter",
    label: "Wind shelter",
    summary:
      "How well moving air is shaped into exchange instead of stripping the system open.",
    primaryElement: "air",
    relatedElements: [],
  },
  transpiration_support: {
    token: "transpiration_support",
    label: "Transpired humidity",
    summary:
      "Water lifted through leaves into local air when light and water are already turning over.",
    primaryElement: "air",
    relatedElements: ["water", "fire"],
  },
  living_turnover: {
    token: "living_turnover",
    label: "Living turnover",
    summary:
      "Used flows returning as litter, roots, and fertility instead of leaving the loop.",
    primaryElement: "earth",
    relatedElements: ["water", "air"],
  },
  daylight_warmth: {
    token: "daylight_warmth",
    label: "Daylight warmth",
    summary:
      "Harnesses light and warmth as living energy rather than treating exposure as waste.",
    primaryElement: "fire",
    relatedElements: ["air"],
  },
  body_heat: {
    token: "body_heat",
    label: "Body heat",
    summary:
      "Turns fire flow into steady metabolism and a warm living body moving through the system.",
    primaryElement: "fire",
    relatedElements: ["air", "water"],
  },
  drinking_water: {
    token: "drinking_water",
    label: "Drinking water",
    summary:
      "Harnesses water directly through the animal body, keeping digestion and turnover active.",
    primaryElement: "water",
    relatedElements: ["earth"],
  },
  forage_intake: {
    token: "forage_intake",
    label: "Forage intake",
    summary:
      "Turns grass and low biomass into animal movement, milk potential, and manure return.",
    primaryElement: "earth",
    relatedElements: ["water", "fire"],
  },
  rumen_turnover: {
    token: "rumen_turnover",
    label: "Rumen turnover",
    summary:
      "Transforms coarse plant matter through digestion before returning fertility to earth.",
    primaryElement: "earth",
    relatedElements: ["water", "air"],
  },
  breathing_exchange: {
    token: "breathing_exchange",
    label: "Breathing exchange",
    summary:
      "Harnesses air continuously for metabolism, movement, and digestion.",
    primaryElement: "air",
    relatedElements: ["fire"],
  },
  grazing_manure: {
    token: "grazing_manure",
    label: "Grazing manure",
    summary:
      "Forage and water return as fertility instead of leaving the forest as waste.",
    primaryElement: "earth",
    relatedElements: ["water", "air", "fire"],
  },
};

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function titleize(value: string): string {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function unique<T>(values: T[]): T[] {
  return Array.from(new Set(values));
}

function roundDisplayRate(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function transformationDisplayKey(
  transformation: IntegrationProfileTransformation,
): string {
  const inputs = transformation.inputs.join("|");
  const outputs = ELEMENT_IDS.map(
    (element) => `${element}:${transformation.outputs[element] ?? 0}`,
  ).join("|");

  return `${transformation.id}:${inputs}:${outputs}`;
}

export function getCapacityDisplayValues(
  potential: number,
  context: IntegrationProfileDisplayContext = {},
): CapacityDisplayValues {
  const mode = context.mode ?? "potential";
  const potentialValue = clamp01(potential);
  const intensity =
    mode === "active" ? clamp01(context.intensity ?? 1) : undefined;
  const active = clamp01(potentialValue * (intensity ?? 1));
  return {
    mode,
    potential: potentialValue,
    active,
    display: mode === "active" ? active : potentialValue,
    intensity,
  };
}

export function getIntegrationTraitDisplay(
  token: string,
  fallbackElement: ElementId = "earth",
): IntegrationTraitDisplay {
  return (
    TRAIT_DISPLAY_DEFINITIONS[token] ?? {
      token,
      label: titleize(token),
      summary: `A recorded ${ELEMENT_LABELS[fallbackElement].toLowerCase()} flow that shapes harnessing capacity.`,
      primaryElement: fallbackElement,
      relatedElements: [],
    }
  );
}

export function buildElementCapacityFactors(
  profile: IngredientIntegrationProfile,
  element: ElementId,
): IntegrationTraitDisplay[] {
  const tokens: string[] = [];
  const add = (token: string | undefined) => {
    if (token) tokens.push(token);
  };

  if (element === "fire") {
    profile.capacityTraits?.fire?.forEach(add);
    profile.sourceTraits.fire.lightPreferences.forEach(add);
    profile.sourceTraits.fire.frostTolerances.forEach(add);
    if (profile.sourceTraits.fire.optimalTempRangeC) add("warmth_window");
    if (profile.sourceTraits.fire.sunlightHours) add("sun_hours");
  }

  if (element === "water") {
    profile.capacityTraits?.water?.forEach(add);
    add(
      profile.sourceTraits.water.waterPull
        ? `${profile.sourceTraits.water.waterPull}_water_pull`
        : undefined,
    );
  }

  if (element === "earth") {
    profile.capacityTraits?.earth?.forEach(add);
    profile.sourceTraits.water.soilPreferences.forEach(add);
    add(
      profile.sourceTraits.water.oxygenSensitivity
        ? `${profile.sourceTraits.water.oxygenSensitivity}_oxygen_sensitivity`
        : undefined,
    );
    add(
      profile.sourceTraits.earth.nutrientPull
        ? `${profile.sourceTraits.earth.nutrientPull}_nutrient_pull`
        : undefined,
    );
    add(profile.sourceTraits.earth.rootStrategy);
    add(
      profile.sourceTraits.earth.rootDepthBand
        ? `${profile.sourceTraits.earth.rootDepthBand}_root_depth`
        : undefined,
    );
  }

  if (element === "air") {
    profile.capacityTraits?.air?.forEach(add);
    profile.sourceTraits.air.airHumidityPreferences.forEach(add);
  }

  return unique(tokens).map((token) =>
    getIntegrationTraitDisplay(token, element),
  );
}

export function summarizeElementCapacityFactors(
  element: ElementId,
  factors: IntegrationTraitDisplay[],
): string {
  const label = ELEMENT_LABELS[element].toLowerCase();
  if (factors.length === 0) {
    return `No specific ${label} flows are recorded yet; the profile uses a conservative default.`;
  }
  if (factors.length === 1) {
    return `${factors[0].label} shapes ${label} harnessing capacity.`;
  }
  if (factors.length === 2) {
    return `${factors[0].label} and one more flow shape ${label} harnessing capacity.`;
  }
  return `${factors[0].label} and ${factors.length - 1} more flows shape ${label} harnessing capacity.`;
}

export function getTransformationDisplayRows(
  transformations: IntegrationProfileTransformation[],
  element: ElementId,
): IntegrationTransformationDisplayRow[] {
  const rows = new Map<string, IntegrationTransformationDisplayRow>();

  for (const transformation of transformations) {
    if ((transformation.outputs[element] ?? 0) <= 0) {
      continue;
    }

    const definition = TRANSFORMATION_OUTPUTS[transformation.id];
    const key = transformationDisplayKey(transformation);
    const existing = rows.get(key);

    if (existing) {
      rows.set(key, {
        ...existing,
        rate: roundDisplayRate(existing.rate + transformation.rate),
        requires: unique([...existing.requires, ...transformation.requires]),
      });
      continue;
    }

    rows.set(key, {
      id: transformation.id,
      label: definition.label,
      definition: definition.definition,
      inputs: transformation.inputs,
      outputs: transformation.outputs,
      rate: transformation.rate,
      requires: transformation.requires,
      persistence: definition.persistence,
    });
  }

  return Array.from(rows.values());
}

export function orderedOutputElements(
  outputs: Partial<Record<ElementId, number>>,
): ElementId[] {
  return ELEMENT_IDS.filter((element) => (outputs[element] ?? 0) > 0);
}
