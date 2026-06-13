import { EcologicalProcessProfile } from "../Forest/Conditions/types";
import {
  ClimateProfile,
  SoilInteraction,
  SuccessionProfile,
  VerticalLayer,
} from "../Forest/types";
import { QualityType } from "./Qualities/Quality/types";
import { TasteType } from "./Taste/types";

export type ExtraFactHighlightTheme =
  | "height"
  | "lifecycle"
  | "growthForm"
  | "light"
  | "frost"
  | "moisture"
  | "airHumidity";

export interface ExtraFactHighlight {
  text: string;
  theme: ExtraFactHighlightTheme;
}

export interface ExtraFactLink {
  text: string;
  url: string;
}

export interface ExtraFact {
  id: string;
  label: string;
  content: string;
  highlights?: ExtraFactHighlight[];
  links?: ExtraFactLink[];
}

export interface ArticleReference {
  id: string;
  title: string;
  url: string;
}

export interface Ingredient {
  link: string;
  id: string;
  // SvgComponent?: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  imgPath?: string;
  useSvg?: boolean;
  type: IngredientType;
  properties: IngredientProperties;
  needsAttribution?: boolean;
  isLocked?: boolean;
  originIngredients?: string[];
  extraFacts?: ExtraFact[];
  articles?: ArticleReference[];
  sourceType?: IngredientType;
  isInedible?: boolean;
  yieldIngredientIds?: string[];
}

export type GrowthFormType =
  | "canopy" // Tall fruiting or structural trees that form the roof.
  | "midstory" // Medium height trees that live between canopy and understory.
  | "understory" // Shorter trees that live beneath canopy shade.
  | "climber" // Vines that use other layers as support.
  | "bushShrub" // Woody plants below tree height.
  | "root" // Plants grown for underground parts.
  | "herbaceous" // Soft stemmed plants, annuals or perennials.
  | "groundcover"; // Low spreaders that protect soil.

export type LightPreferenceType =
  | "full_sun" // Needs strong, direct sunlight for most of the day.
  | "partial_sun" // Gets direct sun only for a few hours, then shade the rest of the time.
  | "filtered_light" // Receives softened, indirect light that passes through leaves or canopy.
  | "shade_tolerant" // Grows well with low direct light and can handle dim conditions.
  | "shade_loving"; // Thrives in very low light under dense canopy where sun almost never reaches.

export type FrostToleranceType =
  | "hardy" // Survives deep winter freezes and repeated frost without damage.
  | "semi_hardy" // Handles light frost but may be damaged by long or severe freezes.
  | "frost_sensitive" // Injured or stunted by frost; survives only brief, mild cold.
  | "frost_intolerant"; // Dies when exposed to any frost or freezing temperatures.

export type AirHumidityPreferenceType =
  | "arid_air" // olives, some Mediterranean herbs
  | "semi_arid_air"
  | "moderate_humidity" // most temperate fruits
  | "humid_air" // cacao, most tropical understory
  | "saturated_air"; // cloud forest, mossy environments

export type SoilPreferenceType =
  | "dry" // Soil with fast drainage + low water retention.
  | "moist_well_drained" // Soil that holds steady moisture but still drains excess water, keeping roots moist yet oxygenated.
  | "water_edge" // Soil that is saturated or seasonally flooded, staying wet but not fully submerged for long periods.
  | "deep_groundwater" // Soil with a dry surface where plants rely on deep taproots to reach stable subsurface moisture.
  | "standing_water"; // Soil fully submerged in shallow, still water where roots live in anoxic, aquatic conditions.

// from seed to flower
export type LifeCycleType =
  | "annual" // Sprouts, grows, flowers, and reproduces in a single growing season, then dies after producing seed.
  | "biennial" // Grows leaves in the first year, flowers and sets seed in the second year, then dies.
  | "perennial" // Lives for many years and keeps growing and producing season after season.
  | "short_lived_perennial" // Lives more than one season but only a few years before declining.
  | "self_seeding"; // Technically dies each year but drops seeds that regrow it every season.

export type HeightClassType = "low" | "medium" | "high" | "emergent";

export type FungiGrowthFormType =
  | "mycorrhizal" // Lives in symbiosis with plant roots (truffles, chanterelles).
  | "saprophytic" // Breaks down dead wood or leaf litter (shiitake, oyster).
  | "parasitic"; // Lives on living hosts (less common for culinary species).

export type FungiLightPreferenceType =
  | "no_light_needed" // Underground or low-light environments; light irrelevant.
  | "low_light" // Indirect or dim light preferred for fruiting.
  | "surface_shaded"; // Grows at soil surface under forest shade.

export type FungiLifeCycleType =
  | "persistent_mycelium" // Lives multiple years, fruits seasonally (true for truffles).
  | "short_lived_mycelium"; // Lives one season or relies on rapidly cycling substrates.

export type FungiSubstrateDepthType =
  | "surface" // Fruiting bodies form on wood or leaf litter.
  | "shallow_soil" // A few centimeters deep.
  | "deep_soil"; // Ectomycorrhizal or truffles forming tens of cm underground.

export type FungiTemperatureToleranceType =
  | "cool_tolerant" // Can handle cool soil; dormant in winter.
  | "cold_tolerant" // Can overwinter in freezing soils (truffles, morels).
  | "warm_preferring"; // Prefers warm season substrates (oysters on logs, etc).

export type FungiMoisturePreferenceType =
  | "moist" // Needs consistent moisture.
  | "humid_substrate" // High humidity inside substrate but not waterlogged.
  | "well_drained" // Cannot tolerate waterlogging; needs airflow.
  | "dry_forest_floor" // Prefers loose, aerated, fast draining duff under conifers or mixed woods; low surface moisture with periodic rainfall. Typical for matsutake, porcini, and some truffles.
  | "damp_forest_floor"; // Moist leaf litter and humus under shade; consistently damp but not saturated. Ideal for Russula, Lactarius, hedgehogs, chanterelles, and many mycorrhizal forest mushrooms.

export interface FungiGrowth {
  substrateDepths: FungiSubstrateDepthType[];
  lightPreferences: FungiLightPreferenceType[];
  lifeCycles: FungiLifeCycleType[];
  growthForms: FungiGrowthFormType[];
  temperatureTolerances: FungiTemperatureToleranceType[];
  soilPreferences: FungiMoisturePreferenceType[];
}

export interface Growth {
  growthForms: GrowthFormType[];
  lightPreferences: LightPreferenceType[];
  lifeCycles: LifeCycleType[];
  heightClasses: HeightClassType[];
  frostTolerances: FrostToleranceType[];
  soilPreferences: SoilPreferenceType[];
  airHumidityPreferences?: AirHumidityPreferenceType[];
  climateProfile?: ClimateProfile;
  /** Soil interaction profile - describes root behavior, resource demands, and competition tolerance */
  soilInteraction?: SoilInteraction;
}

export type AnimalIntegrationKind = "grazer";

export interface AnimalElementCapacity {
  value: number;
  traits: string[];
}

export interface AnimalIntegrationProfile {
  kind: AnimalIntegrationKind;
  layer: VerticalLayer;
  capacity: {
    fire: AnimalElementCapacity;
    water: AnimalElementCapacity;
    earth: AnimalElementCapacity;
    air: AnimalElementCapacity;
  };
  lifecycle: {
    startYear: number;
    maturityYears: number;
    lifespanYears: number;
  };
  turnover: {
    manureRate: number;
    tramplingPressure: number;
  };
  movement: {
    grazingRadius: number;
  };
  yields: string[];
}

export type AlgaeHabitatType =
  | "freshwater"
  | "saltwater"
  | "brackish"
  | "alkaline_lake" // high pH lakes; spirulina’s true home
  | "marine_coastal" // seaweed beds, nori, kelp
  | "marine_open"; // free floating ocean algae

export type AlgaeLightPreferenceType =
  | "full_sun" // strong light for surface algae like spirulina
  | "bright_water" // strong underwater light; kelp, pond algae
  | "low_light" // deeper water algae
  | "surface_float"; // species that float at the water surface

export type AlgaeSubstrateType =
  | "free_floating" // spirulina, chlorella
  | "rock_attached" // kelp, nori
  | "sediment_rooted" // some macroalgae
  | "surface_mat"; // floating mats, bloom layers

export type AlgaeTemperatureToleranceType =
  | "cold_tolerant" // kelp, cold water algae
  | "cool_preferring"
  | "warm_preferring" // spirulina
  | "heat_tolerant"; // thrives in very warm water

export type AlgaeMoisturePreferenceType =
  | "fully_aquatic" // submerged, always underwater
  | "surface_aquatic" // lives at the top layer of water; spirulina
  | "intertidal"; // nori and sea lettuce, exposed with tides

export type AlgaeLifeCycleType =
  | "continuous" // keeps reproducing as long as conditions allow
  | "seasonal_bloom" // appears in warm seasons
  | "sporadic"; // cycles based on nutrients and temperature

export interface AlgaeGrowth {
  habitats: AlgaeHabitatType[];
  lightPreferences: AlgaeLightPreferenceType[];
  substrates: AlgaeSubstrateType[];
  temperatureTolerances: AlgaeTemperatureToleranceType[];
  soilPreferences: AlgaeMoisturePreferenceType[];
  lifeCycles: AlgaeLifeCycleType[];
}

export const PropertyProfilesFinalLabelMap: Record<
  PropertyProfilesLabel,
  {
    singular: string;
    plural: string;
    accessKey: IngredientPropertyAccessKey;
  }
> = {
  taste: {
    singular: "taste",
    plural: "tastes",
    accessKey: "tastes",
  },
  quality: {
    singular: "feel",
    plural: "feels",
    accessKey: "qualities",
  },
  cuisine: {
    singular: "cuisine",
    plural: "cuisines",
    accessKey: "cuisines",
  },
  // Growth uses a special matcher (not accessKey-based); accessKey unused
  growth: {
    singular: "growth",
    plural: "growth",
    accessKey: "tastes",
  },
  fungiGrowth: {
    singular: "fungi growth",
    plural: "fungi growth",
    accessKey: "tastes",
  },
  algaeGrowth: {
    singular: "algae growth",
    plural: "algae growth",
    accessKey: "tastes",
  },
  ingredientType: {
    singular: "ingredient type",
    plural: "ingredient types",
    accessKey: "tastes",
  },
  succession: {
    singular: "succession",
    plural: "succession",
    accessKey: "tastes",
  },
  soilInteraction: {
    singular: "soil interaction",
    plural: "soil interactions",
    accessKey: "tastes",
  },
};

export type IngredientPropertyAccessKey = "tastes" | "qualities" | "cuisines";

export type PropertyProfilesLabel =
  | "taste"
  | "quality"
  | "cuisine"
  | "growth"
  | "fungiGrowth"
  | "algaeGrowth"
  | "ingredientType"
  | "succession"
  | "soilInteraction";

export type IngredientType =
  | "fruit"
  | "root"
  | "leaf"
  | "flower"
  | "stem"
  | "bulb"
  | "grain"
  | "legume"
  | "rhizome"
  | "nut"
  | "seed"
  | "fungi"
  | "dairy"
  | "meat"
  | "seafood"
  | "animal"
  | "sugar"
  | "fat"
  | "salt"
  | "tea"
  | "algae"
  | "process"
  | "misc";

export interface IngredientProperties
  extends Partial<
    Record<IngredientPropertyAccessKey, IngredientPropertyType[] | undefined>
  > {
  tastes?: TasteType[];
  qualities?: QualityType[];
  tasteProfile?: SensorySignal[];
  qualityProfile?: SensorySignal[];
  growth?: Growth; // Now contains soilInteraction
  fungiGrowth?: FungiGrowth;
  algaeGrowth?: AlgaeGrowth;
  animalIntegration?: AnimalIntegrationProfile;
  succession?: SuccessionProfile;
  ecologicalProcess?: EcologicalProcessProfile;
  // soilInteraction removed - now part of Growth interface
}

export type SensoryIntensity = 1 | 2 | 3 | 4 | 5;

export interface SensorySignal<TId extends string = string> {
  id: TId;
  intensity?: SensoryIntensity;
}

export type IngredientPropertyType =
  | TasteType
  | QualityType
  | (string & Record<never, never>);

export interface IngredientProperty {
  bgThemeClasses?: string;
  name: string;
  description?: string;
  id: IngredientPropertyType;
  examples?: string[];
  colors?: IngredientPropertyColors;
}

export interface IngredientPropertyColors {
  bgGradientStart: string;
  bgGradientStop: string;
  bgGradientStartDark: string;
  bgGradientStopDark: string;
  invertTextColor?: boolean;
  textColor?: string;
}
