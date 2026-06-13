import type {
  AirHumidityPreferenceType,
  AnimalIntegrationProfile,
  FrostToleranceType,
  Growth,
  Ingredient,
  LightPreferenceType,
  SoilPreferenceType,
} from "../../../IngredientsPage/types";
import { formatIngredientIdForDisplay } from "../../../../util/functions";
import { assignVerticalLayer, inferSuccessionFromGrowth } from "../../util";
import type { VerticalLayer } from "../../types";
import type {
  ElementId,
  IngredientIntegrationProfile,
  IntegrationElementCapacity,
  IntegrationProfileTransformation,
} from "../types";
import { createTransformationPotential } from "../transformations/constants";

const DEFAULT_LAYER: VerticalLayer = "herbaceous";

export function demandLevelScore(
  level: "low" | "medium" | "high" | undefined,
): number {
  if (level === "high") return 0.8;
  if (level === "medium") return 0.62;
  if (level === "low") return 0.38;
  return 0.5;
}

export function lightCapacityForPreference(
  layer: VerticalLayer,
  preferences: LightPreferenceType[] | undefined,
): number {
  const primary = preferences?.[0] ?? "partial_sun";
  const woodyUpperLayer = layer === "canopy" || layer === "midstory";

  switch (primary) {
    case "full_sun":
      return woodyUpperLayer ? 0.78 : 0.72;
    case "partial_sun":
      return woodyUpperLayer ? 0.62 : 0.58;
    case "filtered_light":
      return 0.5;
    case "shade_tolerant":
      return 0.36;
    case "shade_loving":
      return 0.27;
    default:
      return 0.58;
  }
}

function layerBaseLitterRate(layer: VerticalLayer): number {
  switch (layer) {
    case "canopy":
    case "midstory":
      return 0.26;
    case "groundcover":
      return 0.18;
    case "herbaceous":
      return 0.14;
    default:
      return 0.09;
  }
}

function airExchangeCapacity(
  layer: VerticalLayer,
  preferences: AirHumidityPreferenceType[] | undefined,
): number {
  return (
    (layer === "canopy" || layer === "midstory"
      ? 0.78
      : layer === "understory" || layer === "shrub"
        ? 0.62
        : 0.44) + (preferences?.includes("humid_air") ? 0.1 : 0)
  );
}

function rootCapacity(growth: Growth | undefined): number {
  const nutrientDemand = demandLevelScore(
    growth?.soilInteraction?.demand.nutrientPull,
  );
  return (
    nutrientDemand *
    (growth?.soilInteraction?.root.depthBand === "very_deep"
      ? 1.25
      : growth?.soilInteraction?.root.depthBand === "deep"
        ? 1.12
        : 1)
  );
}

function capacity(
  value: number,
  traits: Array<string | undefined | false>,
): IntegrationElementCapacity {
  return {
    value,
    traits: traits.filter(Boolean) as string[],
  };
}

function hasNitrogenFixingSymbiosis(ingredient: Ingredient): boolean {
  const fixation =
    ingredient.properties.ecologicalProcess?.fertility.nitrogenFixation;
  return Boolean(fixation && fixation !== "none");
}

function transformationPotentials(
  ingredient: Ingredient,
  growth: Growth | undefined,
  layer: VerticalLayer,
): IntegrationProfileTransformation[] {
  const potentials: IntegrationProfileTransformation[] = [
    createTransformationPotential("transpired_humidity", 0.16),
    createTransformationPotential("leaf_litter", layerBaseLitterRate(layer)),
    createTransformationPotential("root_turnover", rootCapacity(growth) * 0.3),
  ];

  if (growth?.soilInteraction?.root.strategy === "taproot_seeker") {
    potentials.push(
      createTransformationPotential("root_turnover", 0.09, {
        requires: ["active_roots", "mineral_lift"],
      }),
    );
  }

  if (hasNitrogenFixingSymbiosis(ingredient)) {
    potentials.push(createTransformationPotential("nitrogen_fixation", 0.26));
  }

  return potentials;
}

function emptyCapacity(): Record<ElementId, IntegrationElementCapacity> {
  return {
    fire: capacity(0.34, []),
    water: capacity(0.28, []),
    earth: capacity(0.28, []),
    air: capacity(0.28, []),
  };
}

function animalTimeProfile(animal: AnimalIntegrationProfile) {
  const startYear = Math.max(0, animal.lifecycle.startYear);
  const maturityYears = Math.max(0.1, animal.lifecycle.maturityYears);
  const lifespanYears = Math.max(
    maturityYears + 0.1,
    animal.lifecycle.lifespanYears,
  );

  return {
    lifeCycles: [],
    successionPhase: "early" as const,
    establishmentLight: "full_sun" as const,
    plantingWindow: [startYear, startYear] as [number, number],
    firstYield: [maturityYears, maturityYears] as [number, number],
    productiveWindow: [
      lifespanYears - maturityYears,
      lifespanYears - maturityYears,
    ] as [number, number],
  };
}

function buildAnimalIntegrationProfile(
  ingredient: Ingredient,
  animal: AnimalIntegrationProfile,
): IngredientIntegrationProfile {
  const time = animalTimeProfile(animal);

  return {
    ingredientId: ingredient.id,
    label: formatIngredientIdForDisplay(ingredient.id),
    incomplete: false,
    profileKind: "animal",
    structure: {
      layer: animal.layer,
      growthForms: [],
      heightClasses: [],
    },
    capacity: {
      fire: capacity(animal.capacity.fire.value, animal.capacity.fire.traits),
      water: capacity(
        animal.capacity.water.value,
        animal.capacity.water.traits,
      ),
      earth: capacity(
        animal.capacity.earth.value,
        animal.capacity.earth.traits,
      ),
      air: capacity(animal.capacity.air.value, animal.capacity.air.traits),
    },
    capacityTraits: {
      fire: animal.capacity.fire.traits,
      water: animal.capacity.water.traits,
      earth: animal.capacity.earth.traits,
      air: animal.capacity.air.traits,
    },
    transformations: [
      createTransformationPotential(
        "grazing_manure",
        animal.turnover.manureRate,
      ),
    ],
    time,
    animalLifecycle: animal.lifecycle,
    yieldIngredientIds: animal.yields,
    sourceTraits: {
      fire: {
        lightPreferences: [],
        frostTolerances: [],
        optimalTempRangeC: undefined,
        sunlightHours: undefined,
      },
      water: {
        soilPreferences: [],
        waterPull: undefined,
        oxygenSensitivity: undefined,
      },
      earth: {
        nutrientPull: undefined,
        rootStrategy: undefined,
        rootDepthBand: undefined,
      },
      air: {
        airHumidityPreferences: [],
        humidityLift: undefined,
        windBuffering: undefined,
      },
    },
  };
}

export function buildIngredientIntegrationProfile(
  ingredient: Ingredient,
): IngredientIntegrationProfile {
  const animal = ingredient.properties.animalIntegration;
  if (animal) {
    return buildAnimalIntegrationProfile(ingredient, animal);
  }

  const growth = ingredient.properties.growth;
  const layer = growth ? assignVerticalLayer(growth) : DEFAULT_LAYER;
  const succession = growth
    ? (ingredient.properties.succession ?? inferSuccessionFromGrowth(growth))
    : {
        successionalPhase: undefined,
        establishmentLight: undefined,
        recommendedPlantYearFromStart: [0, 0] as [number, number],
        yearsToFirstHarvest: [1, 2] as [number, number],
        productiveLifespanYears: [4, 8] as [number, number],
      };
  const profileCapacity = emptyCapacity();
  const lightPreferences: LightPreferenceType[] =
    growth?.lightPreferences ?? [];
  const frostTolerances: FrostToleranceType[] = growth?.frostTolerances ?? [];
  const soilPreferences: SoilPreferenceType[] = growth?.soilPreferences ?? [];
  const airHumidityPreferences = growth?.airHumidityPreferences ?? [];
  const waterPull = growth?.soilInteraction?.demand.waterPull;
  const nutrientPull = growth?.soilInteraction?.demand.nutrientPull;
  const oxygenSensitivity = growth?.soilInteraction?.demand.oxygenSensitivity;
  const rootStrategy = growth?.soilInteraction?.root.strategy;
  const rootDepthBand = growth?.soilInteraction?.root.depthBand;

  profileCapacity.fire = capacity(
    lightCapacityForPreference(layer, lightPreferences),
    [
      ...lightPreferences,
      ...frostTolerances,
      growth?.climateProfile?.optimalTempRangeC ? "warmth_window" : undefined,
      growth?.climateProfile?.sunlightHours ? "sun_hours" : undefined,
    ],
  );
  profileCapacity.water = capacity(demandLevelScore(waterPull), [
    ...soilPreferences,
    waterPull && `${waterPull}_water_pull`,
    oxygenSensitivity,
  ]);
  profileCapacity.earth = capacity(rootCapacity(growth), [
    nutrientPull && `${nutrientPull}_nutrient_pull`,
    rootStrategy,
    rootDepthBand,
  ]);
  profileCapacity.air = capacity(
    airExchangeCapacity(layer, airHumidityPreferences),
    airHumidityPreferences,
  );

  return {
    ingredientId: ingredient.id,
    label: formatIngredientIdForDisplay(ingredient.id),
    profileKind: "plant",
    incomplete:
      !growth ||
      !ingredient.properties.succession ||
      !growth.soilInteraction ||
      !growth.climateProfile ||
      !growth.airHumidityPreferences,
    structure: {
      layer,
      growthForms: growth?.growthForms ?? [],
      heightClasses: growth?.heightClasses ?? [],
      rootStrategy,
      rootDepthBand,
    },
    capacity: profileCapacity,
    transformations: transformationPotentials(ingredient, growth, layer),
    time: {
      lifeCycles: growth?.lifeCycles ?? [],
      successionPhase: succession.successionalPhase,
      establishmentLight: succession.establishmentLight,
      plantingWindow: succession.recommendedPlantYearFromStart,
      firstYield: succession.yearsToFirstHarvest,
      productiveWindow: succession.productiveLifespanYears,
    },
    sourceTraits: {
      fire: {
        lightPreferences,
        frostTolerances,
        chillHours: growth?.climateProfile?.chillHours,
        optimalTempRangeC: growth?.climateProfile?.optimalTempRangeC,
        sunlightHours: growth?.climateProfile?.sunlightHours,
      },
      water: {
        soilPreferences,
        waterPull,
        oxygenSensitivity,
      },
      earth: {
        nutrientPull,
        rootStrategy,
        rootDepthBand,
      },
      air: {
        airHumidityPreferences,
        humidityLift:
          ingredient.properties.ecologicalProcess?.microclimate.humidityLift,
        windBuffering:
          ingredient.properties.ecologicalProcess?.microclimate.windBuffering,
      },
    },
  };
}

export function activateProfileTransformations(
  profile: IngredientIntegrationProfile,
  intensity: number,
) {
  return profile.transformations.map((transformation) => ({
    ...transformation,
    intensity,
  }));
}
