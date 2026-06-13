import {
  canonicalizeHotspotIdInput,
  getLayerLabel,
  resolveHotspotById,
} from "./hotspotKnowledge";
import type {
  HotspotKind,
  TourHotspotBase,
  TourHotspotV2,
  TourLayer,
} from "./types";

export interface PickerMetadataDraft {
  id: string;
  kind: HotspotKind;
  ingredientId: string;
  speciesName: string;
  shortLabel: string;
  stageLabel: string;
  layers: TourLayer[];
  description: string;
  storyImageSrc: string;
  connections: string[];
}

export type PickerProjectionPoint =
  | (PickerMetadataDraft & {
      projection: "flat";
      x: number;
      y: number;
    })
  | (PickerMetadataDraft & {
      projection: "equirectangular";
      x: number;
      y: number;
      yaw: number;
      pitch: number;
    });

export interface PickerDraftTouched {
  id: boolean;
  speciesName: boolean;
  shortLabel: boolean;
  layers: boolean;
  description: boolean;
  connections: boolean;
  stageLabel: boolean;
  storyImageSrc: boolean;
}

export const EMPTY_PICKER_TOUCHED: PickerDraftTouched = {
  id: false,
  speciesName: false,
  shortLabel: false,
  layers: false,
  description: false,
  connections: false,
  stageLabel: false,
  storyImageSrc: false,
};

const EMPTY_DERIVED_LAYERS: TourLayer[] = ["edge"];

const joinLabels = (layers: readonly TourLayer[]): string =>
  layers.map((layer) => getLayerLabel(layer)).join(", ");

const toMarkerSlug = (rawValue: string): string => {
  const canonical = canonicalizeHotspotIdInput(rawValue);
  if (canonical) {
    return canonical;
  }

  return rawValue
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
};

export const buildMarkerIdBase = ({
  kind,
  ingredientId,
  shortLabel,
  stageLabel,
}: {
  kind: HotspotKind;
  ingredientId: string;
  shortLabel: string;
  stageLabel?: string;
}): string => {
  const idSource =
    kind === "ingredient" ? ingredientId : shortLabel.trim().toLowerCase();
  const idBase = toMarkerSlug(idSource) || "marker";
  const stage = toMarkerSlug(stageLabel ?? "");
  if (!stage) return idBase;
  return `${idBase}_${stage}`;
};

export const buildUniqueMarkerId = ({
  requestedId,
  kind,
  ingredientId,
  shortLabel,
  stageLabel,
  existingIds,
  skipId,
}: {
  requestedId: string;
  kind: HotspotKind;
  ingredientId: string;
  shortLabel: string;
  stageLabel?: string;
  existingIds: readonly string[];
  skipId?: string | null;
}): string => {
  const taken = new Set(existingIds.filter((id) => id !== skipId));
  const canonicalRequested = toMarkerSlug(requestedId);
  const base =
    canonicalRequested ||
    buildMarkerIdBase({ kind, ingredientId, shortLabel, stageLabel });

  if (!taken.has(base)) return base;

  let suffix = 2;
  while (taken.has(`${base}_${suffix}`)) {
    suffix += 1;
  }

  return `${base}_${suffix}`;
};

export const applyResolvedMetadata = <T extends PickerMetadataDraft>(
  draft: T,
  resolved: TourHotspotBase | null,
  touched: PickerDraftTouched,
): T => {
  if (!resolved) return draft;

  const next: T = { ...draft };

  if (!touched.speciesName) {
    next.speciesName = resolved.speciesName;
  }
  if (!touched.shortLabel) {
    next.shortLabel = resolved.shortLabel;
  }
  if (!touched.layers) {
    next.layers =
      resolved.layers.length > 0 ? resolved.layers : EMPTY_DERIVED_LAYERS;
  }
  if (!touched.description) {
    next.description = resolved.description;
  }
  if (!touched.connections) {
    next.connections = resolved.connections;
  }
  if (!touched.id) {
    next.id = resolved.id;
  }

  return next;
};

export const resetDraftMetadataToResolved = <T extends PickerMetadataDraft>(
  draft: T,
  resolved: TourHotspotBase | null,
): T => {
  if (!resolved) return draft;

  return {
    ...draft,
    id: resolved.id,
    speciesName: resolved.speciesName,
    shortLabel: resolved.shortLabel,
    layers: resolved.layers.length > 0 ? resolved.layers : EMPTY_DERIVED_LAYERS,
    description: resolved.description,
    connections: resolved.connections,
  };
};

export const getIngredientDefaultById = (
  rawIngredientId: string,
): TourHotspotBase | null =>
  resolveHotspotById(canonicalizeHotspotIdInput(rawIngredientId));

export const validatePointDraft = ({
  hasCoordinates,
  kind,
  ingredientResolved,
  shortLabel,
  description,
  layers,
  projectionInvalidMessage,
}: {
  hasCoordinates: boolean;
  kind: HotspotKind;
  ingredientResolved: TourHotspotBase | null;
  shortLabel: string;
  description: string;
  layers: TourLayer[];
  projectionInvalidMessage: string | null;
}): string | null => {
  if (!hasCoordinates) {
    return "Click the panorama to capture coordinates first.";
  }
  if (projectionInvalidMessage) {
    return projectionInvalidMessage;
  }
  if (layers.length === 0) {
    return "Select at least one forest layer.";
  }
  if (kind === "ingredient" && !ingredientResolved) {
    return "Enter a valid ingredient ID.";
  }
  if (kind === "custom") {
    if (!shortLabel.trim()) {
      return "Custom markers require a short label.";
    }
    if (!description.trim()) {
      return "Custom markers require integration text.";
    }
  }

  return null;
};

export const connectionListToText = (connections: readonly string[]): string =>
  connections.join(", ");

export const connectionTextToList = (value: string): string[] =>
  value
    .split(",")
    .map((entry) => canonicalizeHotspotIdInput(entry))
    .filter(Boolean);

export const formatLayersForSummary = (layers: readonly TourLayer[]): string =>
  joinLabels(layers);

export const pickerPointToHotspot = (
  point: PickerProjectionPoint,
): TourHotspotV2 => {
  const base: Omit<TourHotspotV2, "position"> = {
    id: point.id,
    kind: point.kind,
    ingredientId: point.kind === "ingredient" ? point.ingredientId : undefined,
    speciesName: point.speciesName,
    shortLabel: point.shortLabel,
    stageLabel: point.stageLabel || undefined,
    layers: point.layers,
    description: point.description,
    storyImageSrc: point.storyImageSrc || undefined,
    connections: point.connections,
  };

  if (point.projection === "flat") {
    return {
      ...base,
      position: {
        projection: "flat",
        x: point.x,
        y: point.y,
      },
    };
  }

  return {
    ...base,
    position: {
      projection: "equirectangular",
      yaw: point.yaw,
      pitch: point.pitch,
      x: point.x,
      y: point.y,
    },
  };
};
