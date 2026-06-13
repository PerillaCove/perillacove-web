import type { Ingredient, GrowthFormType } from "../IngredientsPage/types";
import { IngredientMap } from "../IngredientsPage/data/species";
import { formatIngredientIdForDisplay } from "../../util/functions";
import type { TourHotspotBase, TourHotspotLegacy, TourLayer } from "./types";

type HotspotKnowledge = Pick<TourHotspotBase, "description" | "connections"> & {
  layers?: TourLayer[];
  layer?: TourLayer;
  shortLabel?: string;
  speciesName?: string;
};

export interface HotspotCoordinateSeed {
  id: string;
  x: number;
  y: number;
}

const LAYER_LABELS: Record<TourLayer, string> = {
  canopy: "Canopy",
  understory: "Understory",
  mid: "Mid-layer",
  ground: "Ground cover",
  edge: "Edge / Support",
};

const GROWTH_FORM_TO_LAYER: Record<GrowthFormType, TourLayer> = {
  canopy: "canopy",
  understory: "understory",
  midstory: "mid",
  climber: "mid",
  bushShrub: "edge",
  root: "ground",
  herbaceous: "ground",
  groundcover: "ground",
};

const HOTSPOT_KNOWLEDGE_BY_ID: Record<string, HotspotKnowledge> = {
  durian: {
    layer: "canopy",
    shortLabel: "Durian",
    description:
      "Durian is a vast harnesser of light. Its crown sits where light is highest and matches that light with a capacity nothing else in the system can offer. What it cannot use passes through softened, and the air beneath thickens with held humidity. Leaf fall returns light, captured and stored, back to the soil as supply for roots below.",
    connections: ["cacao", "banana", "jackfruit", "peanut"],
  },
  cacao: {
    layer: "understory",
    shortLabel: "Cacao",
    description:
      "Cacao is calibrated for the light that has already been worked through a canopy of jackfruit and durian. In open sun, its capacity is overrun and the system leaks. Its leaves drop into the same ground layer that feeds it, and its trunk-borne pods bring harvest and pollinator activity to a level the canopy cannot reach.",
    connections: ["durian", "jackfruit", "banana", "peanut"],
  },
  jackfruit: {
    layer: "canopy",
    shortLabel: "Jackfruit",
    description:
      "Jackfruit extends the canopy's reach. Along with durian, it raises the system's total harnessing of overhead light closer to the supply arriving. What its deep roots draw deep under earth returns as leaf and fruit fall above.",
    connections: ["durian", "cacao", "peanut"],
  },
  banana: {
    layer: "mid",
    shortLabel: "Banana",
    description:
      "Banana is the system's early harnesser. It matches the light supply that would otherwise reach bare ground, and its broad leaves turn that capture into shade and humidity at the levels beneath. Its stems fall, decompose quickly, and nourish the earth around them.",
    connections: ["durian", "cacao", "pigeon_pea", "peanut"],
  },
  pigeon_pea: {
    layer: "edge",
    shortLabel: "Pigeon Pea",
    description:
      "Pigeon pea, through its roots, pulls nitrogen from the air and deposits it where surrounding plants can take it up, turning an unused supply into one the whole system can harness.",
    connections: ["banana", "peanut", "cacao"],
  },
  peanut: {
    layer: "ground",
    shortLabel: "Peanut",
    description:
      "Peanut works the surface where light, water, and earth meet. Without something here, all three leak: light radiates back as heat, water evaporates, soil dries and loses biology. Peanut fixes nitrogen into the same ground its roots sit in, and the soil it shelters becomes the supply base every layer above eventually draws from.",
    connections: ["pigeon_pea", "cacao", "durian", "jackfruit"],
  },
  cow: {
    layer: "ground",
    shortLabel: "Cow",
    description:
      "Cow is calibrated to harness the biomass that the trees produce in excess of what the ground layer alone can decompose. It walks, it eats, and it returns that captured energy concentrated and ready, deposited where roots are already waiting to take it up.",
    connections: ["banana", "peanut", "pigeon_pea", "durian", "jackfruit"],
  },
  acacia: {
    layer: "canopy",
    shortLabel: "Acacia",
    description:
      "Acacia creates a high, breathable roof that turns hard light into moving shade. Its roots partner with soil microbes to fix nitrogen, and each pruning cycle returns fast biomass back to the ground. In this guild, acacia is not only height, it is the rhythm-setter for fertility, light, and recovery.",
    connections: ["curry_leaf", "wasabi"],
  },
  curry_leaf: {
    layer: "mid",
    shortLabel: "Curry Leaf",
    description:
      "Curry leaf lives in the aromatic middle where filtered light and warm air overlap. It can be harvested often without breaking the layer structure, so flavor, biomass, and habitat are produced together. By bridging canopy shade above and moist soil life below, it acts as the connective tissue of the guild.",
    connections: ["acacia", "wasabi"],
  },
  wasabi: {
    layer: "ground",
    shortLabel: "Wasabi",
    description:
      "Wasabi holds the quiet floor of the system, thriving where shade, mulch, and moisture stay steady. It protects exposed soil while converting cool, humid conditions into a high-value rhizome harvest. Its role is subtle but foundational: keep the ground alive, protected, and continuously productive.",
    connections: ["acacia", "curry_leaf"],
  },
  honey_locust: {
    layer: "canopy",
    shortLabel: "Honey Locust",
    description:
      "Honey locust functions as a rapid canopy scaffold that opens the system and then conditions it through patterned shade and leaf fall. As a nitrogen-fixing legume tree, it helps jump-start fertility while larger long-cycle structure settles in. Managed pruning turns its height into recurring mulch, so light control and soil feeding happen in the same loop.",
    connections: ["elderberry", "hosta"],
  },
  elderberry: {
    layer: "edge",
    shortLabel: "Elderberry",
    description:
      "Elderberry occupies the bright, breathable edge between canopy influence and open light. It responds quickly, flowers for pollinators, and produces fruit while still tolerating partial shade as the system thickens. In succession it acts as a bridge species: early abundance now, structural support while the forest matures.",
    connections: ["honey_locust", "hosta"],
  },
  hosta: {
    layer: "ground",
    shortLabel: "Hosta",
    description:
      "Hosta stabilizes the shaded floor where moisture and organic matter need to persist. Its broad leaves soften rain impact, protect soil biology, and maintain cool surface conditions under shrub and tree layers. It is a durable understory groundcover role: low disturbance, continuous cover, and steady edible leaf production.",
    connections: ["elderberry", "honey_locust"],
  },
};

const toTitleCaseWords = (value: string): string =>
  value
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

export const canonicalizeHotspotIdInput = (rawId: string): string =>
  rawId
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

export const deriveTourLayerFromIngredient = (
  ingredient: Ingredient,
): TourLayer => {
  const growthForms = ingredient.properties.growth?.growthForms ?? [];

  const priority: GrowthFormType[] = [
    "canopy",
    "understory",
    "midstory",
    "groundcover",
    "herbaceous",
    "root",
    "bushShrub",
    "climber",
  ];

  const selectedGrowthForm = priority.find((candidate) =>
    growthForms.includes(candidate),
  );

  if (!selectedGrowthForm) {
    return "edge";
  }

  return GROWTH_FORM_TO_LAYER[selectedGrowthForm] ?? "edge";
};

export const getLayerLabel = (layer: TourLayer): string => LAYER_LABELS[layer];
export const getLayerLabels = (layers: readonly TourLayer[]): string =>
  layers.map((layer) => getLayerLabel(layer)).join(", ");

const getDefaultSpeciesName = (id: string): string => {
  const readable = formatIngredientIdForDisplay(id)
    .replace(/\s*\([^)]*\)/g, "")
    .trim();
  return toTitleCaseWords(readable);
};

const buildFallbackDescription = (
  ingredient: Ingredient,
  layers: readonly TourLayer[],
): string => {
  const primaryLayer = layers[0] ?? "edge";
  const growthForms = ingredient.properties.growth?.growthForms;
  const successionPhase = ingredient.properties.succession?.successionalPhase;

  const growthText = growthForms?.length
    ? `${growthForms.join("/")} growth form`
    : "adaptive growth form";

  const successionText = successionPhase
    ? `It commonly acts in the ${successionPhase} phase of succession`
    : "It adapts to the current succession phase";

  return `${getDefaultSpeciesName(ingredient.id)} expresses a ${growthText} and occupies the ${getLayerLabel(primaryLayer)} in this view. ${successionText}, helping the forest layer itself through time while cycling biomass back into soil.`;
};

export const resolveHotspotById = (rawId: string): TourHotspotBase | null => {
  const id = canonicalizeHotspotIdInput(rawId);
  if (!id) return null;

  const ingredient = IngredientMap[id];
  if (!ingredient) return null;

  const knowledge = HOTSPOT_KNOWLEDGE_BY_ID[id];
  const derivedLayer = deriveTourLayerFromIngredient(ingredient);
  const layers =
    knowledge?.layers?.length && knowledge.layers.length > 0
      ? knowledge.layers
      : [knowledge?.layer ?? derivedLayer];
  const speciesName = knowledge?.speciesName ?? getDefaultSpeciesName(id);
  const shortLabel =
    knowledge?.shortLabel ?? `${speciesName} - ${getLayerLabels(layers)}`;

  return {
    id,
    ingredientId: id,
    kind: "ingredient",
    speciesName,
    layers,
    shortLabel,
    description:
      knowledge?.description ?? buildFallbackDescription(ingredient, layers),
    connections: knowledge?.connections ?? [],
  };
};

export const buildHotspotsFromCoordinates = (
  seeds: HotspotCoordinateSeed[],
): TourHotspotLegacy[] =>
  seeds
    .map((seed): TourHotspotLegacy | null => {
      const resolved = resolveHotspotById(seed.id);
      if (!resolved) return null;

      return {
        ...resolved,
        x: seed.x,
        y: seed.y,
      };
    })
    .filter((value): value is TourHotspotLegacy => value !== null);
