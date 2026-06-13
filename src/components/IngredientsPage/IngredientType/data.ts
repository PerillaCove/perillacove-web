import { Ingredients } from "../data/species";
import { IngredientType } from "../types";

export interface IngredientTypeProfile {
  id: IngredientType;
  name: string;
  description: string;
  examples: string[];
  bgThemeClasses: string;
}

const defaultBgThemeClasses =
  "bg-gradient-to-r from-neutral-100 to-neutral-200 dark:from-neutral-600 dark:to-neutral-700 text-black dark:text-white";

export const fruitType: IngredientTypeProfile = {
  id: "fruit",
  name: "fruit",
  description: `A reproductive structure formed from the flower's ovary that encloses one or many seeds. Often fleshy, sometimes dry, always a product of flowering plant reproduction.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const rootType: IngredientTypeProfile = {
  id: "root",
  name: "root",
  description: `The underground organ that anchors the plant and absorbs water and minerals. Edible roots store energy or nutrients in swollen tissues.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const leafType: IngredientTypeProfile = {
  id: "leaf",
  name: "leaf",
  description: `The plant's primary photosynthetic organ, built as a thin blade that captures light. Edible leaves range from tender herbs to dense leafy heads.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const flowerType: IngredientTypeProfile = {
  id: "flower",
  name: "flower",
  description: `The reproductive structure of a plant that produces pollen, ovules, and eventually fruits and seeds. Edible flowers include whole buds or specific floral parts.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const stemType: IngredientTypeProfile = {
  id: "stem",
  name: "stem",
  description: `The plant's supporting axis that holds leaves and transports water and sugars. Edible stems may be tender shoots, stalks, or swollen structural bases.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const bulbType: IngredientTypeProfile = {
  id: "bulb",
  name: "bulb",
  description: `A compact underground storage organ made of thickened leaves wrapped around a short stem. Onions and garlic are classic examples.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const grainType: IngredientTypeProfile = {
  id: "grain",
  name: "grain",
  description: `The dry one-seeded fruit of grasses such as wheat, rice, and barley. It contains a seed enclosed by a fused fruit wall.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const legumeType: IngredientTypeProfile = {
  id: "legume",
  name: "legume",
  description: `A plant that produces its seeds inside a pod formed from a single flower, where the pod typically splits open at maturity. When eaten, we usually consume the seeds inside the pod.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const rhizomeType: IngredientTypeProfile = {
  id: "rhizome",
  name: "rhizome",
  description: `A horizontal underground stem that grows and spreads below the soil surface. Rhizomes store energy and generate new shoots.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const nutType: IngredientTypeProfile = {
  id: "nut",
  name: "nut",
  description: `A hard-shelled, single-seeded dry fruit that does not split open at maturity. The edible part is the seed inside the woody shell.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const seedType: IngredientTypeProfile = {
  id: "seed",
  name: "seed",
  description: `The fertilized plant embryo packaged with stored nutrients and a protective coat. Seeds can be soft, oily, starchy, or aromatic.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const fungiType: IngredientTypeProfile = {
  id: "fungi",
  name: "fungi",
  description: `Organisms that are not plants, producing fruiting bodies such as mushrooms. They feed by breaking down organic matter or partnering with roots.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const dairyType: IngredientTypeProfile = {
  id: "dairy",
  name: "dairy",
  description: `Milk and products made from milk such as cheese, butter, and yogurt. These come from mammals, not plants.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const meatType: IngredientTypeProfile = {
  id: "meat",
  name: "meat",
  description: `Animal flesh used as food, including muscle tissue, organs, and processed cuts. A primary source of protein in many cuisines.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const seafoodType: IngredientTypeProfile = {
  id: "seafood",
  name: "seafood",
  description: `Edible aquatic animals including fish, shellfish, crustaceans, and other marine creatures. A diverse category spanning freshwater and saltwater species.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const animalType: IngredientTypeProfile = {
  id: "animal",
  name: "animal",
  description: `Living animal species that participate in a system through movement, consumption, fertility return, and yielded foods.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const sugarType: IngredientTypeProfile = {
  id: "sugar",
  name: "sugar",
  description: `Sweet crystalline or liquid carbohydrates extracted from plants like cane, beet, or maple. Provides concentrated energy and sweetness.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const fatType: IngredientTypeProfile = {
  id: "fat",
  name: "fat",
  description: `Lipid-rich substances from plants or animals used for cooking or flavor. Includes oils, butter, lard, and rendered fats.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const saltType: IngredientTypeProfile = {
  id: "salt",
  name: "salt",
  description: `Mineral crystals primarily composed of sodium chloride. Enhances flavor and preserves food.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const teaType: IngredientTypeProfile = {
  id: "tea",
  name: "tea",
  description: `Dried plant material steeped in hot water for aroma and flavor. Most commonly refers to leaves of Camellia sinensis but can include herbal infusions.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const algaeType: IngredientTypeProfile = {
  id: "algae",
  name: "algae",
  description: `Aquatic photosynthetic organisms that are not plants, such as seaweed or spirulina. They range from microscopic forms to large sea vegetables.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const miscType: IngredientTypeProfile = {
  id: "misc",
  name: "misc",
  description: `Ingredients that do not fit into a clean biological or culinary category. Used as a flexible bucket for processed items, extracts, or complex blends.`,
  examples: [],
  bgThemeClasses: defaultBgThemeClasses,
};

export const IngredientTypeProfiles: IngredientTypeProfile[] = [
  fruitType,
  rootType,
  leafType,
  flowerType,
  stemType,
  bulbType,
  grainType,
  legumeType,
  rhizomeType,
  nutType,
  seedType,
  fungiType,
  dairyType,
  meatType,
  seafoodType,
  animalType,
  sugarType,
  fatType,
  saltType,
  teaType,
  algaeType,
  miscType,
];

export const IngredientTypeProfileMap = IngredientTypeProfiles.reduce(
  (acc, curr) => ({ ...acc, [curr.id]: curr }),
  {} as Record<IngredientType, IngredientTypeProfile>,
);

// Compute dynamic examples from actual ingredient data
const MAX_INGREDIENT_TYPE_EXAMPLES = 1000;

export const IngredientTypeToExamples: Record<IngredientType, string[]> =
  (() => {
    const bucketMap: Record<string, string[]> = {};

    // Initialize buckets for all ingredient types
    IngredientTypeProfiles.forEach((profile) => {
      bucketMap[profile.id] = [];
    });

    // Collect examples from ingredients
    Ingredients.forEach((ingredient) => {
      if (
        bucketMap[ingredient.type] &&
        bucketMap[ingredient.type].length < MAX_INGREDIENT_TYPE_EXAMPLES
      ) {
        bucketMap[ingredient.type].push(ingredient.id);
      }
    });

    return bucketMap as Record<IngredientType, string[]>;
  })();

// Update each ingredient type profile with dynamic examples
IngredientTypeProfiles.forEach((profile) => {
  profile.examples = IngredientTypeToExamples[profile.id] || [];
});
