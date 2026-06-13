import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import PanoramicViewer from "./PanoramicViewer";
import { IngredientMap } from "../IngredientsPage/data/species";
import { formatIngredientIdForDisplay } from "../../util/functions";
import { canonicalizeHotspotIdInput, getLayerLabel } from "./hotspotKnowledge";
import {
  isEquirectangularAspect,
  percentToYawPitch,
  yawPitchToPercent,
} from "./sphericalMath";
import {
  PT_INPUT,
  PT_PRIMARY_BUTTON,
  PT_SECONDARY_BUTTON,
  PT_SECONDARY_BUTTON_ACTIVE,
} from "./uiClasses";
import {
  applyResolvedMetadata,
  buildUniqueMarkerId,
  connectionListToText,
  connectionTextToList,
  EMPTY_PICKER_TOUCHED,
  formatLayersForSummary,
  getIngredientDefaultById,
  pickerPointToHotspot,
  resetDraftMetadataToResolved,
  type PickerDraftTouched,
  type PickerMetadataDraft,
  type PickerProjectionPoint,
  validatePointDraft,
} from "./hotspotPickerUtils";
import type { PanoramaProjection, TourHotspotV2, TourLayer } from "./types";

const EQUIRECTANGULAR_MAX_WIDTH = 8192;
const TOUR_LAYERS: TourLayer[] = [
  "canopy",
  "understory",
  "mid",
  "ground",
  "edge",
];

type PickerSourceMode = "default" | "upload" | "url";

type PickerPoint = PickerProjectionPoint;

interface PickerDraft extends PickerMetadataDraft {
  x: number;
  y: number;
  yaw: number;
  pitch: number;
}

const EMPTY_METADATA_DRAFT: PickerMetadataDraft = {
  id: "",
  kind: "ingredient",
  ingredientId: "",
  speciesName: "",
  shortLabel: "",
  stageLabel: "",
  layers: [],
  description: "",
  storyImageSrc: "",
  connections: [],
};

const EMPTY_DRAFT: PickerDraft = {
  ...EMPTY_METADATA_DRAFT,
  x: 0,
  y: 0,
  yaw: 0,
  pitch: 0,
};

const ALL_METADATA_TOUCHED: PickerDraftTouched = {
  id: true,
  speciesName: true,
  shortLabel: true,
  layers: true,
  description: true,
  connections: true,
  stageLabel: true,
  storyImageSrc: true,
};

const clonePointToDraft = (point: PickerPoint): PickerDraft => {
  if (point.projection === "flat") {
    const spherical = percentToYawPitch(point.x, point.y);
    return {
      ...point,
      x: point.x,
      y: point.y,
      yaw: spherical.yaw,
      pitch: spherical.pitch,
    };
  }

  return {
    ...point,
    x: point.x,
    y: point.y,
    yaw: point.yaw,
    pitch: point.pitch,
  };
};

const normalizeDraftForProjection = (
  draft: PickerDraft,
  projection: PanoramaProjection,
): PickerDraft => {
  if (projection === "flat") {
    const percent = yawPitchToPercent(draft.yaw, draft.pitch);
    return {
      ...draft,
      x: Number(percent.x.toFixed(2)),
      y: Number(percent.y.toFixed(2)),
    };
  }

  const spherical = percentToYawPitch(draft.x, draft.y);
  return {
    ...draft,
    yaw: Number(spherical.yaw.toFixed(2)),
    pitch: Number(spherical.pitch.toFixed(2)),
  };
};

const normalizeMetadataForPoint = (
  draft: PickerDraft,
  ingredientId: string,
): PickerMetadataDraft => ({
  id: draft.id,
  kind: draft.kind,
  ingredientId,
  speciesName: draft.speciesName.trim() || draft.shortLabel.trim() || draft.id,
  shortLabel: draft.shortLabel.trim() || draft.speciesName.trim() || draft.id,
  stageLabel: draft.stageLabel.trim(),
  layers: draft.layers,
  description: draft.description.trim(),
  storyImageSrc: draft.storyImageSrc.trim(),
  connections: draft.connections,
});

const buildPendingHotspot = (
  draft: PickerDraft,
  projectionMode: PanoramaProjection,
  hasCoordinates: boolean,
): TourHotspotV2[] => {
  if (!hasCoordinates) return [];

  const id = draft.id.trim() || "pending_marker";
  const base: Omit<TourHotspotV2, "position"> = {
    id,
    kind: draft.kind,
    ingredientId:
      draft.kind === "ingredient"
        ? canonicalizeHotspotIdInput(draft.ingredientId)
        : undefined,
    speciesName:
      draft.speciesName.trim() ||
      draft.shortLabel.trim() ||
      canonicalizeHotspotIdInput(draft.ingredientId) ||
      "Pending Marker",
    shortLabel: draft.shortLabel.trim() || "Pending Marker",
    stageLabel: draft.stageLabel.trim() || undefined,
    layers: draft.layers.length > 0 ? draft.layers : ["edge"],
    description:
      draft.description.trim() ||
      (draft.kind === "custom"
        ? "Custom marker pending integration text."
        : "Ingredient marker pending integration text."),
    storyImageSrc: draft.storyImageSrc.trim() || undefined,
    connections: draft.connections,
  };

  if (projectionMode === "flat") {
    return [
      {
        ...base,
        position: {
          projection: "flat",
          x: draft.x,
          y: draft.y,
        },
      },
    ];
  }

  return [
    {
      ...base,
      position: {
        projection: "equirectangular",
        yaw: draft.yaw,
        pitch: draft.pitch,
        x: draft.x,
        y: draft.y,
      },
    },
  ];
};

export default function HotspotPickerPage() {
  const [sourceMode, setSourceMode] = useState<PickerSourceMode>("default");
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [remoteUrlInput, setRemoteUrlInput] = useState("");
  const [remoteUrl, setRemoteUrl] = useState<string | null>(null);
  const [projectionMode, setProjectionMode] =
    useState<PanoramaProjection>("flat");
  const previousUrlRef = useRef<string | null>(null);

  const [draft, setDraft] = useState<PickerDraft>(EMPTY_DRAFT);
  const [draftTouched, setDraftTouched] =
    useState<PickerDraftTouched>(EMPTY_PICKER_TOUCHED);
  const [points, setPoints] = useState<PickerPoint[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [hasCoordinates, setHasCoordinates] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">(
    "idle",
  );
  const [isDownscaling, setIsDownscaling] = useState(false);
  const [imageMeta, setImageMeta] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const ingredientOptions = useMemo(
    () =>
      Object.keys(IngredientMap)
        .sort((a, b) => a.localeCompare(b))
        .map((id) => ({
          id,
          label: formatIngredientIdForDisplay(id),
        })),
    [],
  );

  useEffect(() => {
    return () => {
      if (previousUrlRef.current) {
        URL.revokeObjectURL(previousUrlRef.current);
      }
    };
  }, []);

  const replaceUploadedSource = useCallback((file: File) => {
    const nextUrl = URL.createObjectURL(file);

    if (previousUrlRef.current) {
      URL.revokeObjectURL(previousUrlRef.current);
    }

    previousUrlRef.current = nextUrl;
    setUploadedFile(file);
    setUploadedUrl(nextUrl);
    setSourceMode("upload");
  }, []);

  const viewerImageSrc =
    sourceMode === "default"
      ? "/t_panorama_3.webp"
      : sourceMode === "upload"
        ? (uploadedUrl ?? "/t_panorama_3.webp")
        : (remoteUrl ?? "/t_panorama_3.webp");

  useEffect(() => {
    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (cancelled) return;
      setImageMeta({ width: img.naturalWidth, height: img.naturalHeight });
    };

    img.onerror = () => {
      if (cancelled) return;
      setImageMeta(null);
    };

    img.src = viewerImageSrc;

    return () => {
      cancelled = true;
    };
  }, [viewerImageSrc]);

  const normalizedIngredientId = canonicalizeHotspotIdInput(draft.ingredientId);
  const resolvedIngredientDefault = useMemo(
    () => getIngredientDefaultById(normalizedIngredientId),
    [normalizedIngredientId],
  );

  const isEquirectangularValid = useMemo(() => {
    if (!imageMeta) return false;
    return isEquirectangularAspect(imageMeta.width, imageMeta.height);
  }, [imageMeta]);

  const isOversizedUpload =
    sourceMode === "upload" &&
    Boolean(imageMeta) &&
    (imageMeta?.width ?? 0) > EQUIRECTANGULAR_MAX_WIDTH;

  const projectionInvalidMessage =
    projectionMode === "equirectangular" &&
    imageMeta !== null &&
    !isEquirectangularValid
      ? "360 mode requires a 2:1 equirectangular image."
      : null;

  const submitBlockReason = validatePointDraft({
    hasCoordinates,
    kind: draft.kind,
    ingredientResolved: resolvedIngredientDefault,
    shortLabel: draft.shortLabel,
    description: draft.description,
    layers: draft.layers,
    projectionInvalidMessage,
  });

  const canSubmit = submitBlockReason === null;

  const resolvedSavedHotspots = useMemo(
    () => points.map((point) => pickerPointToHotspot(point)),
    [points],
  );

  const pendingMarker = useMemo(
    () => buildPendingHotspot(draft, projectionMode, hasCoordinates),
    [draft, hasCoordinates, projectionMode],
  );

  const allMarkers = [...resolvedSavedHotspots, ...pendingMarker];

  const clearDraft = () => {
    setDraft((prev) => ({
      ...EMPTY_DRAFT,
      kind: prev.kind,
    }));
    setDraftTouched(EMPTY_PICKER_TOUCHED);
    setEditingIndex(null);
    setHasCoordinates(false);
  };

  const beginEditingPoint = useCallback(
    (index: number) => {
      const point = points[index];
      if (!point) return;

      setEditingIndex(index);
      setProjectionMode(point.projection);
      setDraft(clonePointToDraft(point));
      setDraftTouched(ALL_METADATA_TOUCHED);
      setHasCoordinates(true);
    },
    [points],
  );

  const toggleLayer = (layer: TourLayer) => {
    setDraftTouched((prev) => ({ ...prev, layers: true }));
    setDraft((prev) => {
      if (prev.layers.includes(layer)) {
        return {
          ...prev,
          layers: prev.layers.filter((entry) => entry !== layer),
        };
      }

      return {
        ...prev,
        layers: [...prev.layers, layer],
      };
    });
  };

  const upsertPoint = () => {
    if (!canSubmit) return;

    const normalizedDraft = normalizeDraftForProjection(draft, projectionMode);
    const normalizedConnections = [
      ...new Set(
        normalizedDraft.connections
          .map((entry) => canonicalizeHotspotIdInput(entry))
          .filter(Boolean),
      ),
    ];
    const canonicalIngredientId =
      normalizedDraft.kind === "ingredient"
        ? canonicalizeHotspotIdInput(normalizedDraft.ingredientId)
        : "";

    const nextId = buildUniqueMarkerId({
      requestedId: draftTouched.id ? normalizedDraft.id : "",
      kind: normalizedDraft.kind,
      ingredientId: canonicalIngredientId,
      shortLabel: normalizedDraft.shortLabel,
      stageLabel: normalizedDraft.stageLabel,
      existingIds: points.map((point) => point.id),
      skipId: editingIndex !== null ? (points[editingIndex]?.id ?? null) : null,
    });

    const metadata = normalizeMetadataForPoint(
      {
        ...normalizedDraft,
        id: nextId,
        ingredientId: canonicalIngredientId,
        connections: normalizedConnections,
      },
      canonicalIngredientId,
    );

    const nextPoint: PickerPoint =
      projectionMode === "flat"
        ? {
            ...metadata,
            projection: "flat",
            x: Number(normalizedDraft.x.toFixed(2)),
            y: Number(normalizedDraft.y.toFixed(2)),
          }
        : {
            ...metadata,
            projection: "equirectangular",
            yaw: Number(normalizedDraft.yaw.toFixed(2)),
            pitch: Number(normalizedDraft.pitch.toFixed(2)),
            x: Number(normalizedDraft.x.toFixed(2)),
            y: Number(normalizedDraft.y.toFixed(2)),
          };

    if (editingIndex !== null) {
      setPoints((prev) => {
        const copy = [...prev];
        copy[editingIndex] = nextPoint;
        return copy;
      });
      clearDraft();
      return;
    }

    setPoints((prev) => [...prev, nextPoint]);
    clearDraft();
  };

  const exportPayload = useMemo(
    () => points.map((point) => pickerPointToHotspot(point)),
    [points],
  );

  const exportJson = useMemo(
    () => JSON.stringify(exportPayload, null, 2),
    [exportPayload],
  );

  const exportTs = useMemo(
    () =>
      `import type { TourHotspotV2 } from "../types";\n\nexport const pickedHotspots: TourHotspotV2[] = ${exportJson};`,
    [exportJson],
  );

  const exportCombined = `${exportJson}\n\n${exportTs}`;

  const copyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportCombined);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 1400);
    } catch {
      setCopyState("error");
      window.setTimeout(() => setCopyState("idle"), 1400);
    }
  };

  const downscaleUpload = async () => {
    if (
      !uploadedFile ||
      !imageMeta ||
      imageMeta.width <= EQUIRECTANGULAR_MAX_WIDTH
    ) {
      return;
    }

    setIsDownscaling(true);

    try {
      const bitmap = await createImageBitmap(uploadedFile);
      try {
        const scale = EQUIRECTANGULAR_MAX_WIDTH / bitmap.width;
        const targetWidth = EQUIRECTANGULAR_MAX_WIDTH;
        const targetHeight = Math.max(1, Math.round(bitmap.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        const context = canvas.getContext("2d");
        if (!context) {
          throw new Error("No 2D canvas context available.");
        }

        context.drawImage(bitmap, 0, 0, targetWidth, targetHeight);

        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob(resolve, "image/webp", 0.92);
        });

        if (!blob) {
          throw new Error("Failed to create downscaled image.");
        }

        const baseName = uploadedFile.name.replace(/\.[^/.]+$/, "");
        const downscaledFile = new File([blob], `${baseName}_8k.webp`, {
          type: "image/webp",
        });

        replaceUploadedSource(downscaledFile);
      } finally {
        bitmap.close();
      }
    } finally {
      setIsDownscaling(false);
    }
  };

  return (
    <div className="relative flex min-h-dvh w-full flex-col gap-[0.8rem] overflow-y-auto bg-[radial-gradient(circle_at_15%_20%,rgba(26,58,42,0.45),transparent_38%),radial-gradient(circle_at_85%_15%,rgba(101,67,33,0.28),transparent_42%),linear-gradient(180deg,#0d1712_0%,#101814_45%,#0f1613_100%)] px-[0.55rem] pb-[1.4rem] pt-[0.65rem] text-gray-200 md:px-[1.15rem] md:pb-[1.35rem] md:pt-4">
      <div className="z-30 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="m-0 text-[1.75rem]">Hotspot Coordinate Picker</h1>
          <p className="mt-[0.35rem] text-emerald-50/85">
            Add ingredient markers or custom markers, click the panorama, then
            export full hotspot objects.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-[0.55rem]">
          <Link
            to="/panoramic-tour/sample-tropical"
            className={PT_SECONDARY_BUTTON}
          >
            Back To Tour
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-[0.8rem] md:grid-cols-[minmax(0,1.25fr)_minmax(360px,540px)] md:items-start">
        <div className="rounded-2xl border border-emerald-200/25 bg-[rgba(3,8,5,0.7)] p-[0.7rem]">
          <div className="mb-[0.65rem] flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`${PT_SECONDARY_BUTTON} ${sourceMode === "default" ? PT_SECONDARY_BUTTON_ACTIVE : ""}`}
              onClick={() => setSourceMode("default")}
            >
              Use /t_panorama_3.webp
            </button>

            <button
              type="button"
              className={`${PT_SECONDARY_BUTTON} ${sourceMode === "upload" ? PT_SECONDARY_BUTTON_ACTIVE : ""}`}
              onClick={() => setSourceMode("upload")}
            >
              Upload Image
            </button>

            <button
              type="button"
              className={`${PT_SECONDARY_BUTTON} ${sourceMode === "url" ? PT_SECONDARY_BUTTON_ACTIVE : ""}`}
              onClick={() => setSourceMode("url")}
            >
              Use URL
            </button>

            <label
              className={`${PT_SECONDARY_BUTTON} relative overflow-hidden`}
            >
              <input
                type="file"
                accept="image/*"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  if (!file) return;
                  replaceUploadedSource(file);
                  event.currentTarget.value = "";
                }}
              />
              Choose File
            </label>
          </div>

          {sourceMode === "url" ? (
            <div className="mb-[0.65rem] flex flex-wrap items-center gap-2">
              <input
                className={`${PT_INPUT} min-w-0 flex-1`}
                value={remoteUrlInput}
                onChange={(event) => setRemoteUrlInput(event.target.value)}
                placeholder="https://assets.perillacove.com/my-panorama.webp"
              />
              <button
                type="button"
                className={PT_SECONDARY_BUTTON}
                onClick={() => {
                  const next = remoteUrlInput.trim();
                  setRemoteUrl(next.length > 0 ? next : null);
                  setSourceMode("url");
                }}
              >
                Apply URL
              </button>
            </div>
          ) : null}

          <div className="mb-[0.65rem] flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={`${PT_SECONDARY_BUTTON} ${projectionMode === "flat" ? PT_SECONDARY_BUTTON_ACTIVE : ""}`}
              onClick={() => {
                setProjectionMode("flat");
                setDraft((prev) => normalizeDraftForProjection(prev, "flat"));
              }}
            >
              Flat (legacy)
            </button>
            <button
              type="button"
              className={`${PT_SECONDARY_BUTTON} ${projectionMode === "equirectangular" ? PT_SECONDARY_BUTTON_ACTIVE : ""}`}
              onClick={() => {
                setProjectionMode("equirectangular");
                setDraft((prev) =>
                  normalizeDraftForProjection(prev, "equirectangular"),
                );
              }}
            >
              360 (equirectangular)
            </button>
            {imageMeta ? (
              <span className="text-[0.75rem] text-emerald-100/80">
                Image: {imageMeta.width}×{imageMeta.height}
              </span>
            ) : null}
          </div>

          {projectionInvalidMessage ? (
            <p className="mb-[0.55rem] text-[0.8rem] text-amber-200">
              {projectionInvalidMessage}
            </p>
          ) : null}

          {isOversizedUpload ? (
            <div className="mb-[0.55rem] flex flex-wrap items-center gap-2 rounded-[0.6rem] border border-amber-300/30 bg-amber-950/30 px-2 py-1.5 text-[0.76rem] text-amber-100">
              <span>
                Width exceeds {EQUIRECTANGULAR_MAX_WIDTH}px. Downscale is
                recommended for performance.
              </span>
              <button
                type="button"
                className={PT_SECONDARY_BUTTON}
                onClick={downscaleUpload}
                disabled={isDownscaling}
              >
                {isDownscaling ? "Downscaling..." : "Downscale to 8K"}
              </button>
            </div>
          ) : null}

          <PanoramicViewer
            imageSrc={viewerImageSrc}
            projection={projectionMode}
            hotspots={allMarkers}
            activeHotspotId={
              editingIndex !== null ? (points[editingIndex]?.id ?? null) : null
            }
            onHotspotSelect={(hotspotId) => {
              const index = points.findIndex((point) => point.id === hotspotId);
              if (index < 0) return;
              beginEditingPoint(index);
            }}
            onCoordinatePick={(point) => {
              if (point.projection === "flat") {
                const spherical = percentToYawPitch(point.x, point.y);
                setDraft((prev) => ({
                  ...prev,
                  x: point.x,
                  y: point.y,
                  yaw: Number(spherical.yaw.toFixed(2)),
                  pitch: Number(spherical.pitch.toFixed(2)),
                }));
              } else {
                setDraft((prev) => ({
                  ...prev,
                  x: point.x,
                  y: point.y,
                  yaw: point.yaw,
                  pitch: point.pitch,
                }));
              }
              setHasCoordinates(true);
            }}
            autoPanHint={false}
            className={
              projectionMode === "equirectangular"
                ? "h-[calc(100dvh-13.5rem)] min-h-[460px] md:h-[calc(100dvh-12rem)]"
                : "h-[clamp(280px,52dvh,620px)]"
            }
          />
        </div>

        <div className="grid grid-cols-1 gap-[0.8rem]">
          <div className="rounded-2xl border border-emerald-200/20 bg-[rgba(3,8,5,0.75)] p-[0.8rem]">
            <h2 className="m-0 text-[1.05rem]">Current Point</h2>

            <div className="mt-[0.55rem] flex flex-wrap items-center gap-2">
              <button
                type="button"
                className={`${PT_SECONDARY_BUTTON} ${draft.kind === "ingredient" ? PT_SECONDARY_BUTTON_ACTIVE : ""}`}
                onClick={() => {
                  setDraft((prev) => ({ ...prev, kind: "ingredient" }));
                }}
              >
                Ingredient Marker
              </button>
              <button
                type="button"
                className={`${PT_SECONDARY_BUTTON} ${draft.kind === "custom" ? PT_SECONDARY_BUTTON_ACTIVE : ""}`}
                onClick={() => {
                  setDraft((prev) => ({
                    ...prev,
                    kind: "custom",
                    ingredientId: "",
                  }));
                }}
              >
                Custom Marker
              </button>
            </div>

            <div className="mt-[0.65rem] grid grid-cols-1 gap-[0.55rem] md:grid-cols-2">
              <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90">
                Marker ID
                <input
                  className={PT_INPUT}
                  value={draft.id}
                  onChange={(event) => {
                    setDraftTouched((prev) => ({ ...prev, id: true }));
                    setDraft((prev) => ({ ...prev, id: event.target.value }));
                    setEditingIndex(null);
                  }}
                  placeholder="banana_infant"
                />
              </label>

              {draft.kind === "ingredient" ? (
                <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90">
                  Ingredient ID
                  <select
                    className={PT_INPUT}
                    value={draft.ingredientId}
                    onChange={(event) => {
                      const nextRaw = event.target.value;
                      const resolved = getIngredientDefaultById(
                        canonicalizeHotspotIdInput(nextRaw),
                      );

                      setDraft((prev) =>
                        applyResolvedMetadata(
                          {
                            ...prev,
                            ingredientId: nextRaw,
                          },
                          resolved,
                          draftTouched,
                        ),
                      );
                      setEditingIndex(null);
                    }}
                  >
                    <option value="">Select ingredient...</option>
                    {ingredientOptions.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.label} ({option.id})
                      </option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90">
                  Custom Type
                  <input
                    className={`${PT_INPUT} text-slate-300/90`}
                    value="custom"
                    readOnly
                  />
                </label>
              )}

              <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90">
                Species Name
                <input
                  className={PT_INPUT}
                  value={draft.speciesName}
                  onChange={(event) => {
                    setDraftTouched((prev) => ({ ...prev, speciesName: true }));
                    setDraft((prev) => ({
                      ...prev,
                      speciesName: event.target.value,
                    }));
                  }}
                  placeholder="Jackfruit"
                />
              </label>

              <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90">
                Short Label
                <input
                  className={PT_INPUT}
                  value={draft.shortLabel}
                  onChange={(event) => {
                    setDraftTouched((prev) => ({ ...prev, shortLabel: true }));
                    setDraft((prev) => ({
                      ...prev,
                      shortLabel: event.target.value,
                    }));
                  }}
                  placeholder="Jackfruit - Mid-layer"
                />
              </label>

              <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90">
                Stage (optional)
                <input
                  className={PT_INPUT}
                  value={draft.stageLabel}
                  onChange={(event) => {
                    setDraftTouched((prev) => ({ ...prev, stageLabel: true }));
                    setDraft((prev) => ({
                      ...prev,
                      stageLabel: event.target.value,
                    }));
                  }}
                  placeholder="infant / middle / late"
                />
              </label>

              <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90 md:col-span-2">
                Layers
                <div className="flex flex-wrap gap-2">
                  {TOUR_LAYERS.map((layer) => {
                    const active = draft.layers.includes(layer);
                    return (
                      <button
                        key={layer}
                        type="button"
                        className={`${PT_SECONDARY_BUTTON} ${active ? PT_SECONDARY_BUTTON_ACTIVE : ""}`}
                        onClick={() => toggleLayer(layer)}
                      >
                        {getLayerLabel(layer)}
                      </button>
                    );
                  })}
                </div>
              </label>

              <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90 md:col-span-2">
                Integration Text
                <textarea
                  className={`${PT_INPUT} min-h-[100px]`}
                  value={draft.description}
                  onChange={(event) => {
                    setDraftTouched((prev) => ({ ...prev, description: true }));
                    setDraft((prev) => ({
                      ...prev,
                      description: event.target.value,
                    }));
                  }}
                  placeholder="Describe this marker's role in the forest integration."
                />
              </label>

              <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90 md:col-span-2">
                Integration Image URL (optional)
                <input
                  className={PT_INPUT}
                  value={draft.storyImageSrc}
                  onChange={(event) => {
                    setDraftTouched((prev) => ({
                      ...prev,
                      storyImageSrc: true,
                    }));
                    setDraft((prev) => ({
                      ...prev,
                      storyImageSrc: event.target.value,
                    }));
                  }}
                  placeholder="https://assets.perillacove.com/example.webp"
                />
              </label>

              <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90 md:col-span-2">
                Connections (ingredient IDs, comma-separated)
                <input
                  className={PT_INPUT}
                  value={connectionListToText(draft.connections)}
                  onChange={(event) => {
                    setDraftTouched((prev) => ({ ...prev, connections: true }));
                    setDraft((prev) => ({
                      ...prev,
                      connections: connectionTextToList(event.target.value),
                    }));
                  }}
                  placeholder="durian, cacao"
                />
              </label>

              <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90">
                X (%)
                <input
                  className={`${PT_INPUT} text-slate-300/90`}
                  value={hasCoordinates ? draft.x.toFixed(2) : ""}
                  readOnly
                />
              </label>

              <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90">
                Y (%)
                <input
                  className={`${PT_INPUT} text-slate-300/90`}
                  value={hasCoordinates ? draft.y.toFixed(2) : ""}
                  readOnly
                />
              </label>

              <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90">
                Yaw (deg)
                <input
                  className={`${PT_INPUT} text-slate-300/90`}
                  value={hasCoordinates ? draft.yaw.toFixed(2) : ""}
                  readOnly
                />
              </label>

              <label className="flex flex-col gap-[0.26rem] text-[0.79rem] text-emerald-50/90">
                Pitch (deg)
                <input
                  className={`${PT_INPUT} text-slate-300/90`}
                  value={hasCoordinates ? draft.pitch.toFixed(2) : ""}
                  readOnly
                />
              </label>
            </div>

            {draft.kind === "ingredient" &&
            !resolvedIngredientDefault &&
            normalizedIngredientId ? (
              <p className="mt-[0.55rem] text-[0.8rem] text-red-300">
                ID not found in ingredients catalog:{" "}
                <code className="text-red-200">{normalizedIngredientId}</code>
              </p>
            ) : null}

            <div className="mt-[0.65rem] flex flex-wrap items-center gap-[0.55rem]">
              <button
                type="button"
                className={PT_PRIMARY_BUTTON}
                onClick={upsertPoint}
                disabled={!canSubmit}
              >
                {editingIndex !== null ? "Update Point" : "Add Point"}
              </button>
              <button
                type="button"
                className={PT_SECONDARY_BUTTON}
                onClick={clearDraft}
              >
                Clear
              </button>
              {draft.kind === "ingredient" ? (
                <button
                  type="button"
                  className={PT_SECONDARY_BUTTON}
                  disabled={!resolvedIngredientDefault}
                  onClick={() => {
                    setDraftTouched(EMPTY_PICKER_TOUCHED);
                    setDraft((prev) =>
                      resetDraftMetadataToResolved(
                        prev,
                        resolvedIngredientDefault,
                      ),
                    );
                  }}
                >
                  Reset Defaults
                </button>
              ) : null}
            </div>

            {!canSubmit && submitBlockReason ? (
              <p className="mt-[0.45rem] text-[0.76rem] text-amber-200/90">
                {submitBlockReason}
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-emerald-200/20 bg-[rgba(3,8,5,0.75)] p-[0.8rem]">
            <h2 className="m-0 text-[1.05rem]">
              Saved Points ({points.length})
            </h2>
            <div className="mt-[0.55rem] grid gap-[0.45rem]">
              {points.map((point, index) => (
                <div
                  key={`${point.id}-${index}`}
                  className="flex items-center justify-between gap-2 rounded-[0.7rem] border border-emerald-200/15 bg-[rgba(8,16,11,0.62)] px-[0.45rem] py-[0.32rem]"
                >
                  <button
                    type="button"
                    className="flex cursor-pointer flex-col items-start gap-[0.08rem] border-0 bg-transparent text-slate-50"
                    onClick={() => beginEditingPoint(index)}
                  >
                    <strong>{point.id}</strong>
                    <span className="text-[0.73rem] text-slate-300/85">
                      {point.kind === "ingredient"
                        ? `ingredient: ${point.ingredientId}`
                        : "custom"}{" "}
                      | {point.shortLabel}
                    </span>
                    <span className="text-[0.73rem] text-slate-300/85">
                      {point.x.toFixed(2)}%, {point.y.toFixed(2)}%
                      {point.projection === "equirectangular"
                        ? ` | yaw ${point.yaw.toFixed(2)} pitch ${point.pitch.toFixed(2)}`
                        : ""}
                    </span>
                    <span className="text-[0.73rem] text-slate-300/75">
                      {point.stageLabel ? `${point.stageLabel} · ` : ""}
                      {formatLayersForSummary(point.layers)}
                    </span>
                  </button>

                  <div className="inline-flex gap-1">
                    <button
                      type="button"
                      className="inline-flex h-[1.55rem] w-[1.55rem] items-center justify-center rounded-full border border-emerald-200/25 bg-[rgba(4,10,7,0.92)] text-[0.66rem] text-slate-200 transition hover:bg-[rgba(15,23,19,0.94)]"
                      onClick={() =>
                        setPoints((prev) => {
                          if (index <= 0) return prev;
                          const copy = [...prev];
                          [copy[index - 1], copy[index]] = [
                            copy[index],
                            copy[index - 1],
                          ];
                          return copy;
                        })
                      }
                      aria-label="Move up"
                    >
                      Up
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-[1.55rem] w-[1.55rem] items-center justify-center rounded-full border border-emerald-200/25 bg-[rgba(4,10,7,0.92)] text-[0.66rem] text-slate-200 transition hover:bg-[rgba(15,23,19,0.94)]"
                      onClick={() =>
                        setPoints((prev) => {
                          if (index >= prev.length - 1) return prev;
                          const copy = [...prev];
                          [copy[index + 1], copy[index]] = [
                            copy[index],
                            copy[index + 1],
                          ];
                          return copy;
                        })
                      }
                      aria-label="Move down"
                    >
                      Dn
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-[1.55rem] w-[1.55rem] items-center justify-center rounded-full border border-emerald-200/25 bg-[rgba(4,10,7,0.92)] text-[0.66rem] text-slate-200 transition hover:bg-[rgba(15,23,19,0.94)]"
                      onClick={() =>
                        setPoints((prev) => prev.filter((_, i) => i !== index))
                      }
                      aria-label="Delete"
                    >
                      X
                    </button>
                  </div>
                </div>
              ))}
              {points.length === 0 ? (
                <p className="m-0 text-[0.84rem] text-slate-300/80">
                  No points yet. Click the image to start.
                </p>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-200/20 bg-[rgba(3,8,5,0.75)] p-[0.8rem]">
            <div className="flex items-center justify-between gap-2">
              <h2 className="m-0 text-[1.05rem]">Export Hotspots</h2>
              <button
                type="button"
                className={PT_PRIMARY_BUTTON}
                onClick={copyExport}
              >
                {copyState === "copied"
                  ? "Copied"
                  : copyState === "error"
                    ? "Copy Failed"
                    : "Copy"}
              </button>
            </div>
            <textarea
              readOnly
              value={exportCombined}
              className={`${PT_INPUT} mt-[0.55rem] min-h-[220px] w-full font-mono leading-[1.4]`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
