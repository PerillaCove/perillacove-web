import {
  algaeGrowthLabelMap,
  fungiGrowthLabelMap,
  plantGrowthLabelMap,
} from "../growthLabels";
import { Ingredients } from "./data/species";
import { Ingredient, IngredientProperty } from "./types";
import { DropdownSection } from "../Dropdown";

// Type for growth property identifiers (not IngredientPropertyType, but string-based)
export type GrowthPropertyId = string;

export interface GrowthProperty extends Omit<IngredientProperty, "id"> {
  id: GrowthPropertyId;
}

export const GrowthOptions = (() => {
  const plantTokens = [
    "canopy",
    "midstory",
    "understory",
    "climber",
    "bushShrub",
    "root",
    "herbaceous",
    "groundcover",
    "full_sun",
    "partial_sun",
    "filtered_light",
    "shade_tolerant",
    "shade_loving",
    "annual",
    "biennial",
    "perennial",
    "short_lived_perennial",
    "self_seeding",
    // "low",
    // "medium",
    // "high",
    // "emergent",
    // @height-edit
    "hardy",
    "semi_hardy",
    "frost_sensitive",
    "frost_intolerant",
    "dry",
    "moist_well_drained",
    "water_edge",
    "deep_groundwater",
    "standing_water",
    "arid_air",
    "semi_arid_air",
    "moderate_humidity",
    "humid_air",
    "saturated_air",
  ] as const;

  const fungiTokens = [
    "surface",
    "shallow_soil",
    "deep_soil",
    "no_light_needed",
    "low_light",
    "surface_shaded",
    "persistent_mycelium",
    "short_lived_mycelium",
    "mycorrhizal",
    "saprophytic",
    "parasitic",
    "cool_tolerant",
    "cold_tolerant",
    "warm_preferring",
    "moist",
    "humid_substrate",
    "well_drained",
    "dry_forest_floor",
    "damp_forest_floor",
  ] as const;

  const algaeTokens = [
    "freshwater",
    "saltwater",
    "brackish",
    "alkaline_lake",
    "marine_coastal",
    "marine_open",
    "full_sun",
    "bright_water",
    "low_light",
    "surface_float",
    "free_floating",
    "rock_attached",
    "sediment_rooted",
    "surface_mat",
    "cold_tolerant",
    "cool_preferring",
    "warm_preferring",
    "heat_tolerant",
    "fully_aquatic",
    "surface_aquatic",
    "intertidal",
    "continuous",
    "seasonal_bloom",
    "sporadic",
  ] as const;

  const MAX_STATIC_GROWTH_EXAMPLES = 1000;

  type TokenExamples = Record<string, string[]>;

  const initExampleBuckets = (tokens: readonly string[]): TokenExamples =>
    tokens.reduce<TokenExamples>((acc, token) => {
      acc[token] = [];
      return acc;
    }, {} as TokenExamples);

  const addExampleIfRoom = (
    bucketMap: TokenExamples,
    token: string,
    ingredientId: string,
  ) => {
    if (!(token in bucketMap)) {
      return;
    }
    const bucket = bucketMap[token];
    if (
      bucket.includes(ingredientId) ||
      bucket.length >= MAX_STATIC_GROWTH_EXAMPLES
    ) {
      return;
    }
    bucket.push(ingredientId);
  };

  const collectExamples = (
    tokens: readonly string[],
    extractor: (ingredient: Ingredient) => Array<readonly string[] | undefined>,
  ): TokenExamples => {
    const bucketMap = initExampleBuckets(tokens);
    Ingredients.forEach((ingredient) => {
      extractor(ingredient).forEach((group) => {
        group?.forEach((token) => {
          addExampleIfRoom(bucketMap, token as string, ingredient.id);
        });
      });
    });
    return bucketMap;
  };

  const plantTokenToExamples = collectExamples(plantTokens, (ingredient) => {
    const growth = ingredient.properties.growth;
    if (!growth) return [];
    return [
      growth.growthForms,
      growth.lightPreferences,
      growth.lifeCycles,
      growth.heightClasses,
      growth.frostTolerances,
      growth.soilPreferences,
      growth.airHumidityPreferences,
    ];
  });

  const fungiTokenToExamples = collectExamples(fungiTokens, (ingredient) => {
    const fungiGrowth = ingredient.properties.fungiGrowth;
    if (!fungiGrowth) return [];
    return [
      fungiGrowth.substrateDepths,
      fungiGrowth.lightPreferences,
      fungiGrowth.lifeCycles,
      fungiGrowth.growthForms,
      fungiGrowth.temperatureTolerances,
      fungiGrowth.soilPreferences,
    ];
  });

  const algaeTokenToExamples = collectExamples(algaeTokens, (ingredient) => {
    const algaeGrowth = ingredient.properties.algaeGrowth;
    if (!algaeGrowth) return [];
    return [
      algaeGrowth.habitats,
      algaeGrowth.lightPreferences,
      algaeGrowth.substrates,
      algaeGrowth.temperatureTolerances,
      algaeGrowth.soilPreferences,
      algaeGrowth.lifeCycles,
    ];
  });

  const allTokens = Array.from(
    new Set<string>([...plantTokens, ...fungiTokens, ...algaeTokens]),
  );

  const buildTokenLabelMap = (
    tokens: readonly string[],
    source: Record<string, string>,
  ) =>
    Object.fromEntries(
      tokens.map((token) => [token, source[token] ?? token.replace(/_/g, " ")]),
    );

  const plantTokenToLabel = buildTokenLabelMap(
    plantTokens,
    plantGrowthLabelMap,
  );
  const fungiTokenToLabel = buildTokenLabelMap(
    fungiTokens,
    fungiGrowthLabelMap,
  );
  const algaeTokenToLabel = buildTokenLabelMap(
    algaeTokens,
    algaeGrowthLabelMap,
  );

  const invertMap = (record: Record<string, string>) =>
    Object.fromEntries(
      Object.entries(record).map(([token, label]) => [label, token]),
    );

  const plantLabelToToken = invertMap(plantTokenToLabel);
  const fungiLabelToToken = invertMap(fungiTokenToLabel);
  const algaeLabelToToken = invertMap(algaeTokenToLabel);

  const legacyTokenToLabel: Record<string, string> = {
    ...algaeTokenToLabel,
    ...fungiTokenToLabel,
    ...plantTokenToLabel,
  };

  const tokenToDescription: Record<string, string> = {
    // Plant growth forms
    canopy: "Tall fruiting or structural trees that form the roof.",
    midstory: "Medium height trees that live between canopy and understory.",
    understory: "Shorter plants that live beneath canopy shade.",
    climber: "Vines that use other layers as support.",
    bushShrub: "Woody plants below tree height.",
    root: "Plants grown for underground parts.",
    herbaceous: "Soft stemmed plants, annuals or perennials.",
    groundcover: "Low spreaders that protect soil.",
    // Plant light
    full_sun: "Prefers strong, direct sunlight for most (or all) of the day.",
    partial_sun:
      "Prefers direct sun only for a few hours, then shade the rest of the time.",
    filtered_light:
      "Prefers softened, indirect light that passes through leaves or canopy.",
    shade_tolerant: "Prefers low direct light and/or dim conditions.",
    shade_loving:
      "Prefers very low light under dense canopy where sun almost never reaches.",
    // Plant lifecycle
    annual:
      "Sprouts, grows, flowers, and reproduces in a single growing season, then dies after producing seed.",
    biennial:
      "Grows leaves in the first year, flowers and sets seed in the second year, then dies.",
    perennial:
      "Lives for many years and keeps growing and producing season after season.",
    short_lived_perennial:
      "Lives more than one season but only a few years before declining.",
    self_seeding:
      "Technically dies each year but drops seeds that regrow it every season.",
    // Plant height (no explicit comments; concise descriptions)
    low: "Low-lying plant height.",
    medium: "Medium plant height.",
    high: "Tall plant height.",
    emergent: "Emergent height above surrounding canopy.",
    // Plant frost tolerance
    hardy: "Survives deep winter freezes and repeated frost without damage.",
    semi_hardy:
      "Handles light frost but may be damaged by long or severe freezes.",
    frost_sensitive:
      "Injured or stunted by frost; survives only brief, mild cold.",
    frost_intolerant:
      "Dies when exposed to any frost or freezing temperatures.",
    // Plant moisture
    dry: "Prefers soil with fast drainage and low water retention, leaving roots in consistently aerated, drought-prone conditions.",
    moist_well_drained:
      "Prefers soil that holds steady moisture but still drains excess water, keeping roots moist yet oxygenated.",
    water_edge:
      "Prefers soil that is saturated or seasonally flooded, staying wet but not fully submerged for long periods.",
    deep_groundwater:
      "Prefers soil with a dry surface where plants rely on deep taproots to reach stable subsurface moisture.",
    standing_water:
      "Prefers soil fully submerged in shallow, still water where roots live in anoxic, aquatic conditions.",
    // Plant air humidity
    arid_air:
      "Prefers dry, low humidity air where evaporation is high and foliage stays crisp. Ideal for plants adapted to Mediterranean hillsides or desert edges that rely on sharp daily drying cycles.",
    semi_arid_air:
      "Tolerates slightly dry ambient conditions with occasional humidity spikes. Thrives where mornings are cool and afternoons pull moisture away from leaves.",
    moderate_humidity:
      "Grows best in balanced air moisture that neither dries leaves nor saturates them. Common among temperate fruit trees that rely on gentle seasonal humidity swings.",
    humid_air:
      "Needs warm, moisture rich air that wraps the foliage in soft humidity through most of the day. Typical of tropical species that evolved under dense canopies with minimal drying winds.",
    saturated_air:
      "Prefers air that is nearly moisture saturated, where mist, fog, or constant transpiration keep humidity close to its upper limit. Found in cloud forest species and plants that never expect their leaves to fully dry.",
    // Fungi substrate depths
    surface: "Fruiting bodies form on wood or leaf litter.",
    shallow_soil: "A few centimeters deep.",
    deep_soil: "Ectomycorrhizal or truffles forming tens of cm underground.",
    // Fungi light
    no_light_needed: "Underground or low-light environments; light irrelevant.",
    low_light: "Indirect or dim light preferred for fruiting.",
    surface_shaded: "Grows at soil surface under forest shade.",
    // Fungi lifecycle
    persistent_mycelium:
      "Lives multiple years, fruits seasonally (true for truffles).",
    short_lived_mycelium:
      "Lives one season or relies on rapidly cycling substrates.",
    // Fungi forms
    mycorrhizal:
      "Lives in symbiosis with plant roots (truffles, chanterelles).",
    saprophytic: "Breaks down dead wood or leaf litter (shiitake, oyster).",
    parasitic: "Lives on living hosts (less common for culinary species).",
    // Fungi temperature
    cool_tolerant: "Can handle cool soil; dormant in winter.",
    cold_tolerant: "Can overwinter in freezing soils (truffles, morels).",
    warm_preferring: "Prefers warm season substrates (oysters on logs, etc).",
    // Fungi moisture
    moist: "Needs consistent moisture.",
    humid_substrate: "High humidity inside substrate but not waterlogged.",
    well_drained: "Cannot tolerate waterlogging; needs airflow.",
    dry_forest_floor:
      "Prefers loose, aerated, fast draining duff under conifers or mixed woods; low surface moisture with periodic rainfall. Typical for matsutake, porcini, and some truffles.",
    damp_forest_floor:
      "Moist leaf litter and humus under shade; consistently damp but not saturated. Ideal for Russula, Lactarius, hedgehogs, chanterelles, and many mycorrhizal forest mushrooms.",
    // Algae habitats
    freshwater: "Freshwater habitats.",
    saltwater: "Saltwater habitats.",
    brackish: "Brackish water habitats.",
    alkaline_lake: "High pH lakes; spirulina’s true home.",
    marine_coastal: "Seaweed beds, nori, kelp.",
    marine_open: "Free floating ocean algae.",
    // Algae light
    bright_water: "Strong underwater light; kelp, pond algae.",
    surface_float: "Species that float at the water surface.",
    // Algae substrates
    free_floating: "Free-floating forms (e.g., spirulina, chlorella).",
    rock_attached: "Rock-attached forms (e.g., kelp, nori).",
    sediment_rooted: "Sediment-rooted forms (some macroalgae).",
    surface_mat: "Floating mats and bloom layers.",
    // Algae temperature
    heat_tolerant: "Thrives in very warm water.",
    cool_preferring: "Prefers cool water.",
    // Algae moisture
    fully_aquatic: "Submerged, always underwater.",
    surface_aquatic: "Lives at the top layer of water; spirulina.",
    intertidal: "Exposed with tides (e.g., nori, sea lettuce).",
    // Algae lifecycle
    continuous: "Keeps reproducing as long as conditions allow.",
    seasonal_bloom: "Appears in warm seasons.",
    sporadic: "Cycles based on nutrients and temperature.",
  };

  const labels = allTokens.map(
    (t) => legacyTokenToLabel[t] ?? t.replace(/_/g, " "),
  );

  return {
    allTokens,
    plantTokens: plantTokens as unknown as string[],
    fungiTokens: fungiTokens as unknown as string[],
    algaeTokens: algaeTokens as unknown as string[],
    tokenToLabel: legacyTokenToLabel,
    labelToToken: Object.fromEntries(
      Object.entries(legacyTokenToLabel).map(([token, label]) => [
        label,
        token,
      ]),
    ) as Record<string, string>,
    plantTokenToLabel,
    fungiTokenToLabel,
    algaeTokenToLabel,
    plantLabelToToken,
    fungiLabelToToken,
    algaeLabelToToken,
    plantTokenToExamples,
    fungiTokenToExamples,
    algaeTokenToExamples,
    labels,
    tokenToDescription,
  };
})();

// Background theme classes for growth properties based on category
const growthCategoryBgClasses: Record<string, string> = {
  // Plant - lifecycle (sky)
  annual:
    "bg-gradient-to-r from-sky-100 to-sky-300 dark:from-sky-200 dark:to-sky-400",
  biennial:
    "bg-gradient-to-r from-sky-100 to-sky-300 dark:from-sky-200 dark:to-sky-400",
  perennial:
    "bg-gradient-to-r from-sky-100 to-sky-300 dark:from-sky-200 dark:to-sky-400",
  short_lived_perennial:
    "bg-gradient-to-r from-sky-100 to-sky-300 dark:from-sky-200 dark:to-sky-400",
  self_seeding:
    "bg-gradient-to-r from-sky-100 to-sky-300 dark:from-sky-200 dark:to-sky-400",
  // Plant - growth form (green)
  canopy:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  midstory:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  understory:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  climber:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  bushShrub:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  root: "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  herbaceous:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  groundcover:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  // Plant - light (amber)
  full_sun:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  partial_sun:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  filtered_light:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  shade_tolerant:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  shade_loving:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  // Plant - frost (indigo)
  hardy:
    "bg-gradient-to-r from-indigo-100 to-indigo-300 dark:from-indigo-200 dark:to-indigo-400",
  semi_hardy:
    "bg-gradient-to-r from-indigo-100 to-indigo-300 dark:from-indigo-200 dark:to-indigo-400",
  frost_sensitive:
    "bg-gradient-to-r from-indigo-100 to-indigo-300 dark:from-indigo-200 dark:to-indigo-400",
  frost_intolerant:
    "bg-gradient-to-r from-indigo-100 to-indigo-300 dark:from-indigo-200 dark:to-indigo-400",
  // Plant - moisture (cyan)
  dry: "bg-gradient-to-r from-cyan-100 to-cyan-300 dark:from-cyan-200 dark:to-cyan-400",
  moist_well_drained:
    "bg-gradient-to-r from-cyan-100 to-cyan-300 dark:from-cyan-200 dark:to-cyan-400",
  water_edge:
    "bg-gradient-to-r from-cyan-100 to-cyan-300 dark:from-cyan-200 dark:to-cyan-400",
  deep_groundwater:
    "bg-gradient-to-r from-cyan-100 to-cyan-300 dark:from-cyan-200 dark:to-cyan-400",
  standing_water:
    "bg-gradient-to-r from-cyan-100 to-cyan-300 dark:from-cyan-200 dark:to-cyan-400",
  // Plant - air humidity (slate)
  arid_air:
    "bg-gradient-to-r from-slate-100 to-slate-300 dark:from-slate-200 dark:to-slate-400",
  semi_arid_air:
    "bg-gradient-to-r from-slate-100 to-slate-300 dark:from-slate-200 dark:to-slate-400",
  moderate_humidity:
    "bg-gradient-to-r from-slate-100 to-slate-300 dark:from-slate-200 dark:to-slate-400",
  humid_air:
    "bg-gradient-to-r from-slate-100 to-slate-300 dark:from-slate-200 dark:to-slate-400",
  saturated_air:
    "bg-gradient-to-r from-slate-100 to-slate-300 dark:from-slate-200 dark:to-slate-400",
  // Fungi - lifecycle (sky)
  persistent_mycelium:
    "bg-gradient-to-r from-sky-100 to-sky-300 dark:from-sky-200 dark:to-sky-400",
  short_lived_mycelium:
    "bg-gradient-to-r from-sky-100 to-sky-300 dark:from-sky-200 dark:to-sky-400",
  // Fungi - growth form (green)
  mycorrhizal:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  saprophytic:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  parasitic:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  // Fungi - substrate depth (emerald)
  surface:
    "bg-gradient-to-r from-emerald-100 to-emerald-300 dark:from-emerald-200 dark:to-emerald-400",
  shallow_soil:
    "bg-gradient-to-r from-emerald-100 to-emerald-300 dark:from-emerald-200 dark:to-emerald-400",
  deep_soil:
    "bg-gradient-to-r from-emerald-100 to-emerald-300 dark:from-emerald-200 dark:to-emerald-400",
  // Fungi - light (amber)
  no_light_needed:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  low_light:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  surface_shaded:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  // Fungi - temperature (indigo)
  cool_tolerant:
    "bg-gradient-to-r from-indigo-100 to-indigo-300 dark:from-indigo-200 dark:to-indigo-400",
  cold_tolerant:
    "bg-gradient-to-r from-indigo-100 to-indigo-300 dark:from-indigo-200 dark:to-indigo-400",
  warm_preferring:
    "bg-gradient-to-r from-indigo-100 to-indigo-300 dark:from-indigo-200 dark:to-indigo-400",
  // Fungi - moisture (cyan)
  moist:
    "bg-gradient-to-r from-cyan-100 to-cyan-300 dark:from-cyan-200 dark:to-cyan-400",
  humid_substrate:
    "bg-gradient-to-r from-cyan-100 to-cyan-300 dark:from-cyan-200 dark:to-cyan-400",
  well_drained:
    "bg-gradient-to-r from-cyan-100 to-cyan-300 dark:from-cyan-200 dark:to-cyan-400",
  dry_forest_floor:
    "bg-gradient-to-r from-cyan-100 to-cyan-300 dark:from-cyan-200 dark:to-cyan-400",
  damp_forest_floor:
    "bg-gradient-to-r from-cyan-100 to-cyan-300 dark:from-cyan-200 dark:to-cyan-400",
  // Algae - habitat (emerald)
  freshwater:
    "bg-gradient-to-r from-emerald-100 to-emerald-300 dark:from-emerald-200 dark:to-emerald-400",
  saltwater:
    "bg-gradient-to-r from-emerald-100 to-emerald-300 dark:from-emerald-200 dark:to-emerald-400",
  brackish:
    "bg-gradient-to-r from-emerald-100 to-emerald-300 dark:from-emerald-200 dark:to-emerald-400",
  alkaline_lake:
    "bg-gradient-to-r from-emerald-100 to-emerald-300 dark:from-emerald-200 dark:to-emerald-400",
  marine_coastal:
    "bg-gradient-to-r from-emerald-100 to-emerald-300 dark:from-emerald-200 dark:to-emerald-400",
  marine_open:
    "bg-gradient-to-r from-emerald-100 to-emerald-300 dark:from-emerald-200 dark:to-emerald-400",
  // Algae - light (amber)
  bright_water:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  surface_float:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  // Algae - substrate (green)
  free_floating:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  rock_attached:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  sediment_rooted:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  surface_mat:
    "bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400",
  // Algae - temperature (indigo)
  heat_tolerant:
    "bg-gradient-to-r from-indigo-100 to-indigo-300 dark:from-indigo-200 dark:to-indigo-400",
  cool_preferring:
    "bg-gradient-to-r from-indigo-100 to-indigo-300 dark:from-indigo-200 dark:to-indigo-400",
  // Algae - moisture (cyan)
  fully_aquatic:
    "bg-gradient-to-r from-cyan-100 to-cyan-300 dark:from-cyan-200 dark:to-cyan-400",
  surface_aquatic:
    "bg-gradient-to-r from-cyan-100 to-cyan-300 dark:from-cyan-200 dark:to-cyan-400",
  intertidal:
    "bg-gradient-to-r from-cyan-100 to-cyan-300 dark:from-cyan-200 dark:to-cyan-400",
  // Algae - lifecycle (sky)
  continuous:
    "bg-gradient-to-r from-sky-100 to-sky-300 dark:from-sky-200 dark:to-sky-400",
  seasonal_bloom:
    "bg-gradient-to-r from-sky-100 to-sky-300 dark:from-sky-200 dark:to-sky-400",
  sporadic:
    "bg-gradient-to-r from-sky-100 to-sky-300 dark:from-sky-200 dark:to-sky-400",
};

function createGrowthProperty(
  token: string,
  labelMap: Record<string, string>,
  descriptionMap: Record<string, string>,
  examplesMap: Record<string, string[]>,
): GrowthProperty {
  return {
    id: token,
    name: labelMap[token] ?? token.replace(/_/g, " "),
    description: descriptionMap[token],
    examples: examplesMap[token],
    bgThemeClasses:
      growthCategoryBgClasses[token] ??
      "bg-gradient-to-r from-neutral-100 to-neutral-300 dark:from-neutral-200 dark:to-neutral-400",
  };
}

export const PlantGrowthProperties: GrowthProperty[] =
  GrowthOptions.plantTokens.map((token) =>
    createGrowthProperty(
      token,
      GrowthOptions.plantTokenToLabel,
      GrowthOptions.tokenToDescription,
      GrowthOptions.plantTokenToExamples,
    ),
  );

export const FungiGrowthProperties: GrowthProperty[] =
  GrowthOptions.fungiTokens.map((token) =>
    createGrowthProperty(
      token,
      GrowthOptions.fungiTokenToLabel,
      GrowthOptions.tokenToDescription,
      GrowthOptions.fungiTokenToExamples,
    ),
  );

export const AlgaeGrowthProperties: GrowthProperty[] =
  GrowthOptions.algaeTokens.map((token) =>
    createGrowthProperty(
      token,
      GrowthOptions.algaeTokenToLabel,
      GrowthOptions.tokenToDescription,
      GrowthOptions.algaeTokenToExamples,
    ),
  );

// Maps for quick lookup
export const PlantGrowthPropertyMap: Record<string, GrowthProperty> =
  PlantGrowthProperties.reduce(
    (acc, prop) => ({ ...acc, [prop.id]: prop }),
    {} as Record<string, GrowthProperty>,
  );

export const FungiGrowthPropertyMap: Record<string, GrowthProperty> =
  FungiGrowthProperties.reduce(
    (acc, prop) => ({ ...acc, [prop.id]: prop }),
    {} as Record<string, GrowthProperty>,
  );

export const AlgaeGrowthPropertyMap: Record<string, GrowthProperty> =
  AlgaeGrowthProperties.reduce(
    (acc, prop) => ({ ...acc, [prop.id]: prop }),
    {} as Record<string, GrowthProperty>,
  );

// Section structures for organized dropdowns
export const PlantGrowthSections: DropdownSection[] = [
  {
    label: "Growth Form",
    options: [
      "canopy",
      "midstory",
      "understory",
      "climber",
      "bushShrub",
      "root",
      "herbaceous",
      "groundcover",
    ].map((t) => GrowthOptions.plantTokenToLabel[t] ?? t.replace(/_/g, " ")),
  },
  {
    label: "Light Preference",
    options: [
      "full_sun",
      "partial_sun",
      "filtered_light",
      "shade_tolerant",
      "shade_loving",
    ].map((t) => GrowthOptions.plantTokenToLabel[t] ?? t.replace(/_/g, " ")),
  },
  {
    label: "Life Cycle",
    onlyOne: true,
    options: [
      "annual",
      "biennial",
      "perennial",
      "short_lived_perennial",
      "self_seeding",
    ].map((t) => GrowthOptions.plantTokenToLabel[t] ?? t.replace(/_/g, " ")),
  },
  {
    label: "Frost Tolerance",
    options: ["hardy", "semi_hardy", "frost_sensitive", "frost_intolerant"].map(
      (t) => GrowthOptions.plantTokenToLabel[t] ?? t.replace(/_/g, " "),
    ),
  },
  {
    label: "Moisture Preference",
    options: [
      "dry",
      "moist_well_drained",
      "water_edge",
      "deep_groundwater",
      "standing_water",
    ].map((t) => GrowthOptions.plantTokenToLabel[t] ?? t.replace(/_/g, " ")),
  },
  {
    label: "Air Humidity",
    options: [
      "arid_air",
      "semi_arid_air",
      "moderate_humidity",
      "humid_air",
      "saturated_air",
    ].map((t) => GrowthOptions.plantTokenToLabel[t] ?? t.replace(/_/g, " ")),
  },
];

export const FungiGrowthSections: DropdownSection[] = [
  {
    label: "Substrate Depth",
    options: ["surface", "shallow_soil", "deep_soil"].map(
      (t) => GrowthOptions.fungiTokenToLabel[t] ?? t.replace(/_/g, " "),
    ),
  },
  {
    label: "Light Preference",
    options: ["no_light_needed", "low_light", "surface_shaded"].map(
      (t) => GrowthOptions.fungiTokenToLabel[t] ?? t.replace(/_/g, " "),
    ),
  },
  {
    label: "Life Cycle",
    onlyOne: true,
    options: ["persistent_mycelium", "short_lived_mycelium"].map(
      (t) => GrowthOptions.fungiTokenToLabel[t] ?? t.replace(/_/g, " "),
    ),
  },
  {
    label: "Growth Form",
    options: ["mycorrhizal", "saprophytic", "parasitic"].map(
      (t) => GrowthOptions.fungiTokenToLabel[t] ?? t.replace(/_/g, " "),
    ),
  },
  {
    label: "Temperature Tolerance",
    options: ["cool_tolerant", "cold_tolerant", "warm_preferring"].map(
      (t) => GrowthOptions.fungiTokenToLabel[t] ?? t.replace(/_/g, " "),
    ),
  },
  {
    label: "Moisture Preference",
    options: [
      "moist",
      "humid_substrate",
      "well_drained",
      "dry_forest_floor",
      "damp_forest_floor",
    ].map((t) => GrowthOptions.fungiTokenToLabel[t] ?? t.replace(/_/g, " ")),
  },
];

export const AlgaeGrowthSections: DropdownSection[] = [
  {
    label: "Habitat",
    options: [
      "freshwater",
      "saltwater",
      "brackish",
      "alkaline_lake",
      "marine_coastal",
      "marine_open",
    ].map((t) => GrowthOptions.algaeTokenToLabel[t] ?? t.replace(/_/g, " ")),
  },
  {
    label: "Light Preference",
    options: ["full_sun", "bright_water", "low_light", "surface_float"].map(
      (t) => GrowthOptions.algaeTokenToLabel[t] ?? t.replace(/_/g, " "),
    ),
  },
  {
    label: "Substrate",
    options: [
      "free_floating",
      "rock_attached",
      "sediment_rooted",
      "surface_mat",
    ].map((t) => GrowthOptions.algaeTokenToLabel[t] ?? t.replace(/_/g, " ")),
  },
  {
    label: "Temperature Tolerance",
    options: [
      "cold_tolerant",
      "cool_preferring",
      "warm_preferring",
      "heat_tolerant",
    ].map((t) => GrowthOptions.algaeTokenToLabel[t] ?? t.replace(/_/g, " ")),
  },
  {
    label: "Moisture Preference",
    options: ["fully_aquatic", "surface_aquatic", "intertidal"].map(
      (t) => GrowthOptions.algaeTokenToLabel[t] ?? t.replace(/_/g, " "),
    ),
  },
  {
    label: "Life Cycle",
    onlyOne: true,
    options: ["continuous", "seasonal_bloom", "sporadic"].map(
      (t) => GrowthOptions.algaeTokenToLabel[t] ?? t.replace(/_/g, " "),
    ),
  },
];

// ============================================================
// Succession and Climate Profile Options
// ============================================================

// Succession tokens
export const successionTokens = {
  successionalPhase: ["pioneer", "early", "mid", "late", "legacy"] as const,
  establishmentLight: [
    "full_sun",
    "filtered_light",
    "deep_shade",
    "partial_sun",
  ] as const,
  managementRotation: ["short_rotation", "medium_rotation", "keep"] as const,
};

// Label maps for succession properties
export const successionLabelMap: Record<string, string> = {
  // Successional Phase
  pioneer: "Pioneer",
  early: "Early",
  mid: "Mid",
  late: "Late",
  legacy: "Legacy",
  // Establishment Light
  full_sun: "Full Sun",
  filtered_light: "Filtered Light",
  deep_shade: "Deep Shade",
  partial_sun: "Partial Sun",
  // Management Rotation
  short_rotation: "Short Rotation",
  medium_rotation: "Medium Rotation",
  keep: "Keep",
  // Years to Harvest
  harvest_quick: "Quick (1-2 years)",
  harvest_medium: "Medium (3-5 years)",
  harvest_slow: "Slow (6-10 years)",
  harvest_very_slow: "Very Slow (10+ years)",
  // Productive Lifespan
  lifespan_short: "Short (1-5 years)",
  lifespan_medium: "Medium (5-20 years)",
  lifespan_long: "Long (20-50 years)",
  lifespan_permanent: "Permanent (50+ years)",
};

// Years to harvest categories
export const yearsToHarvestTokens = [
  "harvest_quick",
  "harvest_medium",
  "harvest_slow",
  "harvest_very_slow",
] as const;

export const yearsToHarvestLabelMap: Record<string, string> = {
  harvest_quick: "Quick (1-2 years)",
  harvest_medium: "Medium (3-5 years)",
  harvest_slow: "Slow (6-10 years)",
  harvest_very_slow: "Very Slow (10+ years)",
};

export const yearsToHarvestRanges: Record<string, [number, number]> = {
  harvest_quick: [0, 2],
  harvest_medium: [3, 5],
  harvest_slow: [6, 10],
  harvest_very_slow: [10, 100],
};

// Productive lifespan categories
export const productiveLifespanTokens = [
  "lifespan_short",
  "lifespan_medium",
  "lifespan_long",
  "lifespan_permanent",
] as const;

export const productiveLifespanLabelMap: Record<string, string> = {
  lifespan_short: "Short (1-5 years)",
  lifespan_medium: "Medium (5-20 years)",
  lifespan_long: "Long (20-50 years)",
  lifespan_permanent: "Permanent (50+ years)",
};

export const productiveLifespanRanges: Record<string, [number, number]> = {
  lifespan_short: [0, 5],
  lifespan_medium: [5, 20],
  lifespan_long: [20, 50],
  lifespan_permanent: [50, 1000],
};

// Inverse map for label to token
export const successionLabelToToken: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(successionLabelMap).map(([token, label]) => [label, token]),
  ),
  ...Object.fromEntries(
    Object.entries(yearsToHarvestLabelMap).map(([token, label]) => [
      label,
      token,
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(productiveLifespanLabelMap).map(([token, label]) => [
      label,
      token,
    ]),
  ),
};

// Descriptions for succession properties
export const successionDescriptionMap: Record<string, string> = {
  // Ecological Role
  pioneer:
    "Fast-growing, short-lived species that build shade and biomass. First to establish in open ground.",
  early:
    "Early fruiting or shrub layer species. Establishes quickly but gives way to larger plants over time.",
  mid: "Midstory species that provide stable structure. Fills the space between canopy and understory.",
  late: "Canopy or long-lived midstory species. Takes years to mature but dominates the system.",
  legacy:
    "Very long-lived species that define the final structure. The permanent backbone of the system.",
  // Establishment Light
  full_sun:
    "Wants full exposure even as a seedling. Plant in open areas with no shade.",
  filtered_light:
    "Wants nurse shade at establishment. Benefits from dappled light through other plants.",
  deep_shade:
    "Understory species that never wants strong direct sun. Thrives under dense canopy.",
  partial_sun:
    "Wants some sun but not full exposure. Tolerates morning sun or afternoon shade.",
  // Management Rotation
  short_rotation:
    "Should be aggressively pruned or culled. Designed to be replaced as the system matures.",
  medium_rotation:
    "Moderate pruning or occasional replacement. Useful for several years before declining.",
  keep: "Permanent fixture in the system. Minimal pruning, allowed to reach full maturity.",
};

// Colors for ecological roles (matching Forest component)
export const successionalPhaseColors: Record<string, string> = {
  pioneer: "#22c55e", // green
  early: "#84cc16", // lime
  mid: "#eab308", // yellow
  late: "#f97316", // orange
  legacy: "#8b5cf6", // purple
};

// Tailwind classes for ecological role badges
export const successionalPhaseBgClasses: Record<string, string> = {
  pioneer:
    "bg-gradient-to-r from-green-200 to-green-300 dark:from-green-700 dark:to-green-600",
  early:
    "bg-gradient-to-r from-lime-200 to-lime-300 dark:from-lime-700 dark:to-lime-600",
  mid: "bg-gradient-to-r from-yellow-200 to-yellow-300 dark:from-yellow-700 dark:to-yellow-600",
  late: "bg-gradient-to-r from-orange-200 to-orange-300 dark:from-orange-700 dark:to-orange-600",
  legacy:
    "bg-gradient-to-r from-purple-200 to-purple-300 dark:from-purple-700 dark:to-purple-600",
};

// Background classes for all succession properties
export const successionBgClasses: Record<string, string> = {
  // Ecological Role (same as above)
  ...successionalPhaseBgClasses,
  // Establishment Light (amber theme)
  full_sun:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  filtered_light:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  deep_shade:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  partial_sun:
    "bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400",
  // Management Rotation (slate theme)
  short_rotation:
    "bg-gradient-to-r from-slate-100 to-slate-300 dark:from-slate-200 dark:to-slate-400",
  medium_rotation:
    "bg-gradient-to-r from-slate-100 to-slate-300 dark:from-slate-200 dark:to-slate-400",
  keep: "bg-gradient-to-r from-slate-100 to-slate-300 dark:from-slate-200 dark:to-slate-400",
};

// Dropdown sections for succession filters
export const SuccessionSections: DropdownSection[] = [
  {
    label: "Successional Phase",
    onlyOne: true,
    options: successionTokens.successionalPhase.map(
      (t) => successionLabelMap[t] ?? t.replace(/_/g, " "),
    ),
  },
  {
    label: "Establishment Light",
    onlyOne: true,
    options: successionTokens.establishmentLight.map(
      (t) => successionLabelMap[t] ?? t.replace(/_/g, " "),
    ),
  },
  {
    label: "Management",
    onlyOne: true,
    options: successionTokens.managementRotation.map(
      (t) => successionLabelMap[t] ?? t.replace(/_/g, " "),
    ),
  },
  {
    label: "Years to Harvest",
    onlyOne: true,
    options: yearsToHarvestTokens.map(
      (t) => yearsToHarvestLabelMap[t] ?? t.replace(/_/g, " "),
    ),
  },
  {
    label: "Productive Lifespan",
    onlyOne: true,
    options: productiveLifespanTokens.map(
      (t) => productiveLifespanLabelMap[t] ?? t.replace(/_/g, " "),
    ),
  },
];

// GrowthProperty-compatible objects for succession (for property profiles modal)
export const SuccessionProperties: GrowthProperty[] = [
  // Ecological Role
  ...successionTokens.successionalPhase.map((token) => ({
    id: token,
    name: successionLabelMap[token] ?? token.replace(/_/g, " "),
    description: successionDescriptionMap[token],
    bgThemeClasses:
      successionBgClasses[token] ??
      "bg-gradient-to-r from-neutral-100 to-neutral-300 dark:from-neutral-200 dark:to-neutral-400",
    examples: Ingredients.filter(
      (i) => i.properties.succession?.successionalPhase === token,
    )
      .slice(0, 5)
      .map((i) => i.id),
  })),
  // Establishment Light
  ...successionTokens.establishmentLight.map((token) => ({
    id: token,
    name: successionLabelMap[token] ?? token.replace(/_/g, " "),
    description: successionDescriptionMap[token],
    bgThemeClasses:
      successionBgClasses[token] ??
      "bg-gradient-to-r from-neutral-100 to-neutral-300 dark:from-neutral-200 dark:to-neutral-400",
    examples: Ingredients.filter(
      (i) => i.properties.succession?.establishmentLight === token,
    )
      .slice(0, 5)
      .map((i) => i.id),
  })),
  // Management Rotation
  ...successionTokens.managementRotation.map((token) => ({
    id: token,
    name: successionLabelMap[token] ?? token.replace(/_/g, " "),
    description: successionDescriptionMap[token],
    bgThemeClasses:
      successionBgClasses[token] ??
      "bg-gradient-to-r from-neutral-100 to-neutral-300 dark:from-neutral-200 dark:to-neutral-400",
    examples: Ingredients.filter(
      (i) => i.properties.succession?.managementRotation === token,
    )
      .slice(0, 5)
      .map((i) => i.id),
  })),
];

// Map for quick lookup
export const SuccessionPropertyMap: Record<string, GrowthProperty> =
  SuccessionProperties.reduce(
    (acc, prop) => ({ ...acc, [prop.id]: prop }),
    {} as Record<string, GrowthProperty>,
  );

// =============================================================================
// SOIL INTERACTION PROPERTIES
// =============================================================================

/**
 * Labels for soil interaction properties.
 */
export const soilInteractionLabelMap: Record<string, string> = {
  // Root strategies
  diffuse_forager: "Diffuse Forager",
  surface_spreader: "Surface Spreader",
  taproot_seeker: "Taproot Seeker",
  storage_bulker: "Storage Bulker",
  woody_structural: "Woody Structural",
  // Depth bands
  very_shallow: "Very Shallow",
  shallow: "Shallow",
  medium: "Medium",
  deep: "Deep",
  very_deep: "Very Deep",
  // Feeder zones
  surface: "Surface Feeder",
  mid: "Mid Feeder",
  // Demand properties
  nutrient_pull: "Nutrient Demand",
  water_pull: "Water Demand",
  oxygen_sensitivity: "Oxygen Sensitivity",
  // Competition tolerance
  intolerant: "Competition Intolerant",
  tolerant: "Competition Tolerant",
  dominant: "Competition Dominant",
};

/**
 * Descriptions for soil interaction properties.
 */
export const soilInteractionDescriptionMap: Record<string, string> = {
  // Root strategies
  diffuse_forager:
    "Spreads fine roots thinly through the soil volume, drawing lightly but broadly. Minimal disruption to neighbors - coexists well in polycultures.",
  surface_spreader:
    "Dominates the surface layer with spreading horizontal roots. Can outcompete shallow-rooted neighbors but leaves deep soil groups accessible.",
  taproot_seeker:
    "Sends a strong central root deep into the soil, accessing water and nutrients at depth. Leaves surface layers mostly undisturbed for companions.",
  storage_bulker:
    "Expands storage organs (tubers, corms, bulbs) that physically displace soil and neighbors. High soil volume demand - can suppress nearby plants.",
  woody_structural:
    "Builds persistent woody root mass over years. Gradually dominates the root zone as the plant matures. Long-term soil impact.",
  // Depth bands
  very_shallow:
    "Root zone concentrated in the top 4 inches of soil. Highly dependent on surface moisture and fertility. Vulnerable to drought.",
  shallow:
    "Roots primarily in the top 8 inches. Accesses surface nutrients well but limited drought tolerance.",
  medium:
    "Moderate root depth of 8-18 inches. Balanced access to both surface fertility and subsoil moisture.",
  deep: "Root system extends 18-36 inches deep. Good drought resilience and access to subsoil nutrients.",
  very_deep:
    "Roots penetrate beyond 36 inches. Excellent drought tolerance and ability to access deep water tables.",
  // Feeder zones
  surface:
    "Fine feeder roots concentrate near the surface where organic matter and nutrients accumulate. Competes directly with other surface feeders.",
  mid: "Feeder roots active in the middle soil group. Partial overlap with both surface and deep feeders.",
  // Demand properties
  nutrient_pull:
    "How heavily the plant draws nutrients from the soil. High demand plants may deplete fertility faster and compete more intensely with neighbors.",
  water_pull:
    "How much water the plant extracts from shared soil. High water demand can stress neighboring plants, especially in dry conditions.",
  oxygen_sensitivity:
    "Sensitivity to soil oxygen levels. High sensitivity means the plant struggles in waterlogged or compacted soils.",
  // Competition tolerance
  intolerant:
    "Struggles when neighbors compete for the same soil resources. Needs space or companions that draw from different depths/zones.",
  tolerant:
    "Handles shared soil pressure well. Can coexist with competitors and adapt to reduced resource availability.",
  dominant:
    "May suppress neighbors in shared soil through aggressive root competition. Can crowd out less vigorous plants.",
};

/**
 * Background color classes for soil interaction properties.
 */
export const soilInteractionBgClasses: Record<string, string> = {
  // Root strategies
  diffuse_forager:
    "bg-gradient-to-r from-green-200 to-green-300 dark:from-green-700 dark:to-green-600",
  surface_spreader:
    "bg-gradient-to-r from-lime-200 to-lime-300 dark:from-lime-700 dark:to-lime-600",
  taproot_seeker:
    "bg-gradient-to-r from-amber-200 to-amber-300 dark:from-amber-700 dark:to-amber-600",
  storage_bulker:
    "bg-gradient-to-r from-orange-200 to-orange-300 dark:from-orange-700 dark:to-orange-600",
  woody_structural:
    "bg-gradient-to-r from-stone-200 to-stone-300 dark:from-stone-600 dark:to-stone-500",
  // Depth bands
  very_shallow:
    "bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-800 dark:to-amber-700",
  shallow:
    "bg-gradient-to-r from-amber-200 to-amber-300 dark:from-amber-700 dark:to-amber-600",
  medium:
    "bg-gradient-to-r from-amber-300 to-amber-400 dark:from-amber-600 dark:to-amber-500",
  deep: "bg-gradient-to-r from-amber-400 to-amber-500 dark:from-amber-500 dark:to-amber-400",
  very_deep:
    "bg-gradient-to-r from-amber-500 to-amber-600 dark:from-amber-400 dark:to-amber-300",
  // Feeder zones
  surface:
    "bg-gradient-to-r from-lime-200 to-lime-300 dark:from-lime-700 dark:to-lime-600",
  mid: "bg-gradient-to-r from-emerald-200 to-emerald-300 dark:from-emerald-700 dark:to-emerald-600",
  // Demand properties
  nutrient_pull:
    "bg-gradient-to-r from-green-200 to-green-300 dark:from-green-700 dark:to-green-600",
  water_pull:
    "bg-gradient-to-r from-blue-200 to-blue-300 dark:from-blue-700 dark:to-blue-600",
  oxygen_sensitivity:
    "bg-gradient-to-r from-sky-200 to-sky-300 dark:from-sky-700 dark:to-sky-600",
  // Competition tolerance
  intolerant:
    "bg-gradient-to-r from-red-200 to-red-300 dark:from-red-700 dark:to-red-600",
  tolerant:
    "bg-gradient-to-r from-green-200 to-green-300 dark:from-green-700 dark:to-green-600",
  dominant:
    "bg-gradient-to-r from-amber-200 to-amber-300 dark:from-amber-700 dark:to-amber-600",
};

// GrowthProperty-compatible objects for soil interaction (for property profiles modal)
export const SoilInteractionProperties: GrowthProperty[] = [
  // Root strategies
  ...[
    "diffuse_forager",
    "surface_spreader",
    "taproot_seeker",
    "storage_bulker",
    "woody_structural",
  ].map((token) => ({
    id: token,
    name: soilInteractionLabelMap[token] ?? token.replace(/_/g, " "),
    description: soilInteractionDescriptionMap[token],
    bgThemeClasses:
      soilInteractionBgClasses[token] ??
      "bg-gradient-to-r from-neutral-100 to-neutral-300 dark:from-neutral-200 dark:to-neutral-400",
    examples: Ingredients.filter(
      (i) => i.properties.growth?.soilInteraction?.root.strategy === token,
    )
      .slice(0, 5)
      .map((i) => i.id),
  })),
  // Depth bands
  ...["very_shallow", "shallow", "medium", "deep", "very_deep"].map(
    (token) => ({
      id: token,
      name: soilInteractionLabelMap[token] ?? token.replace(/_/g, " "),
      description: soilInteractionDescriptionMap[token],
      bgThemeClasses:
        soilInteractionBgClasses[token] ??
        "bg-gradient-to-r from-neutral-100 to-neutral-300 dark:from-neutral-200 dark:to-neutral-400",
      examples: Ingredients.filter(
        (i) => i.properties.growth?.soilInteraction?.root.depthBand === token,
      )
        .slice(0, 5)
        .map((i) => i.id),
    }),
  ),
  // Feeder zones
  ...["surface", "mid"].map((token) => ({
    id: token,
    name: soilInteractionLabelMap[token] ?? token.replace(/_/g, " "),
    description: soilInteractionDescriptionMap[token],
    bgThemeClasses:
      soilInteractionBgClasses[token] ??
      "bg-gradient-to-r from-neutral-100 to-neutral-300 dark:from-neutral-200 dark:to-neutral-400",
    examples: Ingredients.filter(
      (i) => i.properties.growth?.soilInteraction?.root.feederZone === token,
    )
      .slice(0, 5)
      .map((i) => i.id),
  })),
  // Demand properties
  ...["nutrient_pull", "water_pull", "oxygen_sensitivity"].map((token) => ({
    id: token,
    name: soilInteractionLabelMap[token] ?? token.replace(/_/g, " "),
    description: soilInteractionDescriptionMap[token],
    bgThemeClasses:
      soilInteractionBgClasses[token] ??
      "bg-gradient-to-r from-neutral-100 to-neutral-300 dark:from-neutral-200 dark:to-neutral-400",
    examples: [], // Demand levels apply to many plants
  })),
  // Competition tolerance
  ...["intolerant", "tolerant", "dominant"].map((token) => ({
    id: token,
    name: soilInteractionLabelMap[token] ?? token.replace(/_/g, " "),
    description: soilInteractionDescriptionMap[token],
    bgThemeClasses:
      soilInteractionBgClasses[token] ??
      "bg-gradient-to-r from-neutral-100 to-neutral-300 dark:from-neutral-200 dark:to-neutral-400",
    examples: Ingredients.filter(
      (i) =>
        i.properties.growth?.soilInteraction?.competitionTolerance === token,
    )
      .slice(0, 5)
      .map((i) => i.id),
  })),
];

// Map for quick lookup
export const SoilInteractionPropertyMap: Record<string, GrowthProperty> =
  SoilInteractionProperties.reduce(
    (acc, prop) => ({ ...acc, [prop.id]: prop }),
    {} as Record<string, GrowthProperty>,
  );
