import type {
  AirHumidityPreferenceType,
  FrostToleranceType,
  GrowthFormType,
  HeightClassType,
  Ingredient,
  LifeCycleType,
  LightPreferenceType,
  SoilPreferenceType,
} from "../../IngredientsPage/types";
import type {
  DimensionGrouping,
  EstablishmentLight,
  PositionOverrides,
  RespawnConfig,
  SpeciesCountConfig,
  SuccessionalPhase,
  VerticalLayer,
} from "../types";
import type { SpatialVolume } from "../spatial";

export type {
  DimensionGrouping,
  PositionOverrides,
  RespawnConfig,
  SpeciesCountConfig,
  VerticalLayer,
};

export const ELEMENT_IDS = ["fire", "water", "earth", "air"] as const;

export type ElementId = (typeof ELEMENT_IDS)[number];

export type ElementMetric = "supply" | "capacity" | "use" | "integration";

export type IntegrationDirection =
  | "supply_exceeds_capacity"
  | "capacity_exceeds_supply"
  | "balanced";

export interface PlotBounds {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  maxHeight?: number;
}

export interface FieldCell {
  index: number;
  row: number;
  col: number;
  x: number;
  z: number;
  size: number;
  distanceFromCenter: number;
  distanceToEdge: number;
  domainWeight: number;
  inside: boolean;
  weight: number;
}

export interface PlotGrid {
  resolution: number;
  radius: number;
  centerX: number;
  centerZ: number;
  bounds: PlotBounds;
  cells: FieldCell[];
  verticalSamples: number[];
}

export interface BoundaryFlux {
  inflow: number;
  outflow: number;
  retained: number;
}

export interface ElementFieldCell extends FieldCell {
  supply: number;
  capacity: number;
  use: number;
  integration: number;
  direction: IntegrationDirection;
  contributors: string[];
}

export interface ElementField {
  element: ElementId;
  grid: PlotGrid;
  cells: ElementFieldCell[];
  boundaryFlux: BoundaryFlux;
  metadata?: Record<string, number | string | boolean | undefined>;
}

export interface ElementContext {
  grid: PlotGrid;
  structures: FlowStructure[];
  environment: IntegrationEnvironment;
}

export interface StructureFootprint {
  x: number;
  z: number;
  radius: number;
  heightRange?: [number, number];
  layer?: VerticalLayer;
}

export interface FlowStructureEffect {
  supply?: number;
  capacity?: number;
  supplyMultiplier?: number;
  capacityMultiplier?: number;
}

export type IntegrationTransformationId =
  | "transpired_humidity"
  | "leaf_litter"
  | "root_turnover"
  | "nitrogen_fixation"
  | "grazing_manure";

export interface IntegrationElementCapacity {
  value: number;
  traits: string[];
}

export interface IntegrationProfileStructure {
  layer: VerticalLayer;
  growthForms: GrowthFormType[];
  heightClasses: HeightClassType[];
  rootStrategy?: string;
  rootDepthBand?: string;
}

export interface IntegrationProfileTime {
  lifeCycles: LifeCycleType[];
  successionPhase?: SuccessionalPhase;
  establishmentLight?: EstablishmentLight;
  plantingWindow: [number, number];
  firstYield: [number, number];
  productiveWindow: [number, number];
}

export interface IntegrationProfileTransformation {
  id: IntegrationTransformationId;
  label: string;
  inputs: ElementId[];
  outputs: Partial<Record<ElementId, number>>;
  rate: number;
  requires: string[];
}

export interface AnimalLifecycleProfile {
  startYear: number;
  maturityYears: number;
  lifespanYears: number;
}

export interface ActiveIntegrationTransformation
  extends IntegrationProfileTransformation {
  intensity: number;
}

export interface IngredientIntegrationProfile {
  ingredientId: string;
  label: string;
  incomplete: boolean;
  profileKind: "plant" | "animal";
  structure: IntegrationProfileStructure;
  capacity: Record<ElementId, IntegrationElementCapacity>;
  capacityTraits?: Partial<Record<ElementId, string[]>>;
  transformations: IntegrationProfileTransformation[];
  time: IntegrationProfileTime;
  animalLifecycle?: AnimalLifecycleProfile;
  yieldIngredientIds?: string[];
  sourceTraits: {
    fire: {
      lightPreferences: LightPreferenceType[];
      frostTolerances: FrostToleranceType[];
      chillHours?: [number, number];
      optimalTempRangeC?: [number, number];
      sunlightHours?: [number, number];
    };
    water: {
      soilPreferences: SoilPreferenceType[];
      waterPull?: "low" | "medium" | "high";
      oxygenSensitivity?: "low" | "medium" | "high";
    };
    earth: {
      nutrientPull?: "low" | "medium" | "high";
      rootStrategy?: string;
      rootDepthBand?: string;
    };
    air: {
      airHumidityPreferences: AirHumidityPreferenceType[];
      humidityLift?: "low" | "medium" | "high";
      windBuffering?: "low" | "medium" | "high";
    };
  };
}

export type FlowStructureKind =
  | "plant_stage"
  | "animal_grazer"
  | "mulch_zone"
  | "soil_zone"
  | "swale"
  | "greenhouse_shell"
  | "path"
  | "pond"
  | "pruning_gap"
  | "rock_wall"
  | "fence";

export interface FlowStructure {
  id: string;
  kind: FlowStructureKind;
  label: string;
  footprint: StructureFootprint;
  effects: Partial<Record<ElementId, FlowStructureEffect>>;
  capacity: Partial<Record<ElementId, number>>;
  transformations?: ActiveIntegrationTransformation[];
  integrationProfile?: IngredientIntegrationProfile;
  sourceIngredientId?: string;
  volumeId?: string;
  incomplete?: boolean;
  metadata?: Record<string, string | number | boolean | undefined>;
}

export interface SpeciesTrajectorySample {
  ingredientId: string;
  label: string;
  layer: VerticalLayer;
  ageYears: number;
  intensity: number;
  maturity: number;
  radius: number;
  height: number;
  incomplete: boolean;
  lightDemand: number;
  waterDemand: number;
  rootCapacity: number;
  litterSupply: number;
  airExchange: number;
  nitrogenSupply: number;
  integrationProfile: IngredientIntegrationProfile;
  transformations: ActiveIntegrationTransformation[];
}

export interface SpeciesTrajectory {
  ingredient: Ingredient;
  incomplete: boolean;
  sampleAtYear: (year: number) => SpeciesTrajectorySample;
}

export interface IntegrationEnvironment {
  incomingLight: number;
  rainfall: number;
  soilMineralSupply: number;
  airExchange: number;
  humidity: number;
  subsoilLeakage: number;
  ambientTempC: number;
  sunlightHours: number;
  winterChillHours: number;
  frostRisk: number;
  soilDepthAccess: number;
  windExposure: number;
}

export interface IntegrationSceneBuildInput {
  ingredients: Ingredient[];
  year: number;
  soilGrouping?: DimensionGrouping;
  respawnConfig?: RespawnConfig;
  speciesCountConfig?: SpeciesCountConfig;
  positionOverrides?: PositionOverrides;
  seed?: string;
  environment?: Partial<IntegrationEnvironment>;
}

export interface IntegrationSceneState {
  id: string;
  seed: string;
  year: number;
  grid: PlotGrid;
  bounds: PlotBounds;
  structures: FlowStructure[];
  volumes: SpatialVolume[];
  positionOverrides: PositionOverrides;
  environment: IntegrationEnvironment;
  hash: string;
}

export interface IntegrationLocalReading {
  element: ElementId;
  cellIndex: number;
  row: number;
  col: number;
  x: number;
  z: number;
  supply: number;
  capacity: number;
  use: number;
  integration: number;
  direction: IntegrationDirection;
  weight: number;
  contributors: string[];
}

export interface IntegrationBundleChannel {
  id: string;
  label: string;
  summary: string;
  primaryElement: ElementId;
  relatedElements: ElementId[];
  integration: number;
  weight: number;
  direction: IntegrationDirection;
}

export interface IntegrationElementBundle {
  integration: number;
  channels: IntegrationBundleChannel[];
  limitingChannel?: IntegrationBundleChannel;
}

export interface IntegrationElementReading {
  element: ElementId;
  baseIntegration: number;
  integration: number;
  bundle: IntegrationElementBundle;
  closure: number;
  totalSupply: number;
  totalCapacity: number;
  totalUse: number;
  boundaryFlux: BoundaryFlux;
  directionalSummary: Record<IntegrationDirection, number>;
  locals: IntegrationLocalReading[];
}

export interface IntegrationSceneReading {
  sceneId: string;
  sceneHash: string;
  year: number;
  fields: Record<ElementId, ElementField>;
  elements: Record<ElementId, IntegrationElementReading>;
  overallIntegration: number;
  score: number;
  closure: number;
}

export interface FieldOverlayCell {
  index: number;
  row: number;
  col: number;
  x: number;
  z: number;
  size: number;
  value: number;
  direction: IntegrationDirection;
  visible: boolean;
}

export interface FieldOverlay {
  element: ElementId;
  metric: ElementMetric;
  cells: FieldOverlayCell[];
  min: number;
  max: number;
}
