import type { Ingredient } from "../../../IngredientsPage/types";
import { formatIngredientIdForDisplay } from "../../../../util/functions";
import type { SpatialVolume } from "../../spatial";
import { getSpeciesIntensityAtYear } from "../../util";
import type { VerticalLayer } from "../../types";
import type { SpeciesTrajectory, SpeciesTrajectorySample } from "../types";
import {
  activateProfileTransformations,
  buildIngredientIntegrationProfile,
} from "../profiles";

const DEFAULT_LAYER: VerticalLayer = "herbaceous";

function layerBaseRadius(layer: VerticalLayer): number {
  switch (layer) {
    case "canopy":
      return 4;
    case "midstory":
      return 3;
    case "understory":
      return 2;
    case "shrub":
      return 1.5;
    case "groundcover":
      return 1.2;
    case "root":
      return 0.8;
    case "climber":
      return 1;
    case "herbaceous":
    default:
      return 0.9;
  }
}

function layerBaseHeight(layer: VerticalLayer): number {
  switch (layer) {
    case "canopy":
      return 14;
    case "midstory":
      return 8;
    case "understory":
      return 4;
    case "shrub":
      return 1.8;
    case "groundcover":
      return 0.3;
    case "root":
      return 0.25;
    case "climber":
      return 7;
    case "herbaceous":
    default:
      return 0.9;
  }
}

function buildSample(
  ingredient: Ingredient,
  year: number,
  volume?: SpatialVolume,
): SpeciesTrajectorySample {
  const integrationProfile = buildIngredientIntegrationProfile(ingredient);
  const layer = integrationProfile.structure.layer ?? DEFAULT_LAYER;
  const plantYear = integrationProfile.time.plantingWindow[0];
  const harvestStart = plantYear + integrationProfile.time.firstYield[0];
  const harvestEnd = harvestStart + integrationProfile.time.productiveWindow[0];
  const intensity =
    volume?.intensity ??
    getSpeciesIntensityAtYear(plantYear, harvestStart, harvestEnd, year);
  const maturity =
    volume?.growthMaturity ?? Math.max(0.08, Math.sqrt(intensity));
  const radius = Math.max(
    0.2,
    volume?.canopyRadius ?? layerBaseRadius(layer) * maturity,
  );
  const height = Math.max(
    0.2,
    volume?.heightRange[1] ?? layerBaseHeight(layer),
  );

  return {
    ingredientId: ingredient.id,
    label: formatIngredientIdForDisplay(ingredient.id),
    layer,
    ageYears: volume?.ageYears ?? Math.max(0, year - plantYear),
    intensity,
    maturity,
    radius,
    height,
    incomplete: integrationProfile.incomplete,
    lightDemand: integrationProfile.capacity.fire.value,
    waterDemand: integrationProfile.capacity.water.value,
    rootCapacity: integrationProfile.capacity.earth.value,
    litterSupply:
      integrationProfile.transformations.find(
        (transformation) => transformation.id === "leaf_litter",
      )?.rate ?? 0,
    airExchange: integrationProfile.capacity.air.value,
    nitrogenSupply:
      integrationProfile.transformations.find(
        (transformation) => transformation.id === "nitrogen_fixation",
      )?.rate ?? 0,
    integrationProfile,
    transformations: activateProfileTransformations(
      integrationProfile,
      intensity,
    ),
  };
}

export function buildSpeciesTrajectory(
  ingredient: Ingredient,
): SpeciesTrajectory {
  const integrationProfile = buildIngredientIntegrationProfile(ingredient);
  return {
    ingredient,
    incomplete: integrationProfile.incomplete,
    sampleAtYear: (year: number) => buildSample(ingredient, year),
  };
}

export function sampleTrajectoryForVolume(
  ingredient: Ingredient,
  volume: SpatialVolume,
  year: number,
): SpeciesTrajectorySample {
  return buildSample(ingredient, year, volume);
}
