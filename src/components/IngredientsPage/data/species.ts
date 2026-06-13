import { SuccessionProfile } from "../../Forest/types";
import { ExtraFact, Growth, Ingredient } from "../types";

export const getExtraFactAboutPseudoCereal = (
  id: string,
  name: string,
): ExtraFact => {
  return {
    id: `${id}_pseudo_cereal`,
    label: "Pseudo Cereal",
    content: `${name} is a pseudocereal — it is the seed of a non-grass plant, used like a grain but not technically a true grain.`,
  };
};

export const getExtraFactAboutBlossomSensitivityForIngredient = (
  id: string,
  name: string,
  frostSensitivityIntensity?: "highly" | "moderately" | "slightly" | "",
  item: "blossoms" | "fruits" | "spears" = "blossoms",
  sensitiveOrIntolerant: "sensitive" | "intolerant" = "intolerant",
): ExtraFact => {
  return {
    id: `${id}_blossom_frost`,
    label: "Frost Intolerance",
    content: `${name} ${item} are ${frostSensitivityIntensity ? `${frostSensitivityIntensity} ` : ""}frost ${sensitiveOrIntolerant}, making late spring frosts a major threat to the crop.`,
    highlights: [{ text: `frost ${sensitiveOrIntolerant}`, theme: "frost" }],
  };
};

export const VEGETABLES_ARTICLE_URL =
  "https://perillacove.com/writing/vegetables-arent-real-nature/";

export const getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse =
  (
    id: string,
    name: string,
    customContent?: string,
    something:
      | "fruit"
      | "leaf"
      | "flower"
      | "stem"
      | "rhizome"
      | "seed"
      | "dried, one-seeded fruit"
      | "seed-like, dried fruit"
      | "part of an inner bark"
      | "dry woody fruit"
      | "stigma of a flower"
      | "root" = "fruit",
    somethingElse:
      | "vegetable"
      | "fruit"
      | "herb"
      | "spice"
      | "flavoring ingredient" = "vegetable",
  ): ExtraFact => {
    return {
      id: `${id}_botanically_a_${something}_but_culinarily_a_${somethingElse}`,
      label: `Botanically a ${something} but Culinarily a ${somethingElse}`,
      content:
        customContent ??
        `${name} is botanically a ${something} but is often treated as a ${somethingElse === "vegetable" ? '"vegetable"' : somethingElse} in gastronomy.`,
      links:
        somethingElse === "vegetable"
          ? [{ text: `"vegetable"`, url: VEGETABLES_ARTICLE_URL }]
          : [],
    };
  };

export const getExtraFactAboutLegumeSeed = (
  id: string,
  name: string,
): ExtraFact => {
  return {
    id: `${id}_are_seeds_of_a_legume_fruit`,
    label: "Are Seeds of a Legume Fruit",
    content: `${name} are seeds of a legume pod (fruit).`,
  };
};

export const getExtraFactAboutBotanicallyAlgaeButCulinarilyAVegetable = (
  id: string,
  name: string,
): ExtraFact => {
  return {
    id: `${id}_botanically_algae_but_culinarily_a_vegetable`,
    label: "Botanically Algae but Culinarily a Vegetable",
    content: `${name} is a type of algae but is often treated as a "vegetable" in gastronomy.`,
    links: [{ text: `"vegetable"`, url: VEGETABLES_ARTICLE_URL }],
  };
};

export const CondensedMilk: Ingredient = {
  id: "condensed_milk",
  link: "https://en.wikipedia.org/wiki/Condensed_milk",
  type: "dairy",
  properties: {
    qualities: ["dense", "rich", "creamy", "smooth"],
    tastes: ["sweet", "milky"],
  },
  needsAttribution: true,
};

export const HeavyCream: Ingredient = {
  id: "heavy_cream",
  link: "https://en.wikipedia.org/wiki/Heavy_cream",
  type: "dairy",
  properties: {
    qualities: ["dense", "rich", "creamy", "smooth"],
    tastes: ["milky", "sweet"],
  },
};

export const SkipjackTuna: Ingredient = {
  id: "skipjack_tuna",
  link: "https://en.wikipedia.org/wiki/Skipjack_tuna",
  type: "seafood",
  properties: {
    qualities: ["tender"],
    tastes: ["savory", "briny"],
  },
  needsAttribution: true,
};

export const AhiTuna: Ingredient = {
  id: "ahi_tuna",
  link: "https://en.wikipedia.org/wiki/Ahi_tuna",
  type: "seafood",
  properties: {
    qualities: ["tender"],
    tastes: ["savory", "sweet", "briny"],
  },
  needsAttribution: true,
};

export const Pollock: Ingredient = {
  id: "pollock",
  link: "https://en.wikipedia.org/wiki/Pollock",
  type: "seafood",
  properties: {
    qualities: ["tender"],
    tastes: ["savory", "briny", "sweet"],
  },
  needsAttribution: true,
};

export const Plantain: Ingredient = {
  id: "plantain",
  link: "https://en.wikipedia.org/wiki/Plantain",
  type: "fruit",
  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["sweet", "earthy", "fruity"],
    growth: {
      growthForms: ["understory"],
      lightPreferences: ["partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 32],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Excellent early vertical biomass and calorie crop
      recommendedPlantYearFromStart: [0, 2],

      // Likes sun but benefits from shelter when young
      establishmentLight: "full_sun",

      yearsToFirstHarvest: [1, 2],

      // Individual stems fruit once; mats persist via pups
      productiveLifespanYears: [3, 8],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
};

export const Sugarcane: Ingredient = {
  id: "sugarcane",
  link: "https://en.wikipedia.org/wiki/Sugarcane",
  type: "stem",
  properties: {
    qualities: ["fibrous", "juicy"],
    tastes: ["sweet", "grassy", "earthy", "fruity"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 35],
      },
      airHumidityPreferences: ["humid_air"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Introduced once warmth, moisture, and space are reliable
      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "full_sun",

      // First harvest typically after 12–24 months
      yearsToFirstHarvest: [1, 2],

      // Long-lived clumps with ratooning
      productiveLifespanYears: [10, 30],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "sugarcane",
      "Sugarcane",
      "The stalk, which is a tall, fibrous stem filled with sugar-rich sap, is edible",
    ),
  ],
};

export const CaneSugar: Ingredient = {
  id: "cane_sugar",
  link: "https://en.wikipedia.org/wiki/Sugarcane",
  type: "sugar",
  originIngredients: [Sugarcane.id],
  properties: {
    tastes: ["sweet", "malty", "earthy"],
  },
  needsAttribution: true,
};

export const SugarcaneJuice: Ingredient = {
  id: "sugarcane_juice",
  link: "https://en.wikipedia.org/wiki/Sugarcane_juice",
  type: "misc",
  originIngredients: [Sugarcane.id],
  properties: {
    qualities: ["light", "cool"],
    tastes: ["sweet", "grassy", "earthy", "fruity"],
  },
  needsAttribution: true,
};

export const MarianPlum: Ingredient = {
  id: "marian_plum__gandaria",
  link: "https://en.wikipedia.org/wiki/Marian_plum",
  type: "fruit",
  properties: {
    qualities: ["juicy", "dense"],
    tastes: ["sweet", "floral", "astringent"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [22, 32],
      },
      airHumidityPreferences: ["humid_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Introduced once spacing and tropical microclimate are reliable
      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [4, 7],

      productiveLifespanYears: [30, 60],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
  extraFacts: [
    {
      id: "marian_plum_close_mango_relative",
      label: "Close mango relative",
      content: "The Marian plum is a close relative of mango.",
    },
  ],
};

const KafirGrowth: Growth = {
  growthForms: ["midstory", "bushShrub"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["perennial"],
  heightClasses: ["medium"],
  frostTolerances: ["frost_intolerant"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [18, 32],
  },
  airHumidityPreferences: ["humid_air"],
  soilInteraction: {
    root: {
      depthBand: "medium",
      feederZone: "mid",
      strategy: "woody_structural",
    },
    demand: {
      nutrientPull: "medium",
      waterPull: "medium",
      oxygenSensitivity: "low",
    },
    competitionTolerance: "tolerant",
  },
};

export const KaffirLime: Ingredient = {
  id: "kaffir_lime",
  link: "https://en.wikipedia.org/wiki/Kaffir_lime",
  type: "fruit",
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["citrusy", "zesty", "floral", "tangy", "sour", "bitter"],
    growth: KafirGrowth,
    succession: {
      successionalPhase: "late",

      // Works best once microclimate is a bit warmer and less windy
      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "full_sun",

      // Leaf harvest is earlier, but "meaningful yield" (consistent leaf + fruit) takes time
      yearsToFirstHarvest: [2, 4],

      productiveLifespanYears: [20, 40],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
};

export const KaffirLimeLeaf: Ingredient = {
  id: "kaffir_lime_leaf",
  link: "https://en.wikipedia.org/wiki/Kaffir_lime",
  originIngredients: [KaffirLime.id],
  type: "leaf",
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["citrusy", "zesty", "grassy", "floral", "tangy", "sour", "bitter"],
    growth: KafirGrowth,
    succession: {
      successionalPhase: "late",

      // Leaf harvest possible earlier, but tree benefits from microclimate stability
      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [1.5, 3],

      productiveLifespanYears: [20, 40],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
};

export const Ginger: Ingredient = {
  id: "ginger",
  link: "https://en.wikipedia.org/wiki/Ginger",
  type: "rhizome",
  properties: {
    qualities: ["light", "sharp"],
    tastes: ["zesty", "pungent", "earthy", "floral", "citrusy", "peppery"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["partial_sun", "filtered_light"],
      lifeCycles: ["perennial"],
      heightClasses: ["low"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 30],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Excellent early understory rhizome once soil warms
      recommendedPlantYearFromStart: [0, 2],

      // Prefers protection from harsh sun
      establishmentLight: "filtered_light",

      // Young ginger harvest in same season; mature later
      yearsToFirstHarvest: [0.75, 1.25],

      // Often repeated from fresh rhizomes, but clumps can persist
      productiveLifespanYears: [2, 5],

      managementRotation: "medium_rotation",
    },
  },
};

export const Galangal: Ingredient = {
  id: "galangal",
  link: "https://en.wikipedia.org/wiki/Galangal",
  type: "rhizome",
  properties: {
    qualities: ["light", "sharp"],
    tastes: [
      "zesty",
      "citrusy",
      "woody",
      "pungent",
      "earthy",
      "grassy",
      "floral",
      "peppery",
    ],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["partial_sun", "filtered_light"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 32],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Best once soil moisture and organic matter are reliable
      recommendedPlantYearFromStart: [0.5, 2],

      // Establishes best with light shade or dappled sun
      establishmentLight: "filtered_light",

      // Rhizomes usable after the first year
      yearsToFirstHarvest: [1, 2],

      // Clumps persist for years if not overharvested
      productiveLifespanYears: [5, 10],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
};

export const Jackfruit: Ingredient = {
  id: "jackfruit",
  link: "https://en.wikipedia.org/wiki/Jackfruit",
  type: "fruit",
  properties: {
    qualities: ["tender", "juicy", "dense", "snappy"],
    tastes: ["sweet", "fruity", "floral"],
    tasteProfile: [
      { id: "sweet", intensity: 5 },
      { id: "fruity", intensity: 5 },
      { id: "floral", intensity: 2 },
    ],
    qualityProfile: [
      { id: "juicy", intensity: 4 },
      { id: "dense", intensity: 4 },
      { id: "tender", intensity: 3 },
      { id: "snappy", intensity: 2 },
    ],
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [22, 32],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Often planted once you have early shelter, but still early enough to anchor the long game
      recommendedPlantYearFromStart: [1, 4],

      // Young jackfruit appreciates some shelter; becomes a full-sun canopy giant later
      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [3, 7],

      productiveLifespanYears: [50, 70],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
};

export const Jaggery: Ingredient = {
  id: "jaggery",
  link: "https://en.wikipedia.org/wiki/Jaggery",
  type: "sugar",
  originIngredients: [Sugarcane.id],
  properties: {
    qualities: ["dense"],
    tastes: ["sweet", "woody", "malty", "nutty", "earthy"],
  },
  needsAttribution: true,
};

export const PalmSugar: Ingredient = {
  id: "palm_sugar",
  link: "https://en.wikipedia.org/wiki/Palm_sugar",
  type: "sugar",
  originIngredients: ["palm_tree"],
  properties: {
    qualities: ["dense"],
    tastes: ["sweet", "woody", "malty", "nutty", "earthy", "smoky"],
  },
  needsAttribution: true,
};

export const BakingSoda: Ingredient = {
  id: "baking_soda",
  link: "https://en.wikipedia.org/wiki/Baking_soda",
  type: "misc",
  properties: {},
  needsAttribution: true,
};

export const BakingPowder: Ingredient = {
  id: "baking_powder",
  link: "https://en.wikipedia.org/wiki/Baking_powder",
  type: "misc",

  properties: {},
  needsAttribution: true,
};

export const Teff: Ingredient = {
  id: "teff",
  link: "https://en.wikipedia.org/wiki/Teff",
  type: "grain",
  properties: {
    qualities: ["dense", "smooth", "chewy"],
    tastes: ["nutty", "earthy", "sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Warm-season, fine-grain cereal for open conditions
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
};

export const Injera: Ingredient = {
  id: "injera",
  link: "https://en.wikipedia.org/wiki/Injera",
  type: "misc",
  originIngredients: [Teff.id],
  properties: {
    qualities: ["dense", "spongy", "chewy", "smooth"],
    tastes: ["tangy", "nutty", "sour", "zesty", "sweet"],
  },
};

export const Rye: Ingredient = {
  id: "rye",
  link: "https://en.wikipedia.org/wiki/Rye",
  type: "grain",

  properties: {
    qualities: ["dense", "rough", "chewy", "smooth"],
    tastes: ["earthy", "nutty", "malty", "sweet", "sour"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [5, 18],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Extremely hardy early grain, often precedes other crops
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.4, 0.8],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const RyeBread: Ingredient = {
  id: "rye_bread",
  link: "https://en.wikipedia.org/wiki/Rye_bread",
  type: "misc",
  originIngredients: [Rye.id],
  properties: {
    qualities: ["dense", "rough", "chewy", "smooth"],
    tastes: ["earthy", "nutty", "malty", "sweet", "sour"],
  },
  needsAttribution: true,
};

export const Millet: Ingredient = {
  id: "millet",
  link: "https://en.wikipedia.org/wiki/Millet",
  type: "grain",

  properties: {
    qualities: ["dense", "smooth", "chewy"],
    tastes: ["nutty", "earthy", "sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [20, 35],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Heat-tolerant early grain, thrives in low-input systems
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.25, 0.45],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const Mugwort: Ingredient = {
  id: "mugwort",
  link: "https://en.wikipedia.org/wiki/Mugwort",
  type: "leaf",

  properties: {
    qualities: ["light", "delicate"],
    tastes: ["bitter", "earthy", "peppery", "earthy", "woody", "menthol"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Tough, early colonizer once soil is workable
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.5, 1],

      productiveLifespanYears: [8, 20],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "mugwort",
      "Mugwort",
      undefined,
      "leaf",
      "herb",
    ),
  ],
};

export const Mascarpone: Ingredient = {
  id: "mascarpone",
  link: "https://en.wikipedia.org/wiki/Mascarpone",
  type: "dairy",

  properties: {
    qualities: ["dense", "creamy", "rich", "smooth"],
    tastes: ["sweet", "tangy", "zesty", "milky", "savory"],
  },
  needsAttribution: true,
};

export const VanillaIceCream: Ingredient = {
  id: "vanilla_ice_cream",
  link: "https://en.wikipedia.org/wiki/Vanilla_ice_cream",
  type: "dairy",
  properties: {
    qualities: ["rich", "creamy", "dense"],
    tastes: ["sweet", "milky", "floral"],
  },
};

export const CreamCheese: Ingredient = {
  id: "cream_cheese",
  link: "https://en.wikipedia.org/wiki/Cream_cheese",
  type: "dairy",

  properties: {
    qualities: ["dense", "creamy", "rich", "smooth"],
    tastes: ["tangy", "zesty", "milky", "sweet", "savory"],
  },
  needsAttribution: true,
};

export const BoneMarrow: Ingredient = {
  id: "bone_marrow__beef",
  link: "https://en.wikipedia.org/wiki/Bone_marrow_(food)",
  type: "misc",

  properties: {
    qualities: ["dense", "rich", "smooth"],
    tastes: ["beefy", "savory", "nutty", "milky"],
  },
  needsAttribution: true,
};

export const Enoki: Ingredient = {
  id: "enoki",
  link: "https://en.wikipedia.org/wiki/Enoki_mushroom",
  type: "fungi",

  properties: {
    qualities: ["dense", "light", "crunchy", "juicy"],
    tastes: ["savory", "nutty", "milky"],
    fungiGrowth: {
      growthForms: ["saprophytic"],
      lightPreferences: ["low_light"],
      lifeCycles: ["persistent_mycelium"],
      substrateDepths: ["surface"],
      temperatureTolerances: ["cold_tolerant"],
      soilPreferences: ["humid_substrate"],
    },
  },
  needsAttribution: true,
};

export const MatsutakeMushroom: Ingredient = {
  id: "matsutake_mushroom__pine",
  link: "https://en.wikipedia.org/wiki/Matsutake",
  type: "fungi",

  properties: {
    qualities: ["juicy", "dense", "plump"],
    tastes: ["savory", "earthy", "nutty"],
    fungiGrowth: {
      growthForms: ["mycorrhizal"],
      lightPreferences: ["surface_shaded"],
      lifeCycles: ["persistent_mycelium"],
      substrateDepths: ["deep_soil"],
      temperatureTolerances: ["cold_tolerant"],
      soilPreferences: ["dry_forest_floor"],
    },
  },
  needsAttribution: true,
};

export const BeefBoneBroth: Ingredient = {
  id: "beef_bone_broth",
  link: "https://en.wikipedia.org/wiki/Broth",
  type: "misc",

  properties: {
    qualities: ["smooth"],
    tastes: ["beefy", "savory", "milky"],
  },
  needsAttribution: true,
};

export const ChickenBoneBroth: Ingredient = {
  id: "chicken_bone_broth",
  link: "https://en.wikipedia.org/wiki/Broth",
  type: "misc",

  properties: {
    qualities: ["smooth"],
    tastes: ["savory", "nutty"],
  },
  needsAttribution: true,
};

export const SquidInk: Ingredient = {
  id: "squid_ink",
  link: "https://en.wikipedia.org/wiki/Squid",
  type: "misc",
  properties: {
    qualities: ["delicate"],
    tastes: ["briny", "savory", "salty"],
  },
  needsAttribution: true,
};

export const SalmonRoe: Ingredient = {
  id: "salmon_roe",
  link: "https://en.wikipedia.org/wiki/Salmon",
  type: "seafood",
  properties: {
    qualities: ["dense", "plump", "juicy", "snappy", "rich"],
    tastes: ["briny", "savory", "sweet", "salty"],
  },
  needsAttribution: true,
};

export const Oyster: Ingredient = {
  id: "oyster",
  link: "https://en.wikipedia.org/wiki/Oyster",
  type: "seafood",
  properties: {
    qualities: ["dense", "chewy", "jelly-like", "tender"],
    tastes: ["briny", "savory", "sweet"],
  },
  needsAttribution: true,
};

export const MoringaLeaf: Ingredient = {
  id: "moringa_leaf",
  link: "https://en.wikipedia.org/wiki/Moringa",
  type: "leaf",

  properties: {
    qualities: ["light", "delicate"],
    tastes: ["grassy", "earthy", "bitter"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [20, 35],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Very fast-growing “early tree” in warm systems
      recommendedPlantYearFromStart: [0, 2],

      // Thrives in strong light; tolerates heat and exposure
      establishmentLight: "full_sun",

      // Leaf harvest within months
      yearsToFirstHarvest: [0.25, 0.75],

      // Short-lived tree, often cycled or coppiced
      productiveLifespanYears: [5, 15],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
};

export const MoringaPowder: Ingredient = {
  id: "moringa_powder",
  link: "https://en.wikipedia.org/wiki/Moringa",
  type: "misc",
  originIngredients: [MoringaLeaf.id],
  properties: {
    qualities: ["light"],
    tastes: ["earthy", "grassy", "bitter"],
  },
  needsAttribution: true,
};

export const Celery: Ingredient = {
  id: "celery",
  link: "https://en.wikipedia.org/wiki/Celery",
  type: "stem",

  properties: {
    qualities: ["snappy", "juicy"],
    tastes: ["grassy", "bitter", "sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["biennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Early moisture-loving leaf/stem crop
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.4, 0.7],

      productiveLifespanYears: [0.3, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const CowMilk: Ingredient = {
  id: "whole_milk__cow",
  link: "https://en.wikipedia.org/wiki/Cow_milk",
  type: "dairy",
  originIngredients: ["cow"],

  properties: {
    qualities: ["dense", "smooth", "creamy", "rich"],
    tastes: ["milky", "sweet", "nutty"],
    qualityProfile: [
      { id: "smooth", intensity: 4 },
      { id: "creamy", intensity: 3 },
      { id: "dense", intensity: 2 },
      { id: "rich", intensity: 2 },
    ],
    tasteProfile: [
      { id: "milky", intensity: 5 },
      { id: "sweet", intensity: 3 },
      { id: "nutty", intensity: 1 },
    ],
  },
  needsAttribution: true,
};

export const Cow: Ingredient = {
  id: "cow",
  link: "https://en.wikipedia.org/wiki/Cattle",
  type: "animal",
  yieldIngredientIds: [
    "whole_milk__cow",
    "butter__cow",
    "ghee__cow",
    "plain_yogurt__cow",
  ],
  properties: {
    animalIntegration: {
      kind: "grazer",
      layer: "groundcover",
      capacity: {
        fire: {
          value: 0.58,
          traits: ["daylight_warmth", "body_heat"],
        },
        water: {
          value: 0.72,
          traits: ["drinking_water"],
        },
        earth: {
          value: 0.68,
          traits: ["forage_intake", "rumen_turnover"],
        },
        air: {
          value: 0.54,
          traits: ["breathing_exchange"],
        },
      },
      lifecycle: {
        startYear: 0,
        maturityYears: 2,
        lifespanYears: 10,
      },
      turnover: {
        manureRate: 0.34,
        tramplingPressure: 0.012,
      },
      movement: {
        grazingRadius: 3.2,
      },
      yields: [
        "whole_milk__cow",
        "butter__cow",
        "ghee__cow",
        "plain_yogurt__cow",
      ],
    },
  },
  extraFacts: [
    {
      id: "cow_living_turnover",
      label: "Living Turnover",
      content:
        "Cow is modeled as a grazing participant: forage, water, light, heat, and air turn through the animal and return fertility to the soil as manure.",
    },
  ],
};

export const GinsengRoot: Ingredient = {
  id: "ginseng_root",
  link: "https://en.wikipedia.org/wiki/Ginseng",
  type: "root",

  properties: {
    qualities: ["sharp"],
    tastes: ["bitter", "sweet", "earthy", "astringent", "savory", "grassy"],
    growth: {
      growthForms: ["herbaceous", "root"],
      lightPreferences: ["shade_tolerant", "filtered_light"],
      lifeCycles: ["perennial"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        chillHours: [600, 1200],
        optimalTempRangeC: [8, 18],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Only after true forest structure or shade cloth equivalent exists
      recommendedPlantYearFromStart: [2, 6],

      establishmentLight: "deep_shade",

      // Slow medicinal crop
      yearsToFirstHarvest: [4, 7],

      productiveLifespanYears: [10, 25],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "ginseng",
      "Ginseng",
      undefined,
      "root",
      "herb",
    ),
  ],
};

export const Hibiscus: Ingredient = {
  id: "hibiscus",
  link: "https://en.wikipedia.org/wiki/Hibiscus",
  type: "flower",

  properties: {
    qualities: ["light", "delicate"],
    tastes: ["floral", "fruity", "tangy", "sour", "astringent", "sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["humid_air"],
      climateProfile: {
        optimalTempRangeC: [20, 32], // thrives in warm tropical–subtropical conditions
      },
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Fits well in early shrub/herb layer
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Flowers within first year
      yearsToFirstHarvest: [0.5, 1.5],

      // Short-lived perennial or annual depending on species and climate
      productiveLifespanYears: [3, 6],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "hibiscus",
      "Hibiscus",
      undefined,
      "flower",
      "herb",
    ),
  ],
};

export const Rooibos: Ingredient = {
  id: "rooibos",
  link: "https://en.wikipedia.org/wiki/Rooibos",
  type: "leaf",

  properties: {
    qualities: ["light", "delicate"],
    tastes: ["floral", "sweet", "fruity", "earthy", "nutty"],
    growth: {
      growthForms: ["bushShrub"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [15, 30],
      },
      airHumidityPreferences: ["semi_arid_air"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Needs settled, low-input soil and long-term intent
      recommendedPlantYearFromStart: [1, 3],

      establishmentLight: "full_sun",

      // Leaves harvested after shrubs mature
      yearsToFirstHarvest: [2, 4],

      productiveLifespanYears: [10, 30],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "rooibos",
      "Rooibos",
      undefined,
      "leaf",
      "herb",
    ),
  ],
  needsAttribution: true,
};

export const Chamomile: Ingredient = {
  id: "chamomile",
  link: "https://en.wikipedia.org/wiki/Chamomile",
  type: "flower",

  properties: {
    qualities: ["light", "delicate"],
    tastes: ["floral", "sweet", "fruity", "grassy", "bitter"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["annual", "perennial"],
      heightClasses: ["low"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Easy early ground-layer herb
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Flowers within the first season
      yearsToFirstHarvest: [0.2, 0.5],

      // Short-lived; may self-seed but planning window stays short
      productiveLifespanYears: [0.5, 2],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "chamomile",
      "Chamomile",
      undefined,
      "flower",
      "herb",
    ),
  ],
};

const CamelliaSinensisGrowth: Growth = {
  growthForms: ["bushShrub"],
  lightPreferences: ["partial_sun", "filtered_light"],
  lifeCycles: ["perennial"],
  heightClasses: ["medium"],
  frostTolerances: ["semi_hardy"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [10, 25],
  },
  airHumidityPreferences: ["humid_air"],
  soilInteraction: {
    root: {
      depthBand: "shallow",
      feederZone: "surface",
      strategy: "woody_structural",
    },
    demand: {
      nutrientPull: "medium",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const CamelliaSinensisSuccession: SuccessionProfile = {
  successionalPhase: "mid",

  // Best once soil acidity, moisture, and mulch systems are stable
  recommendedPlantYearFromStart: [1, 3],

  // Young tea plants prefer nurse shade, especially in warm climates
  establishmentLight: "filtered_light",

  // Light plucking begins after establishment
  yearsToFirstHarvest: [2, 4],

  // Tea bushes can remain productive for decades with pruning
  productiveLifespanYears: [30, 60],

  managementRotation: "keep",
};

export const GreenTeaLeaf: Ingredient = {
  id: "green_tea_leaf",
  link: "https://en.wikipedia.org/wiki/Green_tea",
  type: "leaf",
  originIngredients: ["camellia_sinensis"],
  properties: {
    qualities: ["light", "delicate"],
    tastes: ["grassy", "floral", "bitter", "earthy", "astringent"],
    growth: CamelliaSinensisGrowth,
    succession: CamelliaSinensisSuccession,
  },
  needsAttribution: true,
};

export const Matcha: Ingredient = {
  id: "matcha",
  link: "https://en.wikipedia.org/wiki/Matcha",
  type: "misc",
  sourceType: "leaf",
  originIngredients: ["camellia_sinensis"],
  properties: {
    qualities: ["smooth"],
    tastes: ["grassy", "earthy", "savory", "sweet", "bitter", "astringent"],
    growth: CamelliaSinensisGrowth,
    succession: CamelliaSinensisSuccession,
  },
  needsAttribution: true,
  extraFacts: [
    {
      id: "matcha_light_preference",
      label: "Light Preference",
      content:
        "Camellia sinensis can tolerate a gentle full sun in cooler highlands like Japan or Korea.",
      highlights: [{ text: "full sun", theme: "light" }],
    },
    {
      id: "matcha_shading",
      label: "Shading Technique",
      content:
        "For the final ~2 weeks before harvest, matcha plants are shaded to block sunlight, giving a vibrant umami-rich, smooth, slightly sweet flavor.",
      highlights: [
        { text: "shaded", theme: "light" },
        { text: "sunlight", theme: "light" },
      ],
    },
  ],
  articles: [
    {
      id: "matcha_article",
      title: "Organic Tea Garden in Jeju Island: My Best Matcha",
      url: "https://perillacove.com/writing/organic-tea-garden-matcha-jeju",
    },
  ],
};

export const Spearmint: Ingredient = {
  id: "mint__spearmint",
  link: "https://en.wikipedia.org/wiki/Spearmint",
  type: "leaf",
  properties: {
    qualities: ["delicate"],
    tastes: ["grassy", "menthol", "sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Establish once boundaries or containers are defined
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Leaf harvest quickly after establishment
      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [5, 15],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
};

export const Peppermint: Ingredient = {
  id: "peppermint",
  link: "https://en.wikipedia.org/wiki/Peppermint",
  type: "leaf",
  originIngredients: ["peppermint_plant"],
  properties: {
    qualities: ["cool", "sharp"],
    tastes: ["menthol", "earthy"],
    growth: {
      growthForms: ["herbaceous", "groundcover"],
      lightPreferences: ["partial_sun", "filtered_light", "full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Establish once you can control spread or dedicate a patch
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Leaf harvest soon after establishment
      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [5, 15],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
};

const ChilliPepperPlantGrowth: Growth = {
  growthForms: ["herbaceous"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["annual"],
  heightClasses: ["medium"],
  frostTolerances: ["frost_intolerant"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [18, 32],
  },
  airHumidityPreferences: ["moderate_humidity", "humid_air"],
  soilInteraction: {
    root: {
      depthBand: "shallow",
      feederZone: "surface",
      strategy: "diffuse_forager",
    },
    demand: {
      nutrientPull: "low",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const ChilliPepperPlantSuccession: SuccessionProfile = {
  successionalPhase: "pioneer",

  recommendedPlantYearFromStart: [0, 1],

  establishmentLight: "full_sun",

  // Same-season harvest
  yearsToFirstHarvest: [0.2, 0.4],

  productiveLifespanYears: [0.2, 1],

  managementRotation: "short_rotation",
};

export const GreenChilliPepper: Ingredient = {
  id: "green_chilli_pepper",
  link: "https://en.wikipedia.org/wiki/Green_chili",
  type: "fruit",
  properties: {
    qualities: ["sharp"],
    tastes: ["pungent", "peppery", "grassy", "bitter", "sweet"],
    growth: ChilliPepperPlantGrowth,
    succession: ChilliPepperPlantSuccession,
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "green_chilli_pepper",
      "Green Chilli Pepper",
      undefined,
      "fruit",
      "spice",
    ),
  ],
};

export const RedChilliFlakesCayenne: Ingredient = {
  id: "red_chilli_flakes__cayenne",
  link: "https://en.wikipedia.org/wiki/Chili_pepper",
  type: "misc",
  originIngredients: ["chilli_pepper_plant"],
  properties: {
    qualities: ["sharp"],
    tastes: ["pungent", "peppery", "sweet"],
    growth: ChilliPepperPlantGrowth,
    succession: ChilliPepperPlantSuccession,
  },
  needsAttribution: true,
};

export const CayennePepper: Ingredient = {
  id: "cayenne_pepper",
  link: "https://en.wikipedia.org/wiki/Capsicum_annuum",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["sharp"],
    tastes: ["pungent", "peppery", "sweet"],
    growth: ChilliPepperPlantGrowth,
    succession: ChilliPepperPlantSuccession,
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "cayenne_pepper",
      "Cayenne Pepper",
      undefined,
      "fruit",
      "spice",
    ),
  ],
};

export const Habanero: Ingredient = {
  id: "habanero",
  link: "https://en.wikipedia.org/wiki/Habanero",
  type: "fruit",
  properties: {
    qualities: ["sharp"],
    tastes: ["pungent", "peppery", "fruity", "sweet"],
    growth: ChilliPepperPlantGrowth,
    succession: ChilliPepperPlantSuccession,
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "habanero",
      "Habanero",
      undefined,
      "fruit",
      "spice",
    ),
  ],
};

export const Jalapeno: Ingredient = {
  id: "jalapeno",
  link: "https://en.wikipedia.org/wiki/Jalape%C3%B1o",
  type: "fruit",
  properties: {
    qualities: ["sharp"],
    tastes: ["pungent", "peppery", "grassy", "sweet"],
    growth: ChilliPepperPlantGrowth,
    succession: ChilliPepperPlantSuccession,
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "jalapeno",
      "Jalapeno",
      undefined,
      "fruit",
      "spice",
    ),
  ],
};

export const JalapenoBlackMagic: Ingredient = {
  id: "black_magic_jalapeno",
  link: "https://en.wikipedia.org/wiki/Jalape%C3%B1o",
  type: "fruit",
  properties: {
    qualities: ["sharp"],
    tastes: ["pungent", "peppery", "grassy", "sweet"],
    growth: ChilliPepperPlantGrowth,
    succession: ChilliPepperPlantSuccession,
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "jalapeno__black_magic",
      "Black Magic Jalapeno",
      undefined,
      "fruit",
      "spice",
    ),
  ],
};

export const RooibosTea: Ingredient = {
  id: "rooibos_tea",
  link: "https://www.wikipedia.org/wiki/Rooibos",
  type: "tea",
  originIngredients: [Rooibos.id],
  properties: {
    qualities: ["cool", "light"],
    tastes: ["floral", "sweet", "fruity", "earthy", "nutty"],
  },
  needsAttribution: true,
};

export const HibiscusTea: Ingredient = {
  id: "hibiscus_tea",
  link: "https://www.wikipedia.org/wiki/Hibiscus",
  type: "tea",
  originIngredients: [Hibiscus.id],
  properties: {
    qualities: ["cool", "light"],
    tastes: ["floral", "fruity", "tangy", "sour", "astringent", "sweet"],
  },
  needsAttribution: true,
};

export const PeppermintTea: Ingredient = {
  id: "peppermint_tea",
  link: "https://www.wikipedia.org/wiki/Peppermint",
  type: "tea",
  originIngredients: [Peppermint.id],
  properties: {
    qualities: ["cool", "sharp"],
    tastes: ["menthol", "earthy"],
  },
  needsAttribution: true,
};

export const ChamomileTea: Ingredient = {
  id: "chamomile_tea",
  link: "https://www.wikipedia.org/wiki/Chamomile",
  type: "tea",
  originIngredients: [Chamomile.id],
  properties: {
    qualities: ["cool", "light"],
    tastes: ["floral", "sweet", "fruity", "grassy", "bitter"],
  },
  needsAttribution: true,
};

export const TurkishTea: Ingredient = {
  id: "turkish_tea",
  link: "https://www.wikipedia.org/wiki/Turkish_tea",
  type: "tea",
  originIngredients: ["camellia_sinensis"],
  properties: {
    qualities: ["cool", "light"],
    tastes: ["floral", "sweet", "fruity", "earthy", "malty", "astringent"],
    growth: CamelliaSinensisGrowth,
  },
  needsAttribution: true,
};

export const RoseTea: Ingredient = {
  id: "rose_tea",
  link: "https://www.wikipedia.org/wiki/Rose_tea",
  type: "tea",
  originIngredients: ["rosa_damascena"],
  properties: {
    qualities: ["cool", "light"],
    tastes: ["floral", "sweet", "fruity"],
    growth: {
      growthForms: ["bushShrub"], // woody perennial rose shrub
      lightPreferences: ["full_sun"], // needs strong light to produce fragrant petals
      lifeCycles: ["perennial"],
      heightClasses: ["medium"], // typically 3 to 6 feet
      frostTolerances: ["hardy"], // survives cold winters in temperate climates
      soilPreferences: ["moist_well_drained"], // steady moisture but hates waterlogging
    },
  },
  needsAttribution: true,
};

export const GingerTea: Ingredient = {
  id: "ginger_tea",
  link: "https://www.wikipedia.org/wiki/Ginger_tea",
  type: "tea",
  originIngredients: [Ginger.id],
  properties: {
    qualities: ["cool", "light"],
    tastes: ["floral", "zesty", "earthy", "peppery"],
  },
  needsAttribution: true,
};

export const SpearmintTea: Ingredient = {
  id: "spearmint_tea",
  link: "https://www.wikipedia.org/wiki/Mint_tea",
  type: "tea",
  originIngredients: [Spearmint.id],
  properties: {
    qualities: ["delicate"],
    tastes: ["grassy", "menthol", "sweet"],
  },
  needsAttribution: true,
};

export const OolongTea: Ingredient = {
  id: "oolong_tea",
  link: "https://www.wikipedia.org/wiki/Oolong_tea",
  type: "tea",
  originIngredients: ["camellia_sinensis"],
  properties: {
    qualities: ["cool", "light"],
    tastes: ["floral", "woody", "earthy", "nutty", "malty"],
    growth: CamelliaSinensisGrowth,
  },
  needsAttribution: true,
};

export const GreenTea: Ingredient = {
  id: "green_tea",
  link: "https://www.wikipedia.org/wiki/Green_tea",
  type: "tea",
  originIngredients: ["camellia_sinensis"],
  properties: {
    qualities: ["cool", "light"],
    tastes: ["grassy", "floral", "bitter", "earthy"],
    growth: CamelliaSinensisGrowth,
  },
  needsAttribution: true,
};

export const Honeycomb: Ingredient = {
  id: "honeycomb",
  link: "https://www.wikipedia.org/wiki/Honeycomb",
  type: "sugar",

  properties: {
    qualities: ["chewy", "sticky"],
    tastes: ["sweet", "floral", "nutty", "woody"],
  },
  needsAttribution: true,
};

export const Yuzu: Ingredient = {
  id: "yuzu",
  link: "https://www.wikipedia.org/wiki/Yuzu",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["cool", "juicy"],
    tastes: ["citrusy", "sour", "tangy", "zesty", "sweet", "bitter", "savory"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [15, 30],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // More cold-tolerant citrus, but still benefits from site planning
      recommendedPlantYearFromStart: [0.5, 3],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [30, 60],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient("yuzu", "Yuzu"),
  ],
};

export const Burrata: Ingredient = {
  id: "burrata",
  link: "https://www.wikipedia.org/wiki/Burrata",
  type: "dairy",

  properties: {
    qualities: ["dense", "smooth", "creamy", "cool"],
    tastes: ["milky", "sweet", "savory"],
  },
  needsAttribution: true,
};

export const MungBean: Ingredient = {
  id: "mung_bean",
  link: "https://www.wikipedia.org/wiki/Mung_bean",
  type: "legume",

  properties: {
    qualities: ["smooth", "fibrous"],
    tastes: ["earthy", "nutty", "grassy", "savory"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [20, 35],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "taproot_seeker",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Warm-season fast-cycling legume
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.25, 0.45],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [getExtraFactAboutLegumeSeed("mung_bean", "Mung beans")],
};

const CoffeaArabicaGrowth: Growth = {
  growthForms: ["understory", "bushShrub"],
  lightPreferences: ["filtered_light", "partial_sun"],
  lifeCycles: ["perennial"],
  heightClasses: ["medium"],
  frostTolerances: ["frost_intolerant"],
  soilPreferences: ["moist_well_drained"],
  airHumidityPreferences: ["humid_air"],
  climateProfile: {
    optimalTempRangeC: [15, 25],
  },
  soilInteraction: {
    root: {
      depthBand: "medium",
      feederZone: "mid",
      strategy: "woody_structural",
    },
    demand: {
      nutrientPull: "medium",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const CoffeaArabicaSuccession: SuccessionProfile = {
  successionalPhase: "late",

  // Requires stable understory microclimate
  recommendedPlantYearFromStart: [1, 4],

  // True understory tree at establishment
  establishmentLight: "filtered_light",

  yearsToFirstHarvest: [3, 5],

  productiveLifespanYears: [25, 50],

  managementRotation: "keep",
};

export const CoffeeBean: Ingredient = {
  id: "coffee_bean",
  link: "https://www.wikipedia.org/wiki/Coffee_bean",
  type: "seed",
  originIngredients: ["coffea_arabica"],
  properties: {
    qualities: ["sharp"],
    tastes: ["bitter", "earthy", "nutty", "malty"],
    growth: CoffeaArabicaGrowth,
    succession: CoffeaArabicaSuccession,
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "coffee_bean",
      "Coffee Bean",
      "It sits inside a red coffee fruit (a berry), but the ingredient is the seed.",
    ),
    {
      id: "coffee_bean_climate_preferences",
      label:
        "Arabica prefers cooler tropical highlands; Robusta tolerates more heat.",
      content:
        "Arabica prefers cooler tropical highlands; Robusta tolerates more heat.",
    },
  ],
};

export const Coffee: Ingredient = {
  id: "coffee",
  link: "https://www.wikipedia.org/wiki/Coffee",
  type: "misc",
  originIngredients: [CoffeeBean.id],
  properties: {
    qualities: ["sharp"],
    tastes: ["bitter", "earthy", "nutty", "malty"],
    growth: CoffeaArabicaGrowth,
    succession: CoffeaArabicaSuccession,
  },
  needsAttribution: true,
};

export const Espresso: Ingredient = {
  id: "espresso",
  link: "https://www.wikipedia.org/wiki/Espresso",
  type: "misc",
  originIngredients: ["coffea_arabica"],
  properties: {
    qualities: ["sharp"],
    tastes: ["bitter", "earthy", "nutty"],
    growth: CoffeaArabicaGrowth,
    succession: CoffeaArabicaSuccession,
  },
  needsAttribution: true,
};

export const GreenBean: Ingredient = {
  id: "green_bean",
  link: "https://www.wikipedia.org/wiki/Green_bean",
  type: "legume",

  properties: {
    qualities: ["snappy", "fibrous"],
    tastes: ["grassy", "earthy", "nutty", "sweet", "bitter"],
    growth: {
      growthForms: ["herbaceous", "climber"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "taproot_seeker",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Early warm-season annual legume
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Fresh pod harvest in same season
      yearsToFirstHarvest: [0.25, 0.45],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "green_bean",
      "Green Bean",
      `The entire bean is a legume fruit. But in gastronomy, green beans are often treated as a "vegetable".`,
    ),
  ],
};

export const BurdockRoot: Ingredient = {
  id: "burdock_root",
  link: "https://www.wikipedia.org/wiki/Burdock",
  type: "root",

  properties: {
    tastes: ["earthy", "woody", "sweet"],
    growth: {
      growthForms: ["herbaceous", "root"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["biennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Likes reasonably loose soil but not extreme disturbance
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Typically harvested in year 1 or 2
      yearsToFirstHarvest: [1, 2],

      productiveLifespanYears: [1, 3],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
};

export const RibeyeSteak: Ingredient = {
  id: "ribeye__beef",
  link: "https://www.wikipedia.org/wiki/Ribeye_steak",
  type: "meat",

  properties: {
    qualities: ["dense", "rich", "juicy", "tender"],
    tastes: ["beefy", "savory", "milky"],
  },
  needsAttribution: true,
};

export const PorkChop: Ingredient = {
  id: "pork_chop",
  link: "https://www.wikipedia.org/wiki/Pork_chop",
  type: "meat",

  properties: {
    qualities: ["dense", "juicy", "tender"],
    tastes: ["savory", "salty", "earthy"],
  },
  needsAttribution: true,
};

export const LambChop: Ingredient = {
  id: "lamb_chop",
  link: "https://www.wikipedia.org/wiki/Lamb",
  type: "meat",

  properties: {
    qualities: ["dense", "juicy", "tender"],
    tastes: ["savory", "gamey", "earthy", "nutty", "woody", "milky"],
  },
  needsAttribution: true,
};

export const FoieGras: Ingredient = {
  id: "foie_gras",
  link: "https://www.wikipedia.org/wiki/Foie_gras",
  type: "meat",

  properties: {
    qualities: ["dense", "rich", "creamy"],
    tastes: ["savory", "milky", "nutty", "sweet"],
  },
  needsAttribution: true,
};

export const ChickenLiver: Ingredient = {
  id: "chicken_liver",
  link: "https://www.wikipedia.org/wiki/Chicken_liver",
  type: "meat",

  properties: {
    qualities: ["dense", "rich"],
    tastes: ["savory", "nutty", "gamey"],
  },
  needsAttribution: true,
};

export const ChickenDrumstick: Ingredient = {
  id: "chicken_drumstick",
  link: "https://www.wikipedia.org/wiki/Chicken_drumstick",
  type: "meat",

  properties: {
    qualities: ["dense", "juicy", "tender", "rich"],
    tastes: ["savory", "gamey"],
  },
  needsAttribution: true,
};

export const AmericanPawpaw: Ingredient = {
  id: "american_pawpaw",
  link: "https://www.wikipedia.org/wiki/American_pawpaw",
  type: "fruit",
  properties: {
    qualities: ["dense", "smooth", "jelly-like", "creamy", "juicy"],
    tastes: ["sweet", "fruity", "milky", "citrusy", "floral"],
    growth: {
      growthForms: ["understory"],
      lightPreferences: ["filtered_light", "partial_sun", "full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        chillHours: [400, 800],
        optimalTempRangeC: [12, 25],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Often started early under light shade, then becomes more sun-tolerant with age
      recommendedPlantYearFromStart: [0, 2],

      // Seedlings prefer protection from harsh sun
      establishmentLight: "filtered_light",

      // Grafted: often 3–5 years. Seedlings: longer. This covers both reasonably.
      yearsToFirstHarvest: [3, 7],

      // Long productive window once established
      productiveLifespanYears: [25, 60],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "american_pawpaw",
      "American Pawpaw",
    ),
  ],
};

export const ChickenBreast: Ingredient = {
  id: "chicken_breast",
  link: "https://www.wikipedia.org/wiki/Chicken_breast",
  type: "meat",

  properties: {
    qualities: ["dense", "lean", "tender", "juicy"],
    tastes: ["savory", "sweet"],
  },
  needsAttribution: true,
};

export const BeefRibs: Ingredient = {
  id: "beef_ribs",
  link: "https://www.wikipedia.org/wiki/Beef_ribs",
  type: "meat",

  properties: {
    qualities: ["dense", "juicy", "tender"],
    tastes: ["beefy", "savory", "sweet"],
  },
  needsAttribution: true,
};

export const PorkRibs: Ingredient = {
  id: "pork_ribs",
  link: "https://www.wikipedia.org/wiki/Pork_ribs",
  type: "meat",

  properties: {
    qualities: ["dense", "juicy", "tender"],
    tastes: ["savory", "sweet"],
  },
  needsAttribution: true,
};

export const VenisonDeer: Ingredient = {
  id: "venison__deer",
  link: "https://www.wikipedia.org/wiki/Deer",
  type: "meat",

  properties: {
    qualities: ["dense", "juicy", "tender", "lean"],
    tastes: ["savory", "gamey", "earthy", "woody"],
  },
  needsAttribution: true,
};

export const EggYolkChicken: Ingredient = {
  id: "egg_yolk__chicken",
  link: "https://www.wikipedia.org/wiki/Chicken_egg",
  type: "meat",

  properties: {
    qualities: ["dense", "rich", "creamy", "smooth"],
    tastes: ["savory", "milky"],
  },
  needsAttribution: true,
};

export const QuailEgg: Ingredient = {
  id: "quail_egg",
  link: "https://www.wikipedia.org/wiki/Quail",
  type: "meat",

  properties: {
    qualities: ["dense", "rich", "creamy", "smooth"],
    tastes: ["savory", "milky", "gamey"],
  },
  needsAttribution: true,
};

export const ChickenEgg: Ingredient = {
  id: "egg__chicken",
  link: "https://www.wikipedia.org/wiki/Chicken_egg",
  type: "meat",

  properties: {
    qualities: ["dense", "rich", "creamy", "smooth"],
    tastes: ["savory", "milky"],
  },
  needsAttribution: true,
};

export const Quail: Ingredient = {
  id: "quail",
  link: "https://www.wikipedia.org/wiki/Quail",
  type: "meat",

  properties: {
    qualities: ["dense", "tender"],
    tastes: ["savory", "gamey", "earthy", "nutty"],
  },
  needsAttribution: true,
};

export const Duck: Ingredient = {
  id: "duck",
  link: "https://www.wikipedia.org/wiki/Duck",
  type: "meat",

  properties: {
    qualities: ["dense", "tender", "rich"],
    tastes: ["savory", "smoky", "sweet"],
  },
  needsAttribution: true,
};

export const Turkey: Ingredient = {
  id: "turkey",
  link: "https://www.wikipedia.org/wiki/Turkey",
  type: "meat",

  properties: {
    qualities: ["dense", "tender"],
    tastes: ["savory", "earthy", "gamey"],
  },
  needsAttribution: true,
};

export const Bacon: Ingredient = {
  id: "bacon",
  link: "https://www.wikipedia.org/wiki/Bacon",
  type: "meat",

  properties: {
    qualities: ["dense", "rich"],
    tastes: ["savory", "smoky", "woody", "salty"],
  },
  needsAttribution: true,
};

export const LavaSalt: Ingredient = {
  id: "lava_salt",
  link: "https://saltverk.com/products/saltverk-lava-salt",
  type: "salt",

  properties: {
    tastes: ["salty", "smoky", "savory", "earthy"],
  },
  needsAttribution: true,
};

export const PinkSalt: Ingredient = {
  id: "pink_salt",
  link: "https://en.wikipedia.org/wiki/Pink_salt",
  type: "salt",

  properties: {
    tastes: ["salty"],
  },
  needsAttribution: true,
};

export const SeaSalt: Ingredient = {
  id: "sea_salt",
  link: "https://en.wikipedia.org/wiki/Sea_salt",
  type: "salt",

  properties: {
    tastes: ["salty", "briny"],
  },
  needsAttribution: true,
};

export const Marjoram: Ingredient = {
  id: "marjoram",
  link: "https://en.wikipedia.org/wiki/Marjoram",
  type: "leaf",

  properties: {
    qualities: ["light", "delicate"],
    tastes: ["zesty", "sweet", "earthy", "peppery", "woody"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["short_lived_perennial"],
      heightClasses: ["low"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [15, 30],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Fits well once soil is settled but still open
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.5, 1],

      productiveLifespanYears: [3, 6],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "marjoram",
      "Marjoram",
      undefined,
      "leaf",
      "herb",
    ),
  ],
};

export const Basil: Ingredient = {
  id: "basil",
  link: "https://en.wikipedia.org/wiki/Basil",
  type: "leaf",

  properties: {
    qualities: ["delicate", "light"],
    tastes: ["sweet", "peppery", "anise", "floral"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Warm-season leaf crop, ideal early filler
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Very fast leaf harvest
      yearsToFirstHarvest: [0.15, 0.3],

      productiveLifespanYears: [0.3, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

const MustardGrowth: Growth = {
  growthForms: ["herbaceous"],
  lightPreferences: ["full_sun", "partial_sun"],
  lifeCycles: ["annual"],
  heightClasses: ["low", "medium"],
  frostTolerances: ["semi_hardy"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [8, 20],
  },
  airHumidityPreferences: ["moderate_humidity"],
  soilInteraction: {
    root: {
      depthBand: "shallow",
      feederZone: "surface",
      strategy: "diffuse_forager",
    },
    demand: {
      nutrientPull: "low",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const MustardSuccession: SuccessionProfile = {
  successionalPhase: "pioneer",

  // Very fast early green, often used as a gap filler
  recommendedPlantYearFromStart: [0, 1],

  establishmentLight: "full_sun",

  yearsToFirstHarvest: [0.15, 0.35],

  productiveLifespanYears: [0.2, 1],

  managementRotation: "short_rotation",
};

export const MustardLeaf: Ingredient = {
  id: "mustard_leaf",
  link: "https://en.wikipedia.org/wiki/Mustard",
  type: "leaf",
  originIngredients: ["mustard_plant"],
  properties: {
    qualities: ["delicate", "light", "sharp"],
    tastes: ["pungent", "bitter", "earthy"],
    growth: MustardGrowth,
    succession: MustardSuccession,
  },
  needsAttribution: true,
};

export const MustardSeed: Ingredient = {
  id: "mustard_seed",
  link: "https://en.wikipedia.org/wiki/Mustard",
  type: "seed",
  originIngredients: ["mustard_plant"],
  properties: {
    qualities: ["sharp"],
    tastes: ["pungent", "bitter", "earthy"],
    growth: MustardGrowth,
    succession: {
      successionalPhase: "pioneer",

      // Fast annual seed crop for open, disturbed soil
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Seed harvest after flowering in same season
      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

const FenugreekGrowth: Growth = {
  growthForms: ["herbaceous"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["annual"],
  heightClasses: ["low", "medium"],
  frostTolerances: ["frost_sensitive"],
  soilPreferences: ["moist_well_drained", "dry"],
  climateProfile: {
    optimalTempRangeC: [10, 22],
  },
  airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
  soilInteraction: {
    root: {
      depthBand: "shallow",
      feederZone: "surface",
      strategy: "diffuse_forager",
    },
    demand: {
      nutrientPull: "low",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const FenugreekSuccession: SuccessionProfile = {
  successionalPhase: "pioneer",

  // Early nitrogen-supporting green
  recommendedPlantYearFromStart: [0, 1],

  establishmentLight: "full_sun",

  yearsToFirstHarvest: [0.2, 0.4],

  productiveLifespanYears: [0.3, 1],

  managementRotation: "short_rotation",
};

export const FenugreekSeed: Ingredient = {
  id: "fenugreek_seed",
  link: "https://en.wikipedia.org/wiki/Fenugreek",
  type: "seed",

  properties: {
    qualities: ["dense", "crunchy"],
    tastes: ["nutty", "woody", "earthy"],
    growth: FenugreekGrowth,
    succession: {
      successionalPhase: "pioneer",

      // Early nitrogen-supporting seed crop
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.4, 0.7],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const Oregano: Ingredient = {
  id: "oregano",
  link: "https://en.wikipedia.org/wiki/Oregano",
  type: "leaf",

  properties: {
    qualities: ["light", "delicate"],
    tastes: ["earthy", "peppery", "bitter", "zesty"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [12, 28],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Prefers settled, well-drained soil
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.5, 1],

      productiveLifespanYears: [8, 20],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
};

export const Lemongrass: Ingredient = {
  id: "lemongrass",
  link: "https://en.wikipedia.org/wiki/Lemongrass",
  type: "stem",

  properties: {
    qualities: ["light", "delicate"],
    tastes: ["citrusy", "zesty", "floral", "grassy", "sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      airHumidityPreferences: ["humid_air"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Establishes well once soil is reasonably settled
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Leaf harvest begins within the first year
      yearsToFirstHarvest: [0.5, 1],

      // Clumps persist for years but benefit from division
      productiveLifespanYears: [5, 15],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "lemongrass",
      "Lemongrass",
      undefined,
      "stem",
      "herb",
    ),
  ],
};

export const FenugreekLeaf: Ingredient = {
  id: "fenugreek_leaf",
  link: "https://en.wikipedia.org/wiki/Fenugreek",
  type: "leaf",

  properties: {
    qualities: ["light"],
    tastes: ["earthy", "nutty", "woody", "bitter"],
    growth: FenugreekGrowth,
    succession: FenugreekSuccession,
  },
  needsAttribution: true,
};

export const Dill: Ingredient = {
  id: "dill",
  link: "https://en.wikipedia.org/wiki/Dill",
  type: "leaf",

  properties: {
    qualities: ["delicate", "light", "sharp"],
    tastes: ["grassy", "citrusy", "zesty", "anise"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Fast, light-demanding herb, often self-seeds
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Leaf harvest quickly, seed later
      yearsToFirstHarvest: [0.2, 0.4],

      productiveLifespanYears: [0.3, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const BayLeaf: Ingredient = {
  id: "bay_leaf",
  link: "https://en.wikipedia.org/wiki/Bay_leaf",
  type: "leaf",

  properties: {
    qualities: ["delicate", "light"],
    tastes: ["floral", "bitter", "earthy", "peppery"],
    growth: {
      growthForms: ["bushShrub", "midstory"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [12, 30],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Slow, deliberate evergreen; place once long-term structure is clear
      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "full_sun",

      // Leaves usable earlier, but meaningful harvest once shrub/tree is established
      yearsToFirstHarvest: [2, 4],

      productiveLifespanYears: [30, 80],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
};

const PerillaGrowth: Growth = {
  growthForms: ["herbaceous"],
  lightPreferences: ["full_sun", "partial_sun"],
  lifeCycles: ["annual"],
  heightClasses: ["low", "medium"],
  frostTolerances: ["frost_sensitive"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [18, 30],
  },
  airHumidityPreferences: ["moderate_humidity", "humid_air"],
  soilInteraction: {
    root: {
      depthBand: "shallow",
      feederZone: "surface",
      strategy: "diffuse_forager",
    },
    demand: {
      nutrientPull: "low",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const PerillaSuccession: SuccessionProfile = {
  successionalPhase: "early",

  // Thrives early, often self-seeds and fills gaps
  recommendedPlantYearFromStart: [0, 2],

  // Likes sun but tolerates partial shade as canopy develops
  establishmentLight: "full_sun",

  yearsToFirstHarvest: [0.3, 0.6],

  productiveLifespanYears: [1, 3],

  managementRotation: "medium_rotation",
};

export const PerillaSeed: Ingredient = {
  id: "perilla_seed",
  link: "https://en.wikipedia.org/wiki/Perilla",
  type: "seed",

  properties: {
    qualities: ["dense", "smooth", "rough"],
    tastes: ["nutty", "woody", "earthy", "savory", "peppery"],
    growth: PerillaGrowth,
    succession: {
      successionalPhase: "pioneer",

      // Fast annual seed crop, often self-seeding
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Seed harvest after flowering
      yearsToFirstHarvest: [0.4, 0.7],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const PerillaOil: Ingredient = {
  id: "perilla_oil",
  link: "https://en.wikipedia.org/wiki/Perilla_oil",
  type: "fat",
  originIngredients: [PerillaSeed.id],
  properties: {
    qualities: ["dense", "rich", "smooth", "sharp"],
    tastes: ["nutty", "woody", "earthy", "savory", "peppery"],
  },
  needsAttribution: true,
};

export const BlackPepper: Ingredient = {
  id: "black_pepper",
  link: "https://en.wikipedia.org/wiki/Black_pepper",
  type: "fruit",

  properties: {
    qualities: ["sharp"],
    tastes: ["peppery"],
    growth: {
      growthForms: ["climber"],
      lightPreferences: ["partial_sun", "filtered_light"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [22, 32],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Best once you already have living supports / posts and some microclimate stability
      recommendedPlantYearFromStart: [0.5, 3],

      // Establishes best with nurse shade; can take more light later if not scorched
      establishmentLight: "filtered_light",

      // Usually starts producing in a few years
      yearsToFirstHarvest: [2, 4],

      // Long-lived vine with a long planning window if managed
      productiveLifespanYears: [10, 25],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "black_pepper",
      "Black Pepper",
      undefined,
      "dried, one-seeded fruit",
      "spice",
    ),
  ],
};

export const Arugula: Ingredient = {
  id: "arugula",
  link: "https://en.wikipedia.org/wiki/Arugula",
  type: "leaf",

  properties: {
    qualities: ["light", "delicate", "sharp"],
    tastes: ["peppery", "grassy", "bitter"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [8, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Fast cool-season green, perfect for earliest phases
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Very fast leaf harvest
      yearsToFirstHarvest: [0.1, 0.3],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const HempSeed: Ingredient = {
  id: "hemp_seed",
  link: "https://en.wikipedia.org/wiki/Hemp",
  type: "seed",
  originIngredients: ["hemp"],
  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["nutty", "earthy", "savory"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["high"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Fast, high-biomass annual for early phases
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.4, 0.8],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const FlaxSeed: Ingredient = {
  id: "flax_seed",
  link: "https://en.wikipedia.org/wiki/Flax",
  type: "seed",

  properties: {
    qualities: ["dense", "rough"],
    tastes: ["nutty", "woody"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Open-field oilseed / fiber crop
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.4, 0.7],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const ChiaSeed: Ingredient = {
  id: "chia_seed",
  link: "https://en.wikipedia.org/wiki/Chia",
  type: "seed",
  originIngredients: ["mint_family_herb"],
  properties: {
    qualities: ["dense", "rough", "crunchy"],
    tastes: ["nutty", "earthy"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Warm-season annual, low-input
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

const VanillaGrowth: Growth = {
  growthForms: ["climber"],
  lightPreferences: ["filtered_light", "partial_sun"],
  lifeCycles: ["perennial"],
  heightClasses: ["medium", "high"],
  frostTolerances: ["frost_intolerant"],
  soilPreferences: ["moist_well_drained"],
  airHumidityPreferences: ["humid_air"],
  climateProfile: {
    optimalTempRangeC: [20, 30],
  },
  soilInteraction: {
    root: {
      depthBand: "medium",
      feederZone: "mid",
      strategy: "diffuse_forager",
    },
    demand: {
      nutrientPull: "medium",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const VanillaBeanSuccession: SuccessionProfile = {
  successionalPhase: "mid",

  // Requires living supports and stable humidity
  recommendedPlantYearFromStart: [1, 4],

  // True understory climber at establishment
  establishmentLight: "filtered_light",

  yearsToFirstHarvest: [3, 5],

  productiveLifespanYears: [10, 25],

  managementRotation: "keep",
};

export const VanillaBean: Ingredient = {
  id: "vanilla_bean",
  link: "https://en.wikipedia.org/wiki/Vanilla",
  type: "fruit",
  originIngredients: ["vanilla_flower"],
  properties: {
    qualities: ["delicate", "light"],
    tastes: ["floral", "sweet"],
    growth: VanillaGrowth,
    succession: VanillaBeanSuccession,
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "vanilla_bean",
      "Vanilla Bean",
      undefined,
      "fruit",
      "flavoring ingredient",
    ),
  ],
};

export const VanillaEssence: Ingredient = {
  id: "vanilla_essence",
  link: "https://en.wikipedia.org/wiki/Vanilla",
  type: "misc",
  originIngredients: ["vanilla_flower"],
  properties: {
    qualities: ["delicate"],
    tastes: ["floral", "sweet"],
    growth: VanillaGrowth,
  },
  needsAttribution: true,
};

export const PoppySeed: Ingredient = {
  id: "poppy_seed",
  link: "https://en.wikipedia.org/wiki/Poppy_seed",
  type: "seed",
  originIngredients: ["poppy_flower"],
  properties: {
    qualities: ["dense", "rough"],
    tastes: ["nutty", "earthy"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Fast annual seed crop for open ground
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Seed heads mature same season
      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const Clam: Ingredient = {
  id: "clam",
  link: "https://en.wikipedia.org/wiki/Clam",
  type: "seafood",

  properties: {
    qualities: ["light", "chewy", "jelly-like", "tender"],
    tastes: ["briny", "salty", "savory"],
  },
  needsAttribution: true,
};

export const Mussel: Ingredient = {
  id: "mussel",
  link: "https://en.wikipedia.org/wiki/Mussel",
  type: "seafood",

  properties: {
    qualities: ["chewy", "jelly-like"],
    tastes: ["briny", "salty", "savory"],
  },
  needsAttribution: true,
};

export const Squid: Ingredient = {
  id: "squid",
  link: "https://en.wikipedia.org/wiki/Squid",
  type: "seafood",

  properties: {
    qualities: ["dense", "chewy"],
    tastes: ["briny", "salty", "savory"],
  },
  needsAttribution: true,
};

export const Sugar: Ingredient = {
  id: "sugar",
  link: "https://en.wikipedia.org/wiki/Sugar",
  type: "sugar",
  originIngredients: [Sugarcane.id],
  properties: {
    qualities: ["smooth"],
    tastes: ["sweet"],
  },
  needsAttribution: true,
};

export const Molasses: Ingredient = {
  id: "molasses",
  link: "https://www.wikipedia.org/wiki/Molasses",
  type: "sugar",
  originIngredients: [Sugarcane.id],
  properties: {
    qualities: ["sticky", "dense"],
    tastes: ["sweet", "malty", "woody", "smoky", "earthy", "tangy", "bitter"],
  },
  needsAttribution: true,
};

export const BrownSugar: Ingredient = {
  id: "brown_sugar",
  link: "https://en.wikipedia.org/wiki/Brown_sugar",
  type: "sugar",
  originIngredients: [Sugarcane.id],
  properties: {
    tastes: ["sweet", "woody", "nutty"],
  },
  needsAttribution: true,
};

export const Lavender: Ingredient = {
  id: "lavender",
  link: "https://en.wikipedia.org/wiki/Lavender",
  type: "flower",

  properties: {
    qualities: ["delicate", "light"],
    tastes: ["floral", "sweet", "fruity", "bitter"],
    growth: {
      growthForms: ["bushShrub"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [15, 30],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Prefers open, dry, well-drained conditions early
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Light flowering often year 1, fuller by year 2
      yearsToFirstHarvest: [1, 2],

      productiveLifespanYears: [6, 12],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "lavender",
      "Lavender",
      undefined,
      "flower",
      "herb",
    ),
  ],
};

export const LavenderTea: Ingredient = {
  id: "lavender_tea",
  link: "https://www.wikipedia.org/wiki/Lavender",
  type: "tea",
  originIngredients: [Lavender.id],
  properties: {
    qualities: ["cool", "light"],
    tastes: ["floral", "sweet", "fruity", "bitter"],
  },
  needsAttribution: true,
};

export const Saffron: Ingredient = {
  id: "saffron",
  link: "https://en.wikipedia.org/wiki/Saffron",
  type: "flower",
  originIngredients: ["crocus_flower"],
  properties: {
    qualities: ["delicate", "smooth"],
    tastes: ["floral", "sweet"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["partial_sun", "full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Can be introduced once soil structure is stable and well drained
      recommendedPlantYearFromStart: [0, 2],

      // Likes sun during growth, tolerates light shade
      establishmentLight: "full_sun",

      // Flowers in the first season after planting corms
      yearsToFirstHarvest: [0.25, 0.75],

      // Corms multiply but productivity declines without division
      productiveLifespanYears: [3, 6],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "saffron",
      "Saffron",
      undefined,
      "stigma of a flower",
      "spice",
    ),
    // add note abotu how ti flowers in autumn not spring
    {
      id: "saffron_flowering_season",
      label: "Flowering Season",
      content: "Flowers in autumn, not spring.",
    },
  ],
};

export const Nutmeg: Ingredient = {
  id: "nutmeg",
  link: "https://en.wikipedia.org/wiki/Nutmeg",
  type: "seed",

  properties: {
    qualities: ["sharp"],
    tastes: ["woody", "earthy", "nutty", "sweet", "bitter", "anise"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["partial_sun", "full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [22, 32],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // True long-horizon tropical tree, spacing and patience required
      recommendedPlantYearFromStart: [2, 6],

      // Young trees require shelter and filtered light
      establishmentLight: "filtered_light",

      // Very slow to bear
      yearsToFirstHarvest: [7, 15],

      productiveLifespanYears: [60, 120],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "nutmeg",
      "Nutmeg",
      undefined,
      "seed",
      "spice",
    ),
  ],
};

export const SugarMapleTree: Ingredient = {
  id: "sugar_maple__acer_saccharum",
  link: "https://en.wikipedia.org/wiki/Acer_saccharum",
  type: "process",

  properties: {
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["moderate_humidity"],
      climateProfile: {
        chillHours: [800, 1600],
        optimalTempRangeC: [-5, 22],
      },
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },

    succession: {
      successionalPhase: "late",
      recommendedPlantYearFromStart: [2, 6],
      establishmentLight: "partial_sun",
      yearsToFirstHarvest: [25, 40], // sap maturity, not fruit
      productiveLifespanYears: [80, 200],
      managementRotation: "keep",
    },

    ecologicalProcess: {
      functions: ["microclimate_builder", "soil_structure_builder"],

      succession: {
        primaryPhase: "late",
        peakPhases: ["late", "legacy"],
        isTypicallyTemporary: false,
      },

      fertility: {
        nitrogenFixation: "none",
        nutrientPump: {
          isNutrientPump: false,
        },
      },

      biomass: {
        throughput: "medium",
        leafDropValue: "high",
      },

      microclimate: {
        shadeBuildRate: "slow",
        humidityLift: "medium",
        windBuffering: "high",
        soilCooling: "medium",
      },

      management: {
        strategies: ["leave", "thin"],
        invasivenessRisk: "low",
        cautions: [
          "Sensitive to soil compaction",
          "Does not tolerate prolonged waterlogging",
          "Requires long planning horizon before sap yield",
        ],
      },
    },
  },

  extraFacts: [
    {
      id: "maple-sap",
      label: "Sap Flow",
      content:
        "Sap flow depends on freeze–thaw cycles in late winter, making sugar maple uniquely adapted to cold temperate climates.",
      highlights: [{ text: "freeze–thaw dependent", theme: "frost" }],
    },
    {
      id: "maple-leaf-litter",
      label: "Leaf Litter Value",
      content:
        "Annual leaf drop builds deep forest duff, supporting fungal networks and long-term soil aggregation.",
      highlights: [{ text: "high litter value", theme: "growthForm" }],
    },
  ],
};

export const MapleSyrup: Ingredient = {
  id: "maple_syrup",
  link: "https://en.wikipedia.org/wiki/Maple_syrup",
  type: "sugar",
  originIngredients: [SugarMapleTree.id],
  properties: {
    qualities: ["smooth", "sticky", "delicate"],
    tastes: ["sweet", "woody", "malty"],
    growth: SugarMapleTree.properties.growth,
  },
  needsAttribution: true,
};

export const MapleSugar: Ingredient = {
  id: "maple_sugar",
  link: "https://en.wikipedia.org/wiki/Maple_sugar",
  type: "sugar",
  originIngredients: [SugarMapleTree.id],
  properties: {
    qualities: ["dense"],
    tastes: ["sweet", "woody", "malty"],
    growth: SugarMapleTree.properties.growth,
  },
};

export const MapleWood: Ingredient = {
  id: "maple_wood",
  link: "https://en.wikipedia.org/wiki/Maple_wood",
  type: "misc",
  originIngredients: [SugarMapleTree.id],
  properties: {
    tastes: ["woody", "smoky"],
    growth: SugarMapleTree.properties.growth,
  },
};

export const AgaveSyrup: Ingredient = {
  id: "agave_syrup",
  link: "https://en.wikipedia.org/wiki/Agave",
  type: "misc",
  originIngredients: ["agave_plant"],
  properties: {
    qualities: ["delicate", "smooth", "sticky"],
    tastes: ["sweet", "fruity", "woody"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["dry"],
      climateProfile: {
        optimalTempRangeC: [18, 35],
      },
      airHumidityPreferences: ["semi_arid_air"],
    },
  },
  needsAttribution: true,
};

export const Endive: Ingredient = {
  id: "endive",
  link: "https://en.wikipedia.org/wiki/Endive",
  type: "leaf",

  properties: {
    qualities: ["snappy", "light"],
    tastes: ["bitter", "earthy", "nutty", "sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["biennial"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [8, 18],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Early leaf crop that prefers open light
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [0.3, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "endive",
      "Endive",
      undefined,
      "leaf",
    ),
  ],
};

export const Kohlrabi: Ingredient = {
  id: "kohlrabi",
  link: "https://en.wikipedia.org/wiki/Kohlrabi",
  type: "stem",

  properties: {
    qualities: ["light", "juicy", "snappy"],
    tastes: ["sweet", "earthy", "grassy", "savory"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["biennial"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [8, 18],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Fast cool-season stem crop
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const Leek: Ingredient = {
  id: "leek",
  link: "https://en.wikipedia.org/wiki/Leek",
  type: "leaf",

  properties: {
    qualities: ["light"],
    tastes: ["sweet", "earthy", "savory"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["biennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [8, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Cool-season, soil-opening crop
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.6, 1],

      productiveLifespanYears: [0.5, 1.5],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const Quinoa: Ingredient = {
  id: "quinoa",
  link: "https://en.wikipedia.org/wiki/Quinoa",
  type: "seed",

  properties: {
    qualities: ["smooth", "dense"],
    tastes: ["nutty", "earthy", "sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Open-field grain/seed crop for early phases
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Same-season seed harvest
      yearsToFirstHarvest: [0.4, 0.7],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [getExtraFactAboutPseudoCereal("quinoa", "Quinoa")],
};

export const Sage: Ingredient = {
  id: "sage",
  link: "https://en.wikipedia.org/wiki/Sage",
  type: "leaf",

  properties: {
    qualities: ["delicate", "light"],
    tastes: ["earthy", "bitter"],
    growth: {
      growthForms: ["bushShrub"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [12, 30],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Prefers settled, well-drained soil
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.5, 1.5],

      productiveLifespanYears: [8, 20],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
};

export const Parsley: Ingredient = {
  id: "parsley",
  link: "https://en.wikipedia.org/wiki/Parsley",
  type: "leaf",

  properties: {
    qualities: ["delicate", "light"],
    tastes: ["grassy", "earthy", "floral"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["biennial"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [8, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Biennial herb that bridges fast greens and longer-lived herbs
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Leaf harvest in first season
      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [1.5, 3],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
};

export const Rosemary: Ingredient = {
  id: "rosemary",
  link: "https://en.wikipedia.org/wiki/Rosemary",
  type: "leaf",

  properties: {
    qualities: ["delicate", "light"],
    tastes: ["fruity", "floral", "sweet", "woody", "earthy"],
    growth: {
      growthForms: ["bushShrub"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [12, 30],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Prefers open, dry, settled soil rather than raw disturbance
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Light harvest in first year, stronger by year 2
      yearsToFirstHarvest: [0.5, 1.5],

      productiveLifespanYears: [8, 20],

      managementRotation: "medium_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "rosemary",
      "Rosemary",
      undefined,
      "leaf",
      "herb",
    ),
  ],
  needsAttribution: true,
};

export const Zucchini: Ingredient = {
  id: "zucchini",
  link: "https://en.wikipedia.org/wiki/Zucchini",
  type: "fruit",

  properties: {
    qualities: ["light", "snappy", "juicy"],
    tastes: ["sweet", "earthy", "nutty"],
    growth: {
      growthForms: ["herbaceous", "groundcover"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.2, 0.4],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "zucchini",
      "Zucchini",
    ),
  ],
};

export const Cardamom: Ingredient = {
  id: "cardamom__green",
  link: "https://en.wikipedia.org/wiki/Cardamom",
  type: "fruit",

  properties: {
    qualities: ["delicate"],
    tastes: ["floral", "woody", "menthol", "sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["filtered_light", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Ideal once you have a humid, sheltered understory pocket
      recommendedPlantYearFromStart: [0.5, 3],

      // Understory plant, establishes best under canopy-filtered light
      establishmentLight: "filtered_light",

      yearsToFirstHarvest: [2, 4],

      productiveLifespanYears: [6, 15],

      managementRotation: "medium_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "cardamom",
      "Cardamom",
      undefined,
      "fruit",
      "spice",
    ),
  ],
  needsAttribution: true,
};

export const Clove: Ingredient = {
  id: "clove",
  link: "https://en.wikipedia.org/wiki/Clove",
  type: "flower",
  originIngredients: ["clove_tree_flower_buds"],
  properties: {
    qualities: ["sharp"],
    tastes: ["sweet", "bitter", "earthy", "woody"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [22, 32],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Very slow, long-horizon tropical tree
      recommendedPlantYearFromStart: [1, 5],

      // Establishes best with shelter and filtered light
      establishmentLight: "filtered_light",

      // Long juvenile phase before bud production
      yearsToFirstHarvest: [6, 10],

      productiveLifespanYears: [60, 120],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "clove",
      "Clove",
      undefined,
      "flower",
      "spice",
    ),
  ],
};

export const SunflowerSeed: Ingredient = {
  id: "sunflower_seed",
  link: "https://en.wikipedia.org/wiki/Sunflower",
  type: "seed",
  originIngredients: ["sunflower"],
  properties: {
    qualities: ["dense", "crunchy"],
    tastes: ["nutty", "earthy", "savory"],
    succession: {
      successionalPhase: "pioneer",

      // Tall early biomass + seed crop
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Seed heads mature same season
      yearsToFirstHarvest: [0.4, 0.7],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
  },
  needsAttribution: true,
};

export const Fennel: Ingredient = {
  id: "fennel",
  link: "https://en.wikipedia.org/wiki/Fennel",
  type: "stem",

  properties: {
    qualities: ["dense", "juicy", "light", "snappy"],
    tastes: ["anise", "sweet", "floral", "grassy", "bitter"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Likes open conditions but not raw disturbance
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Bulb harvest usually first season
      yearsToFirstHarvest: [0.5, 1],

      productiveLifespanYears: [2, 5],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
};

export const Scallop: Ingredient = {
  id: "scallop",
  link: "https://en.wikipedia.org/wiki/Scallop",
  type: "seafood",

  properties: {
    qualities: ["chewy", "juicy", "tender", "jelly-like"],
    tastes: ["briny", "savory", "salty", "sweet", "milky", "nutty"],
  },
  needsAttribution: true,
};

export const FennelSeed: Ingredient = {
  id: "fennel_seed",
  link: "https://en.wikipedia.org/wiki/Fennel",
  type: "fruit",

  properties: {
    qualities: ["dense"],
    tastes: ["anise", "sweet", "earthy"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [15, 25],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Can set seed in the first season in good conditions
      yearsToFirstHarvest: [0.3, 1],

      // Often treated as annual/biennial for seed production; short planning window
      productiveLifespanYears: [0.5, 2],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "fennel_seed",
      "Fennel Seed",
      undefined,
      "seed-like, dried fruit",
      "spice",
    ),
  ],
};

export const StarAnise: Ingredient = {
  id: "star_anise",
  link: "https://en.wikipedia.org/wiki/Star_anise",
  type: "fruit",

  properties: {
    qualities: ["sharp"],
    tastes: ["anise", "sweet", "earthy", "woody"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["partial_sun", "full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["humid_air"],
      climateProfile: {
        optimalTempRangeC: [15, 28],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Slow-growing evergreen; best once moisture and shade dynamics are stable
      recommendedPlantYearFromStart: [1, 4],

      // Understory tree during establishment
      establishmentLight: "filtered_light",

      yearsToFirstHarvest: [6, 10],

      productiveLifespanYears: [40, 80],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "star_anise",
      "Star Anise",
      undefined,
      "dry woody fruit",
      "spice",
    ),
  ],
};

export const ThaiBasil: Ingredient = {
  id: "thai_basil",
  link: "https://en.wikipedia.org/wiki/Thai_basil",
  type: "leaf",

  properties: {
    qualities: ["light", "delicate", "sharp"],
    tastes: ["anise", "sweet", "floral", "peppery"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Warm-season aromatic, fast and expressive
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.15, 0.3],

      productiveLifespanYears: [0.3, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const BokChoy: Ingredient = {
  id: "bok_choy",
  link: "https://en.wikipedia.org/wiki/Bok_choy",
  type: "leaf",

  properties: {
    qualities: ["snappy", "juicy", "light"],
    tastes: ["grassy", "sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["biennial"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Fast cool-season leaf crop
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.08, 0.1],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "bok_choy",
      "Bok Choy",
      undefined,
      "leaf",
    ),
  ],
};

export const Guava: Ingredient = {
  id: "guava",
  link: "https://en.wikipedia.org/wiki/Guava",
  type: "fruit",

  properties: {
    qualities: ["snappy", "juicy", "cool"],
    tastes: ["sweet", "earthy", "astringent"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["humid_air"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Can be established fairly early; benefits from some site planning and spacing
      recommendedPlantYearFromStart: [0, 2],

      // Young plants do fine with some protection, but guava is generally sun-forward
      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [2, 4],

      productiveLifespanYears: [15, 30],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
};

export const GoatCheese: Ingredient = {
  id: "goat_cheese",
  link: "https://en.wikipedia.org/wiki/Goat_cheese",
  type: "dairy",

  properties: {
    qualities: ["dense", "smooth", "cool", "sharp", "creamy"],
    tastes: ["savory", "salty", "briny", "milky"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["humid_air"],
    },
  },
  needsAttribution: true,
};

export const MushroomMorel: Ingredient = {
  id: "morel",
  link: "https://en.wikipedia.org/wiki/Morchella",
  type: "fungi",
  useSvg: true,
  properties: {
    qualities: ["spongy", "delicate", "light"],
    tastes: ["earthy", "nutty", "smoky"],
    fungiGrowth: {
      growthForms: ["saprophytic"],
      lightPreferences: ["surface_shaded"],
      lifeCycles: ["persistent_mycelium"],
      substrateDepths: ["shallow_soil"],
      temperatureTolerances: ["cool_tolerant"],
      soilPreferences: ["damp_forest_floor"],
    },
  },
};

export const MushroomWoodBlewit: Ingredient = {
  id: "wood_blewit",
  link: "https://en.wikipedia.org/wiki/Clitocybe_nuda",
  type: "fungi",
  useSvg: true,

  properties: {
    qualities: ["smooth"],
    tastes: ["floral", "earthy", "savory"],
    fungiGrowth: {
      growthForms: ["saprophytic"],
      lightPreferences: ["surface_shaded"],
      lifeCycles: ["persistent_mycelium"],
      substrateDepths: ["shallow_soil"],
      temperatureTolerances: ["cool_tolerant"],
      soilPreferences: ["damp_forest_floor"],
    },
  },
};

export const MushroomSaffronMilkcap: Ingredient = {
  id: "saffron_milkcap",
  link: "https://en.wikipedia.org/wiki/Lactarius_deliciosus",
  type: "fungi",
  useSvg: true,

  properties: {
    qualities: ["snappy"],
    tastes: ["sweet", "savory", "floral", "milky"],
    fungiGrowth: {
      growthForms: ["mycorrhizal"],
      lightPreferences: ["surface_shaded"],
      lifeCycles: ["persistent_mycelium"],
      substrateDepths: ["shallow_soil"],
      temperatureTolerances: ["cool_tolerant"],
      soilPreferences: ["damp_forest_floor"],
    },
  },
};

export const MushroomAmanita: Ingredient = {
  id: "amanita",
  link: "https://en.wikipedia.org/wiki/Amanita_caesarea",
  type: "fungi",
  useSvg: true,

  properties: {
    qualities: ["light", "smooth", "juicy", "delicate"],
    tastes: ["sweet", "nutty", "earthy", "woody"],
    fungiGrowth: {
      growthForms: ["mycorrhizal"],
      lightPreferences: ["surface_shaded"],
      lifeCycles: ["persistent_mycelium"],
      substrateDepths: ["shallow_soil"],
      temperatureTolerances: ["cool_tolerant"],
      soilPreferences: ["damp_forest_floor"],
    },
  },
};

export const MushroomSuillus: Ingredient = {
  id: "suillus",
  link: "https://en.wikipedia.org/wiki/Suillus",
  type: "fungi",
  useSvg: true,

  properties: {
    qualities: ["spongy"],
    tastes: ["savory", "earthy", "grassy"],
    fungiGrowth: {
      growthForms: ["mycorrhizal"],
      lightPreferences: ["surface_shaded"],
      lifeCycles: ["persistent_mycelium"],
      substrateDepths: ["shallow_soil"],
      temperatureTolerances: ["cool_tolerant"],
      soilPreferences: ["damp_forest_floor"],
    },
  },
};

export const MushroomRussula: Ingredient = {
  id: "russula",
  link: "https://en.wikipedia.org/wiki/Russula",
  type: "fungi",
  useSvg: true,

  properties: {
    qualities: ["snappy", "delicate"],
    tastes: ["nutty", "grassy", "bitter"],
    fungiGrowth: {
      growthForms: ["mycorrhizal"],
      lightPreferences: ["surface_shaded"],
      lifeCycles: ["persistent_mycelium"],
      substrateDepths: ["shallow_soil"],
      temperatureTolerances: ["cool_tolerant"],
      soilPreferences: ["damp_forest_floor"],
    },
  },
};

export const MushroomChampignon: Ingredient = {
  id: "champignon",
  link: "https://en.wikipedia.org/wiki/Agaricus_bisporus",
  type: "fungi",
  useSvg: true,

  properties: {
    qualities: ["smooth", "plump", "tender", "spongy"],
    tastes: ["savory", "earthy", "grassy"],
    fungiGrowth: {
      growthForms: ["saprophytic"],
      lightPreferences: ["low_light"],
      lifeCycles: ["persistent_mycelium"],
      substrateDepths: ["deep_soil"],
      temperatureTolerances: ["cool_tolerant"],
      soilPreferences: ["humid_substrate"],
    },
  },
};

export const MushroomChanterelle: Ingredient = {
  id: "chanterelle",
  link: "https://en.wikipedia.org/wiki/Chanterelle",
  type: "fungi",
  useSvg: true,

  properties: {
    tastes: ["nutty", "earthy", "floral"],
    fungiGrowth: {
      growthForms: ["mycorrhizal"],
      lightPreferences: ["surface_shaded"],
      lifeCycles: ["persistent_mycelium"],
      substrateDepths: ["shallow_soil"],
      temperatureTolerances: ["cold_tolerant"],
      soilPreferences: ["dry_forest_floor"],
    },
  },
};

export const MushroomShittake: Ingredient = {
  id: "shiitake",
  link: "https://en.wikipedia.org/wiki/Shiitake",
  type: "fungi",
  useSvg: true,

  properties: {
    qualities: ["dense", "chewy", "smooth"],
    tastes: ["earthy", "savory", "woody"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
    },
  },
};

const BellpepperGrowth: Growth = {
  growthForms: ["herbaceous"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["annual"],
  heightClasses: ["medium"],
  frostTolerances: ["frost_intolerant"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [18, 30],
  },
  airHumidityPreferences: ["moderate_humidity", "humid_air"],
  soilInteraction: {
    root: {
      depthBand: "shallow",
      feederZone: "surface",
      strategy: "diffuse_forager",
    },
    demand: {
      nutrientPull: "low",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

export const BellpepperSuccession: SuccessionProfile = {
  successionalPhase: "pioneer",

  recommendedPlantYearFromStart: [0, 1],

  establishmentLight: "full_sun",

  // Fast annual yield
  yearsToFirstHarvest: [0.2, 0.4],

  productiveLifespanYears: [0.2, 1],

  managementRotation: "short_rotation",
};

export const BellPepperRed: Ingredient = {
  id: "bell_pepper__red",
  link: "https://en.wikipedia.org/wiki/Bell_pepper",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["snappy", "juicy", "light"],
    tastes: ["sweet", "fruity"],
    growth: BellpepperGrowth,
    succession: BellpepperSuccession,
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "bell_pepper__red",
      "Bell Pepper",
    ),
  ],
};

export const BellPepperGreen: Ingredient = {
  id: "bell_pepper__green",
  link: "https://en.wikipedia.org/wiki/Bell_pepper",
  type: "fruit",

  properties: {
    qualities: ["snappy", "juicy", "light"],
    tastes: ["bitter", "grassy", "earthy"],
    growth: BellpepperGrowth,
    succession: BellpepperSuccession,
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "bell_pepper__green",
      "Bell Pepper",
    ),
  ],
};

export const BellPepperYellow: Ingredient = {
  id: "bell_pepper__yellow",
  link: "https://en.wikipedia.org/wiki/Bell_pepper",
  type: "fruit",

  properties: {
    qualities: ["snappy", "juicy", "light"],
    tastes: ["sweet", "fruity", "bitter"],
    growth: BellpepperGrowth,
    succession: BellpepperSuccession,
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "bell_pepper__yellow",
      "Bell Pepper",
    ),
  ],
};

export const Paprika: Ingredient = {
  id: "paprika",
  link: "https://en.wikipedia.org/wiki/Paprika",
  type: "misc",
  originIngredients: ["chilli_pepper_plant"],
  properties: {
    qualities: ["sharp"],
    tastes: ["pungent", "sweet"],
    growth: ChilliPepperPlantGrowth,
    succession: ChilliPepperPlantSuccession,
  },
  needsAttribution: true,
};

export const Turnip: Ingredient = {
  id: "turnip",
  link: "https://en.wikipedia.org/wiki/Turnip",
  type: "root",
  useSvg: true,
  properties: {
    qualities: ["snappy", "dense", "rough"],
    tastes: ["earthy", "bitter", "pungent"],
    growth: {
      growthForms: ["herbaceous", "root"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["biennial"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Fast cool-season root, ideal for early soil use
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.2, 0.4],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
};

const OnionGrowth: Growth = {
  growthForms: ["herbaceous"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["biennial"],
  heightClasses: ["low"],
  frostTolerances: ["hardy"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [10, 25],
  },
  airHumidityPreferences: ["moderate_humidity"],
  soilInteraction: {
    root: {
      depthBand: "shallow",
      feederZone: "surface",
      strategy: "diffuse_forager",
    },
    demand: {
      nutrientPull: "low",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const OnionSuccession: SuccessionProfile = {
  successionalPhase: "pioneer",

  // Classic early bulb crop in open soil
  recommendedPlantYearFromStart: [0, 1],

  establishmentLight: "full_sun",

  yearsToFirstHarvest: [0.4, 0.8],

  productiveLifespanYears: [0.3, 1],

  managementRotation: "short_rotation",
};

export const OnionWhite: Ingredient = {
  id: "onion__white",
  link: "https://en.wikipedia.org/wiki/Onion",
  type: "bulb",
  useSvg: true,
  properties: {
    qualities: ["light", "sharp", "juicy"],
    tastes: ["pungent", "savory", "sweet"],
    growth: OnionGrowth,
    succession: OnionSuccession,
  },
};

export const OnionRed: Ingredient = {
  id: "onion__red",
  link: "https://en.wikipedia.org/wiki/Onion",
  type: "bulb",
  useSvg: true,
  properties: {
    qualities: ["light", "sharp", "juicy"],
    tastes: ["pungent", "sweet", "earthy"],
    growth: OnionGrowth,
    succession: OnionSuccession,
  },
};

export const OnionSpanish: Ingredient = {
  id: "spanish_onion",
  link: "https://en.wikipedia.org/wiki/Onion",
  type: "bulb",
  useSvg: true,
  properties: {
    qualities: ["light", "sharp", "juicy"],
    tastes: ["pungent", "sweet", "savory"],
    growth: OnionGrowth,
    succession: OnionSuccession,
  },
};

export const Asparagus: Ingredient = {
  id: "asparagus",
  link: "https://en.wikipedia.org/wiki/Asparagus",
  type: "stem",
  useSvg: true,
  properties: {
    qualities: ["snappy", "rough", "dense", "fibrous"],
    tastes: ["grassy", "earthy", "bitter"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Needs settled soil and long-term intent
      recommendedPlantYearFromStart: [0.5, 2],

      establishmentLight: "full_sun",

      // Light harvest year 2–3, full harvest after
      yearsToFirstHarvest: [2, 3],

      // Long-lived perennial bed
      productiveLifespanYears: [15, 25],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "asparagus",
      "Asparagus",
      "",
      "spears",
    ),
  ],
};

export const Hop: Ingredient = {
  id: "hop",
  link: "https://en.wikipedia.org/wiki/Hops",
  type: "flower",
  useSvg: true,
  properties: {
    qualities: ["light"],
    tastes: ["bitter", "floral", "grassy"],
    growth: {
      growthForms: ["climber"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Needs trellis or tall support planned early
      recommendedPlantYearFromStart: [0, 2],

      // Establishes well with sun, tolerates some shelter when young
      establishmentLight: "full_sun",

      // Light harvest in year 2, full cones after
      yearsToFirstHarvest: [1, 2],

      // Long-lived perennial crown if managed
      productiveLifespanYears: [10, 25],

      managementRotation: "keep",
    },
  },
};

export const Marrow: Ingredient = {
  id: "marrow",
  link: "https://en.wikipedia.org/wiki/Marrow_(vegetable)",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "snappy", "juicy"],
    tastes: ["sweet", "earthy"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // First-wave groundcover and calories
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.25, 0.45],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "marrow",
      "Marrow",
    ),
  ],
};

const CornSuccession: SuccessionProfile = {
  successionalPhase: "pioneer",

  // Classic first-wave biomass + calories
  recommendedPlantYearFromStart: [0, 1],

  establishmentLight: "full_sun",

  // Fast annual yield
  yearsToFirstHarvest: [0.2, 0.4],

  productiveLifespanYears: [0.2, 1],

  managementRotation: "short_rotation",
};

export const CornGrowth: Growth = {
  growthForms: ["herbaceous"], // botanically a grass
  lightPreferences: ["full_sun"], // needs intense light
  lifeCycles: ["annual"], // one season from seed to harvest
  heightClasses: ["medium", "high"], // often 5 to 10 feet
  frostTolerances: ["frost_sensitive"], // dies from frost
  soilPreferences: ["moist_well_drained"], // steady moisture but not waterlogged
  climateProfile: {
    optimalTempRangeC: [18, 30],
  },
  airHumidityPreferences: ["moderate_humidity"],
  soilInteraction: {
    root: {
      depthBand: "shallow",
      feederZone: "surface",
      strategy: "diffuse_forager",
    },
    demand: {
      nutrientPull: "low",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

export const CornYellow: Ingredient = {
  id: "corn__yellow",
  link: "https://en.wikipedia.org/wiki/Maize",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "dense"],
    tastes: ["sweet", "earthy", "nutty", "savory"],
    growth: CornGrowth,
    succession: CornSuccession,
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "corn",
      "Corn",
      `The kernels are seeds and the cob is a fruiting structure. But in gastronomy, corn is often treated as a "vegetable" or grain.`,
    ),
  ],
};

export const Beetroot: Ingredient = {
  id: "beetroot",
  link: "https://en.wikipedia.org/wiki/Beetroot",
  type: "root",
  useSvg: true,
  properties: {
    qualities: ["juicy", "snappy", "rough"],
    tastes: ["earthy", "sweet", "bitter"],
    growth: {
      growthForms: ["herbaceous", "root"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["biennial"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 22],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.25, 0.5],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
};

export const Broccoli: Ingredient = {
  id: "broccoli",
  link: "https://en.wikipedia.org/wiki/Broccoli",
  type: "flower",
  useSvg: true,
  properties: {
    qualities: ["snappy", "rough", "fibrous"],
    tastes: ["bitter", "earthy", "nutty", "grassy"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Classic early annual, cool-season friendly
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
};

export const Dewberry: Ingredient = {
  id: "dewberry",
  link: "https://en.wikipedia.org/wiki/Dewberry",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "smooth"],
    tastes: ["sweet", "tangy"],
    growth: {
      growthForms: ["bushShrub", "climber"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        chillHours: [300, 700],
        optimalTempRangeC: [10, 22],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      recommendedPlantYearFromStart: [0, 2],

      // Fruits best in sun, tolerates light shade
      establishmentLight: "full_sun",

      yearsToFirstHarvest: [1, 2],

      productiveLifespanYears: [6, 15],

      managementRotation: "medium_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient("dewberry", "Dewberry"),
  ],
};

export const Quince: Ingredient = {
  id: "quince",
  link: "https://en.wikipedia.org/wiki/Quince",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["dense", "rough"],
    tastes: ["astringent", "sour", "tangy", "sweet"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        chillHours: [300, 700],
        optimalTempRangeC: [8, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [25, 50],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient("quince", "Quince"),
  ],
};

export const Cantaloupe: Ingredient = {
  id: "cantaloupe",
  link: "https://en.wikipedia.org/wiki/Cantaloupe",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool", "smooth"],
    tastes: ["sweet"],
    growth: {
      growthForms: ["herbaceous", "groundcover"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.2, 0.4],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
};

const PomeloGrowth: Growth = {
  growthForms: ["midstory"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["perennial"],
  heightClasses: ["medium", "high"],
  frostTolerances: ["frost_sensitive"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [18, 32],
  },
  airHumidityPreferences: ["moderate_humidity", "humid_air"],
  soilInteraction: {
    root: {
      depthBand: "medium",
      feederZone: "mid",
      strategy: "woody_structural",
    },
    demand: {
      nutrientPull: "medium",
      waterPull: "medium",
      oxygenSensitivity: "low",
    },
    competitionTolerance: "tolerant",
  },
};

const PomeloSuccession: SuccessionProfile = {
  successionalPhase: "late",

  // Large citrus; benefits from spacing and wind protection
  recommendedPlantYearFromStart: [1, 4],

  establishmentLight: "full_sun",

  yearsToFirstHarvest: [4, 7],

  productiveLifespanYears: [30, 60],

  managementRotation: "keep",
};

export const PomeloExtraFacts: ExtraFact[] = [
  getExtraFactAboutBlossomSensitivityForIngredient(
    "pomelo",
    "Pomelo",
    "highly",
  ),
];

export const PomeloPink: Ingredient = {
  id: "pomelo__pink",
  link: "https://en.wikipedia.org/wiki/Pomelo",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["citrusy", "sweet", "tangy"],
    growth: PomeloGrowth,
    succession: PomeloSuccession,
  },
  extraFacts: PomeloExtraFacts,
};

export const PomeloRed: Ingredient = {
  id: "pomelo__red",
  link: "https://en.wikipedia.org/wiki/Pomelo",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["citrusy", "sweet", "zesty"],
    growth: PomeloGrowth,
    succession: PomeloSuccession,
  },
  extraFacts: PomeloExtraFacts,
};

export const PomeloOrange: Ingredient = {
  id: "pomelo__orange",
  link: "https://en.wikipedia.org/wiki/Pomelo",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["citrusy", "sweet", "floral"],
    growth: PomeloGrowth,
    succession: PomeloSuccession,
  },
  extraFacts: PomeloExtraFacts,
};

export const Rambutan: Ingredient = {
  id: "rambutan",
  link: "https://en.wikipedia.org/wiki/Rambutan",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["sweet", "tangy"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [22, 32],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Requires stable humidity, warmth, and spacing
      recommendedPlantYearFromStart: [1, 5],

      // Young trees need protection from harsh sun and wind
      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [4, 8],

      productiveLifespanYears: [40, 80],

      managementRotation: "keep",
    },
  },
};

export const UgliFruit: Ingredient = {
  id: "ugli_fruit",
  link: "https://en.wikipedia.org/wiki/Ugli_fruit",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["citrusy", "sweet", "sour", "tangy"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["humid_air"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Citrus benefits from warmth pockets and wind protection
      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [30, 60],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "ugli_fruit",
      "Ugli Fruit",
      "highly",
    ),
  ],
};

export const Mangosteen: Ingredient = {
  id: "mangosteen",
  link: "https://en.wikipedia.org/wiki/Mangosteen",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy"],
    tastes: ["sweet", "tangy", "milky"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["partial_sun", "filtered_light"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [22, 30],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Requires a highly stable, humid, shaded early system
      recommendedPlantYearFromStart: [2, 6],

      // True deep-understory establishment species
      establishmentLight: "deep_shade",

      yearsToFirstHarvest: [7, 15],

      productiveLifespanYears: [60, 100],

      managementRotation: "keep",
    },
  },
};

export const Lychee: Ingredient = {
  id: "lychee",
  link: "https://en.wikipedia.org/wiki/Lychee",
  type: "fruit",

  properties: {
    qualities: ["juicy", "smooth", "plump"],
    tastes: ["sweet", "floral", "tangy"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["humid_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // True long-game tree; plant when you can commit to water, space, and patience
      recommendedPlantYearFromStart: [1, 5],

      // Establishes best with protection from harsh sun and wind
      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [5, 10],

      productiveLifespanYears: [50, 100],

      managementRotation: "keep",
    },
  },
};

export const Sweetie: Ingredient = {
  id: "sweetie__oroblanco",
  link: "https://en.wikipedia.org/wiki/Sweetie_(fruit)",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "snappy"],
    tastes: ["citrusy", "sweet", "tangy", "bitter"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["humid_air"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [30, 60],

      managementRotation: "keep",
    },
  },
};

export const Marula: Ingredient = {
  id: "marula",
  link: "https://en.wikipedia.org/wiki/Sclerocarya_birrea",
  type: "fruit",

  properties: {
    qualities: [],
    tastes: ["sour", "sweet", "nutty", "citrusy"],
    growth: {
      growthForms: ["midstory", "canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [20, 32],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Big, long-lived savanna tree; best placed once long-term spacing and water strategy are clear
      recommendedPlantYearFromStart: [1, 5],

      // Establishes best with protection; later becomes a hard-sun tree
      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [4, 8],

      productiveLifespanYears: [60, 120],

      managementRotation: "keep",
    },
  },
};

export const Kumquat: Ingredient = {
  id: "kumquat",
  link: "https://en.wikipedia.org/wiki/Kumquat",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["snappy", "juicy", "light"],
    tastes: ["citrusy", "sweet", "tangy", "zesty"],
    growth: {
      growthForms: ["bushShrub", "midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [15, 30],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Compact citrus; can go in relatively early once frost risk / microclimate is understood
      recommendedPlantYearFromStart: [0.5, 3],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [2, 4],

      productiveLifespanYears: [20, 40],

      managementRotation: "keep",
    },
  },
};

export const Apricot: Ingredient = {
  id: "apricot",
  link: "https://en.wikipedia.org/wiki/Apricot",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light"],
    tastes: ["sweet", "sour"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      climateProfile: {
        chillHours: [300, 900],
        optimalTempRangeC: [10, 20],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      recommendedPlantYearFromStart: [0, 2],

      // Needs strong light from the start for structure + fruiting
      establishmentLight: "full_sun",

      yearsToFirstHarvest: [2, 5],

      productiveLifespanYears: [15, 30],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "apricot",
      "Apricot",
      "highly",
    ),
  ],
};

const mandarinGrowth: Growth = {
  growthForms: ["midstory"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["perennial"],
  heightClasses: ["medium"],
  frostTolerances: ["frost_sensitive"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [16, 30],
  },
  airHumidityPreferences: ["moderate_humidity", "humid_air"],
  soilInteraction: {
    root: {
      depthBand: "medium",
      feederZone: "mid",
      strategy: "woody_structural",
    },
    demand: {
      nutrientPull: "medium",
      waterPull: "medium",
      oxygenSensitivity: "low",
    },
    competitionTolerance: "tolerant",
  },
};

const mandarinSuccession: SuccessionProfile = {
  successionalPhase: "late",

  // Benefits from warmth pockets and wind protection
  recommendedPlantYearFromStart: [1, 4],

  establishmentLight: "full_sun",

  yearsToFirstHarvest: [2, 5],

  productiveLifespanYears: [25, 50],

  managementRotation: "keep",
};

export const MandarinExtraFacts: ExtraFact[] = [
  getExtraFactAboutBlossomSensitivityForIngredient(
    "mandarin",
    "Mandarin",
    "highly",
  ),
];

export const MandarinClementine: Ingredient = {
  id: "mandarin__clementine",
  link: "https://en.wikipedia.org/wiki/Clementine",
  type: "fruit",
  originIngredients: ["mandarin_orange"],
  useSvg: true,
  properties: {
    qualities: ["light", "cool", "juicy"],
    tastes: ["citrusy", "sweet", "zesty", "floral"],
    growth: mandarinGrowth,
    succession: mandarinSuccession,
  },
  extraFacts: MandarinExtraFacts,
};

export const MandarinTangerine: Ingredient = {
  id: "mandarin__tangerine",
  link: "https://en.wikipedia.org/wiki/Tangerine",
  type: "fruit",
  originIngredients: ["mandarin_orange"],
  properties: {
    qualities: ["light", "cool", "juicy"],
    tastes: ["citrusy", "sweet", "zesty", "floral"],
    growth: mandarinGrowth,
    succession: mandarinSuccession,
  },
  extraFacts: MandarinExtraFacts,
};

export const Tomatillo: Ingredient = {
  id: "tomatillo",
  link: "https://en.wikipedia.org/wiki/Tomatillo",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["smooth", "juicy"],
    tastes: ["sour", "tangy", "grassy"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Fast annual crop
      yearsToFirstHarvest: [0.2, 0.4],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "tomatillo",
      "Tomatillo",
    ),
  ],
};

export const Longan: Ingredient = {
  id: "longan",
  link: "https://en.wikipedia.org/wiki/Longan",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "plump"],
    tastes: ["sweet", "woody", "earthy", "floral"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["humid_air"],
      climateProfile: {
        optimalTempRangeC: [20, 30],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Introduced once spacing, wind protection, and long-term canopy planning are clear
      recommendedPlantYearFromStart: [1, 5],

      // Young trees benefit from some shelter; later want strong sun
      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [4, 8],

      productiveLifespanYears: [30, 60],

      managementRotation: "keep",
    },
  },
};

export const Salak: Ingredient = {
  id: "salak",
  link: "https://en.wikipedia.org/wiki/Salak",
  type: "fruit",

  properties: {
    qualities: ["plump", "jelly-like", "tender"],
    tastes: ["sweet", "tangy", "milky", "sour", "astringent"],
    growth: {
      growthForms: ["understory", "bushShrub"],
      lightPreferences: ["partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [22, 30],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Needs a warm, humid, sheltered understory edge
      recommendedPlantYearFromStart: [1, 4],

      // Establishes best with protection from direct sun
      establishmentLight: "filtered_light",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [20, 40],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
};

export const Jabuticaba: Ingredient = {
  id: "jabuticaba",
  link: "https://en.wikipedia.org/wiki/Jabuticaba",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "sticky", "dense"],
    tastes: ["sweet", "sour", "earthy", "astringent"],
    growth: {
      growthForms: ["midstory", "bushShrub"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Slow grower; usually added once the system is stable and you can commit to irrigation/moisture management
      recommendedPlantYearFromStart: [1, 4],

      // Establishes best with protection and filtered light
      establishmentLight: "filtered_light",

      // Notoriously slow to fruit (especially from seed)
      yearsToFirstHarvest: [6, 12],

      productiveLifespanYears: [40, 80],

      managementRotation: "keep",
    },
  },
};

export const Cherimoya: Ingredient = {
  id: "cherimoya",
  link: "https://en.wikipedia.org/wiki/Annona",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["smooth"],
    tastes: ["sweet", "milky", "tangy"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 27],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Benefits from establishment protection; can be planted early if sheltered
      recommendedPlantYearFromStart: [0.5, 3],

      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [20, 40],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    {
      id: "cherimoya_shade",
      label: "Light Preference",
      content:
        "In hotter tropical lowlands, cherimoya benefits from light afternoon shade.",
      highlights: [{ text: "shade", theme: "light" }],
    },
  ],
};

export const BlackCurrant: Ingredient = {
  id: "black_currant",
  link: "https://en.wikipedia.org/wiki/Blackcurrant",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "cool", "rough", "light"],
    tastes: ["sweet", "sour", "zesty"],
    growth: {
      growthForms: ["bushShrub"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        chillHours: [800, 1500],
        optimalTempRangeC: [7, 18],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      recommendedPlantYearFromStart: [0, 2],

      // Tolerates part shade well, often best with some protection in hot sun
      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [1, 3],

      productiveLifespanYears: [8, 20],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "black_currant",
      "Black Currant",
    ),
  ],
};

export const Blackberry: Ingredient = {
  id: "blackberry",
  link: "https://en.wikipedia.org/wiki/Blackberry",
  type: "fruit",

  properties: {
    qualities: ["juicy", "cool", "rough", "light"],
    tastes: ["sweet", "sour", "zesty"],
    growth: {
      growthForms: ["bushShrub"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["moderate_humidity"],
      climateProfile: {
        chillHours: [200, 600],
        optimalTempRangeC: [10, 22],
      },
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Can go in early, but tends to expand, so place intentionally
      recommendedPlantYearFromStart: [0, 2],

      // Fruits best in sun, tolerates some shade
      establishmentLight: "full_sun",

      // Many varieties fruit the second year (floricanes); primocanes can fruit in year 1
      yearsToFirstHarvest: [1, 2],

      productiveLifespanYears: [8, 20],

      // Needs ongoing cane management; not typically “culled”, but actively controlled
      managementRotation: "medium_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "blackberry",
      "Blackberry",
    ),
  ],
};

export const MelonCanary: Ingredient = {
  id: "melon__canary",
  link: "https://en.wikipedia.org/wiki/Canary_melon",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["sweet", "tangy", "grassy"],
    growth: {
      growthForms: ["herbaceous", "groundcover"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.2, 0.4],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
};

export const Pitaya: Ingredient = {
  id: "pitaya__dragonfruit",
  link: "https://en.wikipedia.org/wiki/Pitaya",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["sweet", "floral", "peppery"],
    growth: {
      growthForms: ["climber"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Needs posts, trellis, or living supports
      recommendedPlantYearFromStart: [0.5, 3],

      // Young plants prefer some protection; later tolerate strong sun
      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [1.5, 3],

      productiveLifespanYears: [10, 25],

      managementRotation: "keep",
    },
  },
};

export const Pineapple: Ingredient = {
  id: "pineapple",
  link: "https://en.wikipedia.org/wiki/Pineapple",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light"],
    tastes: ["sweet", "sour", "tangy", "zesty", "floral"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 32],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Excellent early understory / gap filler in warm systems
      recommendedPlantYearFromStart: [0, 2],

      // Likes sun but tolerates some shade
      establishmentLight: "full_sun",

      yearsToFirstHarvest: [1.5, 3],

      // Individual plants fruit once, but clumps persist via pups
      productiveLifespanYears: [3, 6],

      managementRotation: "medium_rotation",
    },
  },
};

export const Watermelon: Ingredient = {
  id: "watermelon",
  link: "https://en.wikipedia.org/wiki/Watermelon",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["sweet"],
    growth: {
      growthForms: ["herbaceous", "groundcover"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 32],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Same-season harvest
      yearsToFirstHarvest: [0.25, 0.45],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
};

export const Plum: Ingredient = {
  id: "plum",
  link: "https://en.wikipedia.org/wiki/Plum",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "smooth", "plump"],
    tastes: ["sweet", "sour"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["moderate_humidity"],
      climateProfile: {
        chillHours: [500, 1000],
        optimalTempRangeC: [9, 19],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [3, 5],

      productiveLifespanYears: [20, 40],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient("plum", "Plum"),
  ],
};

export const FigFresh: Ingredient = {
  id: "fig",
  link: "https://en.wikipedia.org/wiki/Fig",
  type: "fruit",
  properties: {
    qualities: ["light", "cool", "juicy", "plump"],
    tastes: ["sweet"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        chillHours: [0, 300],
        optimalTempRangeC: [15, 30],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Can be planted early, but benefits from microclimate planning and spacing
      recommendedPlantYearFromStart: [0, 3],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [2, 5],

      productiveLifespanYears: [20, 50],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "fig",
      "Fig",
      "",
      "fruits",
    ),
  ],
};

export const Blueberry: Ingredient = {
  id: "blueberry",
  link: "https://en.wikipedia.org/wiki/Blueberry",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "cool", "juicy"],
    tastes: ["sweet", "sour"],
    growth: {
      growthForms: ["bushShrub"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      climateProfile: {
        chillHours: [200, 1000],
        optimalTempRangeC: [7, 18],
      },
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Plant once you can commit to soil conditions (acidity, mulch, moisture)
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [2, 4],

      productiveLifespanYears: [15, 40],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient("blueberry", "Blueberry"),
  ],
};

export const Raspberry: Ingredient = {
  id: "raspberry",
  link: "https://en.wikipedia.org/wiki/Raspberry",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "cool", "juicy"],
    tastes: ["sweet", "sour"],
    growth: {
      growthForms: ["bushShrub"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["moderate_humidity"],
      climateProfile: {
        chillHours: [400, 800],
        optimalTempRangeC: [10, 20],
      },
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Can go in early but spreads aggressively
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Primocane or floricane types
      yearsToFirstHarvest: [1, 2],

      productiveLifespanYears: [6, 15],

      managementRotation: "medium_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient("raspberry", "Raspberry"),
  ],
};

export const PassionFruit: Ingredient = {
  id: "passion_fruit",
  link: "https://en.wikipedia.org/wiki/Passionfruit",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "cool", "juicy"],
    tastes: ["sweet", "sour", "tangy", "zesty"],
    growth: {
      growthForms: ["climber"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["humid_air"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Best once trellis or living supports exist
      recommendedPlantYearFromStart: [0.5, 3],

      // Young vines appreciate some protection; later want strong light
      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [1, 2],

      // Productive but relatively short-lived for a perennial vine
      productiveLifespanYears: [3, 7],

      managementRotation: "medium_rotation",
    },
  },
};

export const Carambola: Ingredient = {
  id: "carambola__starfruit",
  link: "https://en.wikipedia.org/wiki/Carambola",
  type: "fruit",

  properties: {
    qualities: ["light", "snappy", "juicy"],
    tastes: ["sweet", "sour", "tangy", "zesty"],
    growth: {
      growthForms: ["midstory", "bushShrub"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["humid_air"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Often best after some wind protection / microclimate is in place
      recommendedPlantYearFromStart: [1, 4],

      // Young trees appreciate protection from harsh sun + wind
      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [2, 5],

      productiveLifespanYears: [20, 50],

      managementRotation: "keep",
    },
  },
};

const GarlicGrowth: Growth = {
  growthForms: ["herbaceous"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["annual"],
  heightClasses: ["low"],
  frostTolerances: ["hardy"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [5, 20],
  },
  airHumidityPreferences: ["moderate_humidity"],
  soilInteraction: {
    root: {
      depthBand: "shallow",
      feederZone: "surface",
      strategy: "diffuse_forager",
    },
    demand: {
      nutrientPull: "low",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const GarlicSuccession: SuccessionProfile = {
  successionalPhase: "early",

  // Likes settled beds but still early-phase friendly
  recommendedPlantYearFromStart: [0, 2],

  establishmentLight: "full_sun",

  yearsToFirstHarvest: [0.6, 1],

  productiveLifespanYears: [1, 3],

  managementRotation: "medium_rotation",
};

export const Garlic: Ingredient = {
  id: "garlic",
  link: "https://en.wikipedia.org/wiki/Garlic",
  type: "bulb",
  useSvg: true,
  properties: {
    qualities: ["sharp"],
    tastes: ["pungent", "savory"],
    growth: GarlicGrowth,
    succession: GarlicSuccession,
  },
};

export const BlackGarlic: Ingredient = {
  id: "black_garlic",
  link: "https://en.wikipedia.org/wiki/Garlic",
  type: "misc",
  originIngredients: [Garlic.id],
  properties: {
    qualities: ["sharp"],
    tastes: ["savory", "sweet", "woody", "malty", "tangy", "earthy"],
  },
};

export const BalloonFlowerRoot: Ingredient = {
  id: "balloon_flower_root",
  link: "https://en.wikipedia.org/wiki/Platycodon",
  type: "root",

  properties: {
    qualities: ["snappy", "dense"],
    tastes: ["earthy", "bitter", "astringent", "pungent"],
    growth: {
      growthForms: ["herbaceous", "root"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        chillHours: [400, 800],
        optimalTempRangeC: [10, 22],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Perennial root that prefers settled soil, not raw disturbance
      recommendedPlantYearFromStart: [0.5, 2],

      establishmentLight: "full_sun",

      // Roots are typically harvested after multiple seasons
      yearsToFirstHarvest: [2, 3],

      productiveLifespanYears: [5, 10],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
};

export const Thyme: Ingredient = {
  id: "thyme",
  link: "https://en.wikipedia.org/wiki/Thyme",
  type: "leaf",

  properties: {
    qualities: ["light", "sharp"],
    tastes: ["earthy", "woody", "sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [12, 28],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Prefers settled, well-drained soil and open exposure
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Light harvest in first year, fuller by year 2
      yearsToFirstHarvest: [0.5, 1.5],

      productiveLifespanYears: [8, 20],

      managementRotation: "medium_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "thyme",
      "Thyme",
      undefined,
      "leaf",
      "herb",
    ),
  ],
  needsAttribution: true,
};

export const LotusRoot: Ingredient = {
  id: "lotus_root",
  link: "https://en.wikipedia.org/wiki/Lotus",
  type: "root",

  properties: {
    qualities: ["snappy", "rough", "dense"],
    tastes: ["earthy", "astringent", "sweet"],
    growth: {
      growthForms: ["herbaceous", "root"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["standing_water"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Introduced once water systems or ponds are established
      recommendedPlantYearFromStart: [1, 4],

      // Requires open light over water
      establishmentLight: "full_sun",

      // Rhizomes harvestable after establishment
      yearsToFirstHarvest: [1, 2],

      productiveLifespanYears: [10, 30],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
};

export const Carrot: Ingredient = {
  id: "carrot",
  link: "https://en.wikipedia.org/wiki/Carrot",
  type: "root",

  properties: {
    qualities: ["light", "rough", "snappy", "dense"],
    tastes: ["sweet", "earthy"],
    growth: {
      growthForms: ["herbaceous", "root"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["biennial"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Classic early soil-opening crop
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.25, 0.45],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const Ghee: Ingredient = {
  id: "ghee__cow",
  link: "https://en.wikipedia.org/wiki/Ghee",
  type: "dairy",
  originIngredients: ["cow"],

  properties: {
    qualities: ["dense", "rich", "smooth"],
    tastes: ["nutty", "sweet"],
    qualityProfile: [
      { id: "rich", intensity: 5 },
      { id: "smooth", intensity: 4 },
      { id: "dense", intensity: 4 },
    ],
    tasteProfile: [
      { id: "nutty", intensity: 4 },
      { id: "sweet", intensity: 2 },
    ],
  },
};

export const Butter: Ingredient = {
  id: "butter__cow",
  link: "https://en.wikipedia.org/wiki/Butter",
  type: "dairy",
  originIngredients: ["cow"],

  properties: {
    qualities: ["dense", "rich", "creamy", "smooth"],
    tastes: ["milky", "sweet"],
    qualityProfile: [
      { id: "creamy", intensity: 5 },
      { id: "rich", intensity: 5 },
      { id: "smooth", intensity: 4 },
      { id: "dense", intensity: 4 },
    ],
    tasteProfile: [
      { id: "milky", intensity: 4 },
      { id: "sweet", intensity: 2 },
    ],
  },
};

export const Tallow: Ingredient = {
  id: "tallow",
  link: "https://en.wikipedia.org/wiki/Tallow",
  type: "fat",

  properties: {
    qualities: ["dense", "rich", "smooth"],
    tastes: ["beefy", "savory", "nutty"],
  },
};

export const Tamarind: Ingredient = {
  id: "tamarind",
  link: "https://en.wikipedia.org/wiki/Tamarind",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "smooth"],
    tastes: ["tangy", "sour", "citrusy", "sweet", "savory"],
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 35],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Large, long-lived tropical tree; spacing and long-term planning required
      recommendedPlantYearFromStart: [1, 5],

      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [4, 8],

      productiveLifespanYears: [60, 120],

      managementRotation: "keep",
    },
  },
};

const CacaoExtraFacts: ExtraFact[] = [
  {
    id: "cacao_light_adaptability",
    label: "Light Adaptability",
    content:
      "Cacao is an understory tree by origin, thriving in filtered light beneath taller canopy trees, but it can perform well in partial sun when properly managed.",
    highlights: [{ text: "partial sun", theme: "light" }],
  },
  getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
    "cacao",
    "Cacao",
    "The white pulp is fruit, but chocolate comes from the fermented seed.",
  ),
];

export const Cacao: Ingredient = {
  id: "cacao",
  link: "https://en.wikipedia.org/wiki/Cacao",
  type: "fruit",
  properties: {
    qualities: ["sharp"],
    tastes: ["bitter", "sweet", "earthy"],
    tasteProfile: [
      { id: "bitter", intensity: 5 },
      { id: "earthy", intensity: 4 },
      { id: "sweet", intensity: 2 },
    ],
    qualityProfile: [{ id: "sharp", intensity: 3 }],
    growth: {
      growthForms: ["understory"],
      lightPreferences: ["filtered_light"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [21, 30],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",
      // plant once there is some shade, which often means
      // a few months after bananas etc are in
      recommendedPlantYearFromStart: [0.5, 2],
      establishmentLight: "filtered_light",
      yearsToFirstHarvest: [3, 5],
      productiveLifespanYears: [20, 40],
      managementRotation: "keep",
    },
  },
  extraFacts: CacaoExtraFacts,
};

export const CacaoNibs: Ingredient = {
  id: "cacao_nibs",
  link: "https://en.wikipedia.org/wiki/Cacao",
  type: "misc",
  originIngredients: [Cacao.id],
  extraFacts: CacaoExtraFacts,
  properties: {
    qualities: ["crunchy", "rough", "dense"],
    tastes: ["bitter", "sweet", "earthy", "nutty"],
  },
};

export const ChocolateMilk: Ingredient = {
  id: "milk_chocolate",
  link: "https://en.wikipedia.org/wiki/Chocolate",
  type: "misc",
  originIngredients: [Cacao.id],
  extraFacts: CacaoExtraFacts,
  properties: {
    qualities: ["dense", "smooth", "creamy", "rich"],
    tastes: ["sweet", "milky"],
  },
  needsAttribution: true,
};

export const ChocolateDark: Ingredient = {
  id: "dark_chocolate",
  link: "https://en.wikipedia.org/wiki/Chocolate",
  type: "misc",
  originIngredients: [Cacao.id],
  extraFacts: CacaoExtraFacts,
  properties: {
    qualities: ["dense", "sharp"],
    tastes: ["sweet", "bitter", "earthy"],
  },
  needsAttribution: true,
};

export const ChocolateWhite: Ingredient = {
  id: "white_chocolate",
  link: "https://en.wikipedia.org/wiki/Chocolate",
  type: "misc",
  originIngredients: [Cacao.id],
  extraFacts: CacaoExtraFacts,
  properties: {
    qualities: ["dense", "rich", "creamy", "smooth"],
    tastes: ["sweet", "milky", "floral"],
  },
  needsAttribution: true,
};

export const Cucumber: Ingredient = {
  id: "cucumber",
  link: "https://en.wikipedia.org/wiki/Cucumber",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "cool", "snappy", "juicy"],
    tastes: ["grassy", "sweet"],
    growth: {
      growthForms: ["herbaceous", "groundcover"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Same-season harvest
      yearsToFirstHarvest: [0.15, 0.35],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "cucumber",
      "Cucumber",
    ),
  ],
};

export const Radish: Ingredient = {
  id: "radish",
  link: "https://en.wikipedia.org/wiki/Radish",
  type: "root",
  useSvg: true,
  properties: {
    qualities: ["sharp", "dense", "juicy", "snappy", "light"],
    tastes: ["earthy", "pungent", "sweet", "tangy"],
    growth: {
      growthForms: ["herbaceous", "root"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [8, 18],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // One of the earliest, fastest soil-opening crops
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.1, 0.25],

      productiveLifespanYears: [0.1, 0.5],

      managementRotation: "short_rotation",
    },
  },
};

export const Turmeric: Ingredient = {
  id: "turmeric",
  link: "https://en.wikipedia.org/wiki/Turmeric",
  type: "rhizome",

  properties: {
    qualities: ["sharp"],
    tastes: ["bitter", "pungent", "earthy"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 35],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Likes warmth, mulch, and moisture stability
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "filtered_light",

      // Rhizomes mature in about a year
      yearsToFirstHarvest: [0.75, 1.25],

      // Long-lived clumps if periodically divided
      productiveLifespanYears: [5, 10],

      managementRotation: "medium_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "turmeric",
      "Turmeric",
      undefined,
      "rhizome",
      "spice",
    ),
  ],
};
export const Cumin: Ingredient = {
  id: "cumin",
  link: "https://en.wikipedia.org/wiki/Cumin",
  type: "fruit",

  properties: {
    qualities: ["sharp"],
    tastes: ["earthy", "bitter", "pungent", "nutty"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["dry"],
      climateProfile: {
        optimalTempRangeC: [15, 25],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Needs open conditions and warmth
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.3, 0.5],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "cumin",
      "Cumin",
      undefined,
      "seed-like, dried fruit",
      "spice",
    ),
  ],
};

export const Cinnamon: Ingredient = {
  id: "cinnamon",
  link: "https://en.wikipedia.org/wiki/Cinnamon",
  type: "misc",

  properties: {
    qualities: ["sharp"],
    tastes: ["sweet", "earthy", "woody"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["humid_air"],
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "cinnamon",
      "Cinnamon",
      undefined,
      "part of an inner bark",
      "spice",
    ),
  ],
};

export const BeanBlack: Ingredient = {
  id: "black_bean",
  link: "https://en.wikipedia.org/wiki/Black_turtle_bean",
  type: "legume",

  properties: {
    qualities: ["dense", "smooth"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "taproot_seeker",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Classic early annual legume
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Green pods earlier, dry beans later
      yearsToFirstHarvest: [0.25, 0.45],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  extraFacts: [getExtraFactAboutLegumeSeed("black_bean", "Black beans")],
};

export const BeanAdzuki: Ingredient = {
  id: "adzuki_bean",
  link: "https://en.wikipedia.org/wiki/Adzuki_bean",
  type: "legume",

  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["sweet", "astringent", "nutty"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "taproot_seeker",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Warm-season legume, good early soil builder
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Same-season dry or fresh bean harvest
      yearsToFirstHarvest: [0.3, 0.5],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutLegumeSeed("adzuki_bean", "Adzuki (red) beans"),
  ],
};

export const BeanSoy: Ingredient = {
  id: "soy_bean",
  link: "https://en.wikipedia.org/wiki/Soybean",
  type: "legume",

  properties: {
    qualities: ["smooth"],
    tastes: ["sweet", "astringent", "savory", "nutty", "milky"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 32],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "taproot_seeker",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Foundational nitrogen-fixing field crop
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [getExtraFactAboutLegumeSeed("soy_bean", "Soybeans")],
};

export const Tofu: Ingredient = {
  id: "tofu",
  link: "https://www.wikipedia.org/wiki/Tofu",
  type: "misc",
  originIngredients: [BeanSoy.id],
  properties: {
    qualities: ["lean", "jelly-like", "smooth", "cool", "delicate"],
    tastes: ["sweet", "nutty", "savory", "milky"],
  },
  needsAttribution: true,
};

export const Tempeh: Ingredient = {
  id: "tempeh",
  link: "https://en.wikipedia.org/wiki/Tempeh",
  type: "misc",
  originIngredients: [BeanSoy.id],
  properties: {
    qualities: ["dense", "chewy", "rough"],
    tastes: ["savory", "nutty", "earthy"],
  },
};

export const Miso: Ingredient = {
  id: "miso",
  link: "https://en.wikipedia.org/wiki/Miso",
  type: "misc",
  originIngredients: [BeanSoy.id],
  properties: {
    qualities: ["smooth"],
    tastes: ["savory", "sweet", "salty", "tangy", "zesty", "nutty", "pungent"],
  },
  needsAttribution: true,
};

export const SoySauce: Ingredient = {
  id: "soy_sauce",
  link: "https://en.wikipedia.org/wiki/Soy_sauce",
  type: "misc",
  originIngredients: [BeanSoy.id],
  properties: {
    qualities: ["smooth", "smooth"],
    tastes: ["salty", "savory", "sweet", "bitter"],
  },
  needsAttribution: true,
};

export const Edamame: Ingredient = {
  id: "edamame",
  link: "https://en.wikipedia.org/wiki/Edamame",
  type: "legume",
  originIngredients: [BeanSoy.id],
  properties: {
    qualities: ["crunchy"],
    tastes: ["savory", "sweet", "nutty", "bitter"],
  },
  needsAttribution: true,
  extraFacts: [getExtraFactAboutLegumeSeed("edamame", "Edamame")],
};

export const BeanSproutsSoy: Ingredient = {
  id: "bean_sprouts__soy",
  link: "https://en.wikipedia.org/wiki/Bean_sprouts",
  type: "misc",
  originIngredients: [BeanSoy.id],
  properties: {
    qualities: ["light", "crunchy"],
    tastes: ["earthy", "savory", "nutty"],
  },
};

export const YogurtGreekCow: Ingredient = {
  id: "greek_yogurt__cow",
  link: "https://en.wikipedia.org/wiki/Yogurt",

  type: "dairy",
  originIngredients: ["cow"],
  properties: {
    qualities: ["dense", "rich", "cool", "creamy", "smooth"],
    tastes: ["savory", "sour", "sweet", "tangy", "milky"],
  },
  needsAttribution: true,
};

export const YogurtPlainCow: Ingredient = {
  id: "plain_yogurt__cow",
  link: "https://en.wikipedia.org/wiki/Yogurt",

  type: "dairy",
  originIngredients: ["cow"],
  properties: {
    qualities: ["dense", "rich", "cool", "creamy", "smooth"],
    tastes: ["sour", "sweet", "tangy", "milky"],
    qualityProfile: [
      { id: "creamy", intensity: 4 },
      { id: "smooth", intensity: 4 },
      { id: "cool", intensity: 3 },
      { id: "dense", intensity: 2 },
      { id: "rich", intensity: 2 },
    ],
    tasteProfile: [
      { id: "sour", intensity: 4 },
      { id: "tangy", intensity: 4 },
      { id: "milky", intensity: 3 },
      { id: "sweet", intensity: 1 },
    ],
  },
  needsAttribution: true,
};

export const Shrimp: Ingredient = {
  id: "shrimp",
  link: "https://en.wikipedia.org/wiki/Shrimp",

  type: "seafood",
  properties: {
    qualities: ["dense", "juicy", "tender"],
    tastes: ["briny", "savory", "sweet", "salty"],
  },
  needsAttribution: true,
};

export const PorkBelly: Ingredient = {
  id: "pork_belly",
  link: "https://en.wikipedia.org/wiki/Pork",

  type: "meat",
  properties: {
    qualities: ["dense", "rich", "juicy", "tender"],
    tastes: ["savory", "sweet"],
  },
  needsAttribution: true,
};

export const BeefTBone: Ingredient = {
  id: "t_bone_steak__beef",
  link: "https://en.wikipedia.org/wiki/Beef",

  type: "meat",
  properties: {
    qualities: ["dense", "rich", "juicy", "tender"],
    tastes: ["beefy", "savory", "milky"],
  },
  needsAttribution: true,
};

export const Chicken: Ingredient = {
  id: "chicken__whole",
  link: "https://en.wikipedia.org/wiki/Chicken",

  type: "meat",
  properties: {
    qualities: ["dense", "tender"],
    tastes: ["savory", "sweet"],
  },
  needsAttribution: true,
};

export const Salmon: Ingredient = {
  id: "salmon",
  link: "https://en.wikipedia.org/wiki/Salmon",

  type: "seafood",
  properties: {
    qualities: ["dense", "rich", "jelly-like", "tender"],
    tastes: ["briny", "savory", "sweet", "salty"],
  },
  needsAttribution: true,
};

export const Mackarel: Ingredient = {
  id: "mackarel",
  link: "https://en.wikipedia.org/wiki/Mackarel",

  type: "seafood",
  properties: {
    qualities: ["dense", "rich", "juicy", "tender"],
    tastes: ["briny", "savory", "sweet", "salty"],
  },
  needsAttribution: true,
};

export const Loach: Ingredient = {
  id: "loach",
  link: "https://en.wikipedia.org/wiki/Loach",

  type: "seafood",
  properties: {
    qualities: ["light"],
    tastes: ["savory", "briny", "bitter", "salty"],
  },
  needsAttribution: true,
};

export const MuttonGoat: Ingredient = {
  id: "mutton__goat",
  link: "https://en.wikipedia.org/wiki/Goat",

  type: "meat",
  properties: {
    qualities: ["dense", "tender"],
    tastes: ["savory", "earthy"],
  },
  needsAttribution: true,
};

export const CheeseFeta: Ingredient = {
  id: "feta_cheese",
  link: "https://en.wikipedia.org/wiki/Feta",

  type: "dairy",
  properties: {
    qualities: ["dense", "rich", "creamy", "smooth"],
    tastes: ["savory", "sour", "tangy", "milky", "briny"],
  },
  needsAttribution: true,
};

export const CheeseSwiss: Ingredient = {
  id: "swiss_cheese",
  link: "https://en.wikipedia.org/wiki/Swiss_cheese",

  type: "dairy",
  properties: {
    qualities: ["dense", "rich", "creamy", "smooth"],
    tastes: ["savory", "sour", "nutty", "milky"],
  },
  needsAttribution: true,
};

export const CheeseBlue: Ingredient = {
  id: "blue_cheese",
  link: "https://en.wikipedia.org/wiki/Blue_cheese",

  type: "dairy",
  properties: {
    qualities: ["dense", "rich", "creamy", "smooth"],
    tastes: ["sour", "tangy", "savory", "pungent", "milky"],
  },
  needsAttribution: true,
};

export const BrieCheese: Ingredient = {
  id: "brie_cheese",
  link: "https://en.wikipedia.org/wiki/Brie",
  type: "dairy",
  properties: {
    qualities: ["dense", "rich", "creamy", "smooth"],
    tastes: ["savory", "tangy", "milky", "earthy"],
  },
};

export const MozzarellaCheese: Ingredient = {
  id: "mozzarella",
  link: "https://en.wikipedia.org/wiki/Mozzarella",

  type: "dairy",
  properties: {
    qualities: ["dense", "rich", "chewy"],
    tastes: ["milky", "savory", "sweet", "tangy"],
  },
  needsAttribution: true,
};

export const GranaPadano: Ingredient = {
  id: "grana_padano",
  link: "https://en.wikipedia.org/wiki/Grana_Padano",

  type: "dairy",
  properties: {
    qualities: ["dense", "rich", "sharp"],
    tastes: ["savory", "salty", "nutty", "tangy", "milky"],
  },
};

export const PecorinoRomano: Ingredient = {
  id: "pecorino_romano",
  link: "https://en.wikipedia.org/wiki/Pecorino_Romano",

  type: "dairy",
  properties: {
    qualities: ["dense", "rich", "sharp"],
    tastes: ["savory", "salty", "tangy", "earthy", "milky"],
  },
};

export const Parmesan: Ingredient = {
  id: "parmesan",
  link: "https://en.wikipedia.org/wiki/Parmigiano-Reggiano",

  type: "dairy",
  properties: {
    qualities: ["dense", "rich", "sharp"],
    tastes: ["savory", "salty", "nutty", "tangy", "milky"],
  },
};

export const Chickpea: Ingredient = {
  id: "chickpea",
  link: "https://en.wikipedia.org/wiki/Chickpea",
  type: "legume",

  properties: {
    qualities: ["dense", "smooth"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "taproot_seeker",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Dryland annual legume, low-input friendly
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.35, 0.6],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  extraFacts: [getExtraFactAboutLegumeSeed("chickpea", "Chickpeas")],
};

export const Lentil: Ingredient = {
  id: "lentil",
  link: "https://en.wikipedia.org/wiki/Lentil",

  type: "legume",
  properties: {
    tastes: ["earthy", "astringent", "savory", "nutty"],
    qualities: ["smooth"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [8, 20],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "taproot_seeker",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Cool-season annual legume
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [getExtraFactAboutLegumeSeed("lentil", "Lentils")],
};

export const Pistachio: Ingredient = {
  id: "pistachio",
  link: "https://en.wikipedia.org/wiki/Pistachio",
  type: "nut",
  useSvg: true,
  properties: {
    qualities: ["dense", "crunchy", "rough"],
    tastes: ["nutty", "earthy", "sweet", "floral"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["hardy"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        chillHours: [600, 1000],
        optimalTempRangeC: [18, 35],
      },
      airHumidityPreferences: ["semi_arid_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Requires long-term planning, spacing, and climate certainty
      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "full_sun",

      // Slow to bear, especially from seed
      yearsToFirstHarvest: [5, 10],

      productiveLifespanYears: [60, 150],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "pistachio",
      "Pistachio",
      "",
      "blossoms",
      "sensitive",
    ),
  ],
};

export const Hazelnut: Ingredient = {
  id: "hazelnut",
  link: "https://en.wikipedia.org/wiki/Hazelnut",
  type: "nut",
  useSvg: true,
  properties: {
    qualities: ["dense", "crunchy", "rough"],
    tastes: ["nutty", "earthy", "sweet"],
    growth: {
      growthForms: ["bushShrub"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        chillHours: [600, 1200],
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Shrub-layer nut, can be established relatively early
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [3, 5],

      productiveLifespanYears: [20, 40],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    {
      id: "hazelnut_seedlings",
      label: "Light Preference",
      content: "More sun means more nuts, but it tolerates some shade.",
      highlights: [{ text: "shade", theme: "light" }],
    },
    {
      id: "hazelnut_blossom_cold",
      label: "Cold Intolerance",
      content:
        "Hazelnut flowers are cold sensitive during bloom, but not fragile to the degree of tropical fruit.",
      highlights: [{ text: "cold sensitive", theme: "frost" }],
    },
  ],
};

export const Orange: Ingredient = {
  id: "orange",
  link: "https://en.wikipedia.org/wiki/Orange",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "juicy"],
    tastes: ["citrusy", "sweet", "sour", "tangy", "zesty", "floral"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [30, 60],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "orange",
      "Orange",
      "highly",
    ),
  ],
};

export const Eggplant: Ingredient = {
  id: "eggplant",
  link: "https://en.wikipedia.org/wiki/Eggplant",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["dense", "smooth", "sticky", "juicy"],
    tastes: ["savory", "sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 32],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Same-season harvest
      yearsToFirstHarvest: [0.25, 0.45],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "eggplant",
      "Eggplant",
    ),
  ],
};

export const Spirulina: Ingredient = {
  id: "spirulina",
  link: "https://en.wikipedia.org/wiki/Spirulina_(genus)",
  type: "algae",

  properties: {
    qualities: ["chewy", "smooth"],
    tastes: ["savory", "nutty", "grassy", "bitter"],
    algaeGrowth: {
      habitats: ["alkaline_lake"],
      lightPreferences: ["full_sun", "surface_float"],
      substrates: ["free_floating", "surface_mat"],
      temperatureTolerances: ["warm_preferring", "heat_tolerant"],
      soilPreferences: ["surface_aquatic"],
      lifeCycles: ["continuous"],
    },
  },
  needsAttribution: true,
};

export const Lemon: Ingredient = {
  id: "lemon",
  link: "https://en.wikipedia.org/wiki/Lemon",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "cool", "juicy"],
    tastes: ["citrusy", "sour", "sweet", "tangy", "zesty", "floral"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Benefits from wind protection and warmth pockets
      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [2, 5],

      productiveLifespanYears: [25, 50],

      managementRotation: "keep",
    },
  },
};

export const Almond: Ingredient = {
  id: "almond",
  link: "https://en.wikipedia.org/wiki/Almond",
  type: "nut",
  useSvg: true,
  properties: {
    qualities: ["dense", "crunchy", "rough"],
    tastes: ["nutty", "earthy", "floral", "woody", "sweet"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        chillHours: [250, 500],
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Orchard-scale tree, needs sun and spacing early
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [25, 50],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "almond",
      "Almond",
      "highly",
    ),
  ],
};
export const AlmondFlour: Ingredient = {
  id: "almond_flour",
  link: "https://en.wikipedia.org/wiki/Almond",
  type: "misc",
  originIngredients: [Almond.id],
  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["nutty", "earthy", "floral", "woody", "sweet"],
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient("almond", "Almond"),
  ],
  needsAttribution: true,
};
export const Chestnut: Ingredient = {
  id: "chestnut",
  link: "https://en.wikipedia.org/wiki/Chestnut",
  type: "nut",
  properties: {
    qualities: ["dense", "smooth", "chewy"],
    tastes: ["earthy", "sweet", "nutty"],
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        chillHours: [400, 1000],
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Large long-lived nut tree, defines final structure
      recommendedPlantYearFromStart: [0, 3],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [5, 10],

      productiveLifespanYears: [80, 200],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
  extraFacts: [
    {
      id: "chestnut_seedlings",
      label: "Light Preference",
      content:
        "Young saplings can handle partial sun, but they lean toward light.",
      highlights: [{ text: "partial sun", theme: "light" }],
    },
  ],
};

export const Walnut: Ingredient = {
  id: "walnut",
  link: "https://en.wikipedia.org/wiki/Walnut",
  type: "nut",
  useSvg: true,
  properties: {
    qualities: ["dense", "crunchy", "rough"],
    tastes: ["nutty", "earthy", "woody"],
    succession: {
      successionalPhase: "legacy",

      // Large canopy tree with allelopathic effects
      recommendedPlantYearFromStart: [0, 3],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [6, 12],

      productiveLifespanYears: [80, 200],

      managementRotation: "keep",
    },
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained", "deep_groundwater"],
      climateProfile: {
        chillHours: [700, 1500],
        optimalTempRangeC: [12, 28],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "walnut",
      "Walnut",
      "",
      "blossoms",
      "sensitive",
    ),
  ],
};

export const Cashew: Ingredient = {
  id: "cashew",
  link: "https://en.wikipedia.org/wiki/Cashew",
  type: "nut",

  properties: {
    qualities: ["dense", "crunchy"],
    tastes: ["nutty", "sweet", "savory", "milky"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["humid_air"],
      climateProfile: {
        optimalTempRangeC: [22, 35],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Needs warmth, spacing, and long-term intent
      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [25, 50],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    {
      id: "cashew_seedlings",
      label: "Light Preference",
      content: "High light is essential for nut production.",
      highlights: [{ text: "light", theme: "light" }],
    },
  ],
  needsAttribution: true,
};

export const Acorn: Ingredient = {
  id: "acorn",
  link: "https://en.wikipedia.org/wiki/Acorn",
  type: "nut",
  originIngredients: ["oak_tree"],
  useSvg: true,
  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["earthy", "sweet", "nutty", "woody"],
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["hardy"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        chillHours: [500, 1500],
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // True long-game tree, defines final structure
      recommendedPlantYearFromStart: [0, 3],

      // Seedlings tolerate shade but benefit from some light
      establishmentLight: "partial_sun",

      // Very long juvenile phase
      yearsToFirstHarvest: [10, 30],

      productiveLifespanYears: [100, 300],

      managementRotation: "keep",
    },
  },
};

export const Peanut: Ingredient = {
  id: "peanut",
  link: "https://en.wikipedia.org/wiki/Peanut",
  type: "legume",
  useSvg: true,
  properties: {
    qualities: ["dense", "crunchy", "rough"],
    tastes: ["nutty", "sweet", "earthy", "savory"],
    tasteProfile: [
      { id: "nutty", intensity: 5 },
      { id: "earthy", intensity: 3 },
      { id: "savory", intensity: 3 },
      { id: "sweet", intensity: 2 },
    ],
    qualityProfile: [
      { id: "dense", intensity: 4 },
      { id: "crunchy", intensity: 4 },
      { id: "rough", intensity: 3 },
    ],
    growth: {
      growthForms: ["herbaceous", "groundcover"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [20, 35],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "taproot_seeker",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Ideal right at system start for soil building
      recommendedPlantYearFromStart: [0, 1],

      // Needs sun early, struggles as shade increases
      establishmentLight: "full_sun",

      // Harvest in the same year
      yearsToFirstHarvest: [0.3, 0.5],

      // Short planning window; often reseeded or replaced
      productiveLifespanYears: [0.5, 1],

      // Designed to be cycled out as shade builds
      managementRotation: "short_rotation",
    },
  },
  extraFacts: [getExtraFactAboutLegumeSeed("peanut", "Peanuts")],
};

export const BrazilNut: Ingredient = {
  id: "brazil_nut",
  link: "https://en.wikipedia.org/wiki/Brazil_nut",
  type: "nut",
  useSvg: true,
  properties: {
    qualities: ["dense", "crunchy"],
    tastes: ["nutty", "earthy", "sweet", "woody"],
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [24, 32],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Massive emergent rainforest tree; only makes sense with long-term commitment
      recommendedPlantYearFromStart: [2, 6],

      // Establishes best with some protection before reaching the canopy
      establishmentLight: "partial_sun",

      // Extremely long juvenile phase
      yearsToFirstHarvest: [10, 20],

      productiveLifespanYears: [150, 300],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    {
      id: "brazil_nut_seedlings",
      label: "Light Preference",
      content: "Seedlings tolerate filtered light under the forest canopy.",
      highlights: [{ text: "filtered light", theme: "light" }],
    },
  ],
};

export const Macadamia: Ingredient = {
  id: "macadamia",
  link: "https://en.wikipedia.org/wiki/Macadamia",
  type: "nut",
  useSvg: true,
  properties: {
    qualities: ["dense", "crunchy", "rich"],
    tastes: ["nutty", "sweet", "savory", "milky"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Subtropical canopy nut tree with long horizon
      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [5, 10],

      productiveLifespanYears: [50, 100],

      managementRotation: "keep",
    },
  },
};

export const Pecan: Ingredient = {
  id: "pecan",
  link: "https://en.wikipedia.org/wiki/Pecan",
  type: "nut",
  useSvg: true,
  properties: {
    qualities: ["dense", "crunchy", "rough"],
    tastes: ["nutty", "woody", "earthy", "savory", "sweet"],
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        chillHours: [200, 600],
        optimalTempRangeC: [15, 30],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Large orchard and forest tree, spacing and water planning required
      recommendedPlantYearFromStart: [0, 3],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [6, 12],

      productiveLifespanYears: [100, 300],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    {
      id: "pecan_light_preference",
      label: "Light Preference",
      content:
        "Young trees tolerate partial sun, but pecan thrives in open light.",
      highlights: [{ text: "partial sun", theme: "light" }],
    },
    getExtraFactAboutBlossomSensitivityForIngredient(
      "pecan",
      "Pecan",
      "",
      "blossoms",
      "sensitive",
    ),
  ],
};

export const PineNut: Ingredient = {
  id: "pine_nut",
  link: "https://en.wikipedia.org/wiki/Pine_nut",
  type: "seed",
  useSvg: true,
  properties: {
    qualities: ["dense", "crunchy"],
    tastes: ["milky", "savory", "nutty", "woody"],
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["hardy"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        chillHours: [400, 1000],
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Very long-term forest tree; only makes sense with generational planning
      recommendedPlantYearFromStart: [0, 4],

      // Seedlings tolerate some shade but need light to mature
      establishmentLight: "partial_sun",

      // Cones take many years to produce
      yearsToFirstHarvest: [10, 25],

      productiveLifespanYears: [100, 300],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    {
      id: "pine_nut_frost_tolerance",
      label: "Frost Tolerance",
      content:
        "Cold may slow development but almost never kills a cone, since conifers evolved in climates with winter freeze.",
    },
    {
      id: "pine_nut_is_seed",
      label: "Is a Seed",
      content: "Pine nuts are seeds from cones, not fruits.",
    },
  ],
};

export const SesameSeed: Ingredient = {
  id: "sesame",
  link: "https://en.wikipedia.org/wiki/Sesame",
  type: "seed",

  properties: {
    qualities: ["dense", "rough", "crunchy"],
    tastes: ["nutty", "savory", "earthy", "sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 35],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Warm-season oilseed for open, early conditions
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Same-season seed harvest
      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },

  needsAttribution: true,
};

export const SesameOil: Ingredient = {
  id: "sesame_oil",
  link: "https://en.wikipedia.org/wiki/Sesame_oil",
  type: "fat",
  originIngredients: [SesameSeed.id],
  properties: {
    qualities: ["dense", "smooth", "rich"],
    tastes: ["nutty", "savory", "earthy", "sweet"],
  },
  needsAttribution: true,
};

export const Tahini: Ingredient = {
  id: "tahini",
  link: "https://en.wikipedia.org/wiki/Tahini",
  originIngredients: [SesameSeed.id],
  type: "misc",
  properties: {
    qualities: ["dense", "smooth", "creamy", "rich"],
    tastes: ["nutty", "earthy", "savory", "bitter", "sweet"],
  },
};

export const SesameSeedBlack: Ingredient = {
  id: "black_sesame",
  link: "https://en.wikipedia.org/wiki/Sesame",
  type: "seed",

  properties: {
    qualities: ["dense", "rough", "crunchy"],
    tastes: ["nutty", "malty", "earthy", "savory", "sweet"],
    growth: SesameSeed.properties.growth,
  },
  needsAttribution: true,
};

export const MushroomPorcini: Ingredient = {
  id: "porcini",
  link: "https://en.wikipedia.org/wiki/Boletus_edulis",
  type: "fungi",
  useSvg: true,

  properties: {
    qualities: ["light", "smooth", "juicy", "chewy"],
    tastes: ["savory", "earthy", "nutty", "woody"],
    fungiGrowth: {
      growthForms: ["mycorrhizal"],
      lightPreferences: ["low_light"],
      lifeCycles: ["persistent_mycelium"],
      substrateDepths: ["surface"],
      temperatureTolerances: ["cold_tolerant"],
      soilPreferences: ["dry_forest_floor"],
    },
  },
};

export const Wheat: Ingredient = {
  id: "wheat",
  link: "https://en.wikipedia.org/wiki/wheat",
  type: "grain",
  useSvg: true,
  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [8, 18],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Foundational early grain for open-field phases
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.4, 0.7],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
};

export const Croissant: Ingredient = {
  id: "croissant",
  link: "https://www.wikipedia.org/wiki/Croissant",
  type: "misc",
  originIngredients: [Wheat.id],
  properties: {
    qualities: ["chewy", "airy", "spongy", "smooth"],
    tastes: ["sweet", "nutty", "malty"],
  },
  needsAttribution: true,
};

export const BreadPlain: Ingredient = {
  id: "bread__plain",
  link: "https://www.wikipedia.org/wiki/Bread",
  type: "misc",
  originIngredients: [Wheat.id],
  properties: {
    qualities: ["spongy", "smooth"],
    tastes: ["sweet"],
  },
  needsAttribution: true,
};

export const BreadMilk: Ingredient = {
  id: "milk_bread",
  link: "https://www.wikipedia.org/wiki/Bread",
  type: "misc",
  originIngredients: [Wheat.id],
  properties: {
    qualities: ["spongy", "smooth"],
    tastes: ["milky", "sweet"],
  },
  needsAttribution: true,
};

export const Sourdough: Ingredient = {
  id: "sourdough__wheat",
  link: "https://www.wikipedia.org/wiki/Sourdough",
  type: "misc",
  originIngredients: [Wheat.id],
  properties: {
    qualities: ["dense", "chewy", "airy"],
    tastes: ["tangy", "nutty", "sour", "sweet", "malty"],
  },
  needsAttribution: true,
};

export const Baguette: Ingredient = {
  id: "baguette__bread",
  link: "https://www.wikipedia.org/wiki/Baguette",
  type: "misc",
  originIngredients: [Wheat.id],
  properties: {
    qualities: ["chewy", "dense"],
    tastes: ["sweet", "malty"],
  },
  needsAttribution: true,
};

export const Bagel: Ingredient = {
  id: "bagel",
  link: "https://www.wikipedia.org/wiki/Bagel",
  type: "misc",
  originIngredients: [Wheat.id],
  properties: {
    qualities: ["chewy", "dense"],
    tastes: ["malty", "nutty", "sweet"],
  },
  needsAttribution: true,
};

export const UdonNoodles: Ingredient = {
  id: "udon_noodles",
  link: "https://en.wikipedia.org/wiki/Udon",
  type: "misc",
  originIngredients: [Wheat.id],
  properties: {
    qualities: ["chewy", "smooth"],
    tastes: ["sweet", "milky"],
  },
  needsAttribution: true,
};

export const WheatFlour: Ingredient = {
  id: "flour__wheat",
  link: "https://en.wikipedia.org/wiki/Flour",
  type: "misc",
  originIngredients: [Wheat.id],
  properties: {
    qualities: ["smooth", "dense"],
    tastes: ["sweet", "nutty"],
  },
  needsAttribution: true,
};

export const GrahamCracker: Ingredient = {
  id: "graham_cracker",
  link: "https://en.wikipedia.org/wiki/Graham_cracker",
  type: "misc",
  originIngredients: [Wheat.id],
  properties: {
    qualities: ["dense", "crunchy"],
    tastes: ["nutty", "malty", "sweet"],
  },
  needsAttribution: true,
};

export const Oat: Ingredient = {
  id: "oat",
  link: "https://en.wikipedia.org/wiki/Oat",
  type: "grain",
  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["sweet", "earthy", "milky"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [7, 18],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Early open-field grain, often used as a cover or food crop
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Same-season harvest
      yearsToFirstHarvest: [0.4, 0.7],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const RiceGrowth: Growth = {
  growthForms: ["herbaceous"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["annual"],
  heightClasses: ["low"],
  frostTolerances: ["frost_intolerant"],
  soilPreferences: ["standing_water"],
  climateProfile: {
    optimalTempRangeC: [20, 35],
  },
  airHumidityPreferences: ["humid_air"],
  soilInteraction: {
    root: {
      depthBand: "shallow",
      feederZone: "surface",
      strategy: "diffuse_forager",
    },
    demand: {
      nutrientPull: "medium",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const RiceSuccession: SuccessionProfile = {
  successionalPhase: "pioneer",

  // Introduced once water management or paddies are established
  recommendedPlantYearFromStart: [0, 2],

  establishmentLight: "full_sun",

  // Seasonal harvest depending on variety
  yearsToFirstHarvest: [0.4, 0.7],

  productiveLifespanYears: [0.2, 1],

  managementRotation: "short_rotation",
};

export const Rice: Ingredient = {
  id: "rice",
  link: "https://en.wikipedia.org/wiki/Rice",
  type: "grain",
  properties: {
    qualities: ["smooth", "sticky", "chewy"],
    tastes: ["sweet"],
    growth: RiceGrowth,
    succession: RiceSuccession,
  },
  needsAttribution: true,
};

export const RiceWhiteJaponicaCooked: Ingredient = {
  id: "rice__white_japonica_cooked",
  link: "https://en.wikipedia.org/wiki/Rice",
  type: "misc",

  properties: {
    qualities: ["smooth", "sticky", "chewy"],
    tastes: ["sweet"],
    growth: RiceGrowth,
    succession: RiceSuccession,
  },
  needsAttribution: true,
};

export const RiceWhiteBasmatiCooked: Ingredient = {
  id: "rice__white_basmati_cooked",
  link: "https://en.wikipedia.org/wiki/Rice",
  type: "misc",

  properties: {
    qualities: ["smooth", "airy"],
    tastes: ["sweet"],
    growth: RiceGrowth,
    succession: RiceSuccession,
  },
  needsAttribution: true,
};

export const Pumpkin: Ingredient = {
  id: "pumpkin",
  link: "https://en.wikipedia.org/wiki/Pumpkin",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["sweet", "earthy"],
    growth: {
      growthForms: ["herbaceous", "groundcover"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // First-wave ground cover, biomass, and calories
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Same-season harvest
      yearsToFirstHarvest: [0.25, 0.45],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
};

export const PumpkinSeed: Ingredient = {
  id: "pumpkin_seed",
  link: "https://en.wikipedia.org/wiki/Pumpkin_seed",
  type: "seed",
  originIngredients: [Pumpkin.id],
  properties: {
    qualities: ["dense", "crunchy"],
    tastes: ["nutty", "earthy", "woody"],
    succession: {
      successionalPhase: "pioneer",

      // First-wave vine crop producing seed and flesh
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Seeds mature with fruit in same season
      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const SweetPotatoPurple: Ingredient = {
  id: "sweet_potato__purple",
  link: "https://en.wikipedia.org/wiki/Sweet_potato",
  type: "root",

  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["sweet", "earthy", "nutty", "woody"],
    growth: {
      growthForms: ["herbaceous", "groundcover", "root"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 30],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Excellent early groundcover once soil is warm
      recommendedPlantYearFromStart: [0, 2],

      // Likes sun but tolerates light shade as canopy builds
      establishmentLight: "full_sun",

      // Tuber harvest usually within the first growing season
      yearsToFirstHarvest: [0.5, 1],

      // Can persist via vines, but productivity is best when cycled
      productiveLifespanYears: [1, 3],

      managementRotation: "medium_rotation",
    },
  },
};

export const SweetPotatoOrange: Ingredient = {
  id: "sweet_potato__orange",
  link: "https://en.wikipedia.org/wiki/Sweet_potato",
  type: "root",

  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["sweet", "earthy", "woody", "malty"],
    growth: SweetPotatoPurple.properties.growth,
  },
};

export const SorrelLeaf: Ingredient = {
  id: "sorrel_leaf",
  link: "https://en.wikipedia.org/wiki/Sorrel",
  type: "leaf",

  properties: {
    qualities: ["light"],
    tastes: ["grassy", "earthy", "bitter"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [8, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Settles in early and persists as a perennial green
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.4, 0.8],

      productiveLifespanYears: [8, 20],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
};

const SquashGrowth: Growth = {
  growthForms: ["herbaceous", "groundcover"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["annual"],
  heightClasses: ["low"],
  frostTolerances: ["frost_intolerant"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [18, 30],
  },
  airHumidityPreferences: ["moderate_humidity"],
  soilInteraction: {
    root: {
      depthBand: "shallow",
      feederZone: "surface",
      strategy: "diffuse_forager",
    },
    demand: {
      nutrientPull: "low",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const SquashSuccession: SuccessionProfile = {
  successionalPhase: "pioneer",

  // Classic first-wave ground cover + calories while trees are tiny
  recommendedPlantYearFromStart: [0, 1],

  establishmentLight: "full_sun",

  // Same-season harvest
  yearsToFirstHarvest: [0.3, 0.6],

  productiveLifespanYears: [0.2, 1],

  managementRotation: "short_rotation",
};

export const SquashButternut: Ingredient = {
  id: "butternut_squash",
  link: "https://en.wikipedia.org/wiki/Butternut_squash",
  type: "fruit",

  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["sweet", "earthy", "nutty", "savory"],
    growth: SquashGrowth,
    succession: SquashSuccession,
  },
};

export const SquashKabocha: Ingredient = {
  id: "kabocha_squash",
  link: "https://en.wikipedia.org/wiki/Kabocha_squash",
  type: "fruit",

  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["sweet", "earthy", "nutty", "savory"],
    growth: SquashGrowth,
    succession: SquashSuccession,
  },
};

export const Potato: Ingredient = {
  id: "potato",
  link: "https://en.wikipedia.org/wiki/Potato",
  type: "stem",
  useSvg: true,
  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["sweet", "earthy", "savory", "nutty"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "dominant",
        notes: [
          "tuber bulking phase needs steady moisture",
          "dislikes waterlogging",
        ],
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Classic early calorie crop in open conditions
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "potato",
      "Potato",
      "A swollen underground stem that stores starch.",
    ),
  ],
};

export const Barley: Ingredient = {
  id: "barley",
  link: "https://en.wikipedia.org/wiki/Barley",
  type: "grain",

  properties: {
    qualities: ["dense", "rough"],
    tastes: ["malty", "nutty", "sweet", "earthy"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [8, 18],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Classic first-wave grain in open soil
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Same-season grain harvest
      yearsToFirstHarvest: [0.3, 0.5],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const BarleyTea: Ingredient = {
  id: "barley_tea",
  link: "https://www.wikipedia.org/wiki/Barley_tea",
  type: "tea",
  originIngredients: [Barley.id],
  properties: {
    qualities: ["cool", "light"],
    tastes: ["malty", "woody", "sweet"],
  },
  needsAttribution: true,
};

export const MushroomTruffle: Ingredient = {
  id: "truffle",
  link: "https://en.wikipedia.org/wiki/Truffle",
  type: "fungi",
  useSvg: true,

  properties: {
    qualities: ["delicate", "smooth"],
    tastes: ["savory", "earthy", "nutty", "woody"],
    fungiGrowth: {
      lightPreferences: ["no_light_needed"],
      lifeCycles: ["persistent_mycelium"],
      substrateDepths: ["deep_soil"],
      temperatureTolerances: ["cold_tolerant"],
      soilPreferences: ["moist", "well_drained"],
      growthForms: ["mycorrhizal"],
    },
  },
};

export const PersimmonAsian: Ingredient = {
  id: "persimmon__asian",
  link: "https://en.wikipedia.org/wiki/Persimmon",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "cool", "juicy"],
    tastes: ["sweet"],
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        chillHours: [200, 600],
        optimalTempRangeC: [10, 22],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Slow, steady tree; benefits from thoughtful placement
      recommendedPlantYearFromStart: [0.5, 3],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [40, 80],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "Asian persimmon",
      "Asian persimmon",
    ),
  ],
};

export const Banana: Ingredient = {
  id: "banana",
  link: "https://en.wikipedia.org/wiki/Banana",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["dense", "light", "creamy", "sticky"],
    tastes: ["sweet", "floral"],
    tasteProfile: [
      { id: "sweet", intensity: 5 },
      { id: "floral", intensity: 2 },
    ],
    qualityProfile: [
      { id: "creamy", intensity: 4 },
      { id: "sticky", intensity: 3 },
      { id: "dense", intensity: 3 },
      { id: "light", intensity: 2 },
    ],
    growth: {
      growthForms: ["understory"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 32],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",
      recommendedPlantYearFromStart: [0, 0], // day zero species
      establishmentLight: "full_sun",
      yearsToFirstHarvest: [0.8, 1.2],
      productiveLifespanYears: [2, 7], // mats can persist, but rotation is common
      managementRotation: "medium_rotation",
    },
  },
};

export const Pomegranate: Ingredient = {
  id: "pomegranate",
  link: "https://en.wikipedia.org/wiki/Pomegranate",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "crunchy", "light", "cool", "fibrous"],
    tastes: ["sweet", "sour", "tangy", "astringent"],
    growth: {
      growthForms: ["bushShrub"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["dry", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [15, 30],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Can be planted early; tolerates marginal conditions well
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [2, 4],

      productiveLifespanYears: [25, 50],

      managementRotation: "keep",
    },
  },
};

export const Papaya: Ingredient = {
  id: "papaya",
  link: "https://en.wikipedia.org/wiki/Papaya",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "cool", "juicy", "smooth"],
    tastes: ["sweet"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["short_lived_perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [21, 32],
      },
      airHumidityPreferences: ["humid_air"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Excellent early “tree-like” producer while canopy trees are still small
      recommendedPlantYearFromStart: [0, 2],

      // Likes sun, but young plants can benefit from slight protection in brutal exposure
      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.75, 1.5],

      // Short-lived perennial in practice (declines after a few years)
      productiveLifespanYears: [2, 5],

      managementRotation: "medium_rotation",
    },
  },
};

export const PearExtraFacts: ExtraFact[] = [
  getExtraFactAboutBlossomSensitivityForIngredient("pear", "Pear"),
];

export const PearGrowth: Growth = {
  growthForms: ["midstory"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["perennial"],
  heightClasses: ["medium"],
  frostTolerances: ["hardy"],
  soilPreferences: ["moist_well_drained"],
  airHumidityPreferences: ["moderate_humidity"],
  climateProfile: {
    chillHours: [600, 1200],
    optimalTempRangeC: [8, 18],
  },
  soilInteraction: {
    root: {
      depthBand: "medium",
      feederZone: "mid",
      strategy: "woody_structural",
    },
    demand: {
      nutrientPull: "medium",
      waterPull: "medium",
      oxygenSensitivity: "low",
    },
    competitionTolerance: "tolerant",
  },
};

const PearSuccession: SuccessionProfile = {
  successionalPhase: "late",

  recommendedPlantYearFromStart: [0, 2],

  establishmentLight: "full_sun",

  yearsToFirstHarvest: [3, 6],

  productiveLifespanYears: [30, 60],

  managementRotation: "keep",
};

export const PearGreen: Ingredient = {
  id: "pear__green",
  link: "https://en.wikipedia.org/wiki/Pear",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "snappy", "light", "cool"],
    tastes: ["tangy", "sweet"],
    growth: PearGrowth,
    succession: PearSuccession,
  },
  extraFacts: PearExtraFacts,
};

export const PearYellow: Ingredient = {
  id: "pear__yellow",
  link: "https://en.wikipedia.org/wiki/Pear",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["sweet"],
    growth: PearGrowth,
    succession: PearSuccession,
  },
  extraFacts: PearExtraFacts,
};

export const Strawberry: Ingredient = {
  id: "strawberry",
  link: "https://en.wikipedia.org/wiki/Strawberry",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["sweet", "floral", "zesty"],
    growth: {
      growthForms: ["groundcover"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["moderate_humidity"],
      climateProfile: {
        chillHours: [0, 300],
        optimalTempRangeC: [8, 18],
      },
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "surface_spreader",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "high",
        },
        competitionTolerance: "intolerant",
        notes: [
          "prefers oxygenated topsoil",
          "stresses under strong competitors",
        ],
      },
    },
    succession: {
      successionalPhase: "early",

      // Excellent early groundcover while trees are small
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.5, 1],

      productiveLifespanYears: [2, 4],

      managementRotation: "medium_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "strawberry",
      "Strawberry",
      "highly",
    ),
  ],
};

export const Grapefruit: Ingredient = {
  id: "grapefruit",
  link: "https://en.wikipedia.org/wiki/Grapefruit",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["citrusy", "sour", "sweet", "bitter"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Better once wind protection and warmth pockets are established
      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [25, 60],

      managementRotation: "keep",
    },
  },
};

export const Lime: Ingredient = {
  id: "lime",
  link: "https://en.wikipedia.org/wiki/Lime_(fruit)",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool"],
    tastes: ["citrusy", "sour", "zesty", "tangy"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      airHumidityPreferences: ["humid_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Similar to lemon but often slightly more frost-sensitive
      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [2, 5],

      productiveLifespanYears: [25, 50],

      managementRotation: "keep",
    },
  },
};

export const Durian: Ingredient = {
  id: "durian",
  link: "https://en.wikipedia.org/wiki/Durian",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["smooth", "creamy", "sticky"],
    tastes: ["sweet", "savory", "pungent"],
    tasteProfile: [
      { id: "sweet", intensity: 5 },
      { id: "savory", intensity: 4 },
      { id: "pungent", intensity: 4 },
    ],
    qualityProfile: [
      { id: "creamy", intensity: 5 },
      { id: "smooth", intensity: 4 },
      { id: "sticky", intensity: 4 },
    ],
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [22, 30],
      },
      airHumidityPreferences: ["humid_air", "saturated_air"],
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "late",
      // plant once shade and humidity are stable, usually a bit
      // later than cacao and early coconuts
      recommendedPlantYearFromStart: [2, 5],
      establishmentLight: "filtered_light",
      yearsToFirstHarvest: [7, 10],
      productiveLifespanYears: [40, 80],
      managementRotation: "keep",
    },
  },
  extraFacts: [
    {
      id: "durian_light_preference",
      label: "Light Preference",
      content:
        "For seedlings and young trees, filtered sunlight may be preferred, perhaps under the shelter of taller trees.",
      highlights: [{ text: "filtered sunlight", theme: "light" }],
    },
    {
      id: "durian_temperature",
      label: "Temperature Range",
      content:
        "Durian thrives in consistently warm, tropical climates with temperatures between 24–30°C (75–86°F). It cannot tolerate frost or prolonged cool periods below 15°C.",
      highlights: [
        { text: "24–30°C", theme: "frost" },
        { text: "75–86°F", theme: "frost" },
        { text: "frost", theme: "frost" },
        { text: "15°C", theme: "frost" },
      ],
    },
  ],
};

export const DateDried: Ingredient = {
  id: "date__dried",
  link: "https://en.wikipedia.org/wiki/Date",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["smooth", "sticky", "chewy"],
    tastes: ["sweet", "woody"],
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["deep_groundwater"],
      climateProfile: {
        optimalTempRangeC: [20, 35],
      },
      airHumidityPreferences: ["arid_air", "semi_arid_air"],
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Usually introduced once long-term water access and spacing are clear
      recommendedPlantYearFromStart: [1, 5],

      // Seedlings tolerate some shelter, but generally want strong light
      establishmentLight: "full_sun",

      // Long juvenile phase
      yearsToFirstHarvest: [5, 10],

      // Extremely long productive window
      productiveLifespanYears: [50, 100],

      managementRotation: "keep",
    },
  },
};

export const Avocado: Ingredient = {
  id: "avocado",
  link: "https://en.wikipedia.org/wiki/Avocado",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["dense", "rich", "creamy", "smooth", "sticky"],
    tastes: ["sweet", "savory", "earthy", "nutty"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [16, 28],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // In mixed systems, often introduced after early shade and wind protection exists
      recommendedPlantYearFromStart: [1, 4],

      // Young avocado likes shelter and can scorch in harsh sun and wind
      establishmentLight: "partial_sun",

      // Grafted commonly 3–5 years, seedlings longer
      yearsToFirstHarvest: [3, 8],

      productiveLifespanYears: [25, 60],

      managementRotation: "keep",
    },
  },
};

export const Mango: Ingredient = {
  id: "mango",
  link: "https://en.wikipedia.org/wiki/Mango",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "juicy", "plump", "smooth"],
    tastes: ["sweet", "floral"],
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["humid_air"],
      climateProfile: {
        optimalTempRangeC: [20, 32],
      },
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "legacy",

      // Often planted once early shelter and spacing are clear
      recommendedPlantYearFromStart: [1, 5],

      // Young mango benefits from protection, later wants full sun
      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [3, 7],

      productiveLifespanYears: [40, 80],

      managementRotation: "keep",
    },
  },
};

export const Honey: Ingredient = {
  id: "honey",
  link: "https://en.wikipedia.org/wiki/Honey",
  type: "sugar",

  properties: {
    qualities: ["sticky", "smooth", "dense"],
    tastes: ["sweet", "floral", "fruity"],
  },
  needsAttribution: true,
};

export const Caramel: Ingredient = {
  id: "caramel",
  link: "https://en.wikipedia.org/wiki/Caramel",
  type: "sugar",
  properties: {
    qualities: ["sticky", "smooth", "dense"],
    tastes: ["sweet", "woody", "nutty"],
  },
  needsAttribution: true,
  originIngredients: [Sugarcane.id],
};

export const TomatoRed: Ingredient = {
  id: "tomato__red",
  link: "https://en.wikipedia.org/wiki/Tomato",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "juicy"],
    tastes: ["savory", "sweet", "sour", "tangy", "zesty"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 30],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Same-season harvest
      yearsToFirstHarvest: [0.2, 0.4],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
};

export const Ketchup: Ingredient = {
  id: "ketchup",
  link: "https://en.wikipedia.org/wiki/Ketchup",
  type: "misc",
  originIngredients: [TomatoRed.id],
  properties: {
    qualities: ["smooth", "sharp"],
    tastes: ["tangy", "sweet", "sour", "salty", "savory"],
  },
  needsAttribution: true,
};

export const Peach: Ingredient = {
  id: "peach",
  link: "https://en.wikipedia.org/wiki/Peach",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "cool", "juicy"],
    tastes: ["sweet", "sour", "zesty", "floral"],
    growth: {
      growthForms: ["midstory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      climateProfile: {
        chillHours: [400, 1000],
        optimalTempRangeC: [10, 20],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [2, 4],

      // High yield but shorter-lived than many orchard trees
      productiveLifespanYears: [10, 20],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "peach",
      "Peach",
      "highly",
    ),
  ],
};

export const CherrySweet: Ingredient = {
  id: "cherry__sweet",
  link: "https://en.wikipedia.org/wiki/Cherry",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "cool", "juicy"],
    tastes: ["sweet"],
    growth: {
      growthForms: ["understory"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["moderate_humidity"],
      climateProfile: {
        chillHours: [700, 1200],
        optimalTempRangeC: [8, 18],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      recommendedPlantYearFromStart: [0, 2],

      // Needs full sun for strong flowering and fruit set
      establishmentLight: "full_sun",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [15, 35],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    getExtraFactAboutBlossomSensitivityForIngredient(
      "cherry",
      "Cherry",
      "highly",
    ),
  ],
};

export const Buckwheat: Ingredient = {
  id: "buckwheat",
  link: "https://en.wikipedia.org/wiki/Buckwheat",
  type: "seed",
  properties: {
    qualities: ["dense", "smooth"],
    tastes: ["earthy", "nutty", "tangy", "bitter"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained", "dry"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Classic fast cover + grain crop
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Very fast flowering and grain set
      yearsToFirstHarvest: [0.25, 0.45],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [getExtraFactAboutPseudoCereal("buckwheat", "Buckwheat")],
};

export const AppleGrowth: Growth = {
  growthForms: ["understory"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["perennial"],
  heightClasses: ["medium"],
  frostTolerances: ["hardy"],
  soilPreferences: ["moist_well_drained"],
  airHumidityPreferences: ["moderate_humidity"],
  climateProfile: {
    chillHours: [800, 1500],
    optimalTempRangeC: [8, 18],
  },
  soilInteraction: {
    root: {
      depthBand: "medium",
      feederZone: "mid",
      strategy: "woody_structural",
    },
    demand: {
      nutrientPull: "medium",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const AppleSuccession: SuccessionProfile = {
  successionalPhase: "late",
  recommendedPlantYearFromStart: [1, 3], // planted once early structure is built
  establishmentLight: "full_sun", // needs direct light to fruit well
  yearsToFirstHarvest: [3, 5], // depends heavily on rootstock
  productiveLifespanYears: [25, 50], // commercial lifespan 20 to 30, biological longer
  managementRotation: "keep",
};

const AppleExtraFacts: ExtraFact[] = [
  getExtraFactAboutBlossomSensitivityForIngredient("apple", "Apple"),
];

export const AppleRed: Ingredient = {
  id: "apple__red",
  link: "https://en.wikipedia.org/wiki/Apple",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "cool", "juicy", "snappy"],
    tastes: ["sweet", "floral"],
    growth: AppleGrowth,
    succession: AppleSuccession,
  },
  extraFacts: AppleExtraFacts,
};

export const AppleCiderVinegar: Ingredient = {
  id: "apple_cider_vinegar",
  link: "https://en.wikipedia.org/wiki/Apple_cider_vinegar",
  type: "misc",
  originIngredients: ["apple"],
  properties: {
    qualities: ["sharp"],
    tastes: ["fruity", "sour", "tangy", "zesty", "sweet", "floral"],
    growth: AppleGrowth,
  },
  needsAttribution: true,
  extraFacts: AppleExtraFacts,
};

export const Applesauce: Ingredient = {
  id: "applesauce",
  link: "https://en.wikipedia.org/wiki/Apple_sauce",
  type: "misc",
  properties: {
    qualities: ["smooth"],
    tastes: ["sweet", "floral"],
  },
  originIngredients: [AppleRed.id],
  extraFacts: AppleExtraFacts,
};

export const AppleGold: Ingredient = {
  id: "apple__gold",
  link: "https://en.wikipedia.org/wiki/Apple",
  useSvg: true,
  type: "fruit",
  properties: {
    qualities: ["light", "cool", "juicy", "snappy"],
    tastes: ["sweet", "zesty"],
    growth: AppleGrowth,
    succession: AppleSuccession,
  },
  extraFacts: AppleExtraFacts,
};

export const RoseApple: Ingredient = {
  id: "rose_apple",
  link: "https://en.wikipedia.org/wiki/Syzygium_samarangense",

  type: "fruit",
  properties: {
    qualities: ["light", "cool", "juicy"],
    tastes: ["sweet", "floral"],
    growth: {
      growthForms: ["understory"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["humid_air"],
      climateProfile: {
        optimalTempRangeC: [20, 32],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Tropical tree benefiting from microclimate stability
      recommendedPlantYearFromStart: [1, 4],

      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [30, 60],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
};

export const AppleGreen: Ingredient = {
  id: "apple__green",
  link: "https://en.wikipedia.org/wiki/Apple",
  useSvg: true,
  type: "fruit",
  properties: {
    qualities: ["light", "juicy", "snappy"],
    tastes: ["sour", "sweet", "tangy"],
    growth: AppleGrowth,
    succession: AppleSuccession,
  },
  extraFacts: AppleExtraFacts,
};

export const Cabbage: Ingredient = {
  id: "cabbage",
  link: "https://en.wikipedia.org/wiki/Cabbage",
  type: "leaf",
  useSvg: true,
  properties: {
    qualities: ["light", "rough", "snappy", "juicy"],
    tastes: ["earthy", "sweet", "grassy"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [7, 18],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Cool-season bulk leaf crop
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.08, 0.1],

      productiveLifespanYears: [0.3, 1],

      managementRotation: "short_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "cabbage",
      "Cabbage",
      undefined,
      "leaf",
    ),
  ],
};

export const Kimchi: Ingredient = {
  id: "kimchi",
  link: "https://en.wikipedia.org/wiki/Kimchi",
  type: "misc",
  originIngredients: [Cabbage.id],
  properties: {
    qualities: ["sharp", "juicy"],
    tastes: ["tangy", "savory", "zesty", "salty", "sour", "sweet", "citrusy"],
  },
  needsAttribution: true,
};

export const Spinach: Ingredient = {
  id: "spinach",
  link: "https://en.wikipedia.org/wiki/Spinach",
  type: "leaf",
  useSvg: true,
  properties: {
    qualities: ["light"],
    tastes: ["grassy", "earthy", "bitter"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["shade_tolerant", "partial_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [5, 18],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Cool-season, fast leaf crop
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.08, 0.1],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
};

export const Kale: Ingredient = {
  id: "kale",
  link: "https://en.wikipedia.org/wiki/Kale",
  type: "leaf",

  properties: {
    qualities: ["light", "snappy"],
    tastes: ["grassy", "earthy", "bitter"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "shade_tolerant"],
      lifeCycles: ["annual"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [5, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Can be planted early and persists longer than other brassicas
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [1, 3],

      managementRotation: "medium_rotation",
    },
  },
};

export const Perilla: Ingredient = {
  id: "perilla_leaf",
  link: "https://en.wikipedia.org/wiki/Perilla",
  type: "leaf",

  properties: {
    qualities: ["light"],
    tastes: [
      "anise",
      "grassy",
      "bitter",
      "earthy",
      "zesty",
      "peppery",
      "peppery",
      "menthol",
    ],
    growth: PerillaGrowth,
    succession: PerillaSuccession,
  },
};

export const Lettuce: Ingredient = {
  id: "lettuce",
  link: "https://en.wikipedia.org/wiki/Lettuce",
  type: "leaf",
  useSvg: true,
  properties: {
    qualities: ["light", "cool", "snappy", "juicy"],
    tastes: ["grassy", "sweet", "earthy", "bitter"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["shade_tolerant", "partial_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [7, 18],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
        notes: ["fast cycle, harvestable to reduce overlap"],
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Classic early cool-season green
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.08, 0.1],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "lettuce",
      "Lettuce",
      undefined,
      "leaf",
    ),
  ],
};

export const Kelp: Ingredient = {
  id: "kelp",
  link: "https://en.wikipedia.org/wiki/Kelp",
  type: "algae",

  properties: {
    qualities: ["light", "cool", "juicy"],
    tastes: ["briny", "salty", "savory", "earthy"],
    algaeGrowth: {
      habitats: ["saltwater", "marine_coastal"],
      lightPreferences: ["bright_water", "low_light"],
      substrates: ["rock_attached"],
      temperatureTolerances: ["cool_preferring", "cold_tolerant"],
      soilPreferences: ["fully_aquatic"],
      lifeCycles: ["continuous"],
    },
  },
};

export const Wakame: Ingredient = {
  id: "wakame",
  link: "https://en.wikipedia.org/wiki/Seaweed",
  type: "algae",

  properties: {
    qualities: ["light", "cool", "juicy"],
    tastes: ["briny", "salty", "savory", "earthy", "sweet"],
    algaeGrowth: {
      habitats: ["saltwater", "marine_coastal"],
      lightPreferences: ["bright_water", "low_light"],
      substrates: ["rock_attached"],
      temperatureTolerances: ["cool_preferring", "cold_tolerant"],
      soilPreferences: ["fully_aquatic", "intertidal"],
      lifeCycles: ["seasonal_bloom"],
    },
  },
};

export const Chives: Ingredient = {
  id: "garlic_chives",
  link: "https://en.wikipedia.org/wiki/Chives",
  type: "leaf",

  properties: {
    qualities: ["light", "sharp"],
    tastes: ["earthy", "bitter", "pungent"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Easy early perennial ground-layer crop
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Leaves usable in first season
      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [5, 10],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "chives",
      "The garlic chive",
      undefined,
      "leaf",
      "herb",
    ),
  ],
};

export const Scallion: Ingredient = {
  id: "scallion",
  link: "https://en.wikipedia.org/wiki/Scallion",
  type: "stem",

  properties: {
    qualities: ["light", "sharp"],
    tastes: ["earthy", "bitter", "pungent"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [8, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Flexible early perennial or repeat-harvest crop
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.3, 0.6],

      productiveLifespanYears: [3, 6],

      managementRotation: "medium_rotation",
    },
  },
  needsAttribution: true,
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "scallion",
      "Scallion",
      undefined,
      "stem",
      "herb",
    ),
  ],
};

export const Cauliflower: Ingredient = {
  id: "cauliflower",
  link: "https://en.wikipedia.org/wiki/Cauliflower",
  type: "flower",
  useSvg: true,
  properties: {
    qualities: ["light", "smooth", "rough"],
    tastes: ["sweet", "earthy"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low", "medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.4, 0.7],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  extraFacts: [
    {
      id: "cauliflower_frost_sensitivity",
      label: "Frost Sensitivity",
      content:
        "The vegetative structure of cauliflower is hardy except the edible head, which is only lightly frost tolerant.",
      highlights: [{ text: "frost tolerant", theme: "frost" }],
    },
  ],
};

const GrapeGrowth: Growth = {
  growthForms: ["climber"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["perennial"],
  heightClasses: ["medium", "high"],
  frostTolerances: ["semi_hardy"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    chillHours: [100, 500],
    optimalTempRangeC: [10, 25],
  },
  airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
  soilInteraction: {
    root: {
      depthBand: "medium",
      feederZone: "mid",
      strategy: "diffuse_forager",
    },
    demand: {
      nutrientPull: "medium",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const GrapeSuccession: SuccessionProfile = {
  successionalPhase: "mid",

  // Plant early once trellis / living support strategy is decided
  recommendedPlantYearFromStart: [0, 2],

  establishmentLight: "full_sun",

  yearsToFirstHarvest: [2, 4],

  productiveLifespanYears: [15, 40],

  managementRotation: "keep",
};

export const GrapeExtraFacts: ExtraFact[] = [
  getExtraFactAboutBlossomSensitivityForIngredient("grape", "Grape"),
];

export const GrapeKishmish: Ingredient = {
  id: "grape__kishmish",
  link: "https://en.wikipedia.org/wiki/kishmish",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["juicy", "light", "cool", "plump"],
    tastes: ["sweet", "tangy"],
    growth: GrapeGrowth,
    succession: GrapeSuccession,
  },
  extraFacts: GrapeExtraFacts,
};

export const GrapePurple: Ingredient = {
  id: "grape__purple",
  link: "https://en.wikipedia.org/wiki/Grape",
  type: "fruit",

  properties: {
    qualities: ["light", "cool", "juicy", "plump"],
    tastes: ["sweet", "floral"],
    growth: GrapeGrowth,
    succession: GrapeSuccession,
  },
  extraFacts: GrapeExtraFacts,
};

export const GrapeWhite: Ingredient = {
  id: "grape__white",
  link: "https://en.wikipedia.org/wiki/Grape",
  type: "fruit",
  needsAttribution: true,
  properties: {
    qualities: ["light", "cool", "juicy", "plump"],
    tastes: ["sweet"],
    growth: GrapeGrowth,
    succession: GrapeSuccession,
  },
  extraFacts: GrapeExtraFacts,
};

export const GrapeTrebbiano: Ingredient = {
  id: "grape__trebbiano",
  link: "https://en.wikipedia.org/wiki/Trebbiano",
  type: "fruit",
  properties: {
    qualities: ["light", "cool", "juicy", "plump"],
    tastes: ["sweet", "tangy"],
    growth: GrapeGrowth,
    succession: GrapeSuccession,
  },
};

export const BalsamicVinegar: Ingredient = {
  id: "balsamic_vinegar",
  link: "https://en.wikipedia.org/wiki/Balsamic_vinegar",
  type: "misc",
  originIngredients: [GrapeTrebbiano.id],
  properties: {
    qualities: ["sharp"],
    tastes: ["tangy", "fruity", "sour", "zesty", "sweet"],
  },
  needsAttribution: true,
  extraFacts: GrapeExtraFacts,
};

export const Raisin: Ingredient = {
  id: "raisin",
  link: "https://en.wikipedia.org/wiki/Raisin",
  type: "fruit",
  originIngredients: ["grape"],
  useSvg: true,
  properties: {
    qualities: ["chewy", "dense", "sticky", "light"],
    tastes: ["sweet", "earthy"],
    growth: GrapeGrowth,
  },
  extraFacts: GrapeExtraFacts,
};

export const Artichoke: Ingredient = {
  id: "artichoke",
  link: "https://en.wikipedia.org/wiki/Artichoke",
  type: "flower",
  useSvg: true,
  properties: {
    qualities: ["light", "juicy", "fibrous"],
    tastes: ["earthy", "grassy", "astringent"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["short_lived_perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 24],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Can be planted early once soil fertility is decent
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Typically produces in year 2, sometimes late year 1 in warm climates
      yearsToFirstHarvest: [1, 2],

      // Long-lived herbaceous perennial if well managed
      productiveLifespanYears: [5, 10],

      managementRotation: "medium_rotation",
    },
  },
};

export const PeasGreen: Ingredient = {
  id: "green_peas",
  link: "https://en.wikipedia.org/wiki/Peas",
  type: "legume",
  useSvg: true,
  properties: {
    qualities: ["smooth", "creamy"],
    tastes: ["savory", "earthy", "sweet", "astringent"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["low"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [8, 20],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "taproot_seeker",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",

      // Cool-season early legume
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      yearsToFirstHarvest: [0.25, 0.5],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  extraFacts: [
    getExtraFactAboutBotanicallyASomethingButCulinarilyASomethingElse(
      "green_peas",
      "Green Peas",
      `The entire pod is a legume fruit; the peas inside are seeds. But in gastronomy, green peas are often treated as a "vegetable".`,
    ),
  ],
};

export const Wasabi: Ingredient = {
  id: "wasabi",
  link: "https://en.wikipedia.org/wiki/Wasabi",
  type: "rhizome",

  properties: {
    qualities: ["light", "sharp"],
    tastes: ["pungent", "earthy", "zesty"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["filtered_light", "shade_tolerant"],
      lifeCycles: ["perennial"],
      heightClasses: ["low"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Only makes sense once water, shade, and temperature stability exist
      recommendedPlantYearFromStart: [2, 5],

      // True shade-loving establishment plant
      establishmentLight: "deep_shade",

      // Rhizomes take years to size up
      yearsToFirstHarvest: [2, 4],

      // Long-lived if conditions are correct, but very sensitive
      productiveLifespanYears: [6, 15],

      managementRotation: "keep",
    },
  },
  needsAttribution: true,
};

const OliveGrowth: Growth = {
  growthForms: ["midstory"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["perennial"],
  heightClasses: ["medium", "high"],
  frostTolerances: ["semi_hardy"],
  soilPreferences: ["dry", "moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [15, 30],
  },
  airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
  soilInteraction: {
    root: {
      depthBand: "medium",
      feederZone: "mid",
      strategy: "woody_structural",
    },
    demand: {
      nutrientPull: "medium",
      waterPull: "medium",
      oxygenSensitivity: "low",
    },
    competitionTolerance: "tolerant",
  },
};

const OliveSuccession: SuccessionProfile = {
  successionalPhase: "legacy",

  // Orchard anchor, long planning horizon
  recommendedPlantYearFromStart: [0, 3],

  establishmentLight: "full_sun",

  yearsToFirstHarvest: [3, 7],

  productiveLifespanYears: [50, 150],

  managementRotation: "keep",
};

export const OliveBlack: Ingredient = {
  id: "olive__black",
  link: "https://en.wikipedia.org/wiki/Olive",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "sharp", "juicy"],
    tastes: ["savory", "earthy", "salty", "bitter", "sweet", "tangy"],
    growth: OliveGrowth,
    succession: OliveSuccession,
  },
};

export const OliveGreen: Ingredient = {
  id: "olive__green",
  link: "https://en.wikipedia.org/wiki/Olive",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "sharp", "juicy"],
    tastes: ["bitter", "earthy", "salty", "sour", "tangy"],
    growth: OliveGrowth,
    succession: OliveSuccession,
  },
};

export const OliveOil: Ingredient = {
  id: "extra_virgin_olive_oil",
  link: "https://en.wikipedia.org/wiki/Olive_oil",
  type: "fat",
  originIngredients: [OliveGreen.id, OliveBlack.id],
  properties: {
    qualities: ["dense", "smooth", "sharp"],
    tastes: ["earthy", "grassy", "bitter", "fruity"],
  },
  needsAttribution: true,
};

export const KiwiGreen: Ingredient = {
  id: "kiwi__green",
  link: "https://en.wikipedia.org/wiki/Kiwi",
  type: "fruit",
  useSvg: true,
  properties: {
    qualities: ["light", "sharp", "juicy"],
    tastes: ["sour", "sweet", "tangy", "zesty", "citrusy"],
    growth: {
      growthForms: ["climber"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium", "high"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        chillHours: [600, 1000],
        optimalTempRangeC: [10, 25],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Needs a trellis / arbor plan early
      recommendedPlantYearFromStart: [0, 2],

      // Young vines like some protection; later they fruit best with good sun exposure
      establishmentLight: "partial_sun",

      yearsToFirstHarvest: [3, 6],

      productiveLifespanYears: [20, 40],

      managementRotation: "keep",
    },
  },
};

export const LiquoriceRoot: Ingredient = {
  id: "liquorice_root",
  link: "https://en.wikipedia.org/wiki/Liquorice",
  type: "root",

  properties: {
    tastes: ["anise", "sweet", "earthy", "bitter", "woody"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [12, 25],
      },
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",

      // Needs settled soil and space; not a first-wave disturbance crop
      recommendedPlantYearFromStart: [1, 3],

      establishmentLight: "full_sun",

      // Roots typically harvested after several years
      yearsToFirstHarvest: [3, 5],

      productiveLifespanYears: [10, 25],

      managementRotation: "keep",
    },
  },
  extraFacts: [
    {
      id: "liquorice_moisture",
      label: "Moisture Tolerance",
      content:
        "Liquorice prefers steady moisture but grows well in slightly dry conditions once established, as its deep roots mine for water.",
      highlights: [{ text: "steady moisture", theme: "moisture" }],
    },
  ],
  needsAttribution: true,
};

const CilantroGrowth: Growth = {
  growthForms: ["herbaceous"],
  lightPreferences: ["full_sun", "partial_sun"],
  lifeCycles: ["annual"],
  heightClasses: ["low"],
  frostTolerances: ["semi_hardy"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [10, 20],
  },
  airHumidityPreferences: ["moderate_humidity"],
  soilInteraction: {
    root: {
      depthBand: "shallow",
      feederZone: "surface",
      strategy: "diffuse_forager",
    },
    demand: {
      nutrientPull: "low",
      waterPull: "medium",
      oxygenSensitivity: "medium",
    },
    competitionTolerance: "tolerant",
  },
};

const CilantroSuccession: SuccessionProfile = {
  successionalPhase: "pioneer",

  // Very fast cool-season herb
  recommendedPlantYearFromStart: [0, 1],

  establishmentLight: "full_sun",

  // Leaf harvest quickly, seeds later
  yearsToFirstHarvest: [0.15, 0.35],

  productiveLifespanYears: [0.2, 1],

  managementRotation: "short_rotation",
};

export const Cilantro: Ingredient = {
  id: "cilantro__coriander",
  link: "https://en.wikipedia.org/wiki/Cilantro",
  type: "leaf",

  properties: {
    qualities: ["light", "sharp", "delicate"],
    tastes: ["grassy", "zesty", "citrusy", "earthy", "peppery"],
    growth: CilantroGrowth,
    succession: CilantroSuccession,
  },
};

export const CorianderSeed: Ingredient = {
  id: "coriander_seed",
  link: "https://en.wikipedia.org/wiki/Coriander",
  type: "seed",
  sourceType: "leaf",
  originIngredients: [Cilantro.id],
  properties: {
    qualities: ["dense", "crunchy"],
    tastes: ["nutty", "earthy", "sweet", "floral"],
    growth: CilantroGrowth,
    succession: {
      successionalPhase: "pioneer",

      // Fast annual spice crop for open conditions
      recommendedPlantYearFromStart: [0, 1],

      establishmentLight: "full_sun",

      // Seed harvest after flowering in same season
      yearsToFirstHarvest: [0.4, 0.7],

      productiveLifespanYears: [0.2, 1],

      managementRotation: "short_rotation",
    },
  },
  needsAttribution: true,
};

export const CurryLeaf: Ingredient = {
  id: "curry_leaf",
  link: "https://en.wikipedia.org/wiki/Curry",
  type: "leaf",

  properties: {
    qualities: ["light", "sharp"],
    tastes: ["tangy", "zesty", "pungent", "earthy", "savory", "bitter"],
    growth: {
      growthForms: ["bushShrub"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "late",

      // Prefers warmth, shelter, and a bit of system stability
      recommendedPlantYearFromStart: [1, 4],

      // Young plants benefit from protection; mature plants like strong light
      establishmentLight: "partial_sun",

      // Leaves can be harvested relatively early once established
      yearsToFirstHarvest: [1.5, 3],

      productiveLifespanYears: [20, 40],

      managementRotation: "keep",
    },
  },
};

export const GaramMasala: Ingredient = {
  id: "garam_masala",
  link: "https://en.wikipedia.org/wiki/Garam_masala",
  type: "misc",
  originIngredients: [
    FennelSeed.id,
    Clove.id,
    Cinnamon.id,
    Nutmeg.id,
    Cumin.id,
    CorianderSeed.id,
    BayLeaf.id,
  ],
  properties: {
    qualities: ["sharp"],
    tastes: [
      "tangy",
      "zesty",
      "pungent",
      "earthy",
      "savory",
      "bitter",
      "astringent",
      "peppery",
    ],
  },
};

export const Asafoetida: Ingredient = {
  id: "asafoetida",
  link: "https://en.wikipedia.org/wiki/Asafoetida",
  type: "misc",
  originIngredients: ["ferula_asafoetida_plant"],
  properties: {
    qualities: ["sharp"],
    tastes: ["savory", "earthy", "pungent", "bitter", "astringent"],
  },
};

export const MasalaTea: Ingredient = {
  id: "masala_tea__chai",
  link: "https://en.wikipedia.org/wiki/Masala_tea",
  type: "tea",

  properties: {
    qualities: ["sharp", "smooth"],
    tastes: ["zesty", "peppery", "sweet", "bitter", "astringent", "earthy"],
  },
};

export const Taro: Ingredient = {
  id: "taro",
  link: "https://en.wikipedia.org/wiki/Taro",
  type: "root",

  properties: {
    qualities: ["dense"],
    tastes: ["nutty", "earthy", "sweet", "floral"],
    growth: {
      growthForms: ["herbaceous"],
      lightPreferences: ["partial_sun", "filtered_light"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["water_edge", "moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 30],
      },
      airHumidityPreferences: ["moderate_humidity"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "storage_bulker",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Can be planted almost immediately once moisture is established
      recommendedPlantYearFromStart: [0, 1.5],

      // Establishes best with partial sun to filtered light
      establishmentLight: "filtered_light",

      // Harvestable corms usually within 9–18 months
      yearsToFirstHarvest: [0.75, 1.5],

      // Can persist and remain productive for many years if moisture is maintained
      productiveLifespanYears: [5, 12],

      // Usually thinned, divided, or selectively harvested rather than removed
      managementRotation: "medium_rotation",
    },
  },
};

export const Jicama: Ingredient = {
  id: "jicama",
  link: "https://en.wikipedia.org/wiki/Jicama",
  type: "root",

  properties: {
    qualities: ["juicy", "snappy"],
    tastes: ["earthy", "nutty", "sweet", "floral"],
    growth: {
      growthForms: ["climber"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["annual"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["moist_well_drained"],
      climateProfile: {
        optimalTempRangeC: [20, 30],
      },
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",

      // Needs warm soil and some system stability, but still early-phase friendly
      recommendedPlantYearFromStart: [0, 2],

      establishmentLight: "full_sun",

      // Large tuber forms after a long warm season
      yearsToFirstHarvest: [0.75, 1.25],

      // Treated as an annual for harvest, though biologically perennial
      productiveLifespanYears: [0.5, 1.5],

      managementRotation: "short_rotation",
    },
  },
};

const CoconutGrowth: Growth = {
  growthForms: ["canopy"],
  lightPreferences: ["full_sun"],
  lifeCycles: ["perennial"],
  heightClasses: ["high"],
  frostTolerances: ["frost_intolerant"],
  soilPreferences: ["moist_well_drained"],
  climateProfile: {
    optimalTempRangeC: [22, 32],
  },
  airHumidityPreferences: ["humid_air", "saturated_air"],
  soilInteraction: {
    root: {
      depthBand: "deep",
      feederZone: "deep",
      strategy: "woody_structural",
    },
    demand: {
      nutrientPull: "high",
      waterPull: "medium",
      oxygenSensitivity: "low",
    },
    competitionTolerance: "dominant",
  },
};

const CoconutSuccession: SuccessionProfile = {
  successionalPhase: "late",
  // can be planted relatively early but is a long lived canopy
  recommendedPlantYearFromStart: [1, 3],
  establishmentLight: "full_sun",
  yearsToFirstHarvest: [5, 8],
  productiveLifespanYears: [40, 70],
  managementRotation: "keep",
};

export const Coconut: Ingredient = {
  id: "coconut",
  link: "https://en.wikipedia.org/wiki/Coconut",
  type: "fruit",
  properties: {
    qualities: ["dense", "rich"],
    tastes: ["sweet", "milky", "floral", "savory"],
    growth: CoconutGrowth,
    succession: CoconutSuccession,
  },
};

export const CoconutFleshYoung: Ingredient = {
  id: "coconut_flesh__young",
  link: "https://en.wikipedia.org/wiki/Coconut",
  type: "misc",

  properties: {
    qualities: ["dense", "rich", "creamy", "jelly-like"],
    tastes: ["sweet", "milky", "floral", "savory"],
    growth: CoconutGrowth,
    succession: CoconutSuccession,
  },
};

export const CoconutFleshMature: Ingredient = {
  id: "coconut_flesh__mature",
  link: "https://en.wikipedia.org/wiki/Coconut",
  type: "misc",
  useSvg: true,
  properties: {
    qualities: ["dense", "snappy", "fibrous"],
    tastes: ["sweet", "nutty", "floral", "savory"],
    growth: CoconutGrowth,
    succession: CoconutSuccession,
  },
};

export const CoconutMilk: Ingredient = {
  id: "coconut_milk",
  link: "https://www.wikipedia.org/wiki/Coconut_milk",
  type: "misc",
  originIngredients: [CoconutFleshMature.id],
  properties: {
    qualities: ["dense", "creamy", "rich"],
    tastes: ["sweet", "milky", "floral", "nutty", "savory"],
  },
  needsAttribution: true,
};

export const CoconutOil: Ingredient = {
  id: "coconut_oil",
  link: "https://en.wikipedia.org/wiki/Coconut_oil",
  type: "fat",
  originIngredients: [CoconutFleshMature.id],
  properties: {
    qualities: ["dense", "smooth", "rich"],
    tastes: ["sweet", "nutty", "milky"],
  },
  needsAttribution: true,
};

export const CoconutCream: Ingredient = {
  id: "coconut_cream",
  link: "https://www.wikipedia.org/wiki/Coconut_cream",
  type: "fat",
  originIngredients: [CoconutFleshMature.id],
  properties: {
    qualities: ["dense", "creamy", "rich"],
    tastes: ["sweet", "milky", "floral", "nutty", "savory"],
  },
  needsAttribution: true,
};

export const CoconutWater: Ingredient = {
  id: "coconut_water",
  link: "https://www.wikipedia.org/wiki/Coconut_water",
  type: "misc",
  originIngredients: [CoconutFleshYoung.id],
  properties: {
    qualities: ["cool", "light"],
    tastes: ["sweet", "floral", "nutty", "grassy"],
  },
  needsAttribution: true,
};

export const WhiteWineVinegar: Ingredient = {
  id: "white_wine_vinegar",
  link: "https://en.wikipedia.org/wiki/White_wine_vinegar",
  type: "misc",
  originIngredients: [
    GrapeWhite.id,
    AppleRed.id,
    CoconutFleshYoung.id,
    Sugarcane.id,
  ],
  properties: {
    qualities: ["sharp"],
    tastes: ["fruity", "tangy", "floral"],
  },
  needsAttribution: true,
};

export const Acacia: Ingredient = {
  id: "acacia",
  link: "https://en.wikipedia.org/wiki/Acacia",
  type: "process",
  properties: {
    succession: {
      successionalPhase: "pioneer",
      recommendedPlantYearFromStart: [0, 1.5],
      establishmentLight: "full_sun",
      yearsToFirstHarvest: [1, 3], // biomass + fertility, not fruit
      productiveLifespanYears: [8, 25],
      managementRotation: "medium_rotation",
    },
    growth: {
      growthForms: ["midstory", "canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["dry", "moist_well_drained", "deep_groundwater"],
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      climateProfile: {
        optimalTempRangeC: [15, 30],
        sunlightHours: [6, 10],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    ecologicalProcess: {
      functions: [
        "succession_pioneer",
        "succession_scaffold",
        "fertility_nitrogen_fixer",
        "biomass_engine",
        "microclimate_builder",
        "soil_structure_builder",
        "living_trellis",
      ],

      succession: {
        primaryPhase: "pioneer",
        peakPhases: ["pioneer", "early", "mid"],
        isTypicallyTemporary: true,
        typicalServiceYears: {
          min: 8,
          max: 30,
        },
      },

      fertility: {
        nitrogenFixation: "rhizobial_legume",
        nutrientPump: {
          isNutrientPump: true,
          depthClass: "medium",
          notes:
            "Combines nitrogen fixation with mineral cycling via leaf drop and pruning.",
        },
      },

      biomass: {
        throughput: "high",
        coppiceResponse: "excellent",
        chopAndDropSuitability: "high",
        leafDropValue: "high",
      },

      microclimate: {
        shadeBuildRate: "fast",
        humidityLift: "medium",
        windBuffering: "high",
        soilCooling: "medium",
      },

      management: {
        strategies: ["coppice", "pollard", "chop_and_drop", "thin"],
        typicalIntervalMonths: 9,
        removalTrigger: {
          trigger: "shade_threshold",
          value: 65,
          notes:
            "Reduce density as productive canopy species approach dominance.",
        },
        invasivenessRisk: "medium",
        cautions: [
          "Some species can self-seed aggressively",
          "Thorns may affect access and harvest",
          "Species selection matters greatly by climate",
        ],
      },
    },
  },
};

export const Poplar: Ingredient = {
  id: "poplar",
  link: "https://en.wikipedia.org/wiki/Poplar",
  type: "process",
  properties: {
    succession: {
      successionalPhase: "pioneer",
      recommendedPlantYearFromStart: [0, 1],
      establishmentLight: "full_sun",
      yearsToFirstHarvest: [2, 4], // poles, biomass, coppice
      productiveLifespanYears: [10, 30],
      managementRotation: "short_rotation",
    },
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["emergent"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained", "water_edge"],
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      climateProfile: {
        chillHours: [500, 1500],
        optimalTempRangeC: [5, 22],
        sunlightHours: [6, 9],
      },
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    ecologicalProcess: {
      functions: [
        "succession_pioneer",
        "succession_scaffold",
        "biomass_engine",
        "microclimate_builder",
        "soil_structure_builder",
        "hydrology_support",
      ],

      succession: {
        primaryPhase: "pioneer",
        peakPhases: ["pioneer", "early"],
        isTypicallyTemporary: true,
        typicalServiceYears: {
          min: 5,
          max: 25,
        },
      },

      fertility: {
        nitrogenFixation: "none",
        nutrientPump: {
          isNutrientPump: true,
          depthClass: "deep",
          notes:
            "Extensive root system mobilizes water and minerals; fertility comes from biomass cycling rather than fixation.",
        },
      },

      biomass: {
        throughput: "extreme",
        coppiceResponse: "excellent",
        chopAndDropSuitability: "high",
        leafDropValue: "high",
      },

      microclimate: {
        shadeBuildRate: "very_fast",
        humidityLift: "high",
        windBuffering: "high",
        soilCooling: "high",
      },

      management: {
        strategies: ["coppice", "pollard", "thin", "ring_bark_remove"],
        typicalIntervalMonths: 12,
        removalTrigger: {
          trigger: "canopy_closure",
          notes:
            "Phase out aggressively once target canopy or understory species are established.",
        },
        invasivenessRisk: "medium",
        cautions: [
          "Aggressive root spread",
          "High water use near small systems",
          "Must be actively managed to avoid dominance",
        ],
      },
    },
  },
};

export const Willow: Ingredient = {
  id: "willow",
  link: "https://en.wikipedia.org/wiki/Willow",
  type: "process",
  properties: {
    succession: {
      successionalPhase: "pioneer",
      recommendedPlantYearFromStart: [0, 2],
      establishmentLight: "full_sun",
      yearsToFirstHarvest: [2, 5], // basketry, poles, biomass
      productiveLifespanYears: [12, 35],
      managementRotation: "short_rotation",
    },
    growth: {
      growthForms: ["midstory", "canopy"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["hardy"],
      soilPreferences: ["water_edge", "moist_well_drained"],
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      climateProfile: {
        chillHours: [400, 1200],
        optimalTempRangeC: [4, 20],
        sunlightHours: [5, 8],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    ecologicalProcess: {
      functions: [
        "succession_pioneer",
        "succession_scaffold",
        "biomass_engine",
        "microclimate_builder",
        "hydrology_support",
        "soil_structure_builder",
        "living_trellis",
      ],

      succession: {
        primaryPhase: "pioneer",
        peakPhases: ["pioneer", "early", "mid"],
        isTypicallyTemporary: true,
        typicalServiceYears: { min: 8, max: 30 },
      },

      fertility: {
        nitrogenFixation: "none",
        nutrientPump: {
          isNutrientPump: true,
          depthClass: "medium",
          notes:
            "Excellent at water-edge cycling and rapid nutrient turnover through pruning and leaf fall.",
        },
      },

      biomass: {
        throughput: "extreme",
        coppiceResponse: "excellent",
        chopAndDropSuitability: "high",
        leafDropValue: "high",
      },

      microclimate: {
        shadeBuildRate: "very_fast",
        humidityLift: "high",
        windBuffering: "medium",
        soilCooling: "high",
      },

      management: {
        strategies: ["coppice", "pollard", "chop_and_drop", "thin", "contain"],
        typicalIntervalMonths: 9,
        removalTrigger: {
          trigger: "competition",
          notes:
            "Willow will dominate wet zones if left alone. Thin/coppice to preserve light and reduce water competition.",
        },
        invasivenessRisk: "medium",
        cautions: [
          "Aggressive rooting and water competition in small systems",
          "Best kept near water edges or where high moisture is guaranteed",
          "Can spread by cuttings and suckers depending on species",
        ],
      },
    },
  },
};

export const Eucalyptus: Ingredient = {
  id: "eucalyptus",
  link: "https://en.wikipedia.org/wiki/Eucalyptus",
  type: "process",
  properties: {
    succession: {
      successionalPhase: "pioneer",
      recommendedPlantYearFromStart: [0, 1],
      establishmentLight: "full_sun",
      yearsToFirstHarvest: [2, 5], // poles, fuelwood, windbreak function, biomass
      productiveLifespanYears: [8, 25],
      managementRotation: "short_rotation",
    },
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["emergent"],
      frostTolerances: ["frost_sensitive"],
      soilPreferences: ["dry", "moist_well_drained", "deep_groundwater"],
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      climateProfile: {
        optimalTempRangeC: [12, 30],
        sunlightHours: [7, 11],
      },
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    ecologicalProcess: {
      functions: [
        "succession_pioneer",
        "succession_scaffold",
        "biomass_engine",
        "microclimate_builder",
        "soil_structure_builder",
      ],

      succession: {
        primaryPhase: "pioneer",
        peakPhases: ["pioneer", "early"],
        isTypicallyTemporary: true,
        typicalServiceYears: { min: 6, max: 25 },
      },

      fertility: {
        nitrogenFixation: "none",
        nutrientPump: {
          isNutrientPump: true,
          depthClass: "deep",
          notes:
            "Fertility comes from rapid biomass cycling, not nitrogen fixation. Rooting can access deep moisture and nutrients.",
        },
      },

      biomass: {
        throughput: "extreme",
        coppiceResponse: "excellent",
        chopAndDropSuitability: "medium",
        leafDropValue: "high",
      },

      microclimate: {
        shadeBuildRate: "very_fast",
        humidityLift: "low",
        windBuffering: "high",
        soilCooling: "medium",
      },

      management: {
        strategies: ["coppice", "pollard", "thin", "contain"],
        typicalIntervalMonths: 12,
        removalTrigger: {
          trigger: "shade_threshold",
          value: 60,
          notes:
            "Keep density low as food/production trees establish. Use as a managed nurse tree or windbreak, not a permanent dominant canopy.",
        },
        invasivenessRisk: "high",
        cautions: [
          "Species-dependent invasiveness and self-seeding risk",
          "High water demand in many species, can dry sites",
          "Leaf litter and oils can suppress understory in some contexts (allelopathy)",
          "Can create monoculture if unmanaged",
        ],
      },
    },
  },
};

export const PigeonPea: Ingredient = {
  id: "pigeon_pea",
  link: "https://en.wikipedia.org/wiki/Pigeon_pea",
  type: "process",
  properties: {
    qualities: ["dense", "tender"],
    tastes: ["earthy", "nutty", "savory", "sweet"],
    tasteProfile: [
      { id: "earthy", intensity: 3 },
      { id: "nutty", intensity: 3 },
      { id: "savory", intensity: 2 },
      { id: "sweet", intensity: 1 },
    ],
    qualityProfile: [
      { id: "dense", intensity: 3 },
      { id: "tender", intensity: 2 },
    ],
    succession: {
      successionalPhase: "pioneer",
      recommendedPlantYearFromStart: [0, 1],
      establishmentLight: "full_sun",
      yearsToFirstHarvest: [0.5, 1.5], // edible peas + biomass very quickly
      productiveLifespanYears: [1, 4],
      managementRotation: "short_rotation",
    },
    growth: {
      growthForms: ["bushShrub"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["short_lived_perennial", "self_seeding"],
      heightClasses: ["medium"],
      frostTolerances: ["frost_intolerant"],
      soilPreferences: ["dry", "moist_well_drained"],
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      climateProfile: {
        optimalTempRangeC: [18, 32],
        sunlightHours: [7, 11],
      },
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    ecologicalProcess: {
      functions: [
        "succession_pioneer",
        "fertility_nitrogen_fixer",
        "biomass_engine",
        "microclimate_builder",
      ],
      succession: {
        primaryPhase: "pioneer",
        peakPhases: ["pioneer", "early"],
        isTypicallyTemporary: true,
        typicalServiceYears: { min: 1, max: 4 },
      },
      fertility: {
        nitrogenFixation: "rhizobial_legume",
        nutrientPump: { isNutrientPump: false },
      },
      biomass: {
        throughput: "high",
        coppiceResponse: "good",
        chopAndDropSuitability: "high",
        leafDropValue: "medium",
      },
      microclimate: {
        shadeBuildRate: "fast",
        humidityLift: "medium",
        windBuffering: "medium",
        soilCooling: "medium",
      },
      management: {
        strategies: ["chop_and_drop", "thin", "self_seed_control"],
        typicalIntervalMonths: 6,
        removalTrigger: {
          trigger: "canopy_closure",
          notes: "Phase out as desired trees establish.",
        },
        invasivenessRisk: "low",
      },
    },
  },
};

export const Alder: Ingredient = {
  id: "alder",
  link: "https://en.wikipedia.org/wiki/Alder",
  type: "process",
  properties: {
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained", "water_edge"],
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      climateProfile: {
        chillHours: [600, 1600],
        optimalTempRangeC: [4, 20],
        sunlightHours: [5, 8],
      },
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "pioneer",
      recommendedPlantYearFromStart: [0, 2],
      establishmentLight: "full_sun",
      yearsToFirstHarvest: [3, 6], // poles, coppice, soil-building service
      productiveLifespanYears: [10, 30],
      managementRotation: "medium_rotation",
    },
    ecologicalProcess: {
      functions: [
        "succession_pioneer",
        "fertility_nitrogen_fixer",
        "biomass_engine",
        "soil_structure_builder",
      ],
      succession: {
        primaryPhase: "early",
        peakPhases: ["pioneer", "early"],
        isTypicallyTemporary: true,
        typicalServiceYears: { min: 5, max: 20 },
      },
      fertility: {
        nitrogenFixation: "frankia_actinorhizal",
        nutrientPump: { isNutrientPump: false },
      },
      biomass: {
        throughput: "high",
        coppiceResponse: "good",
        chopAndDropSuitability: "medium",
        leafDropValue: "high",
      },
      microclimate: {
        shadeBuildRate: "fast",
        humidityLift: "medium",
        windBuffering: "medium",
        soilCooling: "high",
      },
      management: {
        strategies: ["coppice", "thin"],
        typicalIntervalMonths: 12,
        removalTrigger: {
          trigger: "shade_threshold",
          value: 60,
          notes: "Reduce once understory crops need more light.",
        },
        invasivenessRisk: "low",
      },
    },
  },
};

export const TreeLucerne: Ingredient = {
  id: "tree_lucerne",
  link: "https://en.wikipedia.org/wiki/Tree_lucerne",
  type: "process",
  properties: {
    growth: {
      growthForms: ["midstory", "bushShrub"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high"],
      frostTolerances: ["semi_hardy"],
      soilPreferences: ["dry", "moist_well_drained", "deep_groundwater"],
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      climateProfile: {
        optimalTempRangeC: [10, 26],
        sunlightHours: [6, 10],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "pioneer",
      recommendedPlantYearFromStart: [0, 2],
      establishmentLight: "full_sun",
      yearsToFirstHarvest: [1, 3], // biomass, forage, pruning material
      productiveLifespanYears: [6, 20],
      managementRotation: "short_rotation",
    },
    ecologicalProcess: {
      functions: [
        "succession_pioneer",
        "succession_scaffold",
        "fertility_nitrogen_fixer",
        "biomass_engine",
        "microclimate_builder",
        "soil_structure_builder",
        "living_trellis",
        "pollinator_support",
      ],

      succession: {
        primaryPhase: "pioneer",
        peakPhases: ["pioneer", "early", "mid"],
        isTypicallyTemporary: true,
        typicalServiceYears: { min: 6, max: 20 },
      },

      fertility: {
        nitrogenFixation: "rhizobial_legume",
        nutrientPump: {
          isNutrientPump: true,
          depthClass: "medium",
          notes:
            "Legume shrub-tree used as a nurse plant: fixes nitrogen and cycles nutrients through frequent pruning and leaf drop.",
        },
      },

      biomass: {
        throughput: "high",
        coppiceResponse: "excellent",
        chopAndDropSuitability: "high",
        leafDropValue: "high",
      },

      microclimate: {
        shadeBuildRate: "fast",
        humidityLift: "medium",
        windBuffering: "high",
        soilCooling: "medium",
      },

      management: {
        strategies: [
          "coppice",
          "pollard",
          "chop_and_drop",
          "thin",
          "self_seed_control",
        ],
        typicalIntervalMonths: 6,
        removalTrigger: {
          trigger: "shade_threshold",
          value: 65,
          notes:
            "Reduce density as target canopy/understory species establish; keep as scattered support or edge windbreak.",
        },
        invasivenessRisk: "medium",
        cautions: [
          "Can self-seed heavily in some climates if unmanaged",
          "Fast growth can shade out slower crops if not pruned",
          "Best treated as a managed support cycle, not a permanent dominant",
        ],
      },
    },
  },
};

export const Comfrey: Ingredient = {
  id: "comfrey",
  link: "https://en.wikipedia.org/wiki/Comfrey",
  type: "process",
  properties: {
    growth: {
      growthForms: ["herbaceous", "groundcover"],
      lightPreferences: ["full_sun", "partial_sun", "filtered_light"],
      lifeCycles: ["perennial"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      climateProfile: {
        optimalTempRangeC: [5, 22],
        sunlightHours: [4, 9],
      },
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",
      recommendedPlantYearFromStart: [0, 4],
      establishmentLight: "partial_sun",
      yearsToFirstHarvest: [1, 2], // leaf cutting for mulch
      productiveLifespanYears: [8, 25],
      managementRotation: "keep",
    },
    ecologicalProcess: {
      functions: [
        "fertility_nutrient_pump",
        "biomass_engine",
        "groundcover_armor",
        "microclimate_builder",
        "soil_structure_builder",
        "pollinator_support",
      ],

      succession: {
        primaryPhase: "early",
        peakPhases: ["early", "mid", "late"],
        isTypicallyTemporary: false,
        typicalServiceYears: { min: 5, max: 30 },
      },

      fertility: {
        nitrogenFixation: "none",
        nutrientPump: {
          isNutrientPump: true,
          depthClass: "deep",
          notes:
            "Classic mineral-lifting perennial: deep roots mine nutrients, leaves become high-value mulch when cut.",
        },
      },

      biomass: {
        throughput: "high",
        coppiceResponse: "poor", // not woody coppice; it regrows from crown after cutting
        chopAndDropSuitability: "high",
        leafDropValue: "high",
      },

      microclimate: {
        shadeBuildRate: "medium",
        humidityLift: "medium",
        windBuffering: "low",
        soilCooling: "medium",
      },

      management: {
        strategies: ["chop_and_drop", "contain", "leave"],
        typicalIntervalMonths: 8,
        removalTrigger: {
          trigger: "competition",
          notes:
            "Keep away from small seedlings and tight beds; cut repeatedly to prevent smothering and to harvest mulch.",
        },
        invasivenessRisk: "medium",
        cautions: [
          "Hard to remove once established (root fragments regrow)",
          "Can outcompete small plants if planted too close",
          "Best as a mulch plant around mature trees, edges, or dedicated biomass patches",
        ],
      },
    },
  },
};

export const HoneyLocust: Ingredient = {
  id: "honey_locust",
  link: "https://en.wikipedia.org/wiki/Honey_locust",
  type: "process",
  properties: {
    growth: {
      growthForms: ["midstory", "canopy"],
      lightPreferences: ["full_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high", "emergent"],
      frostTolerances: ["hardy"],
      soilPreferences: ["dry", "moist_well_drained", "deep_groundwater"],
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      climateProfile: {
        chillHours: [200, 1000],
        optimalTempRangeC: [7, 28],
        sunlightHours: [6, 10],
      },
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "low",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "pioneer",
      recommendedPlantYearFromStart: [0, 2],
      establishmentLight: "full_sun",
      yearsToFirstHarvest: [3, 6], // canopy service, mulch, and pod yield
      productiveLifespanYears: [30, 90],
      managementRotation: "medium_rotation",
    },
    ecologicalProcess: {
      functions: [
        "succession_pioneer",
        "succession_scaffold",
        "fertility_nitrogen_fixer",
        "biomass_engine",
        "microclimate_builder",
        "soil_structure_builder",
        "living_trellis",
        "pollinator_support",
      ],
      succession: {
        primaryPhase: "pioneer",
        peakPhases: ["pioneer", "early", "mid"],
        isTypicallyTemporary: true,
        typicalServiceYears: { min: 8, max: 40 },
      },
      fertility: {
        nitrogenFixation: "rhizobial_legume",
        nutrientPump: {
          isNutrientPump: true,
          depthClass: "deep",
          notes:
            "Deep-rooted legume tree that contributes nitrogen and heavy litter return when managed with periodic pruning.",
        },
      },
      biomass: {
        throughput: "high",
        coppiceResponse: "good",
        chopAndDropSuitability: "high",
        leafDropValue: "high",
      },
      microclimate: {
        shadeBuildRate: "fast",
        humidityLift: "medium",
        windBuffering: "high",
        soilCooling: "medium",
      },
      management: {
        strategies: ["coppice", "pollard", "thin", "self_seed_control"],
        typicalIntervalMonths: 12,
        removalTrigger: {
          trigger: "shade_threshold",
          value: 60,
          notes:
            "Keep as a managed nurse or windbreak tree while productive canopy species establish.",
        },
        invasivenessRisk: "medium",
        cautions: [
          "Wild-type trees may have large thorns that reduce access",
          "Self-seeding can be vigorous in open, disturbed sites",
          "Deep roots and canopy spread can dominate small systems if unmanaged",
        ],
      },
    },
  },
};

export const Pine: Ingredient = {
  id: "pine",
  link: "https://en.wikipedia.org/wiki/Pine",
  type: "process",
  properties: {
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["high", "emergent"],
      frostTolerances: ["hardy"],
      soilPreferences: ["dry", "moist_well_drained", "deep_groundwater"],
      airHumidityPreferences: ["semi_arid_air", "moderate_humidity"],
      climateProfile: {
        chillHours: [500, 1800],
        optimalTempRangeC: [2, 20],
        sunlightHours: [5, 9],
      },
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "low",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "early",
      recommendedPlantYearFromStart: [0, 2],
      establishmentLight: "full_sun",
      yearsToFirstHarvest: [6, 12], // poles, resin, and shelter function
      productiveLifespanYears: [40, 150],
      managementRotation: "keep",
    },
    ecologicalProcess: {
      functions: [
        "succession_scaffold",
        "biomass_engine",
        "microclimate_builder",
        "soil_structure_builder",
        "hydrology_support",
      ],
      succession: {
        primaryPhase: "early",
        peakPhases: ["early", "mid", "late"],
        isTypicallyTemporary: false,
        typicalServiceYears: { min: 15, max: 80 },
      },
      fertility: {
        nitrogenFixation: "none",
        nutrientPump: {
          isNutrientPump: true,
          depthClass: "deep",
          notes:
            "Deep-rooted conifer that stabilizes soil and recycles minerals through needle litter over long timelines.",
        },
      },
      biomass: {
        throughput: "medium",
        coppiceResponse: "poor",
        chopAndDropSuitability: "low",
        leafDropValue: "medium",
      },
      microclimate: {
        shadeBuildRate: "fast",
        humidityLift: "medium",
        windBuffering: "high",
        soilCooling: "high",
      },
      management: {
        strategies: ["thin", "leave", "contain"],
        typicalIntervalMonths: 24,
        removalTrigger: {
          trigger: "competition",
          notes:
            "Thin dense stands to preserve light for productive midstory and understory species.",
        },
        invasivenessRisk: "low",
        cautions: [
          "Needle mulch can acidify surface soil in unmanaged dense stands",
          "Dense evergreen crowns can suppress sun-demanding crops",
          "High shade and low airflow increase fungal pressure if overcrowded",
        ],
      },
    },
  },
};

export const Hemlock: Ingredient = {
  id: "hemlock",
  link: "https://en.wikipedia.org/wiki/Hemlock",
  type: "process",
  properties: {
    growth: {
      growthForms: ["canopy"],
      lightPreferences: ["partial_sun", "filtered_light", "shade_tolerant"],
      lifeCycles: ["perennial"],
      heightClasses: ["high", "emergent"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained", "water_edge"],
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      climateProfile: {
        chillHours: [700, 2000],
        optimalTempRangeC: [1, 18],
        sunlightHours: [3, 7],
      },
      soilInteraction: {
        root: {
          depthBand: "deep",
          feederZone: "deep",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "late",
      recommendedPlantYearFromStart: [1, 4],
      establishmentLight: "filtered_light",
      yearsToFirstHarvest: [8, 15], // canopy service and long-term shelter function
      productiveLifespanYears: [80, 220],
      managementRotation: "keep",
    },
    ecologicalProcess: {
      functions: [
        "succession_scaffold",
        "microclimate_builder",
        "soil_structure_builder",
        "hydrology_support",
      ],
      succession: {
        primaryPhase: "late",
        peakPhases: ["mid", "late", "legacy"],
        isTypicallyTemporary: false,
        typicalServiceYears: { min: 20, max: 120 },
      },
      fertility: {
        nitrogenFixation: "none",
        nutrientPump: {
          isNutrientPump: true,
          depthClass: "deep",
          notes:
            "Cool-climate conifer that moderates moisture and returns steady organic matter through litter.",
        },
      },
      biomass: {
        throughput: "medium",
        coppiceResponse: "poor",
        chopAndDropSuitability: "low",
        leafDropValue: "medium",
      },
      microclimate: {
        shadeBuildRate: "fast",
        humidityLift: "high",
        windBuffering: "high",
        soilCooling: "high",
      },
      management: {
        strategies: ["leave", "thin", "contain"],
        typicalIntervalMonths: 36,
        removalTrigger: {
          trigger: "competition",
          notes:
            "Maintain spacing to protect light access and airflow around fruiting layers.",
        },
        invasivenessRisk: "low",
        cautions: [
          "Heat and drought stress can cause decline in warmer sites",
          "Dense evergreen shade can suppress sun-loving crops",
          "Humid, crowded plantings can increase fungal disease pressure",
        ],
      },
    },
  },
};

export const Beech: Ingredient = {
  id: "beech",
  link: "https://en.wikipedia.org/wiki/Beech",
  type: "process",
  properties: {
    growth: {
      growthForms: ["canopy"],
      lightPreferences: [
        "full_sun",
        "partial_sun",
        "filtered_light",
        "shade_tolerant",
      ],
      lifeCycles: ["perennial"],
      heightClasses: ["high", "emergent"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      climateProfile: {
        chillHours: [600, 1600],
        optimalTempRangeC: [4, 20],
        sunlightHours: [4, 8],
      },
      soilInteraction: {
        root: {
          depthBand: "medium",
          feederZone: "mid",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "high",
          waterPull: "medium",
          oxygenSensitivity: "low",
        },
        competitionTolerance: "dominant",
      },
    },
    succession: {
      successionalPhase: "late",
      recommendedPlantYearFromStart: [1, 4],
      establishmentLight: "filtered_light",
      yearsToFirstHarvest: [15, 30], // mast, timber, and mature canopy function
      productiveLifespanYears: [100, 250],
      managementRotation: "keep",
    },
    ecologicalProcess: {
      functions: [
        "succession_scaffold",
        "biomass_engine",
        "microclimate_builder",
        "soil_structure_builder",
      ],
      succession: {
        primaryPhase: "late",
        peakPhases: ["late", "legacy"],
        isTypicallyTemporary: false,
        typicalServiceYears: { min: 30, max: 180 },
      },
      fertility: {
        nitrogenFixation: "none",
        nutrientPump: {
          isNutrientPump: true,
          depthClass: "medium",
          notes:
            "Heavy seasonal leaf fall feeds fungal-rich temperate soils and supports long-term aggregation.",
        },
      },
      biomass: {
        throughput: "high",
        coppiceResponse: "ok",
        chopAndDropSuitability: "medium",
        leafDropValue: "high",
      },
      microclimate: {
        shadeBuildRate: "fast",
        humidityLift: "medium",
        windBuffering: "medium",
        soilCooling: "high",
      },
      management: {
        strategies: ["leave", "thin"],
        typicalIntervalMonths: 36,
        removalTrigger: {
          trigger: "competition",
          notes:
            "Use selective thinning where beech shade and roots crowd orchard or understory production zones.",
        },
        invasivenessRisk: "low",
        cautions: [
          "Dense summer shade can halt fruiting in lower layers",
          "Mature stands develop strong root competition near the soil surface",
          "Slow juvenile growth requires long planning horizons",
        ],
      },
    },
  },
};

export const Elderberry: Ingredient = {
  id: "elderberry",
  link: "https://en.wikipedia.org/wiki/Sambucus",
  type: "fruit",
  properties: {
    qualities: ["juicy", "light"],
    tastes: ["sweet", "tangy", "floral"],
    growth: {
      growthForms: ["bushShrub"],
      lightPreferences: ["full_sun", "partial_sun"],
      lifeCycles: ["perennial"],
      heightClasses: ["medium"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained", "water_edge"],
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      climateProfile: {
        chillHours: [400, 1200],
        optimalTempRangeC: [8, 22],
      },
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "woody_structural",
        },
        demand: {
          nutrientPull: "medium",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "early",
      recommendedPlantYearFromStart: [0, 2],
      establishmentLight: "partial_sun",
      yearsToFirstHarvest: [2, 4],
      productiveLifespanYears: [12, 30],
      managementRotation: "keep",
    },
  },
};

export const Hosta: Ingredient = {
  id: "hosta",
  link: "https://en.wikipedia.org/wiki/Hosta",
  type: "leaf",
  properties: {
    qualities: ["light", "tender"],
    tastes: ["grassy", "earthy", "sweet"],
    growth: {
      growthForms: ["herbaceous", "groundcover"],
      lightPreferences: ["partial_sun", "filtered_light", "shade_tolerant"],
      lifeCycles: ["perennial"],
      heightClasses: ["low"],
      frostTolerances: ["hardy"],
      soilPreferences: ["moist_well_drained"],
      airHumidityPreferences: ["moderate_humidity", "humid_air"],
      climateProfile: {
        chillHours: [500, 1500],
        optimalTempRangeC: [5, 22],
        sunlightHours: [2, 6],
      },
      soilInteraction: {
        root: {
          depthBand: "shallow",
          feederZone: "surface",
          strategy: "diffuse_forager",
        },
        demand: {
          nutrientPull: "low",
          waterPull: "medium",
          oxygenSensitivity: "medium",
        },
        competitionTolerance: "tolerant",
      },
    },
    succession: {
      successionalPhase: "mid",
      recommendedPlantYearFromStart: [1, 4],
      establishmentLight: "filtered_light",
      yearsToFirstHarvest: [1, 2], // spring shoots and young leaves
      productiveLifespanYears: [10, 30],
      managementRotation: "keep",
    },
    ecologicalProcess: {
      functions: [
        "groundcover_armor",
        "microclimate_builder",
        "soil_structure_builder",
        "pollinator_support",
      ],
      succession: {
        primaryPhase: "mid",
        peakPhases: ["mid", "late"],
        isTypicallyTemporary: false,
        typicalServiceYears: { min: 5, max: 25 },
      },
      fertility: {
        nitrogenFixation: "none",
        nutrientPump: { isNutrientPump: false },
      },
      biomass: {
        throughput: "medium",
        coppiceResponse: "poor",
        chopAndDropSuitability: "medium",
        leafDropValue: "medium",
      },
      microclimate: {
        shadeBuildRate: "slow",
        humidityLift: "low",
        windBuffering: "low",
        soilCooling: "medium",
      },
      management: {
        strategies: ["leave", "contain", "chop_and_drop"],
        typicalIntervalMonths: 12,
        removalTrigger: {
          trigger: "competition",
          notes:
            "Divide mature clumps when crowns begin to crowd neighboring seedlings.",
        },
        invasivenessRisk: "low",
        cautions: [
          "Young shoots are best harvested early before leaves toughen",
          "Dense foliage can shelter slugs and snails in humid sites",
          "Large clumps may crowd small herbs if not periodically divided",
        ],
      },
    },
  },
};

export const Ingredients: Ingredient[] = [
  Taro,
  Jicama,
  MasalaTea,
  TreeLucerne,
  HoneyLocust,
  Pine,
  Hemlock,
  Beech,
  Acacia,
  Comfrey,
  Hosta,
  Willow,
  PigeonPea,
  Eucalyptus,
  Poplar,
  Alder,
  Asafoetida,
  // GaramMasala,
  CurryLeaf,
  Cilantro,
  Sugar,
  ChiaSeed,
  FlaxSeed,
  PoppySeed,
  PumpkinSeed,
  VanillaBean,
  VanillaEssence,
  HempSeed,
  OliveOil,
  MapleSyrup,
  Nutmeg,
  Saffron,
  BellPepperYellow,
  BellPepperGreen,
  Endive,
  Kohlrabi,
  Leek,
  Quinoa,
  Sage,
  Parsley,
  Rosemary,
  Zucchini,
  Fennel,
  SunflowerSeed,
  Cardamom,
  Clove,
  Scallop,
  CoconutFleshYoung,
  CoconutOil,
  Artichoke,
  TomatoRed,
  Mango,
  Cacao,
  Turmeric,
  AppleRed,
  Perilla,
  Burrata,
  OliveBlack,
  Durian,
  Orange,
  Barley,
  BalloonFlowerRoot,
  PorkBelly,
  Pistachio,
  PersimmonAsian,
  Banana,
  Blackberry,
  CherrySweet,
  GrapePurple,
  SweetPotatoPurple,
  Carambola,
  Raspberry,
  Blueberry,
  Elderberry,
  PassionFruit,
  Caramel,
  Oat,
  Chives,
  Cow,
  CowMilk,
  Chestnut,
  Jackfruit,
  Thyme,
  Cabbage,
  Lemon,
  Spinach,
  KiwiGreen,
  DateDried,
  Pumpkin,
  Oyster,
  Avocado,
  Lettuce,
  Tamarind,
  Ghee,
  FigFresh,
  OliveGreen,
  Lavender,
  MushroomPorcini,
  LotusRoot,
  MushroomTruffle,
  // RiceWhiteJaponicaCooked,
  Salmon,
  Hazelnut,
  Walnut,
  AgaveSyrup,
  KaffirLime,
  KaffirLimeLeaf,
  CheeseBlue,
  Teff,
  Cauliflower,
  Wheat,
  Buckwheat,
  BeanBlack,
  Mackarel,
  Wasabi,
  Lentil,
  Chickpea,
  YogurtGreekCow,
  CoconutWater,
  CoconutCream,
  Peanut,
  SquashKabocha,
  Macadamia,
  Squid,
  Clam,
  Mussel,
  Acorn,
  BrazilNut,
  Pecan,
  // Espresso,
  PineNut,
  BrownSugar,
  Cashew,
  Wakame,
  Carrot,
  MapleSugar,
  // MapleWood,
  Peach,
  CheeseFeta,
  BrieCheese,
  MozzarellaCheese,
  // Tahini,
  GranaPadano,
  PecorinoRomano,
  Parmesan,
  SquashButternut,
  Honey,
  PeasGreen,
  MuttonGoat,
  Eggplant,
  Loach,
  Cucumber,
  OnionWhite,
  OnionSpanish,
  Garlic,
  Cumin,
  // ChocolateMilk,
  ChocolateDark,
  ChocolateWhite,
  CayennePepper,
  Ginger,
  Shrimp,
  BeanSoy,
  Tofu,
  // Tempeh,
  SugarMapleTree,
  CheeseSwiss,
  Almond,
  BeanSproutsSoy,
  Potato,
  Chicken,
  Cinnamon,
  // BlackGarlic,
  Kale,
  BeefTBone,
  Radish,
  BeanAdzuki,
  SesameSeed,
  Kelp,
  Pomegranate,
  Papaya,
  PearGreen,
  Strawberry,
  BalsamicVinegar,
  Grapefruit,
  MelonCanary,
  Pineapple,
  GreenChilliPepper,
  Pitaya,
  BlackCurrant,
  Watermelon,
  Plum,
  SweetPotatoOrange,
  Lime,
  RoseApple,
  Marjoram,
  AppleGreen,
  AppleGold,
  PearYellow,
  MandarinClementine,
  Tomatillo,
  Longan,
  // GrahamCracker,
  Molasses,
  Jabuticaba,
  Cherimoya,
  Apricot,
  Kumquat,
  CreamCheese,
  Lychee,
  Mangosteen,
  AhiTuna,
  SkipjackTuna,
  Pollock,
  // UdonNoodles,
  Marula,
  // Raisin,
  Sweetie,
  Cantaloupe,
  GrapeKishmish,
  PomeloPink,
  PomeloRed,
  Honeycomb,
  Butter,
  Yuzu,
  PomeloOrange,
  Rambutan,
  // BreadPlain,
  CoconutFleshMature,
  // Sourdough,
  // Bagel,
  // Croissant,
  // Baguette,
  UgliFruit,
  Dewberry,
  Quince,
  Asparagus,
  Beetroot,
  Broccoli,
  // BakingSoda,
  // BakingPowder,
  CornYellow,
  BurdockRoot,
  Hop,
  Marrow,
  OnionRed,
  BellPepperRed,
  Turnip,
  PerillaOil,
  // MushroomAmanita,
  MushroomShittake,
  MushroomChanterelle,
  MushroomChampignon,
  MushroomRussula,
  MushroomSuillus,
  MushroomWoodBlewit,
  SugarcaneJuice,
  MushroomSaffronMilkcap,
  GrapeTrebbiano,
  MushroomMorel,
  LiquoriceRoot,
  ThaiBasil,
  StarAnise,
  // Applesauce,
  FennelSeed,
  BokChoy,
  Guava,
  GoatCheese,
  MungBean,
  FenugreekLeaf,
  Lemongrass,
  Oregano,
  FenugreekSeed,
  MustardSeed,
  MandarinTangerine,
  MustardLeaf,
  Arugula,
  Basil,
  Dill,
  BayLeaf,
  BlackPepper,
  PerillaSeed,
  SeaSalt,
  PinkSalt,
  LavaSalt,
  MatsutakeMushroom,
  VenisonDeer,
  QuailEgg,
  EggYolkChicken,
  ChickenEgg,
  SesameSeedBlack,
  Quail,
  Bacon,
  Duck,
  Turkey,
  MarianPlum,
  Salak,
  ChickenBreast,
  WhiteWineVinegar,
  Edamame,
  ChickenDrumstick,
  ChickenLiver,
  FoieGras,
  AmericanPawpaw,
  // Coffee,
  CoffeeBean,
  GreenBean,
  CoconutMilk,
  LambChop,
  RibeyeSteak,
  BeefRibs,
  PorkRibs,
  PorkChop,
  RooibosTea,
  ChamomileTea,
  HibiscusTea,
  PeppermintTea,
  LavenderTea,
  SpearmintTea,
  RoseTea,
  // BreadMilk,
  BarleyTea,
  GingerTea,
  OolongTea,
  Rice,
  TurkishTea,
  Paprika,
  Habanero,
  Jalapeno,
  JalapenoBlackMagic,
  // RedChilliFlakesCayenne,
  GreenTea,
  CorianderSeed,
  Spearmint,
  Peppermint,
  // RiceWhiteBasmatiCooked,
  GreenTeaLeaf,
  GinsengRoot,
  Chamomile,
  Hibiscus,
  YogurtPlainCow,
  Rooibos,
  Matcha,
  Spirulina,
  SorrelLeaf,
  MoringaLeaf,
  MoringaPowder,
  Millet,
  SalmonRoe,
  Tallow,
  Celery,
  // CacaoNibs,
  // Mayonaisse,
  // Ketchup,
  // SquidInk,
  // VanillaIceCream,
  // Kimchi,
  BeefBoneBroth,
  ChickenBoneBroth,
  Enoki,
  BoneMarrow,
  SesameOil,
  SoySauce,
  Miso,
  Mascarpone,
  Galangal,
  AppleCiderVinegar,
  Mugwort,
  // RyeBread,
  Injera,
  PalmSugar,
  GrapeWhite,
  Jaggery,
  Sugarcane,
  CaneSugar,
  Plantain,
  Coconut,
  // WheatFlour,
  HeavyCream,
  Rye,
  Scallion,
  CondensedMilk,
  // AlmondFlour,
]
  .map((a) => {
    return {
      ...a,
      imgPath:
        a.imgPath ??
        `https://static.perillacove.com/${a.type}/${a.id}.${a.useSvg ? "svg" : "webp"}`,
    };
  })
  .sort((a, b) => a.id.localeCompare(b.id));

export const IngredientMap = Ingredients.reduce(
  (acc, ingredient) => {
    acc[ingredient.id] = ingredient;
    return acc;
  },
  {} as Record<string, Ingredient>,
);

export const VisibleIngredients = Ingredients.slice(0, 12);

export const GrowableIngredients = Ingredients.filter(
  (a) =>
    ![
      "meat",
      "seafood",
      "misc",
      "fungi",
      "sugar",
      "salt",
      "tea",
      "algae",
      "dairy",
      "fat",
    ].includes(a.type),
).filter((a) => a.id !== Edamame.id);
