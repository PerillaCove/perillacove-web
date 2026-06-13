import type {
  PanoramaTourData,
  PanoramaTourDataV2,
  TourHotspotV2,
} from "../types";
import {
  buildHotspotsFromCoordinates,
  type HotspotCoordinateSeed,
} from "../hotspotKnowledge";
import { IngredientMap } from "../../IngredientsPage/data/species";
import {
  buildLayerPlacements,
  computeLayerDominanceByPhase,
  generateSuccessionNarrative,
} from "../../Forest/util";

export const SAMPLE_TROPICAL_COORDINATES: HotspotCoordinateSeed[] = [
  { id: "durian", x: 13, y: 33.58 },
  { id: "cacao", x: 30, y: 44 },
  { id: "jackfruit", x: 45, y: 44 },
  { id: "banana", x: 87, y: 39 },
  { id: "peanut", x: 46, y: 88 },
  { id: "pigeon_pea", x: 68, y: 95 },
  { id: "cow", x: 68, y: 72 },
  { id: "cow", x: 84, y: 79 },
];

export const SAMPLE_TROPICAL_SUBTITLE =
  "The brilliant synergy of durian and cacao, for starters.";

export const SAMPLE_TROPICAL_IMAGE_SRC =
  "https://assets.perillacove.com/t_panorama_3.webp";

/**
 * One-line switch for the sample tropical viewer:
 * true  -> live 3D forest scene (panorama image stays as the loading poster)
 * false -> original flat panorama image viewer
 */
export const SAMPLE_TROPICAL_USE_3D_SCENE = false;

const SAMPLE_SHOW_CANOPY_LAYER_NARRATIVE = true;
const SAMPLE_SEPARATE_SOIL = false;

const getUniqueIngredientIds = <T extends { id: string }>(
  seeds: readonly T[],
): string[] => [...new Set(seeds.map((seed) => seed.id))];

const EMPTY_STORY: PanoramaTourData["story"] = {
  establishment: "",
  transition: "",
  maturity: "",
};

function buildStoryFromForestNarrative(
  ingredientIds: readonly string[],
): PanoramaTourData["story"] {
  const sampleIngredients = ingredientIds
    .map((id) => IngredientMap[id])
    .filter(Boolean);

  if (sampleIngredients.length === 0) {
    return EMPTY_STORY;
  }

  const placements = buildLayerPlacements(sampleIngredients);
  const dominanceData = computeLayerDominanceByPhase(placements);
  const narratives = generateSuccessionNarrative(
    dominanceData,
    placements,
    false,
    SAMPLE_SHOW_CANOPY_LAYER_NARRATIVE,
    sampleIngredients.length,
    [],
    SAMPLE_SEPARATE_SOIL,
  );

  const getPhaseText = (
    phase: "establishment" | "transition" | "maturity",
  ): string => {
    const phaseNarrative = narratives.find((item) => item.phase === phase);
    return phaseNarrative?.sentences.join(" ").trim() ?? "";
  };

  return {
    establishment: getPhaseText("establishment"),
    transition: getPhaseText("transition"),
    maturity: getPhaseText("maturity"),
  };
}

const SAMPLE_TROPICAL_INGREDIENT_IDS = getUniqueIngredientIds(
  SAMPLE_TROPICAL_COORDINATES,
);
const SAMPLE_TROPICAL_SPECIES_IDS = [...SAMPLE_TROPICAL_INGREDIENT_IDS, "cow"];

export const SAMPLE_TROPICAL_STORY: PanoramaTourData["story"] =
  buildStoryFromForestNarrative(SAMPLE_TROPICAL_INGREDIENT_IDS);

const buildScene3dHotspots = (
  seeds: HotspotCoordinateSeed[],
): TourHotspotV2[] =>
  buildHotspotsFromCoordinates(seeds).map(
    ({ x, y, ...hotspot }): TourHotspotV2 => ({
      ...hotspot,
      position: { projection: "flat", x, y },
    }),
  );

export const sampleTropicalTour: PanoramaTourDataV2 = {
  id: "sample-tropical",
  title: "Tropical Drip",
  subtitle: SAMPLE_TROPICAL_SUBTITLE,
  story: SAMPLE_TROPICAL_STORY,
  source: {
    kind: "concept",
    label: "wide lens",
  },
  forestWorkspace: {
    speciesIds: SAMPLE_TROPICAL_SPECIES_IDS,
    speciesCountConfig: {
      cow: 7,
      banana: 4,
      peanut: 20,
      pigeon_pea: 10,
      cacao: 2,
      jackfruit: 1,
      durian: 1,
    },
    respawnConfig: {
      cow: 5,
      banana: 10,
      peanut: 30,
      pigeon_pea: 20,
      cacao: 2,
      jackfruit: 1,
      durian: 1,
    },
    showInHotspotStory: true,
  },
  initialNodeId: "sample-tropical-main",
  nodes: [
    {
      id: "sample-tropical-main",
      imageSrc: SAMPLE_TROPICAL_IMAGE_SRC,
      projection: SAMPLE_TROPICAL_USE_3D_SCENE ? "scene3d" : "flat",
      hotspots: buildScene3dHotspots(SAMPLE_TROPICAL_COORDINATES),
      links: [],
    },
  ],
};

export const PANORAMIC_TOURS: Record<string, PanoramaTourData> = {
  [sampleTropicalTour.id]: sampleTropicalTour,
};
