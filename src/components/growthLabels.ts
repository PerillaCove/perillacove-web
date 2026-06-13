import {
  AirHumidityPreferenceType,
  AlgaeHabitatType,
  AlgaeLifeCycleType,
  AlgaeLightPreferenceType,
  AlgaeMoisturePreferenceType,
  AlgaeSubstrateType,
  AlgaeTemperatureToleranceType,
  FrostToleranceType,
  FungiGrowthFormType,
  FungiLifeCycleType,
  FungiLightPreferenceType,
  FungiMoisturePreferenceType,
  FungiSubstrateDepthType,
  FungiTemperatureToleranceType,
  GrowthFormType,
  HeightClassType,
  LifeCycleType,
  LightPreferenceType,
  SoilPreferenceType,
} from "./IngredientsPage/types";

export const heightLabelMap: Record<HeightClassType, string> = {
  low: "low-lying",
  medium: "medium-tall",
  high: "tall",
  emergent: "emergent",
};

export const heightShortLabelMap: Record<HeightClassType, string> = {
  low: "low",
  medium: "medium-tall",
  high: "tall",
  emergent: "emergent",
};

export const lifecycleLabelMap: Record<LifeCycleType, string> = {
  annual: "annual",
  biennial: "biennial",
  perennial: "perennial",
  short_lived_perennial: "short-lived perennial",
  self_seeding: "self-seeding",
};

export const growthFormLabelMap: Record<GrowthFormType, string> = {
  canopy: "canopy-forming tree",
  midstory: "midstory tree",
  understory: "understory",
  climber: "climber vine",
  bushShrub: "shrub",
  root: "root crop",
  herbaceous: "herbaceous plant",
  groundcover: "groundcover",
};

export const lightPrefLabelMap: Record<LightPreferenceType, string> = {
  full_sun: "full",
  partial_sun: "partial",
  filtered_light: "filtered",
  shade_tolerant: "some shade",
  shade_loving: "shade",
};

export const frostLabelMap: Record<FrostToleranceType, string> = {
  hardy: "hardy",
  semi_hardy: "semi-hardy",
  frost_sensitive: "frost-sensitive",
  frost_intolerant: "frost-intolerant",
};

export const moistureLabelMap: Record<SoilPreferenceType, string> = {
  dry: "soil with fast drainage & low water retention",
  moist_well_drained: "soil with steady moisture",
  water_edge: "saturated, wet soil",
  deep_groundwater: "dry surface soil with deep roots",
  standing_water: "roots submerged in shallow water",
};

export const airHumidityLabelMap: Record<AirHumidityPreferenceType, string> = {
  arid_air: "arid air",
  semi_arid_air: "semi-arid air",
  moderate_humidity: "moderately humid air",
  humid_air: "humid air",
  saturated_air: "saturated air",
};

export type PlantGrowthLabelKey =
  | GrowthFormType
  | LightPreferenceType
  | LifeCycleType
  | HeightClassType
  | FrostToleranceType
  | SoilPreferenceType
  | AirHumidityPreferenceType;

export const plantGrowthLabelMap: Record<PlantGrowthLabelKey, string> = {
  ...heightLabelMap,
  ...lifecycleLabelMap,
  ...growthFormLabelMap,
  ...lightPrefLabelMap,
  ...frostLabelMap,
  ...moistureLabelMap,
  ...airHumidityLabelMap,
};

// --- Fungi growth labels ---

export const fungiLifecycleLabelMap: Record<FungiLifeCycleType, string> = {
  persistent_mycelium: "persistent mycelium",
  short_lived_mycelium: "short-lived mycelium",
};

export const fungiGrowthFormLabelMap: Record<FungiGrowthFormType, string> = {
  mycorrhizal: "mycorrhizal fungus",
  saprophytic: "saprophytic fungus",
  parasitic: "parasitic fungus",
};

export const fungiLightPrefLabelMap: Record<FungiLightPreferenceType, string> =
  {
    no_light_needed: "no light",
    low_light: "low light",
    surface_shaded: "surface shade",
  };

export const fungiTemperatureLabelMap: Record<
  FungiTemperatureToleranceType,
  string
> = {
  cool_tolerant: "cool-tolerant",
  cold_tolerant: "cold-tolerant",
  warm_preferring: "warm-preferring",
};

export const fungiMoistureLabelMap: Record<
  FungiMoisturePreferenceType,
  string
> = {
  moist: "moist",
  humid_substrate: "a humid",
  well_drained: "well-drained",
  dry_forest_floor: "dry forest floor",
  damp_forest_floor: "damp forest floor",
};

export const fungiSubstrateDepthLabelMap: Record<
  FungiSubstrateDepthType,
  string
> = {
  surface: "surface",
  shallow_soil: "shallow soil",
  deep_soil: "deep soil",
};

export function fungiSubstrateDepthPhrase(
  depth: FungiSubstrateDepthType,
): string {
  switch (depth) {
    case "surface":
      return "at the surface";
    case "shallow_soil":
      return "in shallow soil";
    case "deep_soil":
      return "deep in soil";
    default:
      return "";
  }
}

export type FungiGrowthLabelKey =
  | FungiGrowthFormType
  | FungiLightPreferenceType
  | FungiLifeCycleType
  | FungiSubstrateDepthType
  | FungiTemperatureToleranceType
  | FungiMoisturePreferenceType;

export const fungiGrowthLabelMap: Record<FungiGrowthLabelKey, string> = {
  ...fungiLifecycleLabelMap,
  ...fungiGrowthFormLabelMap,
  ...fungiLightPrefLabelMap,
  ...fungiTemperatureLabelMap,
  ...fungiMoistureLabelMap,
  ...fungiSubstrateDepthLabelMap,
};

// --- Algae growth labels ---

export const algaeHabitatLabelMap: Record<AlgaeHabitatType, string> = {
  freshwater: "freshwater",
  saltwater: "saltwater",
  brackish: "brackish water",
  alkaline_lake: "alkaline lake",
  marine_coastal: "coastal marine",
  marine_open: "open-ocean",
};

export const algaeLightPrefLabelMap: Record<AlgaeLightPreferenceType, string> =
  {
    full_sun: "full sun",
    bright_water: "bright water light",
    low_light: "low light",
    surface_float: "surface light",
  };

export const algaeSubstrateLabelMap: Record<AlgaeSubstrateType, string> = {
  free_floating: "free-floating",
  rock_attached: "rock-attached",
  sediment_rooted: "sediment-rooted",
  surface_mat: "surface mat-forming",
};

export const algaeTemperatureLabelMap: Record<
  AlgaeTemperatureToleranceType,
  string
> = {
  cold_tolerant: "cold-tolerant",
  cool_preferring: "cool-preferring",
  warm_preferring: "warm-preferring",
  heat_tolerant: "heat-tolerant",
};

export const algaeMoistureLabelMap: Record<
  AlgaeMoisturePreferenceType,
  string
> = {
  fully_aquatic: "fully aquatic",
  surface_aquatic: "surface aquatic",
  intertidal: "intertidal",
};

export const algaeLifeCycleLabelMap: Record<AlgaeLifeCycleType, string> = {
  continuous: "continuous growth",
  seasonal_bloom: "a seasonal bloom cycle",
  sporadic: "sporadic bloom cycles",
};

export type AlgaeGrowthLabelKey =
  | AlgaeHabitatType
  | AlgaeLightPreferenceType
  | AlgaeSubstrateType
  | AlgaeTemperatureToleranceType
  | AlgaeMoisturePreferenceType
  | AlgaeLifeCycleType;

export const algaeGrowthLabelMap: Record<AlgaeGrowthLabelKey, string> = {
  ...algaeHabitatLabelMap,
  ...algaeLightPrefLabelMap,
  ...algaeSubstrateLabelMap,
  ...algaeTemperatureLabelMap,
  ...algaeMoistureLabelMap,
  ...algaeLifeCycleLabelMap,
};
