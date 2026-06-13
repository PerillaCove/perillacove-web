import type {
  ElementId,
  FlowStructure,
  FlowStructureEffect,
  FlowStructureKind,
  SpeciesTrajectorySample,
  StructureFootprint,
} from "../types";

export interface StructureDefinition {
  kind: FlowStructureKind;
  label: string;
  description: string;
  elements: ElementId[];
}

export const STRUCTURE_DEFINITIONS: Record<
  FlowStructureKind,
  StructureDefinition
> = {
  plant_stage: {
    kind: "plant_stage",
    label: "Plant stage",
    description:
      "A living ingredient at the current year cursor position, declaring inherent capacity and conditional turnover through its footprint.",
    elements: ["fire", "water", "earth", "air"],
  },
  animal_grazer: {
    kind: "animal_grazer",
    label: "Animal grazer",
    description:
      "A moving animal participant with living capacity, forage intake, manure return, and light trampling through a grazing range.",
    elements: ["fire", "water", "earth", "air"],
  },
  mulch_zone: {
    kind: "mulch_zone",
    label: "Mulch zone",
    description:
      "Dead organic cover slows water, feeds soil life, and reduces bare-ground waste.",
    elements: ["water", "earth", "air"],
  },
  soil_zone: {
    kind: "soil_zone",
    label: "Soil zone",
    description:
      "A managed soil volume with local water residence and root exchange capacity.",
    elements: ["water", "earth", "air"],
  },
  swale: {
    kind: "swale",
    label: "Swale",
    description:
      "A contour-holding structure that turns fast runoff into slow infiltration.",
    elements: ["water", "earth", "air"],
  },
  greenhouse_shell: {
    kind: "greenhouse_shell",
    label: "Greenhouse shell",
    description:
      "A boundary shell that retains water vapor and moderates air exchange while preserving plant demand.",
    elements: ["fire", "water", "air"],
  },
  path: {
    kind: "path",
    label: "Path",
    description:
      "A compacted access surface that lowers root and water capacity through its footprint.",
    elements: ["water", "earth", "air"],
  },
  pond: {
    kind: "pond",
    label: "Pond",
    description:
      "Stored water that supplies humidity and residence time around its edge.",
    elements: ["water", "air", "earth"],
  },
  pruning_gap: {
    kind: "pruning_gap",
    label: "Pruning gap",
    description: "Compile-time stub for a future light-opening structure.",
    elements: ["fire", "air"],
  },
  rock_wall: {
    kind: "rock_wall",
    label: "Rock or wall",
    description: "Compile-time stub for thermal mass and wind shaping.",
    elements: ["fire", "air"],
  },
  fence: {
    kind: "fence",
    label: "Fence",
    description: "Compile-time stub for lateral air-flow shaping.",
    elements: ["air"],
  },
};

function effect(
  supply: number,
  capacity: number,
  multipliers?: Pick<
    FlowStructureEffect,
    "supplyMultiplier" | "capacityMultiplier"
  >,
): FlowStructureEffect {
  return { supply, capacity, ...multipliers };
}

export function createPlantStageStructure(
  sample: SpeciesTrajectorySample,
  footprint: StructureFootprint,
  ids: { id: string; volumeId: string; sourceIngredientId: string },
): FlowStructure {
  const rootLift =
    sample.layer === "root" || sample.layer === "groundcover" ? 1.18 : 1;
  const intensity = Math.max(0, sample.intensity);

  return {
    id: ids.id,
    kind: "plant_stage",
    label: sample.label,
    footprint,
    sourceIngredientId: ids.sourceIngredientId,
    volumeId: ids.volumeId,
    incomplete: sample.incomplete,
    effects: {
      fire: effect(0, sample.lightDemand * intensity),
      water: effect(0, sample.waterDemand * intensity),
      earth: effect(0, sample.rootCapacity * intensity * rootLift),
      air: effect(0, sample.airExchange * intensity),
    },
    capacity: {
      fire: sample.lightDemand * intensity,
      water: sample.waterDemand * intensity,
      earth: sample.rootCapacity * intensity * rootLift,
      air: sample.airExchange * intensity,
    },
    transformations: sample.transformations,
    integrationProfile: sample.integrationProfile,
    metadata: {
      ingredientId: sample.ingredientId,
      layer: sample.layer,
      ageYears: sample.ageYears,
      maturity: sample.maturity,
      intensity,
    },
  };
}

export function createAnimalGrazerStructure(
  sample: SpeciesTrajectorySample,
  footprint: StructureFootprint,
  ids: { id: string; volumeId: string; sourceIngredientId: string },
  options: { stockingDensity?: number; tramplingPressure?: number } = {},
): FlowStructure {
  const intensity = Math.max(0, sample.intensity);
  const stockingDensity = Math.max(1, options.stockingDensity ?? 1);
  const tramplingPressure = Math.max(0, options.tramplingPressure ?? 0.01);
  const tramplingReduction = Math.min(
    0.12,
    tramplingPressure * stockingDensity,
  );

  return {
    id: ids.id,
    kind: "animal_grazer",
    label: sample.label,
    footprint,
    sourceIngredientId: ids.sourceIngredientId,
    volumeId: ids.volumeId,
    incomplete: sample.incomplete,
    effects: {
      fire: effect(0, sample.lightDemand * intensity),
      water: effect(0, sample.waterDemand * intensity),
      earth: effect(0, sample.rootCapacity * intensity, {
        capacityMultiplier: 1 - tramplingReduction,
      }),
      air: effect(0, sample.airExchange * intensity),
    },
    capacity: {
      fire: sample.lightDemand * intensity,
      water: sample.waterDemand * intensity,
      earth: sample.rootCapacity * intensity,
      air: sample.airExchange * intensity,
    },
    transformations: sample.transformations,
    integrationProfile: sample.integrationProfile,
    metadata: {
      ingredientId: sample.ingredientId,
      layer: sample.layer,
      ageYears: sample.ageYears,
      maturity: sample.maturity,
      intensity,
      stockingDensity,
      tramplingReduction,
    },
  };
}

export function createMulchZone(
  id: string,
  footprint: StructureFootprint,
): FlowStructure {
  return {
    id,
    kind: "mulch_zone",
    label: "Mulch",
    footprint,
    effects: {
      water: effect(0.05, 0.32),
      earth: effect(0.36, 0.28),
      air: effect(0, 0.1, { supplyMultiplier: 0.96 }),
    },
    capacity: { water: 0.32, earth: 0.28, air: 0.1 },
  };
}

export function createSoilZone(
  id: string,
  label: string,
  footprint: StructureFootprint,
): FlowStructure {
  return {
    id,
    kind: "soil_zone",
    label,
    footprint,
    effects: {
      water: effect(0.04, 0.22),
      earth: effect(0.18, 0.3),
      air: effect(0.02, 0.14),
    },
    capacity: { water: 0.22, earth: 0.3, air: 0.14 },
  };
}

export function createSwale(
  id: string,
  footprint: StructureFootprint,
): FlowStructure {
  return {
    id,
    kind: "swale",
    label: "Swale",
    footprint,
    effects: {
      water: effect(0.24, 0.18, { supplyMultiplier: 0.98 }),
      earth: effect(0.08, 0.18),
      air: effect(0.03, 0.08),
    },
    capacity: { water: 0.18, earth: 0.18, air: 0.08 },
  };
}

export function createGreenhouseShell(
  id: string,
  footprint: StructureFootprint,
): FlowStructure {
  return {
    id,
    kind: "greenhouse_shell",
    label: "Greenhouse",
    footprint,
    effects: {
      fire: effect(0.05, 0.08, { supplyMultiplier: 0.9 }),
      water: effect(0.02, 0.18, { supplyMultiplier: 0.92 }),
      air: effect(0.02, 0.18, { supplyMultiplier: 0.94 }),
    },
    capacity: { fire: 0.08, water: 0.18, air: 0.18 },
  };
}

export function createPath(
  id: string,
  footprint: StructureFootprint,
): FlowStructure {
  return {
    id,
    kind: "path",
    label: "Path",
    footprint,
    effects: {
      water: effect(0.12, 0.02, { capacityMultiplier: 0.55 }),
      earth: effect(0, 0.01, { capacityMultiplier: 0.35 }),
      air: effect(0.08, 0.03),
    },
    capacity: { water: 0.02, earth: 0.01, air: 0.03 },
  };
}

export function createPond(
  id: string,
  footprint: StructureFootprint,
): FlowStructure {
  return {
    id,
    kind: "pond",
    label: "Pond",
    footprint,
    effects: {
      water: effect(0.68, 0.72),
      air: effect(0.25, 0.22),
      earth: effect(0.05, 0.04),
    },
    capacity: { water: 0.72, air: 0.22, earth: 0.04 },
  };
}

export function createCompileTimeStub(
  kind: "pruning_gap" | "rock_wall" | "fence",
  id: string,
  footprint: StructureFootprint,
): FlowStructure {
  return {
    id,
    kind,
    label: STRUCTURE_DEFINITIONS[kind].label,
    footprint,
    effects: {},
    capacity: {},
  };
}
