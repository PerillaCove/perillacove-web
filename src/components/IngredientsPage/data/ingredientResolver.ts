import type { Ingredient } from "../types";
import { IngredientMap } from "./species";

/**
 * Contextual ingredient profile resolver.
 *
 * Why this exists:
 * - `ingredients.ts` is the canonical default catalog.
 * - Some contexts (tour/region/cultivar) need local profile tweaks.
 * - We want those tweaks applied at read-time without mutating global catalog data.
 */
type Primitive = string | number | boolean | symbol | bigint | null | undefined;

type DeepPartial<T> = T extends Primitive
  ? T
  : T extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T extends ReadonlyArray<infer U>
      ? ReadonlyArray<DeepPartial<U>>
      : { [K in keyof T]?: DeepPartial<T[K]> };

export type IngredientOverride = DeepPartial<Ingredient>;
export type IngredientOverrideMap = Record<string, IngredientOverride>;
export type IngredientResolver = (ingredientId: string) => Ingredient | null;

interface ResolveIngredientByIdOptions {
  overridesById?: IngredientOverrideMap;
  baseMap?: Record<string, Ingredient>;
}

interface NormalizeIngredientOverridesOptions {
  baseMap?: Record<string, Ingredient>;
}

// Only merge plain object records recursively. Everything else is treated as a leaf value.
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === "[object Object]";

// Deep-merge helper for contextual ingredient overrides:
// - object fields merge recursively
// - arrays replace defaults entirely (no union)
// - scalar/leaf values override directly
const deepMergeReplaceArrays = (base: unknown, override: unknown): unknown => {
  if (override === undefined) return base;

  if (Array.isArray(override)) {
    return override;
  }

  if (!isPlainObject(base) || !isPlainObject(override)) {
    return override;
  }

  const baseObject = base as Record<string, unknown>;
  const overrideObject = override as Record<string, unknown>;
  const merged: Record<string, unknown> = { ...baseObject };

  Object.keys(overrideObject).forEach((key) => {
    const nextOverride = overrideObject[key];
    if (nextOverride === undefined) return;

    const currentBase = baseObject[key];

    if (Array.isArray(nextOverride)) {
      merged[key] = nextOverride;
      return;
    }

    if (isPlainObject(currentBase) && isPlainObject(nextOverride)) {
      merged[key] = deepMergeReplaceArrays(currentBase, nextOverride);
      return;
    }

    merged[key] = nextOverride;
  });

  return merged;
};

export const canonicalizeIngredientId = (rawId: string): string =>
  rawId
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

// Canonicalize keys and keep only IDs that exist in the current ingredient catalog.
// Unknown IDs are intentionally dropped so defaults remain authoritative.
export const normalizeIngredientOverridesById = (
  overridesById?: IngredientOverrideMap,
  { baseMap = IngredientMap }: NormalizeIngredientOverridesOptions = {},
): IngredientOverrideMap | undefined => {
  if (!overridesById) return undefined;

  const normalized: IngredientOverrideMap = {};

  Object.entries(overridesById).forEach(([rawId, override]) => {
    const canonicalId = canonicalizeIngredientId(rawId);
    if (!canonicalId || !baseMap[canonicalId]) return;
    normalized[canonicalId] = override;
  });

  return Object.keys(normalized).length > 0 ? normalized : undefined;
};

export const resolveIngredientById = (
  rawId: string,
  { overridesById, baseMap = IngredientMap }: ResolveIngredientByIdOptions = {},
): Ingredient | null => {
  const canonicalId = canonicalizeIngredientId(rawId);
  if (!canonicalId) return null;

  const baseIngredient = baseMap[canonicalId];
  if (!baseIngredient) return null;

  const override = overridesById?.[canonicalId];
  if (!override) return baseIngredient;

  const merged = deepMergeReplaceArrays(baseIngredient, override) as Ingredient;

  return {
    // Keep canonical catalog identity stable even when override payload includes an `id`.
    ...merged,
    id: baseIngredient.id,
  };
};

export const createIngredientResolver = ({
  overridesById,
  baseMap = IngredientMap,
}: ResolveIngredientByIdOptions = {}): IngredientResolver => {
  const normalizedOverrides = normalizeIngredientOverridesById(overridesById, {
    baseMap,
  });

  // Resolver is pre-bound to one override context (tour/region/etc).
  return (ingredientId: string) =>
    resolveIngredientById(ingredientId, {
      baseMap,
      overridesById: normalizedOverrides,
    });
};
