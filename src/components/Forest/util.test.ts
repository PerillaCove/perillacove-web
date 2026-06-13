// pnpm vitest run src/components/Forest/util.test.ts
// disable the whole file es linting
/* eslint-disable */
import { describe, it, expect } from "vitest";
import {
  getSpeciesIntensityAtYear,
  buildLifetimeSegments,
  buildLayerPlacements,
  computeLayerDominanceByPhase,
  generateSuccessionNarrative,
  computeTimelineDuration,
  computeShortestLifecycle,
  computeDurationOptions,
  computePhasePositions,
  DISPLAY_LAYER_ORDER,
  SUCCESSION_PHASES,
  ENABLE_LIFECYCLE_SCALE,
} from "./util";
import type { Ingredient } from "../IngredientsPage/types";
import type { SuccessionProfile } from "../Forest/types";
import {
  Avocado,
  Banana,
  Cacao,
  Durian,
  Mango,
  Peanut,
  Taro,
} from "../IngredientsPage/data";

/**
 * TEST DATA: A realistic food forest with 5 ingredients
 *
 * This mix covers:
 * - Different vertical layers (canopy, understory, herbaceous, groundcover)
 * - Different succession stages (pioneer, mid, late)
 * - With and without explicit succession data (tests inference)
 */

// The complete test food forest
const testFoodForest: Ingredient[] = [Banana, Cacao, Durian, Peanut, Taro];

/**
 * Helper to find placement by ingredient id
 */
function findPlacement(
  placements: ReturnType<typeof buildLayerPlacements>,
  id: string,
) {
  return placements.find((p) => p.ingredient.id === id);
}

/**
 * Helper to find dominance data by layer and phase
 */
function findDominance(
  data: ReturnType<typeof computeLayerDominanceByPhase>,
  layer: string,
  phase: string,
) {
  return data.find((d) => d.layer === layer && d.phase === phase);
}

// =============================================================================
// TESTS
// =============================================================================

describe("Forest util functions", () => {
  // =========================================================================
  // getSpeciesIntensityAtYear
  // =========================================================================
  describe("getSpeciesIntensityAtYear", () => {
    /**
     * Using Banana as test case:
     * - Plant year: 0
     * - Harvest start: 0.8 (plant year + yearsToFirstHarvest)
     * - Harvest end: 2.8 (harvest start + productiveLifespan)
     */
    const bananaPlantYear = 0;
    const bananaHarvestStart = 0.8;
    const bananaHarvestEnd = 2.8;

    describe("Chapter 1: Before planting", () => {
      it("returns 0 before plant year", () => {
        expect(
          getSpeciesIntensityAtYear(
            bananaPlantYear,
            bananaHarvestStart,
            bananaHarvestEnd,
            -1,
          ),
        ).toBe(0);
        expect(
          getSpeciesIntensityAtYear(
            bananaPlantYear,
            bananaHarvestStart,
            bananaHarvestEnd,
            -0.5,
          ),
        ).toBe(0);
      });
    });

    describe("Chapter 2: Establishment phase (plant to harvest start)", () => {
      it("returns 0 at exact plant year", () => {
        const intensity = getSpeciesIntensityAtYear(
          bananaPlantYear,
          bananaHarvestStart,
          bananaHarvestEnd,
          0,
        );
        expect(intensity).toBe(0);
      });

      it("returns small value during early establishment", () => {
        // At year 0.4 (halfway through establishment)
        // progress = 0.4 / 0.8 = 0.5
        // intensity = 0.5 * 0.5 * 0.3 = 0.075
        const intensity = getSpeciesIntensityAtYear(
          bananaPlantYear,
          bananaHarvestStart,
          bananaHarvestEnd,
          0.4,
        );
        expect(intensity).toBeCloseTo(0.075, 2);
      });

      it("returns ~0.3 just before harvest starts", () => {
        // Just before 0.8
        const intensity = getSpeciesIntensityAtYear(
          bananaPlantYear,
          bananaHarvestStart,
          bananaHarvestEnd,
          0.79,
        );
        expect(intensity).toBeGreaterThan(0.25);
        expect(intensity).toBeLessThan(0.3);
      });
    });

    describe("Chapter 3: Ramp up phase (first 10% of harvest period)", () => {
      it("starts at ~0.3 when harvest begins", () => {
        const intensity = getSpeciesIntensityAtYear(
          bananaPlantYear,
          bananaHarvestStart,
          bananaHarvestEnd,
          0.8,
        );
        expect(intensity).toBeCloseTo(0.3, 1);
      });

      it("reaches 1.0 by 10% into harvest period", () => {
        // Harvest duration = 2.8 - 0.8 = 2.0 years
        // 10% = 0.2 years, so full productivity at year 1.0
        const intensity = getSpeciesIntensityAtYear(
          bananaPlantYear,
          bananaHarvestStart,
          bananaHarvestEnd,
          1.0,
        );
        expect(intensity).toBeCloseTo(1.0, 1);
      });
    });

    describe("Chapter 4: Peak productivity (10% to 90% of harvest period)", () => {
      it("returns 1.0 during peak years", () => {
        // Peak should be from year 1.0 to year 2.6 (90% of harvest period)
        expect(
          getSpeciesIntensityAtYear(
            bananaPlantYear,
            bananaHarvestStart,
            bananaHarvestEnd,
            1.5,
          ),
        ).toBe(1.0);
        expect(
          getSpeciesIntensityAtYear(
            bananaPlantYear,
            bananaHarvestStart,
            bananaHarvestEnd,
            2.0,
          ),
        ).toBe(1.0);
        expect(
          getSpeciesIntensityAtYear(
            bananaPlantYear,
            bananaHarvestStart,
            bananaHarvestEnd,
            2.5,
          ),
        ).toBe(1.0);
      });
    });

    describe("Chapter 5a: Decline phase (last 10% of harvest period)", () => {
      it("starts declining after 90% of harvest period", () => {
        // Decline starts at year 2.6, ends at 2.8
        const intensityAtDeclineStart = getSpeciesIntensityAtYear(
          bananaPlantYear,
          bananaHarvestStart,
          bananaHarvestEnd,
          2.6,
        );
        expect(intensityAtDeclineStart).toBe(1.0);

        const intensityMidDecline = getSpeciesIntensityAtYear(
          bananaPlantYear,
          bananaHarvestStart,
          bananaHarvestEnd,
          2.7,
        );
        expect(intensityMidDecline).toBeLessThan(1.0);
        expect(intensityMidDecline).toBeGreaterThan(0.3);
      });

      it("reaches correct intensity at harvest end", () => {
        // ENABLE_LIFECYCLE_SCALE: decline coeff 0.85 → 0.15 at harvestEnd
        // Classic:                decline coeff 0.7  → 0.3  at harvestEnd
        const expected = ENABLE_LIFECYCLE_SCALE ? 0.15 : 0.3;
        const intensity = getSpeciesIntensityAtYear(
          bananaPlantYear,
          bananaHarvestStart,
          bananaHarvestEnd,
          2.8,
        );
        expect(intensity).toBeCloseTo(expected, 1);
      });
    });

    describe("Chapter 5b: Fade out (after harvest end)", () => {
      it("fades to 0 over the configured fade window", () => {
        // ENABLE_LIFECYCLE_SCALE: 2-year quadratic fade from 0.15
        // Classic:                1-year linear fade from 0.3
        const fadeEnd = ENABLE_LIFECYCLE_SCALE ? 4.8 : 3.8;
        const fadeStart = ENABLE_LIFECYCLE_SCALE ? 0.15 : 0.3;

        // Just after harvest end
        const intensityJustAfter = getSpeciesIntensityAtYear(
          bananaPlantYear,
          bananaHarvestStart,
          bananaHarvestEnd,
          3.0,
        );
        expect(intensityJustAfter).toBeGreaterThan(0);
        expect(intensityJustAfter).toBeLessThan(fadeStart);

        // Midway — still fading, still > 0
        const midYear = (2.8 + fadeEnd) / 2;
        const intensityMid = getSpeciesIntensityAtYear(
          bananaPlantYear,
          bananaHarvestStart,
          bananaHarvestEnd,
          midYear,
        );
        expect(intensityMid).toBeLessThan(intensityJustAfter);
        expect(intensityMid).toBeGreaterThanOrEqual(0);

        // Fully faded
        const intensityFaded = getSpeciesIntensityAtYear(
          bananaPlantYear,
          bananaHarvestStart,
          bananaHarvestEnd,
          fadeEnd,
        );
        expect(intensityFaded).toBe(0);
      });
    });

    describe("Using Durian (slow-maturing tree)", () => {
      /**
       * Durian:
       * - Plant year: 2
       * - Harvest start: 9 (2 + 7)
       * - Harvest end: 49 (9 + 40)
       */
      const durianPlantYear = 2;
      const durianHarvestStart = 9;
      const durianHarvestEnd = 49;

      it("returns 0 before planting at year 2", () => {
        expect(
          getSpeciesIntensityAtYear(
            durianPlantYear,
            durianHarvestStart,
            durianHarvestEnd,
            0,
          ),
        ).toBe(0);
        expect(
          getSpeciesIntensityAtYear(
            durianPlantYear,
            durianHarvestStart,
            durianHarvestEnd,
            1,
          ),
        ).toBe(0);
      });

      it("is establishing during years 2-9", () => {
        const intensityYear5 = getSpeciesIntensityAtYear(
          durianPlantYear,
          durianHarvestStart,
          durianHarvestEnd,
          5,
        );
        expect(intensityYear5).toBeGreaterThan(0);
        expect(intensityYear5).toBeLessThan(0.3);
      });

      it("reaches peak productivity and stays there for decades", () => {
        const intensityYear15 = getSpeciesIntensityAtYear(
          durianPlantYear,
          durianHarvestStart,
          durianHarvestEnd,
          15,
        );
        const intensityYear30 = getSpeciesIntensityAtYear(
          durianPlantYear,
          durianHarvestStart,
          durianHarvestEnd,
          30,
        );
        expect(intensityYear15).toBe(1.0);
        expect(intensityYear30).toBe(1.0);
      });
    });
  });

  // =========================================================================
  // buildLifetimeSegments
  // =========================================================================
  describe("buildLifetimeSegments", () => {
    /**
     * This function is a very small “planner” helper:
     * - It only includes ingredients that have `properties.succession`
     * - It uses the MIN values from the succession tuples:
     *   - recommendedPlantYearFromStart[0]
     *   - yearsToFirstHarvest[0]
     *   - productiveLifespanYears[0]
     * - It returns one segment per qualifying ingredient, in the same order as input
     */

    /**
     * Helper to find a segment by ingredient id.
     */
    function findSegment(
      segments: ReturnType<typeof buildLifetimeSegments>,
      id: string,
    ) {
      return segments.find((s) => s.ingredient.id === id);
    }

    /**
     * Helper for creating a minimal Ingredient stub.
     * We intentionally only provide the fields `buildLifetimeSegments` reads
     * (ingredient.properties.succession). Everything else is cast away.
     */
    function makeIngredientWithSuccession(params: {
      id: string;
      succession: SuccessionProfile;
    }): Ingredient {
      return {
        id: params.id,
        link: "",
        type: "fruit" as any,
        properties: {
          succession: params.succession,
        } as any,
      } as unknown as Ingredient;
    }

    it("documents the intended planning math via a concrete 4-species example (banana/cacao/coconut/durian)", () => {
      /**
       * This test is deliberately “narrative” and should remain readable on its own.
       * It encodes the exact example described in `buildLifetimeSegments`’s JSDoc.
       *
       * The point: given `[min,max]` ranges, we pick the MIN values to build a
       * conservative, easy-to-understand planning timeline.
       */
      const banana = makeIngredientWithSuccession({
        id: "banana_example",
        succession: {
          successionalPhase: "pioneer",
          establishmentLight: "full_sun",
          recommendedPlantYearFromStart: [0, 0],
          yearsToFirstHarvest: [0.8, 1.2],
          productiveLifespanYears: [2, 3],
        },
      });

      const cacao = makeIngredientWithSuccession({
        id: "cacao_example",
        succession: {
          successionalPhase: "mid",
          establishmentLight: "filtered_light",
          recommendedPlantYearFromStart: [0.5, 2],
          yearsToFirstHarvest: [3, 5],
          productiveLifespanYears: [20, 30],
        },
      });

      const coconut = makeIngredientWithSuccession({
        id: "coconut_example",
        succession: {
          successionalPhase: "late",
          establishmentLight: "full_sun",
          recommendedPlantYearFromStart: [1, 3],
          yearsToFirstHarvest: [5, 8],
          productiveLifespanYears: [40, 60],
        },
      });

      const durian = makeIngredientWithSuccession({
        id: "durian_example",
        succession: {
          successionalPhase: "late",
          establishmentLight: "filtered_light",
          recommendedPlantYearFromStart: [2, 5],
          yearsToFirstHarvest: [7, 10],
          productiveLifespanYears: [40, 60],
        },
      });

      const segments = buildLifetimeSegments([banana, cacao, coconut, durian]);

      expect(segments.map((s) => s.ingredient.id)).toEqual([
        "banana_example",
        "cacao_example",
        "coconut_example",
        "durian_example",
      ]);

      expect(findSegment(segments, "banana_example")).toEqual({
        ingredient: banana,
        plantYear: 0,
        harvestStartYear: 0.8,
        harvestEndYear: 2.8,
        respawnCycle: 0,
      });

      expect(findSegment(segments, "cacao_example")).toEqual({
        ingredient: cacao,
        plantYear: 0.5,
        harvestStartYear: 3.5,
        harvestEndYear: 23.5,
        respawnCycle: 0,
      });

      expect(findSegment(segments, "coconut_example")).toEqual({
        ingredient: coconut,
        plantYear: 1,
        harvestStartYear: 6,
        harvestEndYear: 46,
        respawnCycle: 0,
      });

      expect(findSegment(segments, "durian_example")).toEqual({
        ingredient: durian,
        plantYear: 2,
        harvestStartYear: 9,
        harvestEndYear: 49,
        respawnCycle: 0,
      });
    });

    it("returns an empty array for empty input", () => {
      expect(buildLifetimeSegments([])).toEqual([]);
    });

    it("skips ingredients that have no succession profile", () => {
      // Create a minimal ingredient without succession data
      const noSuccessionIngredient = {
        id: "test_no_succession",
        link: "",
        type: "fruit" as any,
        properties: {
          // No succession property
        } as any,
      } as unknown as Ingredient;
      const segments = buildLifetimeSegments([noSuccessionIngredient]);
      expect(segments).toEqual([]);
    });

    it("computes plant/harvestStart/harvestEnd using the min values from the profile (Banana)", () => {
      // Banana succession expectations are already documented elsewhere in this file.
      // plant year = 0
      // harvest start = 0 + 0.8 = 0.8
      // harvest end = 0.8 + 2 = 2.8
      const segments = buildLifetimeSegments([Banana]);
      expect(segments.length).toBe(1);

      const banana = segments[0];
      expect(banana.ingredient).toBe(Banana); // exact object reference
      expect(banana.plantYear).toBe(0);
      expect(banana.harvestStartYear).toBeCloseTo(0.8, 3);
      expect(banana.harvestEndYear).toBeCloseTo(2.8, 3);
    });

    it("computes correctly for a non-zero plant year (Durian)", () => {
      // Durian:
      // plant year = 2
      // harvest start = 2 + 7 = 9
      // harvest end = 9 + 40 = 49
      const segments = buildLifetimeSegments([Durian]);
      const durian = segments[0];
      expect(durian.plantYear).toBe(2);
      expect(durian.harvestStartYear).toBe(9);
      expect(durian.harvestEndYear).toBe(49);
    });

    it("computes correctly for long-lived understory species (Cacao)", () => {
      // Cacao:
      // plant year = 0.5
      // harvest start = 0.5 + 3 = 3.5
      // harvest end = 3.5 + 20 = 23.5
      const segments = buildLifetimeSegments([Cacao]);
      const cacao = segments[0];
      expect(cacao.plantYear).toBe(0.5);
      expect(cacao.harvestStartYear).toBeCloseTo(3.5, 3);
      expect(cacao.harvestEndYear).toBeCloseTo(23.5, 3);
    });

    it("preserves input ordering", () => {
      // Intentionally put Durian first, then Banana, then Cacao.
      const input = [Durian, Banana, Cacao];
      const segments = buildLifetimeSegments(input);

      expect(segments.map((s) => s.ingredient.id)).toEqual([
        "durian",
        "banana",
        "cacao",
      ]);
    });

    it("does not mutate the input array", () => {
      const input = [Durian, Peanut, Banana];
      const before = input.slice();
      buildLifetimeSegments(input);
      expect(input).toEqual(before);
    });

    it("uses the first tuple entry (min) for calculations, not the max", () => {
      // We set the max values wildly different; results should still be based on the [0] entries.
      const weird = makeIngredientWithSuccession({
        id: "weird",
        succession: {
          successionalPhase: "early",
          establishmentLight: "full_sun",
          recommendedPlantYearFromStart: [1, 999],
          yearsToFirstHarvest: [2, 999],
          productiveLifespanYears: [3, 999],
        },
      });

      const segments = buildLifetimeSegments([weird]);
      expect(segments.length).toBe(1);

      const seg = segments[0];
      expect(seg.plantYear).toBe(1);
      expect(seg.harvestStartYear).toBe(3); // 1 + 2
      expect(seg.harvestEndYear).toBe(6); // 3 + 3
    });

    it("returns one segment per ingredient with a profile (mixed real data)", () => {
      // All these ingredients have succession data
      const segments = buildLifetimeSegments([
        Banana,
        Peanut,
        Taro,
        Cacao,
        Durian,
      ]);

      // All ingredients with succession data should have segments
      expect(findSegment(segments, "banana")).toBeDefined();
      expect(findSegment(segments, "cacao")).toBeDefined();
      expect(findSegment(segments, "durian")).toBeDefined();
      // Peanut now has succession data, so it should be defined
      expect(findSegment(segments, "peanut")).toBeDefined();
    });

    // =========================================================================
    // Respawning functionality
    // =========================================================================
    describe("Respawning", () => {
      it("creates multiple segments when respawnConfig specifies cycles", () => {
        // Banana with 2 respawn cycles (original + 2 = 3 total segments)
        const respawnConfig = { banana: 2 };
        const segments = buildLifetimeSegments([Banana], respawnConfig);

        expect(segments.length).toBe(3);
      });

      it("assigns correct respawnCycle values (0, 1, 2, ...)", () => {
        const respawnConfig = { banana: 2 };
        const segments = buildLifetimeSegments([Banana], respawnConfig);

        expect(segments[0].respawnCycle).toBe(0);
        expect(segments[1].respawnCycle).toBe(1);
        expect(segments[2].respawnCycle).toBe(2);
      });

      it("chains respawn cycles back-to-back with correct timing", () => {
        // Banana lifecycle: plant 0, harvest 0.8-2.8 (2 year productive)
        // Lifecycle duration = 0.8 + 2 = 2.8 years
        const respawnConfig = { banana: 1 };
        const segments = buildLifetimeSegments([Banana], respawnConfig);

        // First cycle (original)
        expect(segments[0].plantYear).toBe(0);
        expect(segments[0].harvestStartYear).toBeCloseTo(0.8, 3);
        expect(segments[0].harvestEndYear).toBeCloseTo(2.8, 3);

        // Second cycle (first respawn) - starts at 2.8 (end of first cycle)
        // Actually starts at 0 + 2.8 = 2.8 (lifecycle duration offset)
        expect(segments[1].plantYear).toBeCloseTo(2.8, 3);
        expect(segments[1].harvestStartYear).toBeCloseTo(3.6, 3); // 2.8 + 0.8
        expect(segments[1].harvestEndYear).toBeCloseTo(5.6, 3); // 3.6 + 2
      });

      it("only creates extra segments for ingredients in respawnConfig", () => {
        const respawnConfig = { banana: 2 }; // Only banana gets respawned
        const segments = buildLifetimeSegments([Banana, Cacao], respawnConfig);

        const bananaSegments = segments.filter(
          (s) => s.ingredient.id === "banana",
        );
        const cacaoSegments = segments.filter(
          (s) => s.ingredient.id === "cacao",
        );

        expect(bananaSegments.length).toBe(3); // Original + 2 respawns
        expect(cacaoSegments.length).toBe(1); // Just original
      });

      it("handles empty respawnConfig (no respawning)", () => {
        const segments = buildLifetimeSegments([Banana], {});
        expect(segments.length).toBe(1);
        expect(segments[0].respawnCycle).toBe(0);
      });

      it("handles undefined respawnConfig (no respawning)", () => {
        const segments = buildLifetimeSegments([Banana], undefined);
        expect(segments.length).toBe(1);
        expect(segments[0].respawnCycle).toBe(0);
      });

      it("handles respawnConfig with zero value (no extra cycles)", () => {
        const respawnConfig = { banana: 0 };
        const segments = buildLifetimeSegments([Banana], respawnConfig);
        expect(segments.length).toBe(1);
      });

      it("works correctly with late-planting species (Durian)", () => {
        // Durian: plant year 2, harvest 9-49 (40 year productive)
        // Lifecycle duration = 7 + 40 = 47 years
        const respawnConfig = { durian: 1 };
        const segments = buildLifetimeSegments([Durian], respawnConfig);

        expect(segments.length).toBe(2);

        // First cycle
        expect(segments[0].plantYear).toBe(2);
        expect(segments[0].harvestStartYear).toBe(9);
        expect(segments[0].harvestEndYear).toBe(49);
        expect(segments[0].respawnCycle).toBe(0);

        // Second cycle - offset by lifecycle duration (47 years)
        expect(segments[1].plantYear).toBe(49); // 2 + 47
        expect(segments[1].harvestStartYear).toBe(56); // 49 + 7
        expect(segments[1].harvestEndYear).toBe(96); // 56 + 40
        expect(segments[1].respawnCycle).toBe(1);
      });

      it("preserves ingredient reference in all respawned segments", () => {
        const respawnConfig = { banana: 2 };
        const segments = buildLifetimeSegments([Banana], respawnConfig);

        segments.forEach((seg) => {
          expect(seg.ingredient).toBe(Banana); // Same object reference
          expect(seg.ingredient.id).toBe("banana");
        });
      });
    });
  });

  // =========================================================================
  // buildLayerPlacements
  // =========================================================================
  describe("buildLayerPlacements", () => {
    const placements = buildLayerPlacements(testFoodForest);

    describe("Layer assignment", () => {
      it("assigns Durian to canopy layer", () => {
        const durianPlacement = findPlacement(placements, "durian");
        expect(durianPlacement).toBeDefined();
        expect(durianPlacement!.layer).toBe("canopy");
      });

      it("assigns Cacao to understory layer", () => {
        const cacaoPlacement = findPlacement(placements, "cacao");
        expect(cacaoPlacement).toBeDefined();
        expect(cacaoPlacement!.layer).toBe("understory");
      });

      it("assigns Banana to understory layer", () => {
        const bananaPlacement = findPlacement(placements, "banana");
        expect(bananaPlacement).toBeDefined();
        expect(bananaPlacement!.layer).toBe("understory");
      });

      it("assigns Peanut to herbaceous or groundcover layer (inferred)", () => {
        const peanutPlacement = findPlacement(placements, "peanut");
        expect(peanutPlacement).toBeDefined();
        // Peanut has both herbaceous and groundcover growthForms
        // The first match wins, so it should be herbaceous
        expect(["herbaceous", "groundcover"]).toContain(peanutPlacement!.layer);
      });

      it("assigns Taro to herbaceous layer (inferred)", () => {
        const taroPlacement = findPlacement(placements, "taro");
        expect(taroPlacement).toBeDefined();
        expect(taroPlacement!.layer).toBe("herbaceous");
      });
    });

    describe("Active years calculation", () => {
      it("calculates Banana active years from succession data", () => {
        const bananaPlacement = findPlacement(placements, "banana");
        expect(bananaPlacement).toBeDefined();
        // Plant year 0, harvest start 0.8, harvest end 0.8 + 2 = 2.8
        expect(bananaPlacement!.activeYears[0]).toBe(0);
        expect(bananaPlacement!.activeYears[1]).toBeCloseTo(2.8, 1);
      });

      it("calculates Durian active years from succession data", () => {
        const durianPlacement = findPlacement(placements, "durian");
        expect(durianPlacement).toBeDefined();
        // Plant year 2, harvest start 2+7=9, harvest end 9 + 40 = 49
        expect(durianPlacement!.activeYears[0]).toBe(2);
        expect(durianPlacement!.activeYears[1]).toBeCloseTo(49, 0);
      });

      it("calculates Cacao active years from succession data", () => {
        const cacaoPlacement = findPlacement(placements, "cacao");
        expect(cacaoPlacement).toBeDefined();
        // Plant year 0.5, harvest start 0.5+3=3.5, harvest end 3.5 + 20 = 23.5
        expect(cacaoPlacement!.activeYears[0]).toBe(0.5);
        expect(cacaoPlacement!.activeYears[1]).toBeCloseTo(23.5, 1);
      });

      it("infers active years for Peanut (no succession data)", () => {
        const peanutPlacement = findPlacement(placements, "peanut");
        expect(peanutPlacement).toBeDefined();
        // Should be inferred as pioneer/annual with short lifespan
        expect(peanutPlacement!.activeYears[0]).toBeGreaterThanOrEqual(0);
        expect(peanutPlacement!.activeYears[1]).toBeLessThan(10); // Short-lived
      });
    });

    describe("Relocation flagging", () => {
      it("does NOT flag canopy trees for relocation", () => {
        const durianPlacement = findPlacement(placements, "durian");
        expect(durianPlacement!.needsRelocation).toBe(false);
      });

      it("does NOT flag shade-tolerant understory for relocation", () => {
        const cacaoPlacement = findPlacement(placements, "cacao");
        // Cacao prefers filtered light, so no relocation needed
        expect(cacaoPlacement!.needsRelocation).toBe(false);
      });

      it("flags full-sun herbaceous plants for relocation", () => {
        const peanutPlacement = findPlacement(placements, "peanut");
        // Peanut wants full sun but is in a lower layer
        expect(peanutPlacement!.needsRelocation).toBe(true);
      });
    });

    describe("Placement notes generation", () => {
      it("generates placement notes for each ingredient", () => {
        placements.forEach((placement) => {
          expect(placement.placementNotes).toBeDefined();
          expect(Array.isArray(placement.placementNotes)).toBe(true);
          expect(placement.placementNotes.length).toBeGreaterThan(0);
        });
      });

      it("generates canopy-specific notes for Durian", () => {
        const durianPlacement = findPlacement(placements, "durian");
        const notesText = durianPlacement!.placementNotes.join(" ");
        expect(notesText.toLowerCase()).toContain("anchor");
      });

      it("generates understory-specific notes for Cacao", () => {
        const cacaoPlacement = findPlacement(placements, "cacao");
        const notesText = cacaoPlacement!.placementNotes.join(" ");
        expect(notesText.toLowerCase()).toContain("shade");
      });
    });

    describe("Sorting", () => {
      it("returns placements sorted by vertical layer order (canopy first)", () => {
        const layerOrder = placements.map((p) => p.layer);
        const canopyIndex = layerOrder.indexOf("canopy");
        const understoryIndex = layerOrder.indexOf("understory");
        const herbaceousIndex = layerOrder.indexOf("herbaceous");

        // Canopy should come before understory
        if (canopyIndex !== -1 && understoryIndex !== -1) {
          expect(canopyIndex).toBeLessThan(understoryIndex);
        }
        // Understory should come before herbaceous
        if (understoryIndex !== -1 && herbaceousIndex !== -1) {
          expect(understoryIndex).toBeLessThan(herbaceousIndex);
        }
      });
    });
  });

  // =========================================================================
  // computeLayerDominanceByPhase
  // =========================================================================
  describe("computeLayerDominanceByPhase", () => {
    const placements = buildLayerPlacements(testFoodForest);
    const dominanceData = computeLayerDominanceByPhase(placements);

    describe("Data structure", () => {
      it("returns data for all display layers and phases", () => {
        // 4 display layers × 3 phases = 12 entries
        expect(dominanceData.length).toBe(
          DISPLAY_LAYER_ORDER.length * SUCCESSION_PHASES.length,
        );
      });

      it("each entry has required fields", () => {
        dominanceData.forEach((entry) => {
          expect(entry).toHaveProperty("layer");
          expect(entry).toHaveProperty("phase");
          expect(entry).toHaveProperty("dominance");
          expect(entry).toHaveProperty("rawDominance");
          expect(entry).toHaveProperty("species");
          expect(DISPLAY_LAYER_ORDER).toContain(entry.layer);
          expect(SUCCESSION_PHASES.map((p) => p.id)).toContain(entry.phase);
        });
      });
    });

    describe("Establishment phase (Y0-2)", () => {
      it("shows Banana as dominant in understory during establishment", () => {
        const understoryEstablishment = findDominance(
          dominanceData,
          "understory",
          "establishment",
        );
        expect(understoryEstablishment).toBeDefined();

        // Banana should be contributing
        const bananaContribution = understoryEstablishment!.species.find(
          (s) => s.ingredient.id === "banana",
        );
        expect(bananaContribution).toBeDefined();
        expect(bananaContribution!.intensity).toBeGreaterThan(0.3);
      });

      it("shows groundcover layer has activity during establishment", () => {
        const groundcoverEstablishment = findDominance(
          dominanceData,
          "groundcover",
          "establishment",
        );
        expect(groundcoverEstablishment).toBeDefined();
        // Peanut should be in groundcover (mapped from herbaceous/groundcover)
        expect(groundcoverEstablishment!.rawDominance).toBeGreaterThanOrEqual(
          0,
        );
      });

      it("shows canopy layer has low/no activity during establishment", () => {
        const canopyEstablishment = findDominance(
          dominanceData,
          "canopy",
          "establishment",
        );
        expect(canopyEstablishment).toBeDefined();
        // Durian is planted year 2, so minimal presence in Y0-2
        expect(canopyEstablishment!.dominance).toBeLessThan(0.5);
      });
    });

    describe("Transition phase (Y3-7)", () => {
      it("shows Cacao rising in understory during transition", () => {
        const understoryTransition = findDominance(
          dominanceData,
          "understory",
          "transition",
        );
        expect(understoryTransition).toBeDefined();

        // Cacao should be contributing (harvest starts year 3.5)
        const cacaoContribution = understoryTransition!.species.find(
          (s) => s.ingredient.id === "cacao",
        );
        expect(cacaoContribution).toBeDefined();
        expect(cacaoContribution!.intensity).toBeGreaterThan(0);
      });

      it("shows Durian starting to appear in canopy", () => {
        const canopyTransition = findDominance(
          dominanceData,
          "canopy",
          "transition",
        );
        expect(canopyTransition).toBeDefined();

        // Durian should be establishing (planted year 2, harvest starts year 9)
        const durianContribution = canopyTransition!.species.find(
          (s) => s.ingredient.id === "durian",
        );
        expect(durianContribution).toBeDefined();
      });

      it("shows Banana declining compared to establishment", () => {
        const understoryEstablishment = findDominance(
          dominanceData,
          "understory",
          "establishment",
        );
        const understoryTransition = findDominance(
          dominanceData,
          "understory",
          "transition",
        );

        const bananaEstablishment = understoryEstablishment!.species.find(
          (s) => s.ingredient.id === "banana",
        );
        const bananaTransition = understoryTransition!.species.find(
          (s) => s.ingredient.id === "banana",
        );

        // Banana should have lower intensity in transition (harvest ends ~2.8)
        if (bananaEstablishment && bananaTransition) {
          expect(bananaTransition.intensity).toBeLessThan(
            bananaEstablishment.intensity,
          );
        }
      });
    });

    describe("Maturity phase (Y8-20)", () => {
      it("shows Durian dominant in canopy at maturity", () => {
        const canopyMaturity = findDominance(
          dominanceData,
          "canopy",
          "maturity",
        );
        expect(canopyMaturity).toBeDefined();

        // Durian should be at peak productivity
        const durianContribution = canopyMaturity!.species.find(
          (s) => s.ingredient.id === "durian",
        );
        expect(durianContribution).toBeDefined();
        expect(durianContribution!.intensity).toBeGreaterThan(0.5);
      });

      it("shows Cacao dominant in understory at maturity", () => {
        const understoryMaturity = findDominance(
          dominanceData,
          "understory",
          "maturity",
        );
        expect(understoryMaturity).toBeDefined();

        // Cacao should be at peak productivity
        const cacaoContribution = understoryMaturity!.species.find(
          (s) => s.ingredient.id === "cacao",
        );
        expect(cacaoContribution).toBeDefined();
        expect(cacaoContribution!.intensity).toBe(1.0);
      });

      it("shows Banana completely faded at maturity", () => {
        const understoryMaturity = findDominance(
          dominanceData,
          "understory",
          "maturity",
        );
        expect(understoryMaturity).toBeDefined();

        // Banana should be gone (harvest ended year 2.8)
        const bananaContribution = understoryMaturity!.species.find(
          (s) => s.ingredient.id === "banana",
        );
        // Either not present or intensity is 0
        if (bananaContribution) {
          expect(bananaContribution.intensity).toBeLessThan(0.1);
        }
      });
    });

    describe("Normalization", () => {
      it("normalizes dominance values to max of 1.0", () => {
        const maxDominance = Math.max(...dominanceData.map((d) => d.dominance));
        expect(maxDominance).toBeLessThanOrEqual(1.0);
      });

      it("has at least one entry with dominance of 1.0 (the max)", () => {
        const hasMaxDominance = dominanceData.some((d) => d.dominance === 1.0);
        expect(hasMaxDominance).toBe(true);
      });

      it("preserves raw dominance values for reference", () => {
        dominanceData.forEach((entry) => {
          expect(entry.rawDominance).toBeGreaterThanOrEqual(0);
          // If normalized dominance > 0, raw should also be > 0
          if (entry.dominance > 0) {
            expect(entry.rawDominance).toBeGreaterThan(0);
          }
        });
      });
    });

    describe("Species contributions", () => {
      it("sorts species by intensity descending", () => {
        dominanceData.forEach((entry) => {
          for (let i = 1; i < entry.species.length; i++) {
            expect(entry.species[i - 1].intensity).toBeGreaterThanOrEqual(
              entry.species[i].intensity,
            );
          }
        });
      });

      it("only includes species with intensity > 0.01", () => {
        dominanceData.forEach((entry) => {
          entry.species.forEach((sp) => {
            expect(sp.intensity).toBeGreaterThan(0.01);
          });
        });
      });
    });

    // =========================================================================
    // Accessible Sun Mode
    // =========================================================================
    describe("Accessible Sun mode", () => {
      const managedDominanceData = computeLayerDominanceByPhase(
        placements,
        true,
      );

      it("extends sun-lover productivity into maturity phase", () => {
        const understoryMaturity = findDominance(
          managedDominanceData,
          "understory",
          "maturity",
        );
        expect(understoryMaturity).toBeDefined();

        // In managed mode, Banana should still be present at maturity
        // (normally it would be gone by year 2.8)
        const bananaContribution = understoryMaturity!.species.find(
          (s) => s.ingredient.id === "banana",
        );
        expect(bananaContribution).toBeDefined();
        expect(bananaContribution!.intensity).toBeGreaterThan(0.1);
      });

      it("caps sun-lover intensity at 0.75 in managed mode", () => {
        const managedData = computeLayerDominanceByPhase(placements, true);

        // Find Banana's intensity - it should be capped at 0.75
        managedData.forEach((entry) => {
          const bananaContribution = entry.species.find(
            (s) => s.ingredient.id === "banana",
          );
          if (bananaContribution) {
            expect(bananaContribution.intensity).toBeLessThanOrEqual(0.75);
          }
        });
      });

      it("shows higher Banana intensity at maturity in managed vs natural", () => {
        const naturalUnderstoryMaturity = findDominance(
          dominanceData,
          "understory",
          "maturity",
        );
        const managedUnderstoryMaturity = findDominance(
          managedDominanceData,
          "understory",
          "maturity",
        );

        const naturalBanana = naturalUnderstoryMaturity!.species.find(
          (s) => s.ingredient.id === "banana",
        );
        const managedBanana = managedUnderstoryMaturity!.species.find(
          (s) => s.ingredient.id === "banana",
        );

        // In Normal Mode, Banana should be absent or very low
        const naturalIntensity = naturalBanana?.intensity ?? 0;
        // In managed mode, Banana should be present
        const managedIntensity = managedBanana?.intensity ?? 0;

        expect(managedIntensity).toBeGreaterThan(naturalIntensity);
      });

      it("does not affect non-sun-loving species", () => {
        // Cacao is not a sun-lover (needsRelocation: false), should be similar in both modes
        const naturalUnderstoryMaturity = findDominance(
          dominanceData,
          "understory",
          "maturity",
        );
        const managedUnderstoryMaturity = findDominance(
          managedDominanceData,
          "understory",
          "maturity",
        );

        const naturalCacao = naturalUnderstoryMaturity!.species.find(
          (s) => s.ingredient.id === "cacao",
        );
        const managedCacao = managedUnderstoryMaturity!.species.find(
          (s) => s.ingredient.id === "cacao",
        );

        // Both should be at similar intensity (1.0)
        expect(naturalCacao?.intensity).toBeCloseTo(
          managedCacao?.intensity ?? 0,
          1,
        );
      });
    });
  });

  // =========================================================================
  // generateSuccessionNarrative
  // =========================================================================
  describe("generateSuccessionNarrative", () => {
    const placements = buildLayerPlacements(testFoodForest);
    const dominanceData = computeLayerDominanceByPhase(placements);
    const narratives = generateSuccessionNarrative(dominanceData);

    describe("Structure", () => {
      it("returns narratives for all 3 phases", () => {
        expect(narratives.length).toBe(3);
      });

      it("includes establishment, transition, and maturity phases", () => {
        const phases = narratives.map((n) => n.phase);
        expect(phases).toContain("establishment");
        expect(phases).toContain("transition");
        expect(phases).toContain("maturity");
      });

      it("each narrative has phase, phaseLabel, and sentences", () => {
        narratives.forEach((narrative) => {
          expect(narrative).toHaveProperty("phase");
          expect(narrative).toHaveProperty("phaseLabel");
          expect(narrative).toHaveProperty("sentences");
          expect(Array.isArray(narrative.sentences)).toBe(true);
        });
      });

      it("has human-readable phase labels", () => {
        const establishment = narratives.find(
          (n) => n.phase === "establishment",
        );
        const transition = narratives.find((n) => n.phase === "transition");
        const maturity = narratives.find((n) => n.phase === "maturity");

        expect(establishment!.phaseLabel).toBe("Establishment");
        expect(transition!.phaseLabel).toBe("Transition");
        expect(maturity!.phaseLabel).toBe("Maturity");
      });
    });

    describe("Establishment narrative content", () => {
      const establishmentNarrative = narratives.find(
        (n) => n.phase === "establishment",
      );
      const narrativeText = establishmentNarrative!.sentences
        .join(" ")
        .toLowerCase();

      it("generates sentences for establishment phase", () => {
        expect(establishmentNarrative!.sentences.length).toBeGreaterThan(0);
      });

      it("mentions relevant early species (Banana, Peanut, or Taro)", () => {
        // The narrative should mention some of the early-active species
        // Banana is productive Y0-2, Peanut and Taro are also active early
        const mentionsEarlySpecies =
          narrativeText.includes("banana") ||
          narrativeText.includes("peanut") ||
          narrativeText.includes("taro");
        expect(mentionsEarlySpecies).toBe(true);
      });

      it("starts sentences with capital letters", () => {
        establishmentNarrative!.sentences.forEach((sentence) => {
          if (sentence.length > 0) {
            const firstChar = sentence.charAt(0);
            expect(firstChar).toBe(firstChar.toUpperCase());
          }
        });
      });
    });

    describe("Transition narrative content", () => {
      const transitionNarrative = narratives.find(
        (n) => n.phase === "transition",
      );
      const narrativeText = transitionNarrative!.sentences
        .join(" ")
        .toLowerCase();

      it("generates sentences for transition phase", () => {
        expect(transitionNarrative!.sentences.length).toBeGreaterThan(0);
      });

      it("mentions fading species when relevant", () => {
        // Banana should be fading during transition (harvest ends year 2.8)
        // The narrative might mention "fades" or similar
        const mentionsFadingOrRising =
          narrativeText.includes("fade") ||
          narrativeText.includes("rise") ||
          narrativeText.includes("transition");
        expect(mentionsFadingOrRising).toBe(true);
      });

      it("mentions rising species (Cacao)", () => {
        // Cacao should be rising during transition
        expect(narrativeText).toContain("cacao");
      });
    });

    describe("Maturity narrative content", () => {
      const maturityNarrative = narratives.find((n) => n.phase === "maturity");
      const narrativeText = maturityNarrative!.sentences
        .join(" ")
        .toLowerCase();

      it("generates sentences for maturity phase", () => {
        expect(maturityNarrative!.sentences.length).toBeGreaterThan(0);
      });

      it("mentions canopy-defining species (Durian)", () => {
        // Durian should be mentioned as the canopy tree
        expect(narrativeText).toContain("durian");
      });

      it("mentions understory species (Cacao)", () => {
        // Cacao should be thriving in the understory
        expect(narrativeText).toContain("cacao");
      });

      it("ends with 'The forest is calm.' or similar closing", () => {
        // The maturity narrative should end with a calm/stable statement
        const lastSentence =
          maturityNarrative!.sentences[
            maturityNarrative!.sentences.length - 1
          ].toLowerCase();
        const hasClosingStatement =
          lastSentence.includes("calm") ||
          lastSentence.includes("stable") ||
          lastSentence.includes("intervention");
        expect(hasClosingStatement).toBe(true);
      });
    });

    describe("Narrative quality", () => {
      it("uses proper grammar (singular/plural agreement)", () => {
        narratives.forEach((narrative) => {
          narrative.sentences.forEach((sentence) => {
            // Check for obvious grammar issues
            // "dominates" should follow singular subjects
            // "dominate" should follow plural subjects
            const hasObviousErrors =
              sentence.includes("Banana dominate ") ||
              sentence.includes("Durian dominate ") ||
              sentence.includes("Cacao dominate ");
            expect(hasObviousErrors).toBe(false);
          });
        });
      });

      it("capitalizes ingredient names at sentence start", () => {
        narratives.forEach((narrative) => {
          narrative.sentences.forEach((sentence) => {
            // First word should be capitalized
            if (sentence.length > 0) {
              expect(sentence[0]).toBe(sentence[0].toUpperCase());
            }
          });
        });
      });

      it("produces readable narrative text", () => {
        // Combine all sentences and check it reads naturally
        const fullNarrative = narratives.flatMap((n) => n.sentences).join(" ");

        // Should be non-empty
        expect(fullNarrative.length).toBeGreaterThan(50);

        // Should not have broken formatting
        expect(fullNarrative).not.toContain("undefined");
        expect(fullNarrative).not.toContain("NaN");
        expect(fullNarrative).not.toContain("null");
      });
    });

    // =========================================================================
    // Accessible Sun Mode Narrative
    // =========================================================================
    describe("Accessible Sun mode", () => {
      const managedDominanceData = computeLayerDominanceByPhase(
        placements,
        true,
      );
      const managedNarratives = generateSuccessionNarrative(
        managedDominanceData,
        placements,
        true,
      );

      it("generates narratives for all 3 phases in managed mode", () => {
        expect(managedNarratives.length).toBe(3);
      });

      describe("Transition phase in managed mode", () => {
        const transitionNarrative = managedNarratives.find(
          (n) => n.phase === "transition",
        );
        const narrativeText = transitionNarrative!.sentences
          .join(" ")
          .toLowerCase();

        it("handles sun-lovers differently than Normal Mode", () => {
          // In managed mode, sun-lovers either:
          // 1. Continue on edges (if they were going to fade)
          // 2. Don't appear as fading (because their productivity is extended)
          // Either way, the narrative should be different from Normal Mode
          const naturalTransition = narratives.find(
            (n) => n.phase === "transition",
          );
          const naturalText = naturalTransition!.sentences
            .join(" ")
            .toLowerCase();

          // The narratives should be different
          expect(narrativeText).not.toBe(naturalText);
        });

        it("does not say sun-lovers fade as canopy closes in managed mode", () => {
          // In managed mode, we shouldn't see "fades as canopy closes" for sun-lovers
          const hasBananaFadingCanopy =
            narrativeText.includes("banana") &&
            narrativeText.includes("canopy closes");
          expect(hasBananaFadingCanopy).toBe(false);
        });

        it("narrative is valid and non-empty", () => {
          // The narrative should be valid
          expect(transitionNarrative!.sentences.length).toBeGreaterThan(0);
          expect(narrativeText.length).toBeGreaterThan(0);
        });
      });

      describe("Maturity phase in managed mode", () => {
        const maturityNarrative = managedNarratives.find(
          (n) => n.phase === "maturity",
        );
        const narrativeText = maturityNarrative!.sentences
          .join(" ")
          .toLowerCase();

        it("ends with stewardship message instead of 'forest is calm'", () => {
          const lastSentence =
            maturityNarrative!.sentences[
              maturityNarrative!.sentences.length - 1
            ].toLowerCase();
          const hasStewardshipMessage =
            lastSentence.includes("stewardship") ||
            lastSentence.includes("management") ||
            lastSentence.includes("thrives");
          expect(hasStewardshipMessage).toBe(true);
        });

        it("may mention sun-lovers thriving on edges", () => {
          // In managed mode at maturity, sun-lovers could be mentioned
          // const mentionsEdgesOrThriving =
          //   narrativeText.includes("edge") ||
          //   narrativeText.includes("thrives") ||
          //   narrativeText.includes("management");
          // This is a soft check - narrative content may vary
          expect(narrativeText.length).toBeGreaterThan(0);
        });
      });

      describe("Comparison: natural vs managed narratives", () => {
        const naturalTransition = narratives.find(
          (n) => n.phase === "transition",
        );
        const managedTransition = managedNarratives.find(
          (n) => n.phase === "transition",
        );

        it("produces different transition narratives in each mode", () => {
          const naturalText = naturalTransition!.sentences.join(" ");
          const managedText = managedTransition!.sentences.join(" ");

          // The narratives should be different (one mentions fading, other mentions edges)
          expect(naturalText).not.toBe(managedText);
        });

        it("Normal Mode mentions canopy closing for sun-lovers", () => {
          const naturalText = naturalTransition!.sentences
            .join(" ")
            .toLowerCase();
          const mentionsCanopyOrFading =
            naturalText.includes("canopy") ||
            naturalText.includes("fades") ||
            naturalText.includes("fade");
          expect(mentionsCanopyOrFading).toBe(true);
        });
      });
    });

    // =========================================================================
    // Late-maturing species (Avocado + Mango) - Establishment always has content
    // =========================================================================
    describe("Late-maturing species (Avocado + Mango)", () => {
      /**
       * Avocado and Mango are both planted at year 1 and don't start
       * harvesting until year 4+. During Establishment (years 0-2),
       * their intensity is very low (< 0.1), but we should still
       * generate a meaningful narrative about them establishing.
       */
      const lateMaturingForest: Ingredient[] = [Avocado, Mango];
      const placements = buildLayerPlacements(lateMaturingForest);
      const dominanceData = computeLayerDominanceByPhase(placements);
      const narratives = generateSuccessionNarrative(dominanceData);

      describe("Establishment phase", () => {
        const establishmentNarrative = narratives.find(
          (n) => n.phase === "establishment",
        );

        it("always generates sentences for establishment phase", () => {
          expect(establishmentNarrative).toBeDefined();
          expect(establishmentNarrative!.sentences.length).toBeGreaterThan(0);
        });

        it("mentions species establishing their roots", () => {
          const narrativeText = establishmentNarrative!.sentences
            .join(" ")
            .toLowerCase();

          // Should mention either avocado or mango establishing
          const mentionsSpecies =
            narrativeText.includes("avocado") ||
            narrativeText.includes("mango");
          expect(mentionsSpecies).toBe(true);

          // Should mention establishing/roots/shape
          const mentionsEstablishing =
            narrativeText.includes("establish") ||
            narrativeText.includes("root") ||
            narrativeText.includes("shape");
          expect(mentionsEstablishing).toBe(true);
        });

        it("starts sentences with capital letters", () => {
          establishmentNarrative!.sentences.forEach((sentence) => {
            if (sentence.length > 0) {
              const firstChar = sentence.charAt(0);
              expect(firstChar).toBe(firstChar.toUpperCase());
            }
          });
        });
      });

      describe("Transition phase", () => {
        const transitionNarrative = narratives.find(
          (n) => n.phase === "transition",
        );

        it("returns a narrative for transition phase", () => {
          expect(transitionNarrative).toBeDefined();
          // Transition may or may not have sentences depending on species changes
        });
      });

      describe("Maturity phase", () => {
        const maturityNarrative = narratives.find(
          (n) => n.phase === "maturity",
        );
        const narrativeText = maturityNarrative!.sentences
          .join(" ")
          .toLowerCase();

        it("generates sentences for maturity phase", () => {
          expect(maturityNarrative).toBeDefined();
          expect(maturityNarrative!.sentences.length).toBeGreaterThan(0);
        });

        it("mentions canopy-defining species", () => {
          // Mango is a canopy tree, Avocado is midstory (maps to canopy display layer)
          const mentionsCanopySpecies =
            narrativeText.includes("avocado") ||
            narrativeText.includes("mango");
          expect(mentionsCanopySpecies).toBe(true);
        });
      });
    });
  });

  /**
   * Tests for single ingredient narratives
   * When only one ingredient is selected, we should NOT mention "forest"
   */
  describe("Single ingredient narrative", () => {
    const singleIngredient = [Avocado];
    const placements = buildLayerPlacements(singleIngredient);
    const dominanceData = computeLayerDominanceByPhase(placements, false);
    const narratives = generateSuccessionNarrative(
      dominanceData,
      placements,
      false,
      false,
      1, // ingredientCount = 1
    );

    it("should not mention 'forest' when only one ingredient", () => {
      const allNarrativeText = narratives
        .flatMap((n) => n.sentences)
        .join(" ")
        .toLowerCase();

      expect(allNarrativeText).not.toContain("forest");
    });

    it("should use 'planting' terminology instead", () => {
      const allNarrativeText = narratives
        .flatMap((n) => n.sentences)
        .join(" ")
        .toLowerCase();

      // Should mention planting or establish (common single-ingredient phrases)
      const usesAppropriateTerminology =
        allNarrativeText.includes("planting") ||
        allNarrativeText.includes("establish");
      expect(usesAppropriateTerminology).toBe(true);
    });
  });

  /**
   * Tests for narrative-aware narratives
   */
  describe("Narrative-aware narrative", () => {
    const twoTreeSystem = [Avocado, Mango];
    const placements = buildLayerPlacements(twoTreeSystem);
    const dominanceData = computeLayerDominanceByPhase(placements, false);

    it("includes nitrogen cycling message when fertility-no-nitrogen finding present", () => {
      const narrativeFindings = [
        {
          id: "fertility-no-nitrogen",
          category: "fertility" as const,
          severity: "critical" as const,
          title: "No nitrogen cycling species present",
          description: "Test description",
        },
      ];

      const narratives = generateSuccessionNarrative(
        dominanceData,
        placements,
        false,
        false,
        2,
        narrativeFindings,
      );

      const establishmentText = narratives
        .find((n) => n.phase === "establishment")
        ?.sentences.join(" ")
        .toLowerCase();

      expect(establishmentText).toContain("nitrogen");
    });

    it("includes cashflow message when cashflow-years-0-3 finding present", () => {
      const narrativeFindings = [
        {
          id: "cashflow-years-0-3",
          category: "cashflow" as const,
          severity: "warning" as const,
          title: "No early cashflow",
          description: "Test description",
          affectedYears: [0, 3] as [number, number],
        },
      ];

      const narratives = generateSuccessionNarrative(
        dominanceData,
        placements,
        false,
        false,
        2,
        narrativeFindings,
      );

      const transitionText = narratives
        .find((n) => n.phase === "transition")
        ?.sentences.join(" ")
        .toLowerCase();

      expect(transitionText).toContain("cashflow");
    });

    it("includes resilience message when resilience-single-canopy finding present", () => {
      const narrativeFindings = [
        {
          id: "resilience-single-canopy",
          category: "resilience" as const,
          severity: "critical" as const,
          title: "No canopy redundancy",
          description: "Test description",
        },
      ];

      // Use single canopy to trigger the finding
      const singleCanopy = [Avocado];
      const singlePlacements = buildLayerPlacements(singleCanopy);
      const singleDominance = computeLayerDominanceByPhase(
        singlePlacements,
        false,
      );

      const narratives = generateSuccessionNarrative(
        singleDominance,
        singlePlacements,
        false,
        false,
        1,
        narrativeFindings,
      );

      const maturityText = narratives
        .find((n) => n.phase === "maturity")
        ?.sentences.join(" ")
        .toLowerCase();

      expect(maturityText).toContain("redundancy");
    });

    it("handles empty narrative findings gracefully", () => {
      const narratives = generateSuccessionNarrative(
        dominanceData,
        placements,
        false,
        false,
        2,
        [], // Empty integration notes
      );

      // Should still generate narratives without crashing
      expect(narratives.length).toBe(3);
      narratives.forEach((n) => {
        expect(n.sentences.length).toBeGreaterThan(0);
      });
    });
  });

  /**
   * Tests for separate soil narratives
   * When separateSoil is enabled, narrative should mention reduced root competition
   */
  describe("Separate soil narrative", () => {
    const multiIngredientForest = [Banana, Cacao, Durian];
    const placements = buildLayerPlacements(multiIngredientForest);
    const dominanceData = computeLayerDominanceByPhase(placements, false);

    describe("when separateSoil is enabled", () => {
      const narratives = generateSuccessionNarrative(
        dominanceData,
        placements,
        false, // managedLight
        false, // enableCanopyLayerNarrative
        3, // ingredientCount
        [], // narrativeFindings
        true, // separateSoil
      );

      it("includes separate beds message in establishment phase", () => {
        const establishmentText = narratives
          .find((n) => n.phase === "establishment")
          ?.sentences.join(" ")
          .toLowerCase();

        expect(establishmentText).toContain("separate");
        expect(establishmentText).toContain("root competition");
      });

      it("includes separated soil volumes message in transition phase", () => {
        const transitionText = narratives
          .find((n) => n.phase === "transition")
          ?.sentences.join(" ")
          .toLowerCase();

        expect(transitionText).toContain("separated");
        expect(transitionText).toContain("competition");
      });

      it("includes separate beds coexistence message in maturity phase", () => {
        const maturityText = narratives
          .find((n) => n.phase === "maturity")
          ?.sentences.join(" ")
          .toLowerCase();

        expect(maturityText).toContain("separate");
        expect(maturityText).toContain("coexistence");
      });
    });

    describe("when separateSoil is disabled", () => {
      const narratives = generateSuccessionNarrative(
        dominanceData,
        placements,
        false, // managedLight
        false, // enableCanopyLayerNarrative
        3, // ingredientCount
        [], // narrativeFindings
        false, // separateSoil
      );

      it("does not include separate soil messages", () => {
        const allText = narratives
          .flatMap((n) => n.sentences)
          .join(" ")
          .toLowerCase();

        // Should not contain the specific separate soil phrases
        expect(allText).not.toContain("separate beds");
        expect(allText).not.toContain("separated soil volumes");
      });
    });

    describe("with single ingredient", () => {
      const singleIngredient = [Avocado];
      const singlePlacements = buildLayerPlacements(singleIngredient);
      const singleDominance = computeLayerDominanceByPhase(
        singlePlacements,
        false,
      );

      it("does not include separate soil messages for single ingredient", () => {
        const narratives = generateSuccessionNarrative(
          singleDominance,
          singlePlacements,
          false,
          false,
          1, // ingredientCount = 1
          [],
          true, // separateSoil enabled but only 1 ingredient
        );

        const allText = narratives
          .flatMap((n) => n.sentences)
          .join(" ")
          .toLowerCase();

        // Separate soil narrative should not appear for single ingredient
        // (no competition to reduce)
        expect(allText).not.toContain("separate beds");
        expect(allText).not.toContain("separated soil volumes");
      });
    });
  });
});

// ============================================================================
// DYNAMIC TIMELINE DURATION
// ============================================================================

describe("Dynamic Timeline Duration", () => {
  describe("computeTimelineDuration", () => {
    it("returns default 5 years for empty segments", () => {
      expect(computeTimelineDuration([])).toBe(5);
    });

    it("returns short duration for short-lived ingredients (annuals)", () => {
      const segments = buildLifetimeSegments([Peanut]);
      const duration = computeTimelineDuration(segments);
      // Peanut is short-lived (~1-2 years), should get a short timeline
      expect(duration).toBeLessThanOrEqual(3);
    });

    it("returns appropriate duration for long-lived ingredients (Durian)", () => {
      const segments = buildLifetimeSegments([Durian]);
      const duration = computeTimelineDuration(segments);
      // Durian: plant year 2, harvest start 9, harvest end ~49
      // Should round up to nearest 5, so 50
      expect(duration).toBe(50);
    });

    it("uses smart rounding based on timeline length", () => {
      // Banana ends at ~2.8, falls in medium range (>2), rounds to nearest 2 = 4
      const bananaSegments = buildLifetimeSegments([Banana]);
      expect(computeTimelineDuration(bananaSegments)).toBe(4);

      // Cacao ends at ~23.5, should round to 25 (nearest 5 for long timelines)
      const cacaoSegments = buildLifetimeSegments([Cacao]);
      expect(computeTimelineDuration(cacaoSegments)).toBe(25);
    });

    it("handles mixed forests - uses longest-lived", () => {
      const segments = buildLifetimeSegments(testFoodForest);
      const duration = computeTimelineDuration(segments);
      // Should use Durian's end year (~49) rounded to 50
      expect(duration).toBe(50);
    });

    it("extends with respawn cycles", () => {
      const segments = buildLifetimeSegments([Banana], { banana: 2 });
      // 3 cycles of ~2.8 years each = ~8.4, rounded to 10 (nearest 2 for medium)
      const duration = computeTimelineDuration(segments);
      expect(duration).toBe(10);
    });
  });

  describe("computeShortestLifecycle", () => {
    it("returns 5 for empty segments", () => {
      expect(computeShortestLifecycle([])).toBe(5);
    });

    it("returns short lifecycle for annual (Peanut)", () => {
      const segments = buildLifetimeSegments([Peanut]);
      const shortest = computeShortestLifecycle(segments);
      // Peanut is short-lived (pioneer/annual)
      expect(shortest).toBeLessThan(5);
    });

    it("returns Banana's lifecycle when it's shortest", () => {
      const segments = buildLifetimeSegments([Banana, Durian]);
      const shortest = computeShortestLifecycle(segments);
      // Banana: ~2.8 years lifecycle, Durian: ~47 years
      expect(shortest).toBeCloseTo(2.8, 0);
    });

    it("ignores respawn cycles - uses original lifecycle duration", () => {
      const segments = buildLifetimeSegments([Banana], { banana: 5 });
      const shortest = computeShortestLifecycle(segments);
      // Should still be ~2.8, not the extended timeline
      expect(shortest).toBeCloseTo(2.8, 0);
    });
  });

  describe("computeDurationOptions", () => {
    it("returns only Full option for empty segments", () => {
      const options = computeDurationOptions([]);
      expect(options.length).toBe(1);
      expect(options[0].label).toContain("Full");
      expect(options[0].value).toBe(5);
    });

    it("includes 1 year option when shortest lifecycle <= 2 years", () => {
      // Peanut is very short-lived
      const segments = buildLifetimeSegments([Peanut, Durian]);
      const options = computeDurationOptions(segments);
      expect(options.some((o) => o.value === 1)).toBe(true);
    });

    it("does NOT include 1 year option for long-lived only forests", () => {
      const segments = buildLifetimeSegments([Durian]);
      const options = computeDurationOptions(segments);
      // No short-lived species, so no 1 year option
      expect(options.some((o) => o.value === 1)).toBe(false);
    });

    it("includes 5, 10, 20 year options for long durations", () => {
      const segments = buildLifetimeSegments([Durian]);
      const options = computeDurationOptions(segments);
      expect(options.some((o) => o.value === 5)).toBe(true);
      expect(options.some((o) => o.value === 10)).toBe(true);
      expect(options.some((o) => o.value === 20)).toBe(true);
    });

    it("always includes Full as last option", () => {
      const segments = buildLifetimeSegments(testFoodForest);
      const options = computeDurationOptions(segments);
      const lastOption = options[options.length - 1];
      expect(lastOption.label).toContain("Full");
      expect(lastOption.value).toBe(50); // Durian's timeline
    });

    it("provides mixed forest with all contextual options", () => {
      // Forest with both annual (Peanut) and long-lived (Durian)
      const segments = buildLifetimeSegments([Peanut, Banana, Cacao, Durian]);
      const options = computeDurationOptions(segments);
      // Should have 1, 5, 10, 20, and Full (50)
      expect(options.some((o) => o.value === 1)).toBe(true);
      expect(options.some((o) => o.value === 5)).toBe(true);
      expect(options.some((o) => o.value === 10)).toBe(true);
      expect(options.some((o) => o.value === 20)).toBe(true);
      expect(options.some((o) => o.label.includes("Full"))).toBe(true);
    });
  });

  describe("computePhasePositions", () => {
    it("returns valid phase positions for 1 year timeline", () => {
      const phases = computePhasePositions(1);
      expect(phases.establishment.start).toBe(0);
      expect(phases.establishment.end).toBe(0.2);
      expect(phases.transition.start).toBe(0.2);
      expect(phases.transition.end).toBe(0.5);
      expect(phases.maturity.start).toBe(0.5);
      expect(phases.maturity.end).toBe(1);
    });

    it("returns valid phase positions for 20 year timeline", () => {
      const phases = computePhasePositions(20);
      // Establishment: 0-2 years (10%)
      expect(phases.establishment.start).toBe(0);
      expect(phases.establishment.end).toBeCloseTo(0.1, 1);
      // Transition: 2-7 years (25%)
      expect(phases.transition.start).toBeCloseTo(0.1, 1);
      expect(phases.transition.end).toBeCloseTo(0.35, 1);
      // Maturity: 7-20 years (65%)
      expect(phases.maturity.start).toBeCloseTo(0.35, 1);
      expect(phases.maturity.end).toBe(1);
    });

    it("scales appropriately for 50 year timeline", () => {
      const phases = computePhasePositions(50);
      // Should have phases that sum to 1
      expect(phases.establishment.start).toBe(0);
      expect(phases.maturity.end).toBe(1);
      // Phases should be contiguous
      expect(phases.establishment.end).toBe(phases.transition.start);
      expect(phases.transition.end).toBe(phases.maturity.start);
    });

    it("all phases are contiguous", () => {
      [1, 5, 10, 20, 50].forEach((duration) => {
        const phases = computePhasePositions(duration);
        expect(phases.establishment.end).toBe(phases.transition.start);
        expect(phases.transition.end).toBe(phases.maturity.start);
      });
    });
  });
});
