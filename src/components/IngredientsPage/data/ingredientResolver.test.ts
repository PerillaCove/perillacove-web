import { describe, expect, it } from "vitest";
import { IngredientMap } from "./species";
import {
  canonicalizeIngredientId,
  createIngredientResolver,
  normalizeIngredientOverridesById,
  resolveIngredientById,
} from "./ingredientResolver";

describe("ingredientResolver", () => {
  it("resolves catalog defaults when no overrides are provided", () => {
    const resolved = resolveIngredientById("banana");
    expect(resolved).toEqual(IngredientMap.banana);
  });

  it("deep-merges nested object overrides while preserving fallback fields", () => {
    const resolver = createIngredientResolver({
      overridesById: {
        banana: {
          properties: {
            growth: {
              climateProfile: {
                optimalTempRangeC: [18, 29],
              },
            },
          },
        },
      },
    });

    const resolved = resolver("banana");
    expect(resolved).not.toBeNull();
    expect(
      resolved?.properties.growth?.climateProfile?.optimalTempRangeC,
    ).toEqual([18, 29]);
    expect(resolved?.properties.growth?.growthForms).toEqual(
      IngredientMap.banana.properties.growth?.growthForms,
    );
  });

  it("replaces arrays when override arrays are provided", () => {
    const resolver = createIngredientResolver({
      overridesById: {
        banana: {
          properties: {
            growth: {
              lightPreferences: ["filtered_light"],
            },
          },
        },
      },
    });

    const resolved = resolver("banana");
    expect(resolved?.properties.growth?.lightPreferences).toEqual([
      "filtered_light",
    ]);
  });

  it("canonicalizes override keys before resolution", () => {
    const resolver = createIngredientResolver({
      overridesById: {
        " Pigeon Pea ": {
          link: "https://example.com/pigeon-pea-override",
        },
      },
    });

    const resolved = resolver("pigeon-pea");
    expect(resolved?.link).toBe("https://example.com/pigeon-pea-override");
  });

  it("returns null for unknown ingredient IDs", () => {
    expect(resolveIngredientById("unknown_species")).toBeNull();
  });

  it("normalizes override keys and drops unknown IDs", () => {
    const normalized = normalizeIngredientOverridesById({
      " BANANA ": { link: "https://example.com/banana" },
      unknown_species: { link: "https://example.com/unknown" },
    });

    expect(normalized).toEqual({
      banana: { link: "https://example.com/banana" },
    });
  });

  it("canonicalizes ingredient IDs with spaces and hyphens", () => {
    expect(canonicalizeIngredientId(" Pigeon-Pea ")).toBe("pigeon_pea");
  });
});
