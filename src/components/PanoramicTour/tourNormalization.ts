import { percentToYawPitch, yawPitchToPercent } from "./sphericalMath";
import {
  canonicalizeIngredientId,
  normalizeIngredientOverridesById,
  resolveIngredientById,
} from "../IngredientsPage/data";
import type {
  HotspotKind,
  HotspotPosition,
  NormalizedPanoramaNode,
  NormalizedPanoramaTourData,
  NormalizedTourHotspot,
  PanoramaNode,
  PanoramaProjection,
  PanoramaTourForestWorkspace,
  PanoramaTourSource,
  PanoramaTourData,
  PanoramaTourDataV2,
  TourHotspot,
  TourHotspotV2,
} from "./types";

const LEGACY_NODE_ID = "main";
const DEFAULT_TOUR_SOURCE: PanoramaTourSource = {
  kind: "concept",
  label: "Concept",
};

const isPanoramaTourDataV2 = (
  tour: PanoramaTourData,
): tour is PanoramaTourDataV2 => "nodes" in tour && Array.isArray(tour.nodes);

const isHotspotV2 = (hotspot: TourHotspot): hotspot is TourHotspotV2 =>
  "position" in hotspot;

const deriveIngredientId = (
  hotspot: Pick<TourHotspot, "id" | "ingredientId">,
): string | undefined => {
  if (hotspot.ingredientId) {
    return hotspot.ingredientId;
  }

  const canonicalId = canonicalizeIngredientId(hotspot.id);
  return resolveIngredientById(canonicalId) ? canonicalId : undefined;
};

const deriveHotspotKind = (
  hotspot: Pick<TourHotspot, "kind" | "ingredientId" | "id">,
): HotspotKind =>
  hotspot.kind ?? (deriveIngredientId(hotspot) ? "ingredient" : "custom");

const deriveLayers = (
  hotspot: Pick<TourHotspot, "layers" | "layer">,
): NormalizedTourHotspot["layers"] => {
  if (hotspot.layers && hotspot.layers.length > 0) {
    return hotspot.layers;
  }

  if (hotspot.layer) {
    return [hotspot.layer];
  }

  return ["edge"];
};

const normalizeHotspotBase = (
  hotspot: TourHotspot,
): Omit<NormalizedTourHotspot, "position" | "percent"> => {
  const ingredientId = deriveIngredientId(hotspot);

  return {
    id: hotspot.id,
    ingredientId,
    kind: deriveHotspotKind(hotspot),
    speciesName: hotspot.speciesName,
    layers: deriveLayers(hotspot),
    stageLabel: hotspot.stageLabel,
    shortLabel: hotspot.shortLabel,
    description: hotspot.description,
    storyImageSrc: hotspot.storyImageSrc,
    connections: hotspot.connections,
    icon: hotspot.icon,
  };
};

const toNormalizedPosition = (
  hotspot: TourHotspot,
  nodeProjection: PanoramaProjection,
): { position: HotspotPosition; percent: { x: number; y: number } } => {
  if (!isHotspotV2(hotspot)) {
    if (nodeProjection === "equirectangular") {
      const converted = percentToYawPitch(hotspot.x, hotspot.y);
      return {
        position: {
          projection: "equirectangular",
          yaw: converted.yaw,
          pitch: converted.pitch,
          x: hotspot.x,
          y: hotspot.y,
        },
        percent: { x: hotspot.x, y: hotspot.y },
      };
    }

    return {
      position: {
        projection: "flat",
        x: hotspot.x,
        y: hotspot.y,
      },
      percent: { x: hotspot.x, y: hotspot.y },
    };
  }

  if (hotspot.position.projection === "flat") {
    return {
      position: hotspot.position,
      percent: { x: hotspot.position.x, y: hotspot.position.y },
    };
  }

  const fallbackPercent = yawPitchToPercent(
    hotspot.position.yaw,
    hotspot.position.pitch,
  );
  const percent = {
    x: hotspot.position.x ?? fallbackPercent.x,
    y: hotspot.position.y ?? fallbackPercent.y,
  };

  return {
    position: {
      projection: "equirectangular",
      yaw: hotspot.position.yaw,
      pitch: hotspot.position.pitch,
      x: percent.x,
      y: percent.y,
    },
    percent,
  };
};

const normalizeNode = (node: PanoramaNode): NormalizedPanoramaNode => ({
  id: node.id,
  imageSrc: node.imageSrc,
  projection: node.projection,
  hotspots: node.hotspots.map((hotspot): NormalizedTourHotspot => {
    const normalized = toNormalizedPosition(hotspot, node.projection);
    return {
      ...normalizeHotspotBase(hotspot),
      position: normalized.position,
      percent: normalized.percent,
    };
  }),
  links: node.links ?? [],
});

const normalizeTourSource = (
  source?: PanoramaTourSource,
): PanoramaTourSource => {
  if (!source) {
    return { ...DEFAULT_TOUR_SOURCE };
  }

  const label = source.label.trim();

  if (label) {
    return {
      ...source,
      label,
    };
  }

  return {
    ...source,
    label: source.kind === "real" ? "Real" : DEFAULT_TOUR_SOURCE.label,
  };
};

const normalizeTourForestWorkspace = (
  forestWorkspace?: PanoramaTourForestWorkspace,
): PanoramaTourForestWorkspace | null => {
  if (!forestWorkspace) {
    return null;
  }

  const rawSpeciesIds =
    forestWorkspace.speciesIds ?? forestWorkspace.ingredientIds ?? [];
  const speciesIds = [
    ...new Set(
      rawSpeciesIds.map((speciesId) => speciesId.trim()).filter(Boolean),
    ),
  ];

  if (speciesIds.length === 0) {
    return null;
  }

  const normalizeCountConfig = (
    rawConfig: Record<string, number> | undefined,
  ): Record<string, number> | undefined => {
    if (!rawConfig) return undefined;

    const normalizedConfig = Object.fromEntries(
      Object.entries(rawConfig).flatMap(([id, count]) => {
        const normalizedId = id.trim();
        if (!normalizedId || !speciesIds.includes(normalizedId)) {
          return [];
        }

        const numericCount = Number(count);
        if (!Number.isFinite(numericCount) || numericCount <= 0) {
          return [];
        }

        return [[normalizedId, Math.floor(numericCount)]];
      }),
    );

    return Object.keys(normalizedConfig).length > 0
      ? normalizedConfig
      : undefined;
  };

  const speciesCountConfig = normalizeCountConfig(
    forestWorkspace.speciesCountConfig,
  );
  const respawnConfig = normalizeCountConfig(forestWorkspace.respawnConfig);
  const normalizedInitialYear = Number(forestWorkspace.initialYear);
  const initialYear =
    Number.isFinite(normalizedInitialYear) && normalizedInitialYear >= 0
      ? normalizedInitialYear
      : undefined;
  const normalizedInitialDuration = Number(forestWorkspace.initialDuration);
  const initialDuration =
    Number.isFinite(normalizedInitialDuration) && normalizedInitialDuration > 0
      ? normalizedInitialDuration
      : undefined;
  const normalizedSceneCameraDistanceScale = Number(
    forestWorkspace.sceneCameraDistanceScale,
  );
  const sceneCameraDistanceScale =
    Number.isFinite(normalizedSceneCameraDistanceScale) &&
    normalizedSceneCameraDistanceScale > 0
      ? normalizedSceneCameraDistanceScale
      : undefined;

  return {
    speciesIds,
    ingredientIds: speciesIds,
    ...(speciesCountConfig ? { speciesCountConfig } : {}),
    ...(respawnConfig ? { respawnConfig } : {}),
    ...(initialYear !== undefined ? { initialYear } : {}),
    ...(initialDuration !== undefined ? { initialDuration } : {}),
    ...(forestWorkspace.showInHotspotStory ? { showInHotspotStory: true } : {}),
    ...(typeof forestWorkspace.forceDarkMode === "boolean"
      ? { forceDarkMode: forestWorkspace.forceDarkMode }
      : {}),
    ...(typeof forestWorkspace.sceneForceDarkMode === "boolean"
      ? { sceneForceDarkMode: forestWorkspace.sceneForceDarkMode }
      : {}),
    ...(typeof forestWorkspace.sceneControlsExpandedDefault === "boolean"
      ? {
          sceneControlsExpandedDefault:
            forestWorkspace.sceneControlsExpandedDefault,
        }
      : {}),
    ...(typeof forestWorkspace.showGroundDressing === "boolean"
      ? { showGroundDressing: forestWorkspace.showGroundDressing }
      : {}),
    ...(sceneCameraDistanceScale !== undefined
      ? { sceneCameraDistanceScale }
      : {}),
    ffBrand: forestWorkspace.ffBrand ?? "forest",
  };
};

export const normalizePanoramaTourData = (
  tour: PanoramaTourData,
): NormalizedPanoramaTourData => {
  if (!isPanoramaTourDataV2(tour)) {
    const legacyNode: NormalizedPanoramaNode = {
      id: LEGACY_NODE_ID,
      imageSrc: tour.imageSrc,
      projection: "flat",
      hotspots: tour.hotspots.map(
        (hotspot): NormalizedTourHotspot => ({
          ...normalizeHotspotBase(hotspot),
          position: {
            projection: "flat",
            x: hotspot.x,
            y: hotspot.y,
          },
          percent: { x: hotspot.x, y: hotspot.y },
        }),
      ),
      links: [],
    };

    return {
      id: tour.id,
      title: tour.title,
      subtitle: tour.subtitle,
      story: tour.story,
      source: normalizeTourSource(tour.source),
      forestWorkspace: normalizeTourForestWorkspace(tour.forestWorkspace),
      ingredientOverridesById: normalizeIngredientOverridesById(
        tour.ingredientOverridesById,
      ),
      nodes: [legacyNode],
      initialNodeId: LEGACY_NODE_ID,
    };
  }

  const nodes = tour.nodes.map((node) => normalizeNode(node));
  const fallbackNodeId = nodes[0]?.id ?? LEGACY_NODE_ID;
  const initialNodeId =
    tour.initialNodeId && nodes.some((node) => node.id === tour.initialNodeId)
      ? tour.initialNodeId
      : fallbackNodeId;

  return {
    id: tour.id,
    title: tour.title,
    subtitle: tour.subtitle,
    story: tour.story,
    source: normalizeTourSource(tour.source),
    forestWorkspace: normalizeTourForestWorkspace(tour.forestWorkspace),
    ingredientOverridesById: normalizeIngredientOverridesById(
      tour.ingredientOverridesById,
    ),
    nodes,
    initialNodeId,
  };
};
