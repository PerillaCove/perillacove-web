import { Ingredients } from "../../data/species";
import { Quality, QualityType } from "./types";

const defaultBgThemeClasses =
  "bg-gradient-to-r from-slate-50 to-slate-100 dark:from-neutral-700 dark:to-neutral-700 text-black dark:text-white";

// Dynamic example collection - computes examples from actual ingredient data
const MAX_QUALITY_EXAMPLES = 1000;

export const snappyQuality: Quality = {
  id: "snappy",
  name: "snappy",
  description: `A distinct, clean snap or crack. There's a precise moment when the texture gives way.`,
  examples: ["cucumber", "carrot", "taro"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const lightQuality: Quality = {
  id: "light",
  name: "light",
  description: `An almost ethereal texture and feel that glides effortlessly, leaving a refreshing and buoyant finish.`,
  examples: ["mint__spearmint", "strawberry", "lavender"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const sharpQuality: Quality = {
  id: "sharp",
  name: "sharp",
  description: `A pointed sensation that vibrantly cuts through your palate with a quick, incisive burst.`,
  examples: ["nutmeg", "thai_basil", "turmeric"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const coolQuality: Quality = {
  id: "cool",
  name: "cool",
  description: `A brisk, refreshing chill that awakens your senses with a subtle, crisp demeanor.`,
  examples: ["cucumber", "guava", "lemon"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const smoothQuality: Quality = {
  id: "smooth",
  name: "smooth",
  description: `An elegant, velvety texture that glides effortlessly across your palate, inviting calm indulgence.`,
  examples: ["butter", "goat_cheese", "white_chocolate"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const roughQuality: Quality = {
  id: "rough",
  name: "rough",
  description: `A coarse, irregular texture that punctuates each bite with a raw and unrefined sensory experience.`,
  examples: ["walnut", "asparagus", "lotus_root"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const denseQuality: Quality = {
  id: "dense",
  name: "dense",
  description: `A compact and hearty texture that delivers a satiating mouthfeel, marking each bite with concentrated depth.`,
  examples: ["chestnut", "lamb_chop", "bagel"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const stickyQuality: Quality = {
  id: "sticky",
  name: "sticky",
  description: `A tacky consistency that clings to the fingertips and palate, prolonging its flavorful presence.`,
  examples: ["maple_syrup", "honey", "molasses"],
  bgThemeClasses: defaultBgThemeClasses,
};

// export const oilyQuality: Quality = {
//   id: "oily",
//   name: "oily",
//   description: `A slick, glossy texture that smoothly coats the palate, imparting a subtle but rich mouthfeel.`,
//   examples: ["hemp_seed", "bacon", "saffron_milkcap"],
//   bgThemeClasses: defaultBgThemeClasses,
// };

export const creamyQuality: Quality = {
  id: "creamy",
  name: "creamy",
  description: `A luscious, velvety texture that envelops the palate in an indulgent embrace of smooth richness.`,
  examples: ["egg_yolk__chicken", "durian", "coconut_cream"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const crunchyQuality: Quality = {
  id: "crunchy",
  name: "crunchy",
  description: `A crisp and resonant texture that shatters under pressure, unveiling a burst of invigorating flavor.`,
  examples: ["almond", "pine_nut", "peanut"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const chewyQuality: Quality = {
  id: "chewy",
  name: "chewy",
  description: `A resilient texture that demands a gradual, steady effort, rewarding you with an evolving taste experience.`,
  examples: ["croissant", "date__dried", "scallop"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const juicyQuality: Quality = {
  id: "juicy",
  name: "juicy",
  description: `An immediate burst of moisture and concentrated flavor that enlivens every morsel with natural zest.`,
  examples: ["mango", "lychee", "tomato__red"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const jellyLikeQuality: Quality = {
  id: "jelly-like",
  name: "jelly-like",
  description: `A playful, wobbly texture that undulates softly, enclosing its flavors in a gentle, buoyant embrace.`,
  examples: ["salmon", "tofu", "coconut_flesh__young"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const spongyQuality: Quality = {
  id: "spongy",
  name: "spongy",
  description: `A porous, cushion-like texture that compresses tenderly before rebounding, effectively absorbing its lively flavors.`,
  examples: ["morel", "bread__plain", "suillus"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const delicateQuality: Quality = {
  id: "delicate",
  name: "delicate",
  description: `A finely nuanced texture that barely registers on the palate, allowing subtle flavors to elegantly emerge.`,
  examples: ["saffron", "vanilla_bean", "chamomile"],
  bgThemeClasses: defaultBgThemeClasses,
};

// export const viscousQuality: Quality = {
//   id: "viscous",
//   name: "viscous",
//   description: `A thick, slow-moving texture that clings to your palate, extending each moment of flavor exposure deliberately.`,
//   examples: ["peanut_butter", "caramel", "greek_yogurt__cow"],
//   bgThemeClasses: defaultBgThemeClasses,
// };

export const tenderQuality: Quality = {
  id: "tender",
  name: "tender",
  description: `A gently yielding texture that melts softly with every bite, leaving behind a harmonious aftertaste.`,
  examples: ["salmon", "pork_belly", "chicken_drumstick"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const fibrousQuality: Quality = {
  id: "fibrous",
  name: "fibrous",
  description: `A stringy, layered texture that interweaves with every chew, offering a naturally complex mouthfeel.`,
  examples: ["kale", "taro", "broccoli"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const plumpQuality: Quality = {
  id: "plump",
  name: "plump",
  description: `A robust, rounded texture that hints at pristine juiciness and a full-bodied, succulent interior.`,
  examples: ["fig", "grape__purple", "green_peas"],
  bgThemeClasses: defaultBgThemeClasses,
};

// export const liquidQuality: Quality = {
//   id: "liquid",
//   name: "liquid",
//   description: `A completely fluid texture that effortlessly cascades over your palate, delivering flavor in a free-form flow.`,
//   examples: ["coconut_water", "balsamic_vinegar", "hibiscus_tea"],
//   bgThemeClasses: defaultBgThemeClasses,
// };

// export const semiSolidQuality: Quality = {
//   id: "semi-solid",
//   name: "semi-solid",
//   description: `A balanced texture that marries fluidity with structure, offering a harmonious compromise in each bite.`,
//   examples: ["honeycomb", "ghee__cow", "coconut_oil"],
//   bgThemeClasses: defaultBgThemeClasses,
// };

export const richQuality: Quality = {
  id: "rich",
  name: "rich",
  description: `A lavish texture that saturates your palate with deep, resonant flavors, leaving a lingering impression of opulence.`,
  examples: ["white_chocolate", "quail_egg", "swiss_cheese"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const leanQuality: Quality = {
  id: "lean",
  name: "lean",
  description: `A clean, unembellished texture that accentuates its natural essence without any overwhelming heaviness.`,
  examples: ["tofu", "chicken_breast", "adzuki_bean"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const airyQuality: Quality = {
  id: "airy",
  name: "airy",
  description: `An ethereal texture that seems almost weightless on your palate, leaving behind a delicate and refreshing finish.`,
  examples: ["sourdough__wheat", "croissant"],
  bgThemeClasses: defaultBgThemeClasses,
};

export const Qualities = [
  lightQuality,
  coolQuality,
  sharpQuality,
  smoothQuality,
  roughQuality,
  denseQuality,
  stickyQuality,
  // oilyQuality,
  creamyQuality,
  snappyQuality,
  crunchyQuality,
  chewyQuality,
  juicyQuality,
  jellyLikeQuality,
  spongyQuality,
  delicateQuality,
  // viscousQuality,
  tenderQuality,
  fibrousQuality,
  plumpQuality,
  // liquidQuality,
  // semiSolidQuality,
  richQuality,
  leanQuality,
  airyQuality,
];

export const QualityMap = Qualities.reduce(
  (acc, curr) => ({ ...acc, [curr.id]: curr }),
  {} as Record<QualityType, Quality>,
);

// Compute dynamic examples from actual ingredient data
export const QualityToExamples: Record<QualityType, string[]> = (() => {
  const bucketMap: Record<string, string[]> = {};

  // Initialize buckets for all quality types
  Qualities.forEach((quality) => {
    bucketMap[quality.id] = [];
  });

  // Collect examples from ingredients
  Ingredients.forEach((ingredient) => {
    ingredient.properties.qualities?.forEach((qualityId) => {
      if (
        bucketMap[qualityId] &&
        bucketMap[qualityId].length < MAX_QUALITY_EXAMPLES
      ) {
        bucketMap[qualityId].push(ingredient.id);
      }
    });
  });

  return bucketMap as Record<QualityType, string[]>;
})();

// Update each quality with dynamic examples
Qualities.forEach((quality) => {
  quality.examples = QualityToExamples[quality.id] || [];
});
