import type {
  ElementField,
  ElementId,
  FlowStructure,
  IngredientIntegrationProfile,
  IntegrationBundleChannel,
  IntegrationDirection,
  IntegrationElementReading,
  IntegrationEnvironment,
} from "./types";
import { clamp01, directionFromValues, roundReading } from "./elements/common";
import { getIntegrationTraitDisplay } from "./profiles/display";
import {
  AirHumidityPreferenceType,
  SoilPreferenceType,
} from "../../IngredientsPage/types";

type PlantStructure = FlowStructure & {
  integrationProfile: IngredientIntegrationProfile;
};

type WeightedChannelReading = {
  integration: number;
  direction: IntegrationDirection;
  sourceToken?: string;
};

const CHANNEL_WEIGHTS = {
  field: 0.7,
  fire: {
    warmth: 0.13,
    sunDuration: 0.1,
    coldChill: 0.07,
  },
  water: {
    moistureFit: 0.13,
    waterPull: 0.1,
    rootOxygen: 0.07,
  },
  earth: {
    fertilityPull: 0.1,
    rootDepth: 0.1,
    livingTurnover: 0.1,
  },
  air: {
    humidityFit: 0.17,
    windShelter: 0.07,
    transpirationSupport: 0.06,
  },
} as const;

const FLOW_LABELS: Record<ElementId, string> = {
  fire: "Fire flow",
  water: "Water flow",
  earth: "Earth flow",
  air: "Air flow",
};

export function match01(supply: number, capacity: number): number {
  const maxValue = Math.max(Math.max(0, supply), Math.max(0, capacity));
  if (maxValue <= 0) return 0;
  return clamp01(1 - Math.abs(supply - capacity) / maxValue);
}

export function rangeFit01(value: number, range: [number, number]): number {
  const [min, max] = range[0] <= range[1] ? range : [range[1], range[0]];
  if (value >= min && value <= max) return 1;
  const span = Math.max(1, max - min);
  if (value < min) return clamp01(1 - (min - value) / span);
  return clamp01(1 - (value - max) / span);
}

function directionFromRange(
  value: number,
  range: [number, number],
): IntegrationDirection {
  const [min, max] = range[0] <= range[1] ? range : [range[1], range[0]];
  if (value >= min && value <= max) return "balanced";
  return value < min ? "capacity_exceeds_supply" : "supply_exceeds_capacity";
}

function levelScore(level: "low" | "medium" | "high" | undefined): number {
  if (level === "high") return 0.8;
  if (level === "medium") return 0.62;
  if (level === "low") return 0.38;
  return 0.5;
}

function activePlants(structures: FlowStructure[]): PlantStructure[] {
  return structures.filter(
    (structure): structure is PlantStructure =>
      (structure.kind === "plant_stage" ||
        structure.kind === "animal_grazer") &&
      Boolean(structure.integrationProfile),
  );
}

function plantWeight(structure: PlantStructure, element: ElementId): number {
  const capacity = Math.max(0.02, structure.capacity[element] ?? 0);
  return capacity * structure.footprint.radius * structure.footprint.radius;
}

function weightedPlantChannel(
  plants: PlantStructure[],
  element: ElementId,
  evaluate: (
    profile: IngredientIntegrationProfile,
  ) => WeightedChannelReading | undefined,
): WeightedChannelReading | undefined {
  let weighted = 0;
  let total = 0;
  const directions: Record<IntegrationDirection, number> = {
    supply_exceeds_capacity: 0,
    capacity_exceeds_supply: 0,
    balanced: 0,
  };
  const sourceWeights: Record<string, number> = {};

  for (const plant of plants) {
    const reading = evaluate(plant.integrationProfile);
    if (!reading) continue;
    const weight = plantWeight(plant, element);
    weighted += reading.integration * weight;
    total += weight;
    directions[reading.direction] += weight;
    if (reading.sourceToken) {
      sourceWeights[reading.sourceToken] =
        (sourceWeights[reading.sourceToken] ?? 0) + weight;
    }
  }

  if (total <= 0) return undefined;
  const direction = (
    Object.entries(directions) as Array<[IntegrationDirection, number]>
  ).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0][0];
  const sourceToken = Object.entries(sourceWeights).sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
  )[0]?.[0];

  return {
    integration: roundReading(weighted / total),
    direction,
    sourceToken,
  };
}

function channel(
  id: string,
  weight: number,
  reading: WeightedChannelReading | undefined,
  fallbackToken: string,
  fallbackElement: ElementId,
): IntegrationBundleChannel | undefined {
  if (!reading) return undefined;
  const display = getIntegrationTraitDisplay(
    reading.sourceToken ?? fallbackToken,
    fallbackElement,
  );
  return {
    id,
    label: display.label,
    summary: display.summary,
    primaryElement: display.primaryElement,
    relatedElements: display.relatedElements,
    integration: roundReading(reading.integration),
    weight,
    direction: reading.integration >= 0.92 ? "balanced" : reading.direction,
  };
}

function baseChannel(
  reading: IntegrationElementReading,
): IntegrationBundleChannel {
  const directions = Object.entries(reading.directionalSummary) as Array<
    [IntegrationDirection, number]
  >;
  const direction =
    directions.sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    )[0]?.[0] ?? "balanced";
  return {
    id: `${reading.element}_flow`,
    label: FLOW_LABELS[reading.element],
    summary:
      "The local field score where available flow meets living capacity.",
    primaryElement: reading.element,
    relatedElements: [],
    integration: reading.baseIntegration,
    weight: CHANNEL_WEIGHTS.field,
    direction,
  };
}

function composeReading(
  reading: IntegrationElementReading,
  channels: Array<IntegrationBundleChannel | undefined>,
): IntegrationElementReading {
  const available = channels.filter(
    (item): item is IntegrationBundleChannel =>
      Boolean(item) && (item?.weight ?? 0) > 0,
  );
  const totalWeight = available.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight <= 0) return reading;

  const normalized = available.map((item) => ({
    ...item,
    weight: roundReading(item.weight / totalWeight),
  }));
  const integration = roundReading(
    normalized.reduce((sum, item) => sum + item.integration * item.weight, 0),
  );
  const limitingChannel = [...normalized].sort(
    (a, b) => a.integration - b.integration || a.id.localeCompare(b.id),
  )[0];

  return {
    ...reading,
    integration,
    bundle: {
      integration,
      channels: normalized,
      limitingChannel,
    },
  };
}

function bestRangeFit(
  value: number,
  ranges: Array<{ token: string; range: [number, number] }>,
): WeightedChannelReading | undefined {
  if (ranges.length === 0) return undefined;
  const best = ranges
    .map(({ token, range }) => ({
      integration: rangeFit01(value, range),
      direction: directionFromRange(value, range),
      sourceToken: token,
    }))
    .sort(
      (a, b) =>
        b.integration - a.integration ||
        a.sourceToken.localeCompare(b.sourceToken),
    )[0];
  return best;
}

function moistureLevel(environment: IntegrationEnvironment): number {
  return clamp01(environment.rainfall * 0.82 + environment.humidity * 0.18);
}

function moistureRangeForPreference(
  preference: string,
): [number, number] | undefined {
  switch (preference) {
    case "dry":
      return [0.14, 0.46];
    case "moist_well_drained":
      return [0.42, 0.78];
    case "water_edge":
      return [0.64, 0.92];
    case "deep_groundwater":
      return [0.32, 0.72];
    case "standing_water":
      return [0.82, 1];
    default:
      return undefined;
  }
}

function humidityRangeForPreference(
  preference: string,
): [number, number] | undefined {
  switch (preference) {
    case "arid_air":
      return [0.1, 0.35];
    case "semi_arid_air":
      return [0.24, 0.5];
    case "moderate_humidity":
      return [0.4, 0.68];
    case "humid_air":
      return [0.6, 0.86];
    case "saturated_air":
      return [0.78, 1];
    default:
      return undefined;
  }
}

function frostResilience(tolerance: string | undefined): number | undefined {
  switch (tolerance) {
    case "hardy":
      return 0.95;
    case "semi_hardy":
      return 0.72;
    case "frost_sensitive":
      return 0.38;
    case "frost_intolerant":
      return 0.1;
    default:
      return undefined;
  }
}

function rootDepthNeed(depthBand: string | undefined): number | undefined {
  switch (depthBand) {
    case "very_shallow":
      return 0.18;
    case "shallow":
      return 0.34;
    case "medium":
      return 0.54;
    case "deep":
      return 0.74;
    case "very_deep":
      return 0.92;
    default:
      return undefined;
  }
}

function contributorTurnoverScore(
  field: ElementField,
  tokens: string[],
): WeightedChannelReading | undefined {
  let totalUse = 0;
  let transformedUse = 0;
  for (const cell of field.cells) {
    if (!cell.inside) continue;
    const use = cell.use * cell.weight;
    totalUse += use;
    if (
      cell.contributors.some((contributor) =>
        tokens.some((token) => contributor.includes(token)),
      )
    ) {
      transformedUse += use;
    }
  }
  if (totalUse <= 0) return undefined;
  const integration = clamp01((transformedUse / totalUse) * 1.6);
  return {
    integration: roundReading(integration),
    direction: integration >= 0.92 ? "balanced" : "capacity_exceeds_supply",
  };
}

function hasTransformation(
  plants: PlantStructure[],
  transformationId: string,
): boolean {
  return plants.some((plant) =>
    plant.transformations?.some(
      (transformation) => transformation.id === transformationId,
    ),
  );
}

function fireChannels(
  reading: IntegrationElementReading,
  plants: PlantStructure[],
  environment: IntegrationEnvironment,
) {
  const warmth = weightedPlantChannel(plants, "fire", (profile) => {
    const range = profile.sourceTraits.fire.optimalTempRangeC;
    if (!range) return undefined;
    return {
      integration: rangeFit01(environment.ambientTempC, range),
      direction: directionFromRange(environment.ambientTempC, range),
      sourceToken: "warmth_window",
    };
  });
  const sunDuration = weightedPlantChannel(plants, "fire", (profile) => {
    const range = profile.sourceTraits.fire.sunlightHours;
    if (!range) return undefined;
    return {
      integration: rangeFit01(environment.sunlightHours, range),
      direction: directionFromRange(environment.sunlightHours, range),
      sourceToken: "sun_hours",
    };
  });
  const coldChill = weightedPlantChannel(plants, "fire", (profile) => {
    const range = profile.sourceTraits.fire.chillHours;
    if (range) {
      return {
        integration: rangeFit01(environment.winterChillHours, range),
        direction: directionFromRange(environment.winterChillHours, range),
        sourceToken: "cold_chill",
      };
    }
    if (environment.frostRisk <= 0) return undefined;
    const resilience = Math.max(
      ...profile.sourceTraits.fire.frostTolerances
        .map(frostResilience)
        .filter((value): value is number => value !== undefined),
    );
    if (!Number.isFinite(resilience)) return undefined;
    const integration = clamp01(1 - environment.frostRisk * (1 - resilience));
    return {
      integration,
      direction: integration >= 0.92 ? "balanced" : "supply_exceeds_capacity",
      sourceToken: profile.sourceTraits.fire.frostTolerances[0] ?? "cold_chill",
    };
  });

  return [
    baseChannel(reading),
    channel(
      "warmth_window",
      CHANNEL_WEIGHTS.fire.warmth,
      warmth,
      "warmth_window",
      "fire",
    ),
    channel(
      "sun_duration",
      CHANNEL_WEIGHTS.fire.sunDuration,
      sunDuration,
      "sun_hours",
      "fire",
    ),
    channel(
      "cold_chill",
      CHANNEL_WEIGHTS.fire.coldChill,
      coldChill,
      "cold_chill",
      "fire",
    ),
  ];
}

function waterChannels(
  reading: IntegrationElementReading,
  plants: PlantStructure[],
  environment: IntegrationEnvironment,
) {
  const moisture = moistureLevel(environment);
  const moistureFit = weightedPlantChannel(plants, "water", (profile) => {
    const ranges = profile.sourceTraits.water.soilPreferences
      .map((token) => {
        const range = moistureRangeForPreference(token);
        return range ? { token, range } : undefined;
      })
      .filter(
        (
          item,
        ): item is { token: SoilPreferenceType; range: [number, number] } =>
          Boolean(item),
      );
    return bestRangeFit(moisture, ranges);
  });
  const waterPull = weightedPlantChannel(plants, "water", (profile) => {
    const pull = profile.sourceTraits.water.waterPull;
    if (!pull) return undefined;
    const capacity = levelScore(pull);
    return {
      integration: match01(moisture, capacity),
      direction: directionFromValues(moisture, capacity),
      sourceToken: `${pull}_water_pull`,
    };
  });
  const rootOxygen = weightedPlantChannel(plants, "water", (profile) => {
    const sensitivity = profile.sourceTraits.water.oxygenSensitivity;
    if (!sensitivity) return undefined;
    const saturation = clamp01((moisture - 0.68) / 0.32);
    const resilience =
      sensitivity === "low" ? 0.92 : sensitivity === "medium" ? 0.68 : 0.42;
    const integration = clamp01(1 - saturation * (1 - resilience));
    return {
      integration,
      direction: integration >= 0.92 ? "balanced" : "supply_exceeds_capacity",
      sourceToken: `${sensitivity}_oxygen_sensitivity`,
    };
  });

  return [
    baseChannel(reading),
    channel(
      "moisture_fit",
      CHANNEL_WEIGHTS.water.moistureFit,
      moistureFit,
      "moisture_fit",
      "water",
    ),
    channel(
      "water_pull",
      CHANNEL_WEIGHTS.water.waterPull,
      waterPull,
      "water_pull",
      "water",
    ),
    channel(
      "root_oxygen",
      CHANNEL_WEIGHTS.water.rootOxygen,
      rootOxygen,
      "root_oxygen",
      "earth",
    ),
  ];
}

function earthChannels(
  reading: IntegrationElementReading,
  field: ElementField,
  plants: PlantStructure[],
  environment: IntegrationEnvironment,
) {
  const fertilityPull = weightedPlantChannel(plants, "earth", (profile) => {
    const pull = profile.sourceTraits.earth.nutrientPull;
    if (!pull) return undefined;
    const capacity = levelScore(pull);
    return {
      integration: match01(environment.soilMineralSupply, capacity),
      direction: directionFromValues(environment.soilMineralSupply, capacity),
      sourceToken: `${pull}_nutrient_pull`,
    };
  });
  const rootDepth = weightedPlantChannel(plants, "earth", (profile) => {
    const need = rootDepthNeed(profile.sourceTraits.earth.rootDepthBand);
    if (need === undefined) return undefined;
    const integration =
      environment.soilDepthAccess >= need
        ? 1
        : clamp01(environment.soilDepthAccess / Math.max(0.01, need));
    return {
      integration,
      direction: integration >= 0.92 ? "balanced" : "capacity_exceeds_supply",
      sourceToken: `${profile.sourceTraits.earth.rootDepthBand}_root_depth`,
    };
  });
  const livingTurnover = plants.length
    ? contributorTurnoverScore(field, [
        "leaf_litter",
        "root_turnover",
        "nitrogen_fixation",
        "grazing_manure",
      ])
    : undefined;

  return [
    baseChannel(reading),
    channel(
      "fertility_pull",
      CHANNEL_WEIGHTS.earth.fertilityPull,
      fertilityPull,
      "fertility_pull",
      "earth",
    ),
    channel(
      "root_depth",
      CHANNEL_WEIGHTS.earth.rootDepth,
      rootDepth,
      "medium_root_depth",
      "earth",
    ),
    channel(
      "living_turnover",
      CHANNEL_WEIGHTS.earth.livingTurnover,
      livingTurnover,
      "living_turnover",
      "earth",
    ),
  ];
}

function airChannels(
  reading: IntegrationElementReading,
  field: ElementField,
  plants: PlantStructure[],
  environment: IntegrationEnvironment,
) {
  const humidityFit = weightedPlantChannel(plants, "air", (profile) => {
    const ranges = profile.sourceTraits.air.airHumidityPreferences
      .map((token) => {
        const range = humidityRangeForPreference(token);
        return range ? { token, range } : undefined;
      })
      .filter(
        (
          item,
        ): item is {
          token: AirHumidityPreferenceType;
          range: [number, number];
        } => Boolean(item),
      );
    return bestRangeFit(environment.humidity, ranges);
  });
  const windShelter = weightedPlantChannel(plants, "air", (profile) => {
    const buffering = profile.sourceTraits.air.windBuffering;
    if (!buffering) return undefined;
    const capacity = levelScore(buffering);
    return {
      integration: match01(environment.windExposure, capacity),
      direction: directionFromValues(environment.windExposure, capacity),
      sourceToken: "wind_shelter",
    };
  });
  const transpirationSupport = hasTransformation(plants, "transpired_humidity")
    ? contributorTurnoverScore(field, ["transpired_humidity"])
    : undefined;

  return [
    baseChannel(reading),
    channel(
      "humidity_fit",
      CHANNEL_WEIGHTS.air.humidityFit,
      humidityFit,
      "humidity_fit",
      "air",
    ),
    channel(
      "wind_shelter",
      CHANNEL_WEIGHTS.air.windShelter,
      windShelter,
      "wind_shelter",
      "air",
    ),
    channel(
      "transpiration_support",
      CHANNEL_WEIGHTS.air.transpirationSupport,
      transpirationSupport,
      "transpiration_support",
      "air",
    ),
  ];
}

export function applyElementBundles(
  readings: Record<ElementId, IntegrationElementReading>,
  fields: Record<ElementId, ElementField>,
  structures: FlowStructure[],
  environment: IntegrationEnvironment,
): Record<ElementId, IntegrationElementReading> {
  const plants = activePlants(structures);
  return {
    fire: composeReading(
      readings.fire,
      fireChannels(readings.fire, plants, environment),
    ),
    water: composeReading(
      readings.water,
      waterChannels(readings.water, plants, environment),
    ),
    earth: composeReading(
      readings.earth,
      earthChannels(readings.earth, fields.earth, plants, environment),
    ),
    air: composeReading(
      readings.air,
      airChannels(readings.air, fields.air, plants, environment),
    ),
  };
}
