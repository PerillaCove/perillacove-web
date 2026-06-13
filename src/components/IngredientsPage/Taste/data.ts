import { Ingredients } from "../data/species";
import { IngredientType } from "../types";
import { Taste, TasteType } from "./types";

const hoverClasses = "";

// Dynamic example collection - computes examples from actual ingredient data
const MAX_TASTE_EXAMPLES = 1000;

export const sweetTaste: Taste = {
  id: "sweet",
  name: "sweet",
  bgThemeClasses: `bg-gradient-to-r from-sky-100 to-sky-300 dark:from-sky-200 dark:to-sky-400 ${hoverClasses}`,
  description: `The taste of sweetness is nature's signal of energy-rich nourishment. It's a universal language of delight that transcends cultures and cuisines. 

    It’s not just the obvious allure of sugar or the decadence of desserts. Sweetness lingers in the honeyed notes of ripe fruit, releases in the comforting warmth of freshly baked bread, and even hides in the earthy richness of roasted nuts or the delicate grains of rice. 
    
    It’s a flavor that evokes joy, comfort, and celebration, a timeless symbol of pleasure and satisfaction.
    `,
  examples: ["mango", "banana", "honey"],
  treemapBgColor: "#7dd3fc",
  colors: {
    bgGradientStart: "#e0f2fe",
    bgGradientStop: "#7dd3fc",
    bgGradientStartDark: "#bae6fd",
    bgGradientStopDark: "#38bdf8",
  },
};

export const sourTaste: Taste = {
  id: "sour",
  name: "sour",
  bgThemeClasses: `bg-gradient-to-r from-lime-100 to-lime-300 dark:from-lime-200 dark:to-lime-400 ${hoverClasses}`,
  description: `Sour is the dance of brightness and tang, a signal of acidity that enlivens the senses. It is found in the vibrant kiss of citrus fruits, the complex allure of fermented foods, and the sharp clarity of vinegar.

    This taste  awakens the palate and infuses dishes with a sharpness that cuts through richness while maintaining a refreshing, almost zesty edge.
    
    Sourness is a master of balance that brings character to dishes ranging from entrees to desserts.`,
  examples: ["lemon", "tamarind", "greek_yogurt__cow"],
  treemapBgColor: "#bef264",
  colors: {
    bgGradientStart: "#ecfccb",
    bgGradientStop: "#bef264",
    bgGradientStartDark: "#d9f99d",
    bgGradientStopDark: "#a3e635",
  },
};

export const saltyTaste: Taste = {
  id: "salty",
  name: "salty",
  bgThemeClasses: `bg-gradient-to-r from-pink-100 to-pink-300 dark:from-pink-200 dark:to-pink-400 ${hoverClasses}`,
  description: `Salty captures the essence of minerals. It's also the cornerstone of flavor enhancement as it awakens the palate and deepens every bite.

Found in the briny kiss of sea salt, the rich umami of sea vegetables, and the bold character of aged cheeses, salt does more than just season; it amplifies, enhances, and transforms.

Even in sweetness, a touch of salt works magic, making chocolate richer, caramel bolder, and fruit more vibrant.`,
  examples: ["wakame", "goat_cheese", "olive__black"],
  treemapBgColor: "#f9a8d4",
  colors: {
    bgGradientStart: "#fce7f3",
    bgGradientStop: "#f9a8d4",
    bgGradientStartDark: "#fbcfe8",
    bgGradientStopDark: "#f472b6",
  },
};

export const bitterTaste: Taste = {
  id: "bitter",
  name: "bitter",
  bgThemeClasses: `bg-gradient-to-r from-indigo-100 to-indigo-300 dark:from-indigo-200 dark:to-indigo-400 ${hoverClasses}`,
  description:
    "Bitter is the taste of complexity and intrigue, often associated with plants, herbs, and seeds.\n\n Found in dark chocolate, coffee, kale, and citrus peels, it hints at both caution and refinement.\n\nBitter flavors challenge the palate, adding depth and a sophisticated balance that lingers, inviting contemplation and appreciation.",
  examples: ["cacao", "kale", "turmeric"],
  treemapBgColor: "#a5b4fc",
  colors: {
    bgGradientStart: "#e0e7ff",
    bgGradientStop: "#93c5fd",
    bgGradientStartDark: "#c7d2fe",
    bgGradientStopDark: "#818cf8",
  },
};

export const astringentTaste: Taste = {
  id: "astringent",
  name: "astringent",
  bgThemeClasses: `bg-gradient-to-r from-neutral-100 to-neutral-300 dark:from-neutral-200 dark:to-neutral-400 ${hoverClasses}`,
  description:
    "Astringent is the taste of dryness and puckering, often linked to tannins in foods like unripe fruits, tea, and certain legumes. It creates a tactile sensation that cleanses the palate. \n\n Astringent flavors bring a sense of refreshment and contrast, adding a unique dimension to culinary experiences.",
  examples: ["chickpea", "black_bean", "adzuki_bean"],
  treemapBgColor: "#d4d4d4",
  colors: {
    bgGradientStart: "#f5f5f5",
    bgGradientStop: "#d4d4d4",
    bgGradientStartDark: "#e5e5e5",
    bgGradientStopDark: "#a3a3a3",
  },
};

export const pungentTaste: Taste = {
  id: "pungent",
  name: "pungent",
  bgThemeClasses: `bg-gradient-to-r from-red-100 to-red-300 dark:from-red-200 dark:to-red-400 ${hoverClasses}`,
  description: `Pungent is the taste of unapologetic boldness, igniting the senses with its dynamic heat and sharp intensity. 
      
    From the thrilling spiciness of chili peppers and the vivid bite of garlic to the clearing edge of wasabi, it's a flavor profile that demands readiness. 
    
    Put simply, pungency is a punch without compromise.`,
  examples: ["cayenne_pepper", "wasabi", "garlic"],
  treemapBgColor: "#f87171",
  colors: {
    bgGradientStart: "#fee2e2",
    bgGradientStop: "#fca5a5",
    bgGradientStartDark: "#fecaca",
    bgGradientStopDark: "#f87171",
  },
};

export const savoryTaste: Taste = {
  id: "savory",
  name: "savory",
  bgThemeClasses: `bg-gradient-to-r from-orange-100 to-orange-300 dark:from-orange-200 dark:to-orange-400 ${hoverClasses}`,
  description: `Savory, often referred to as umami, is the essence of depth and richness. 
    
    It's the soulful taste that lingers in a simmering broth, the golden crust of a perfectly roasted meat, the complex tang of aged cheeses, and the earthy allure of fermented delicacies. 
    
    The savory taste is the hearty embrace of a steaming bowl of soup on a cold day, the comforting warmth of a slow-cooked stew, and the deeply satisfying sensation that fills not just the stomach, but the heart. Savory flavors are a celebration of life's richness, a culinary hug that resonates with the very core of who we are.
    `,
  examples: ["avocado", "t_bone_steak__beef", "swiss_cheese"],
  treemapBgColor: "#fdba74",
  colors: {
    bgGradientStart: "#ffedd5",
    bgGradientStop: "#fdba74",
    bgGradientStartDark: "#fed7aa",
    bgGradientStopDark: "#fb923c",
  },
};

export const earthyTaste: Taste = {
  id: "earthy",
  name: "earthy",
  bgThemeClasses: `bg-gradient-to-r from-lime-100 to-yellow-500 dark:from-lime-200 dark:to-yellow-500 ${hoverClasses}`,
  description: `Earthy flavors evoke the rugged essence of soil and nature.

From the rustic charm of root vegetables and mushrooms to the aromatic whisper of forest herbs, these flavors tell a story of the land -- ancient, untamed, and full of character.

They ground us with their warmth and authenticity, infusing every dish with a sense of comfort, tradition, and wild beauty.`,
  examples: ["potato", "porcini", "pistachio"],
  treemapBgColor: "#a16207",
  colors: {
    bgGradientStart: "#ecfccb",
    bgGradientStop: "#eab308",
    bgGradientStartDark: "#d9f99d",
    bgGradientStopDark: "#eab308",
  },
};

export const nuttyTaste: Taste = {
  id: "nutty",
  name: "nutty",
  bgThemeClasses: `bg-gradient-to-r from-amber-400 to-amber-600 dark:from-amber-500 dark:to-amber-700 ${hoverClasses}`,
  description: `Nutty is the taste of comforting warmth, conjuring the aroma of roasted nuts like almonds, hazelnuts, or walnuts. 
    
    It envelops dishes with a gentle sweetness and a grounded richness that feels earthy and soothing. 
    
    These flavors bring a heartiness that can anchor sweet treats and deepen savory recipes alike, creating a balanced profile that feels both nostalgic and satisfying.`,
  examples: ["almond", "hazelnut", "poppy_seed"],
  treemapBgColor: "#c2410c",
  colors: {
    bgGradientStart: "#fbbf24",
    bgGradientStop: "#d97706",
    bgGradientStartDark: "#f59e0b",
    bgGradientStopDark: "#b45309",
  },
};

export const tangyTaste: Taste = {
  id: "tangy",
  name: "tangy",
  bgThemeClasses: `bg-gradient-to-r from-amber-100 to-amber-300 dark:from-amber-200 dark:to-amber-400 ${hoverClasses}`,
  description: `Tangy is a vibrant and piercing taste that masterfully balances the tartness of sour with the allure of sweetness, often infused with a subtle hint of savoriness.

Often found in luscious fruits like succulent pineapples, crisp green apples, and exotic tamarind, tangy flavors radiate brightness and vitality.

They infuse dishes with a lively zest, adding a spirited and invigorating twist that awakens the palate and elevates culinary creations with their energetic dynamism.`,
  examples: ["orange", "kiwi__green", "blue_cheese"],
  treemapBgColor: "#fcd34d",
  colors: {
    bgGradientStart: "#fef3c7",
    bgGradientStop: "#fcd34d",
    bgGradientStartDark: "#fde68a",
    bgGradientStopDark: "#fbbf24",
  },
};

export const zestyTaste: Taste = {
  id: "zesty",
  name: "zesty",
  bgThemeClasses: `bg-gradient-to-r from-green-100 to-orange-300 dark:from-green-200 dark:to-orange-400 ${hoverClasses}`,
  description: `Zesty embodies the electrifying essence of brightness, exploding with tang and a spirited zing.

From the vibrant burst of citrus fruits to the vivacious spark of fresh herbs, zesty flavors ignite the palate with a rejuvenating jolt.

They infuse dishes with unparalleled freshness and dynamic vitality, awakening the senses and igniting culinary creativity.`,
  examples: ["ginger", "peach", "tomato__red"],
  treemapBgColor: "#86efac",
  colors: {
    bgGradientStart: "#dcfce7",
    bgGradientStop: "#fdba74",
    bgGradientStartDark: "#bbf7d0",
    bgGradientStopDark: "#fb923c",
  },
};

export const floralTaste: Taste = {
  id: "floral",
  name: "floral",
  bgThemeClasses: `bg-gradient-to-r from-rose-100 to-blue-300 dark:from-rose-200 dark:to-blue-400 ${hoverClasses}`,
  description:
    "Floral is the taste of delicate elegance, reminiscent of blossoms and fragrant gardens. \n\n Found in ingredients like rose, lavender, elderflower, and jasmine, it adds a subtle, aromatic sweetness and a touch of sophistication. \n\n Floral flavors bring a gentle, romantic quality that kindles the sweet and tames the savory.",
  examples: ["apple__red", "thyme", "perilla_leaf"],
  treemapBgColor: "#f9a8d4",
  colors: {
    bgGradientStart: "#ffe4e6",
    bgGradientStop: "#93c5fd",
    bgGradientStartDark: "#fecdd3",
    bgGradientStopDark: "#60a5fa",
  },
};

export const grassyTaste: Taste = {
  id: "grassy",
  name: "grassy",
  bgThemeClasses: `bg-gradient-to-r from-green-100 to-green-300 dark:from-green-200 dark:to-green-400 ${hoverClasses}`,
  description:
    "The grassy taste is vibrant and fresh, evoking the essence of lush meadows and freshly cut herbs. \n\n It's often associated with ingredients like spinach, parsley, green tea, or extra virgin olive oil. \n\n This taste is subtly earthy and slightly bitter, balancing brightness with a natural, raw quality that feels alive. \n\n Grassy flavors can add a refreshing undertone to dishes, making them feel light and invigorating, perfect for salads, pestos, or herbal teas.",
  examples: ["spinach", "cucumber", "lettuce"],
  treemapBgColor: "#65a30d",
  colors: {
    bgGradientStart: "#dcfce7",
    bgGradientStop: "#86efac",
    bgGradientStartDark: "#bbf7d0",
    bgGradientStopDark: "#4ade80",
  },
};

export const milkyTaste: Taste = {
  id: "milky",
  name: "milky",
  bgThemeClasses: `bg-gradient-to-r from-neutral-50 to-sky-200 dark:from-neutral-50 dark:to-sky-200 ${hoverClasses}`,
  description: `The milky taste embodies a comforting creaminess that's effortlessly smooth and gently sweet. 

    Traditionally tied to the freshness of dairy—like a cool glass of milk or the velvet of whipped cream—it also extends into foods with a similar, sweetly soothing character. 
    
    In coconut milk or oat milk, for instance, you'll find that same mellow, rounded flavor profile. Even starchy ingredients such as cooked rice or tapioca can channel this subtle, velvety richness. 
    
    Ultimately, the milky taste is about enveloping the palate in a soft, gentle embrace—smooth, calming, and irresistibly cozy.`,
  examples: ["milk_chocolate", "oat", "swiss_cheese"],
  treemapBgColor: "#cffafe",
  colors: {
    bgGradientStart: "#fafafa",
    bgGradientStop: "#bae6fd",
    bgGradientStartDark: "#fafafa",
    bgGradientStopDark: "#bae6fd",
  },
};

export const smokyTaste: Taste = {
  id: "smoky",
  name: "smoky",
  bgThemeClasses: `bg-gradient-to-r from-neutral-50 to-amber-400 dark:from-neutral-50 dark:to-amber-400 ${hoverClasses}`,
  description:
    "A flavor profile reminiscent of fire-cured foods and charred wood, created through smoking or natural compounds. \n\n Found in fire-roasted vegetables, cured meats, aged cheeses, and certain wild-hung fungi like morels, it adds a primal complexity. \n\n It adds a layered richness to dishes, balancing between subtle campfire warmth and assertive charred notes that coat the palate.",
  examples: ["morel", "lava_salt", "bacon"],
  treemapBgColor: "##713f12",
  colors: {
    bgGradientStart: "#fafafa",
    bgGradientStop: "#fbbf24",
    bgGradientStartDark: "#fafafa",
    bgGradientStopDark: "#fbbf24",
  },
};

export const brinyTaste: Taste = {
  id: "briny",
  name: "briny",
  bgThemeClasses: `bg-gradient-to-r from-orange-100 to-teal-300 dark:from-orange-200 dark:to-teal-300 ${hoverClasses}`,
  description:
    "Briny is a distinctly oceanic taste that captures the essence of the sea - clean, mineral-rich, and naturally salty. \n\n It's characterized by a crisp salinity that's more refined and complex than simple saltiness. Often found in fresh seafood like oysters, wakame, and caviar, briny flavors evoke the pure, pristine qualities of ocean waters. \n\n The briny taste brings a refreshing mineral depth to dishes, adding a sophisticated saltiness that connects the palate to the sea's natural essence.",
  examples: ["scallop", "kelp", "mackarel"],
  treemapBgColor: "#0d9488",
  colors: {
    bgGradientStart: "#ffedd5",
    bgGradientStop: "#5eead4",
    bgGradientStartDark: "#fed7aa",
    bgGradientStopDark: "#5eead4",
  },
};

export const aniseTaste: Taste = {
  id: "anise",
  name: "anise",
  bgThemeClasses: `bg-gradient-to-r from-red-200 to-indigo-200 dark:from-red-200 dark:to-indigo-300 ${hoverClasses}`,
  description:
    "Anise is a distinctive aromatic taste with a sweet, herbaceous character reminiscent of licorice. It carries cool, ethereal notes that create a refreshing sensation on the palate. \n\n Found naturally in ingredients like fennel, star anise, and Thai basil, this flavor has been prized in cuisines worldwide for its unique ability to bridge sweet and savory dishes. \n\n It brings a sophisticated complexity to foods, offering an initial sweetness followed by subtle, lingering notes that both cool and enliven the palate.",
  examples: ["fennel_seed", "star_anise", "thai_basil"],
  treemapBgColor: "#6b21a8",
  colors: {
    bgGradientStart: "#fecaca",
    bgGradientStop: "#c7d2fe",
    bgGradientStartDark: "#fecaca",
    bgGradientStopDark: "#a5b4fc",
  },
};

export const fruityTaste: Taste = {
  id: "fruity",
  name: "fruity",
  bgThemeClasses: `bg-gradient-to-r from-red-300 to-green-200 dark:from-red-300 dark:to-green-300 ${hoverClasses}`,
  description: `Fruity is the taste of vibrant complexity, evoking the essence of ripe, sun-warmed fruits or their bright, tangy counterparts.

Found in citrus, berries, apples, and even in non-fruits like rosemary or red bell peppers, it encompasses a wide range of flavors—from sweet and juicy to tangy and tart, with occasional floral undertones.

The fruity taste balances sweetness, acidity, and sometimes a hint of floral notes that excite the palate.
  `,
  examples: ["orange", "rosemary", "bell_pepper__red"],
  treemapBgColor: "#be185d",
  colors: {
    bgGradientStart: "#fca5a5",
    bgGradientStop: "#bbf7d0",
    bgGradientStartDark: "#fca5a5",
    bgGradientStopDark: "#86efac",
  },
};

export const woodyTaste: Taste = {
  id: "woody",
  name: "woody",
  bgThemeClasses: `bg-gradient-to-r from-neutral-300 to-amber-600 dark:from-neutral-300 dark:to-amber-700 ${hoverClasses}`,
  description: `Imagine the comforting embrace of a crackling fireplace, the grounding scent of a forest floor, or the rich aroma of aged spices. This is the woody taste.

From the earthy spice of cinnamon to the rich, bark-like essence of nutmeg and the sweet complexity of maple syrup, it adds a grounding, aromatic sophistication to any dish.

Woody flavors evoke a sense of comfort and nostalgia, wrapping the palate in a warm, mellow embrace.`,
  examples: ["porcini", "walnut", "cinnamon"],
  treemapBgColor: "#78350f",
  colors: {
    bgGradientStart: "#d4d4d4",
    bgGradientStop: "#d97706",
    bgGradientStartDark: "#d4d4d4",
    bgGradientStopDark: "#b45309",
  },
};

export const pepperyTaste: Taste = {
  id: "peppery",
  name: "peppery",
  bgThemeClasses: `bg-gradient-to-r from-zinc-500 to-zinc-800 dark:from-zinc-100 dark:to-zinc-300 text-white dark:text-black ${hoverClasses}`,
  description: `Peppery is the taste of bold vibrancy that gives a crackling sensation to the palate.

Found in ingredients like arugula, black pepper, radishes, and watercress, it adds a lively, spicy edge and a touch of adventure.

Peppery flavors cut through richness, add a sharp dimension to salads, and simply make dishes dance.
`,
  examples: ["arugula", "black_pepper", "oregano"],
  treemapBgColor: "#737373",
  colors: {
    invertTextColor: true,
    bgGradientStart: "#71717a",
    bgGradientStop: "#27272a",
    bgGradientStartDark: "#f4f4f5",
    bgGradientStopDark: "#d4d4d8",
  },
};

export const gameyTaste: Taste = {
  id: "gamey",
  name: "gamey",
  bgThemeClasses: `bg-gradient-to-r from-zinc-500 to-red-800 dark:from-zinc-100 dark:to-red-300 text-white dark:text-black ${hoverClasses}`,
  description: `Gamey is the untamed essence of the wild - a mix of earthy, musky, and primal savoriness that hints of forest trails and open ranges. 

Found in meats like venison's iron-rich intensity, lamb's pastoral richness, and wild boar's rugged character, this taste profile carries the imprint of an animal's life - their diet of wild herbs, their active existence, their very connection to untamed landscapes.

Gamey flavors unfold like a story: initial notes of weathered leather and damp forest floor give way to layers of iron-rich blood minerals and robust notes of pine forests at dusk.`,
  examples: ["venison__deer", "lamb_chop", "quail"],
  treemapBgColor: "#94a3b8",
  colors: {
    invertTextColor: true,
    bgGradientStart: "#71717a",
    bgGradientStop: "#991b1b",
    bgGradientStartDark: "#f4f4f5",
    bgGradientStopDark: "#fca5a5",
  },
};

export const beefyTaste: Taste = {
  id: "beefy",
  name: "beefy",
  bgThemeClasses: `bg-gradient-to-r from-stone-200 to-rose-300 dark:from-stone-300 dark:to-rose-400 ${hoverClasses}`,
  description: `Beefy is deep, rich, and distinctly meaty — the concentrated savor of seared beef, slow-simmered stocks, and marrow’s silky depth.

It leans into caramelized crusts, roasted fat, and collagen-laced broths, delivering a rounded umami that’s both hearty and luxurious. 

Beefy flavors anchor dishes with warmth and weight, pairing naturally with peppery, woody, and tangy notes.`,
  examples: ["ribeye__beef", "t_bone_steak__beef", "beef_bone_broth"],
  treemapBgColor: "#b45309",
  colors: {
    bgGradientStart: "#e7e5e4",
    bgGradientStop: "#fda4af",
    bgGradientStartDark: "#d6d3d1",
    bgGradientStopDark: "#fb7185",
  },
};

export const maltyTaste: Taste = {
  id: "malty",
  name: "malty",
  bgThemeClasses: `bg-gradient-to-r from-neutral-200 to-amber-400 dark:from-neutral-200 dark:to-amber-400 ${hoverClasses}`,
  description: `The malty taste has a comforting depth reminiscent of freshly baked bread, toasted cereal, or a light honeyed sweetness.

Found in ingredients like barley, wheat, and hops, it adds a deep, earthy nuttiness and a hint of caramel.

Depending on the intensity, it can range from a subtle, creamy richness (like in malted milk) to a deep, roasted, almost biscuity flavor (as found in dark beers or malted barley).`,
  examples: ["barley", "caramel", "bagel"],
  treemapBgColor: "#f59e0b",
  colors: {
    bgGradientStart: "#e5e5e5",
    bgGradientStop: "#fbbf24",
    bgGradientStartDark: "#e5e5e5",
    bgGradientStopDark: "#fbbf24",
  },
};

export const mentholTaste: Taste = {
  id: "menthol",
  name: "menthol",
  bgThemeClasses: `bg-gradient-to-r from-neutral-50 to-green-300 dark:from-neutral-50 dark:to-green-300 ${hoverClasses}`,
  description: `Menthol is the taste of pure refreshment. It's a crystalline coolness like an alpine breeze or the crisp whisper of frost.

Found in ingredients like peppermint, eucalyptus, spearmint, and wintergreen, it delivers a sharp, invigorating chill and a clean, bracing edge.

Menthol awakens the senses with its icy clarity, balancing sweetness with bite and transforming richness into something lighter.
  `,
  examples: ["spearmint_tea", "peppermint", "perilla_leaf"],
  treemapBgColor: "#a7f3d0",
  colors: {
    bgGradientStart: "#fafafa",
    bgGradientStop: "#86efac",
    bgGradientStartDark: "#fafafa",
    bgGradientStopDark: "#86efac",
  },
};

export const citrusyTaste: Taste = {
  id: "citrusy",
  name: "citrusy",
  bgThemeClasses: `bg-gradient-to-r from-lime-100 to-amber-300 dark:from-lime-200 dark:to-amber-400 ${hoverClasses}`,
  description: `
    Citrus is the spark of vivid brightness that weaves through the palate, offering a layered interplay of tang, zest, and aromatic lift. It transcends the familiar squeeze of lemon or lime, surfacing subtly in unexpected places — a whisper in fine cacao, the sharp clarity of lemongrass, the electric snap of galangal, the fragrant breath of kaffir lime leaf.

This taste is not just sourness; it is a radiant sharpness intertwined with floral, herbal, and even slightly sweet undertones. Citrus enlivens dishes with a clean, refreshing energy, slicing through heaviness while leaving behind a lingering, aromatic trail.

Citrus is a bearer of light, a taste that brightens, sharpens, and uplifts, breathing vitality into creations both savory and sweet.
  `,
  examples: ["galangal", "kaffir_lime_leaf", "lemongrass"],
  treemapBgColor: "#a7f3d0",
  colors: {
    bgGradientStart: "#ecfccb",
    bgGradientStop: "#fcd34d",
    bgGradientStartDark: "#d9f99d",
    bgGradientStopDark: "#fbbf24",
  },
};

export const Tastes = [
  sweetTaste,
  savoryTaste,
  earthyTaste,
  saltyTaste,
  sourTaste,
  bitterTaste,
  pungentTaste,
  maltyTaste,
  milkyTaste,
  nuttyTaste,
  tangyTaste,
  zestyTaste,
  floralTaste,
  grassyTaste,
  astringentTaste,
  // brinyTaste,
  // smokyTaste,
  aniseTaste,
  fruityTaste,
  woodyTaste,
  mentholTaste,
  pepperyTaste,
  // gameyTaste,
  // beefyTaste,
  citrusyTaste,
];

export const TasteMap = Tastes.reduce(
  (acc, curr) => {
    return { ...acc, [curr.id]: curr };
  },
  {} as Record<TasteType, Taste>,
);

// Compute dynamic examples from actual ingredient data
export const TasteToExamples: Record<TasteType, string[]> = (() => {
  const bucketMap: Record<string, string[]> = {};

  // Initialize buckets for all taste types
  Tastes.forEach((taste) => {
    bucketMap[taste.id] = [];
  });

  // Collect examples from ingredients
  Ingredients.forEach((ingredient) => {
    ingredient.properties.tastes?.forEach((tasteId) => {
      if (
        bucketMap[tasteId] &&
        bucketMap[tasteId].length < MAX_TASTE_EXAMPLES
      ) {
        bucketMap[tasteId].push(ingredient.id);
      }
    });
  });

  return bucketMap as Record<TasteType, string[]>;
})();

// Update each taste with dynamic examples
Tastes.forEach((taste) => {
  taste.examples = TasteToExamples[taste.id] || [];
});

export const IngredientTypes: IngredientType[] = [
  "fruit",
  "flower",
  "root",
  "leaf",
  "stem",
  "grain",
  "legume",
  "nut",
  "seed",
  "rhizome",
  "fungi",
  "bulb",
  "dairy",
  // "meat",
  "algae",
  "seafood",
  "sugar",
  "fat",
  "salt",
  "tea",
  "misc",
  "process",
].filter(
  (type) =>
    ![
      "algae",
      "dairy",
      "fat",
      "salt",
      "sugar",
      "misc",
      "fungi",
      "meat",
      "seafood",
      "tea",
    ].includes(type),
) as IngredientType[];
