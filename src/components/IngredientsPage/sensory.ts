import { Qualities, QualityMap } from "./Qualities/Quality/data";
import { TasteMap, Tastes } from "./Taste/data";
import type {
  Ingredient,
  IngredientProperty,
  IngredientPropertyColors,
  SensoryIntensity,
  SensorySignal,
} from "./types";

export type SensoryKind = "taste" | "quality";

export interface SensoryDisplaySignal {
  kind: SensoryKind;
  id: string;
  label: string;
  intensity: SensoryIntensity;
  colors: IngredientPropertyColors;
  property: IngredientProperty;
  isKnown: boolean;
}

export interface IngredientSensoryProfile {
  tastes: SensoryDisplaySignal[];
  qualities: SensoryDisplaySignal[];
}

const DEFAULT_INTENSITY: SensoryIntensity = 3;

const fallbackTastePalettes: IngredientPropertyColors[] = [
  {
    bgGradientStart: "#e0f2fe",
    bgGradientStop: "#7dd3fc",
    bgGradientStartDark: "#bae6fd",
    bgGradientStopDark: "#38bdf8",
  },
  {
    bgGradientStart: "#ffedd5",
    bgGradientStop: "#fdba74",
    bgGradientStartDark: "#fed7aa",
    bgGradientStopDark: "#fb923c",
  },
  {
    bgGradientStart: "#dcfce7",
    bgGradientStop: "#86efac",
    bgGradientStartDark: "#bbf7d0",
    bgGradientStopDark: "#4ade80",
  },
  {
    bgGradientStart: "#ffe4e6",
    bgGradientStop: "#93c5fd",
    bgGradientStartDark: "#fecdd3",
    bgGradientStopDark: "#60a5fa",
  },
  {
    bgGradientStart: "#fef3c7",
    bgGradientStop: "#fcd34d",
    bgGradientStartDark: "#fde68a",
    bgGradientStopDark: "#fbbf24",
  },
];

const qualityPalettes: IngredientPropertyColors[] = [
  {
    bgGradientStart: "#ecfeff",
    bgGradientStop: "#67e8f9",
    bgGradientStartDark: "#164e63",
    bgGradientStopDark: "#22d3ee",
  },
  {
    bgGradientStart: "#f0fdf4",
    bgGradientStop: "#86efac",
    bgGradientStartDark: "#14532d",
    bgGradientStopDark: "#4ade80",
  },
  {
    bgGradientStart: "#fafafa",
    bgGradientStop: "#d4d4d4",
    bgGradientStartDark: "#404040",
    bgGradientStopDark: "#a3a3a3",
  },
  {
    bgGradientStart: "#f5f3ff",
    bgGradientStop: "#c4b5fd",
    bgGradientStartDark: "#312e81",
    bgGradientStopDark: "#a78bfa",
  },
  {
    bgGradientStart: "#fff7ed",
    bgGradientStop: "#fdba74",
    bgGradientStartDark: "#7c2d12",
    bgGradientStopDark: "#fb923c",
  },
];

const registryByKind: Record<
  SensoryKind,
  Record<string, IngredientProperty>
> = {
  taste: TasteMap,
  quality: QualityMap,
};

const propertiesByKind: Record<SensoryKind, IngredientProperty[]> = {
  taste: Tastes,
  quality: Qualities,
};

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function formatSensoryLabel(id: string): string {
  return id.replace(/[_-]+/g, " ").trim().toLowerCase();
}

function normalizeId(id: string): string {
  return id.trim().toLowerCase();
}

function normalizeIntensity(
  intensity: SensorySignal["intensity"],
): SensoryIntensity {
  return intensity && intensity >= 1 && intensity <= 5
    ? intensity
    : DEFAULT_INTENSITY;
}

function fallbackColorsFor(
  kind: SensoryKind,
  id: string,
): IngredientPropertyColors {
  const palettes = kind === "taste" ? fallbackTastePalettes : qualityPalettes;
  return palettes[hashString(`${kind}:${id}`) % palettes.length];
}

function fallbackPropertyFor(
  kind: SensoryKind,
  id: string,
): IngredientProperty {
  const label = formatSensoryLabel(id);
  const colors = fallbackColorsFor(kind, id);

  return {
    id,
    name: label,
    description:
      kind === "taste"
        ? `${label} is a custom taste note in this sensory profile.`
        : `${label} is a custom texture note in this sensory profile.`,
    bgThemeClasses:
      kind === "taste"
        ? "bg-gradient-to-r from-sky-100 to-emerald-200 dark:from-sky-200 dark:to-emerald-300 text-black"
        : "bg-gradient-to-r from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-900 text-neutral-900 dark:text-neutral-100",
    colors,
  };
}

function displaySignalFor(
  kind: SensoryKind,
  id: string,
  intensity: SensoryIntensity,
): SensoryDisplaySignal {
  const known = registryByKind[kind][id];
  const property = known ?? fallbackPropertyFor(kind, id);
  const colors = property.colors ?? fallbackColorsFor(kind, id);

  return {
    kind,
    id,
    label: property.name || formatSensoryLabel(id),
    intensity,
    colors,
    property,
    isKnown: Boolean(known),
  };
}

function normalizeSignals(
  kind: SensoryKind,
  legacyIds: readonly string[] | undefined,
  profile: readonly SensorySignal[] | undefined,
): SensoryDisplaySignal[] {
  const order: string[] = [];
  const intensityById = new Map<string, SensoryIntensity>();

  const add = (rawId: string, intensity: SensoryIntensity) => {
    const id = normalizeId(rawId);
    if (!id) return;
    if (!intensityById.has(id)) {
      order.push(id);
    }
    intensityById.set(id, intensity);
  };

  legacyIds?.forEach((id) => add(id, DEFAULT_INTENSITY));
  profile?.forEach((signal) =>
    add(signal.id, normalizeIntensity(signal.intensity)),
  );

  return order.map((id) =>
    displaySignalFor(kind, id, intensityById.get(id) ?? DEFAULT_INTENSITY),
  );
}

export function getIngredientSensoryProfile(
  ingredient: Ingredient,
): IngredientSensoryProfile {
  return {
    tastes: normalizeSignals(
      "taste",
      ingredient.properties.tastes,
      ingredient.properties.tasteProfile,
    ),
    qualities: normalizeSignals(
      "quality",
      ingredient.properties.qualities,
      ingredient.properties.qualityProfile,
    ),
  };
}

export function getSensoryProfileProperties(
  signal: SensoryDisplaySignal,
): IngredientProperty[] {
  if (signal.isKnown) {
    return propertiesByKind[signal.kind];
  }

  return [signal.property];
}
