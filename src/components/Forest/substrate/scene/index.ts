import { IngredientMap } from "../../../IngredientsPage/data/species";
import type { SpatialVolume } from "../../spatial";
import { computeSpatialVolumes } from "../../spatial";
import type { ElementalGroup } from "../../types";
import {
  createPlotGrid,
  DEFAULT_GRID_RESOLUTION,
  LOW_PERFORMANCE_GRID_RESOLUTION,
} from "../engine/grid";
import {
  createAnimalGrazerStructure,
  createMulchZone,
  createPlantStageStructure,
  createSoilZone,
} from "../structures";
import type {
  IntegrationEnvironment,
  IntegrationSceneBuildInput,
  IntegrationSceneState,
  PlotBounds,
  PositionOverrides,
} from "../types";
import { sampleTrajectoryForVolume } from "../species";

export const DEFAULT_INTEGRATION_ENVIRONMENT: IntegrationEnvironment = {
  incomingLight: 1,
  rainfall: 0.72,
  soilMineralSupply: 0.5,
  airExchange: 0.56,
  humidity: 0.42,
  subsoilLeakage: 0,
  ambientTempC: 22,
  sunlightHours: 7,
  winterChillHours: 800,
  frostRisk: 0,
  soilDepthAccess: 0.78,
  windExposure: 0.48,
};

// Stable grid bounds reserve the largest mature plant-stage substrate radius
// (canopy base radius * canopy multiplier) so growth and respawn cycles do not
// resize the cell lattice while the year cursor moves.
const STABLE_SUBSTRATE_MARGIN = 8.8;
const OVERRIDE_POSITION_MARGIN = 12;

function applyOverrides(
  volumes: SpatialVolume[],
  positionOverrides?: PositionOverrides,
): SpatialVolume[] {
  if (!positionOverrides || Object.keys(positionOverrides).length === 0) {
    return volumes;
  }
  return volumes.map((volume) => {
    const override = positionOverrides[volume.ingredientId];
    if (!override) return volume;
    return { ...volume, position: override };
  });
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>).sort(
    ([a], [b]) => a.localeCompare(b),
  );
  return `{${entries
    .map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`)
    .join(",")}}`;
}

function hashString(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function structureHashInput(scene: IntegrationSceneState) {
  return {
    seed: scene.seed,
    year: Math.round(scene.year * 1000) / 1000,
    environment: scene.environment,
    structures: scene.structures.map((structure) => ({
      id: structure.id,
      kind: structure.kind,
      x: Math.round(structure.footprint.x * 1000) / 1000,
      z: Math.round(structure.footprint.z * 1000) / 1000,
      radius: Math.round(structure.footprint.radius * 1000) / 1000,
      capacity: structure.capacity,
      effects: structure.effects,
      transformations: structure.transformations,
      incomplete: structure.incomplete,
    })),
  };
}

function groupVolumesForSoilZone(
  group: ElementalGroup,
  volumes: SpatialVolume[],
): SpatialVolume[] {
  return volumes.filter((volume) => {
    const sourceId = volume.sourceIngredientId ?? volume.ingredientId;
    return group.ingredientIds.includes(sourceId);
  });
}

function addSoilGroupStructures(
  input: IntegrationSceneBuildInput,
  volumes: SpatialVolume[],
): ReturnType<typeof createSoilZone>[] {
  if (!input.soilGrouping?.enabled) return [];

  return input.soilGrouping.groups.flatMap((group) => {
    const groupVolumes = groupVolumesForSoilZone(group, volumes);
    if (groupVolumes.length === 0) return [];
    const center = groupVolumes.reduce(
      (acc, volume) => ({
        x: acc.x + volume.position.x / groupVolumes.length,
        z: acc.z + volume.position.z / groupVolumes.length,
      }),
      { x: 0, z: 0 },
    );
    const radius =
      Math.max(
        ...groupVolumes.map((volume) =>
          Math.hypot(
            volume.position.x - center.x,
            volume.position.z - center.z,
          ),
        ),
        1.5,
      ) + 1.4;
    return [
      createSoilZone(`soil_zone:${group.id}`, group.label, {
        x: center.x,
        z: center.z,
        radius,
      }),
    ];
  });
}

function addDefaultMulch(volumes: SpatialVolume[]) {
  return volumes
    .filter((volume) => {
      const sourceId = volume.sourceIngredientId ?? volume.ingredientId;
      const ingredient = IngredientMap[sourceId];
      if (ingredient?.properties.animalIntegration) return false;
      return ["groundcover", "herbaceous", "root"].includes(volume.layer);
    })
    .map((volume) =>
      createMulchZone(`mulch:${volume.ingredientId}`, {
        x: volume.position.x,
        z: volume.position.z,
        radius: Math.max(1.4, substrateRadiusForVolume(volume) * 0.75),
        layer: volume.layer,
      }),
    );
}

function resolveBounds(bounds: PlotBounds): PlotBounds {
  return {
    minX: Math.min(bounds.minX, -5),
    maxX: Math.max(bounds.maxX, 5),
    minZ: Math.min(bounds.minZ, -5),
    maxZ: Math.max(bounds.maxZ, 5),
    maxHeight: bounds.maxHeight ?? 15,
  };
}

function resolveStableGridBounds(
  fallback: PlotBounds,
  volumes: SpatialVolume[],
): PlotBounds {
  const stableBounds = resolveBounds(fallback);
  const paddedStableBounds = {
    minX: stableBounds.minX - STABLE_SUBSTRATE_MARGIN,
    maxX: stableBounds.maxX + STABLE_SUBSTRATE_MARGIN,
    minZ: stableBounds.minZ - STABLE_SUBSTRATE_MARGIN,
    maxZ: stableBounds.maxZ + STABLE_SUBSTRATE_MARGIN,
    maxHeight: stableBounds.maxHeight,
  };
  if (volumes.length === 0) return paddedStableBounds;

  return resolveBounds({
    minX: Math.min(
      paddedStableBounds.minX,
      ...volumes.map((volume) => volume.position.x - OVERRIDE_POSITION_MARGIN),
    ),
    maxX: Math.max(
      paddedStableBounds.maxX,
      ...volumes.map((volume) => volume.position.x + OVERRIDE_POSITION_MARGIN),
    ),
    minZ: Math.min(
      paddedStableBounds.minZ,
      ...volumes.map((volume) => volume.position.z - OVERRIDE_POSITION_MARGIN),
    ),
    maxZ: Math.max(
      paddedStableBounds.maxZ,
      ...volumes.map((volume) => volume.position.z + OVERRIDE_POSITION_MARGIN),
    ),
    maxHeight: stableBounds.maxHeight ?? fallback.maxHeight ?? 15,
  });
}

function substrateRadiusForVolume(volume: SpatialVolume): number {
  const base = Math.max(0.25, volume.canopyRadius || volume.footprintRadius);
  switch (volume.layer) {
    case "canopy":
    case "midstory":
      return Math.max(base * 2.2, 4.2);
    case "understory":
    case "shrub":
      return Math.max(base * 2.6, 4);
    case "herbaceous":
    case "groundcover":
    case "root":
      return Math.max(base * 6, 5.5);
    case "climber":
      return Math.max(base * 2.2, 1.6);
    default:
      return base;
  }
}

export function buildIntegrationScene(
  input: IntegrationSceneBuildInput,
): IntegrationSceneState {
  const seed = input.seed ?? "perillacove-integration-v1";
  const separateSoil = input.soilGrouping?.enabled ?? false;
  const spatial = computeSpatialVolumes(
    input.ingredients,
    input.year,
    { separateSoil },
    input.soilGrouping,
    input.respawnConfig,
    input.speciesCountConfig,
  );
  const volumes = applyOverrides(spatial.volumes, input.positionOverrides);
  const gridResolution =
    volumes.length >= 96
      ? LOW_PERFORMANCE_GRID_RESOLUTION
      : DEFAULT_GRID_RESOLUTION;
  const plantStructures = volumes.flatMap((volume) => {
    const sourceIngredientId = volume.sourceIngredientId ?? volume.ingredientId;
    const ingredient = IngredientMap[sourceIngredientId];
    if (!ingredient) return [];
    const sample = sampleTrajectoryForVolume(ingredient, volume, input.year);
    const animal = ingredient.properties.animalIntegration;
    if (animal?.kind === "grazer") {
      const stockingDensity = volumes.filter(
        (candidate) =>
          (candidate.sourceIngredientId ?? candidate.ingredientId) ===
          sourceIngredientId,
      ).length;
      return [
        createAnimalGrazerStructure(
          sample,
          {
            x: volume.position.x,
            z: volume.position.z,
            radius: substrateRadiusForVolume(volume),
            heightRange: volume.heightRange,
            layer: volume.layer,
          },
          {
            id: `animal:${volume.ingredientId}`,
            volumeId: volume.ingredientId,
            sourceIngredientId,
          },
          {
            stockingDensity,
            tramplingPressure: animal.turnover.tramplingPressure,
          },
        ),
      ];
    }
    return [
      createPlantStageStructure(
        sample,
        {
          x: volume.position.x,
          z: volume.position.z,
          radius: substrateRadiusForVolume(volume),
          heightRange: volume.heightRange,
          layer: volume.layer,
        },
        {
          id: `plant:${volume.ingredientId}`,
          volumeId: volume.ingredientId,
          sourceIngredientId,
        },
      ),
    ];
  });
  const additionalStructures = [
    ...addSoilGroupStructures(input, volumes),
    ...addDefaultMulch(volumes),
  ];
  const structures = [...plantStructures, ...additionalStructures];
  const activeDomainFootprints = structures.map((structure) => ({
    x: structure.footprint.x,
    z: structure.footprint.z,
    radius: structure.footprint.radius,
  }));
  const bounds = resolveStableGridBounds(spatial.bounds, volumes);
  const grid = createPlotGrid(bounds, gridResolution, activeDomainFootprints);

  const scene: IntegrationSceneState = {
    id: "integration-scene",
    seed,
    year: input.year,
    grid,
    bounds,
    structures,
    volumes,
    positionOverrides: input.positionOverrides ?? {},
    environment: {
      ...DEFAULT_INTEGRATION_ENVIRONMENT,
      ...(input.environment ?? {}),
    },
    hash: "",
  };
  scene.hash = hashString(stableStringify(structureHashInput(scene)));
  return scene;
}

export { stableStringify as stableIntegrationStringify, hashString };
