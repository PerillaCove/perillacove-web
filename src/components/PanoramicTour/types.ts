import type { IngredientOverrideMap } from "../IngredientsPage/data";

export type TourLayer = "canopy" | "understory" | "mid" | "ground" | "edge";
export type HotspotKind = "ingredient" | "custom";

export interface TourHotspotBase {
  id: string;
  ingredientId?: string;
  kind?: HotspotKind;
  speciesName: string;
  layers: TourLayer[];
  stageLabel?: string;
  shortLabel: string;
  description: string;
  storyImageSrc?: string;
  connections: string[];
  icon?: string;
}

interface LegacyLayerCompatibility {
  layers?: TourLayer[];
  layer?: TourLayer;
}

type TourHotspotInputBase = Omit<TourHotspotBase, "layers"> &
  LegacyLayerCompatibility;

export interface TourHotspotLegacy extends TourHotspotInputBase {
  x: number;
  y: number;
}

export type PanoramaProjection = "flat" | "equirectangular" | "scene3d";

export type HotspotPosition =
  | { projection: "flat"; x: number; y: number }
  | {
      projection: "equirectangular";
      yaw: number;
      pitch: number;
      x?: number;
      y?: number;
    };

export interface TourHotspotV2 extends TourHotspotInputBase {
  position: HotspotPosition;
}

export type TourHotspot = TourHotspotLegacy | TourHotspotV2;

export interface PanoramaTourStory {
  establishment: string;
  transition: string;
  maturity: string;
}

export type PanoramaTourSourceKind = "concept" | "real";

export interface PanoramaTourSource {
  kind: PanoramaTourSourceKind;
  label: string;
  url?: string;
}

export interface PanoramaTourForestWorkspace {
  /** Preferred species IDs for living forest participants. */
  speciesIds?: string[];
  /** Compatibility alias for older tours and ingredient-centric callers. */
  ingredientIds?: string[];
  speciesCountConfig?: Record<string, number>;
  respawnConfig?: Record<string, number>;
  initialYear?: number;
  initialDuration?: number;
  showInHotspotStory?: boolean;
  forceDarkMode?: boolean;
  sceneForceDarkMode?: boolean;
  sceneControlsExpandedDefault?: boolean;
  showGroundDressing?: boolean;
  sceneCameraDistanceScale?: number;
  ffBrand?: "forest";
}

export interface PanoramaTourDataLegacy {
  id: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  imageAspectRatio: "21:9";
  story: PanoramaTourStory;
  source?: PanoramaTourSource;
  forestWorkspace?: PanoramaTourForestWorkspace;
  ingredientOverridesById?: IngredientOverrideMap;
  hotspots: TourHotspotLegacy[];
}

export interface PanoramaNodeLink {
  id: string;
  targetNodeId: string;
  yaw: number;
  pitch: number;
  label: string;
}

export interface PanoramaNode {
  id: string;
  imageSrc: string;
  projection: PanoramaProjection;
  hotspots: TourHotspotV2[];
  links?: PanoramaNodeLink[];
}

export interface PanoramaTourDataV2 {
  id: string;
  title: string;
  subtitle: string;
  story: PanoramaTourStory;
  source?: PanoramaTourSource;
  forestWorkspace?: PanoramaTourForestWorkspace;
  ingredientOverridesById?: IngredientOverrideMap;
  nodes: PanoramaNode[];
  initialNodeId?: string;
}

export type PanoramaTourData = PanoramaTourDataLegacy | PanoramaTourDataV2;

export interface NormalizedTourHotspot extends TourHotspotBase {
  kind: HotspotKind;
  percent: {
    x: number;
    y: number;
  };
  position: HotspotPosition;
}

export interface NormalizedPanoramaNode {
  id: string;
  imageSrc: string;
  projection: PanoramaProjection;
  hotspots: NormalizedTourHotspot[];
  links: PanoramaNodeLink[];
}

export interface NormalizedPanoramaTourData {
  id: string;
  title: string;
  subtitle: string;
  story: PanoramaTourStory;
  source: PanoramaTourSource;
  forestWorkspace: PanoramaTourForestWorkspace | null;
  ingredientOverridesById?: IngredientOverrideMap;
  nodes: NormalizedPanoramaNode[];
  initialNodeId: string;
}

export interface ViewerMetrics {
  containerWidth: number;
  containerHeight: number;
  imageNaturalWidth: number;
  imageNaturalHeight: number;
}

export interface PanView {
  zoom: number;
  offsetX: number;
}

export type ViewerFocusTarget =
  | { projection: "flat"; x: number; y?: number; hotspotId?: string }
  | { projection: "equirectangular"; yaw: number; pitch: number };

export type PickedCoordinate =
  | { projection: "flat"; x: number; y: number }
  | {
      projection: "equirectangular";
      yaw: number;
      pitch: number;
      x: number;
      y: number;
    };

export interface PanoramicViewerHandle {
  focusHotspot: (
    target: ViewerFocusTarget,
    options?: { animate?: boolean },
  ) => void;
  resetView: () => void;
}
