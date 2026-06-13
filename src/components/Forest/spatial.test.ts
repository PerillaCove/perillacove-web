// pnpm vitest run src/components/Forest/spatial.test.ts
/* eslint-disable */
import { describe, it, expect } from "vitest";
import {
  computeSpatialVolumes,
  getLayerAtHeight,
  computeLightAtHeight,
} from "./spatial";
import type { StructureSettings } from "./spatial";
// Ingredient type not directly used but ingredients are imported from data
import type {
  DimensionGrouping,
  RespawnConfig,
  SpeciesCountConfig,
} from "./types";
import { Banana, Cacao, Durian, Mango } from "../IngredientsPage/data";

// =============================================================================
// TEST DATA
// =============================================================================

/**
 * Default structure settings for most tests
 */
const defaultStructures: StructureSettings = {
  separateSoil: false,
};

/**
 * Helper to find a volume by ingredient ID (handles multi-instance IDs)
 */
function findVolume(
  volumes: ReturnType<typeof computeSpatialVolumes>["volumes"],
  idOrPrefix: string,
) {
  return volumes.find(
    (v) =>
      v.ingredientId === idOrPrefix ||
      v.ingredientId.startsWith(idOrPrefix + "__"),
  );
}

/**
 * Helper to find all volumes for a given ingredient ID prefix
 */
function findAllVolumes(
  volumes: ReturnType<typeof computeSpatialVolumes>["volumes"],
  idPrefix: string,
) {
  return volumes.filter(
    (v) =>
      v.ingredientId === idPrefix || v.ingredientId.startsWith(idPrefix + "__"),
  );
}

// =============================================================================
// TESTS
// =============================================================================

describe("Spatial Volume Computation", () => {
  // =========================================================================
  // Basic computeSpatialVolumes
  // =========================================================================
  describe("computeSpatialVolumes - basics", () => {
    it("returns empty volumes for empty ingredients", () => {
      const result = computeSpatialVolumes([], 0, defaultStructures);
      expect(result.volumes).toHaveLength(0);
    });

    it("creates one volume per ingredient by default", () => {
      // At year 1, Banana is active (0.8-2.8), at year 10 Cacao is active (3.5-23.5)
      // Use year 1 with just Banana to keep it simple
      const result = computeSpatialVolumes([Banana], 1, defaultStructures);
      expect(result.volumes.length).toBe(1);
    });

    it("includes scene metadata", () => {
      const result = computeSpatialVolumes([Banana], 1, defaultStructures);
      expect(result).toHaveProperty("volumes");
      expect(result).toHaveProperty("hasCanopy");
      expect(result).toHaveProperty("canopyClosure");
      expect(result).toHaveProperty("bounds");
    });

    it("computes reasonable bounds", () => {
      const result = computeSpatialVolumes(
        [Banana, Durian],
        5,
        defaultStructures,
      );
      expect(result.bounds.minX).toBeLessThan(result.bounds.maxX);
      expect(result.bounds.minZ).toBeLessThan(result.bounds.maxZ);
      expect(result.bounds.maxHeight).toBeGreaterThan(0);
    });

    it("each volume has required properties", () => {
      const result = computeSpatialVolumes([Banana], 1, defaultStructures);
      const volume = result.volumes[0];

      expect(volume).toHaveProperty("ingredientId");
      expect(volume).toHaveProperty("displayName");
      expect(volume).toHaveProperty("layer");
      expect(volume).toHaveProperty("heightRange");
      expect(volume).toHaveProperty("canopyRadius");
      expect(volume).toHaveProperty("footprintType");
      expect(volume).toHaveProperty("footprintRadius");
      expect(volume).toHaveProperty("position");
      expect(volume).toHaveProperty("intensity");
      expect(volume).toHaveProperty("status");
      expect(volume).toHaveProperty("layerColor");
      expect(volume).toHaveProperty("opacity");
      expect(volume).toHaveProperty("growthMaturity");
      expect(volume).toHaveProperty("ageYears");
    });

    it("assigns correct layers to species", () => {
      // Use year 1 when Banana is active (planted year 0, harvests 0.8-2.8)
      const bananaResult = computeSpatialVolumes(
        [Banana],
        1,
        defaultStructures,
      );
      const bananaVolume = findVolume(bananaResult.volumes, "banana");
      expect(bananaVolume?.layer).toBe("understory");

      // Use year 10 when Durian is active (planted year 2, harvests 9-49)
      const durianResult = computeSpatialVolumes(
        [Durian],
        10,
        defaultStructures,
      );
      const durianVolume = findVolume(durianResult.volumes, "durian");
      expect(durianVolume?.layer).toBe("canopy");
    });

    it("skips species with negligible intensity", () => {
      // At year 0, nothing has been planted yet for late species like Durian
      const result = computeSpatialVolumes([Durian], 0, defaultStructures);
      // Durian is planted at year 2, so at year 0 it shouldn't appear
      const durianVolumes = findAllVolumes(result.volumes, "durian");
      expect(durianVolumes.length).toBe(0);
    });

    it("shows species at appropriate years", () => {
      // Banana is planted at year 0, should appear at year 1
      const result = computeSpatialVolumes([Banana], 1, defaultStructures);
      const bananaVolume = findVolume(result.volumes, "banana");
      expect(bananaVolume).toBeDefined();
      expect(bananaVolume!.intensity).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // Species Count Feature
  // =========================================================================
  describe("computeSpatialVolumes - speciesCountConfig", () => {
    describe("Basic instance counting", () => {
      it("creates 1 volume per species by default (no config)", () => {
        const result = computeSpatialVolumes([Banana], 1, defaultStructures);
        const bananaVolumes = findAllVolumes(result.volumes, "banana");
        expect(bananaVolumes.length).toBe(1);
      });

      it("creates 1 volume when speciesCountConfig is empty", () => {
        const result = computeSpatialVolumes(
          [Banana],
          1,
          defaultStructures,
          undefined,
          undefined,
          {},
        );
        const bananaVolumes = findAllVolumes(result.volumes, "banana");
        expect(bananaVolumes.length).toBe(1);
      });

      it("creates multiple volumes when count > 1", () => {
        const speciesCountConfig: SpeciesCountConfig = { banana: 3 };
        const result = computeSpatialVolumes(
          [Banana],
          1,
          defaultStructures,
          undefined,
          undefined,
          speciesCountConfig,
        );
        const bananaVolumes = findAllVolumes(result.volumes, "banana");
        expect(bananaVolumes.length).toBe(3);
      });

      it("creates 5 volumes when count is 5", () => {
        const speciesCountConfig: SpeciesCountConfig = { banana: 5 };
        const result = computeSpatialVolumes(
          [Banana],
          1,
          defaultStructures,
          undefined,
          undefined,
          speciesCountConfig,
        );
        const bananaVolumes = findAllVolumes(result.volumes, "banana");
        expect(bananaVolumes.length).toBe(5);
      });

      it("handles max count of 20", () => {
        const speciesCountConfig: SpeciesCountConfig = { banana: 20 };
        const result = computeSpatialVolumes(
          [Banana],
          1,
          defaultStructures,
          undefined,
          undefined,
          speciesCountConfig,
        );
        const bananaVolumes = findAllVolumes(result.volumes, "banana");
        expect(bananaVolumes.length).toBe(20);
      });
    });

    describe("Volume ID format", () => {
      it("uses simple ID for single instance", () => {
        const result = computeSpatialVolumes([Banana], 1, defaultStructures);
        const bananaVolume = result.volumes.find(
          (v) => v.ingredientId === "banana",
        );
        expect(bananaVolume).toBeDefined();
      });

      it("uses indexed IDs for multiple instances", () => {
        const speciesCountConfig: SpeciesCountConfig = { banana: 3 };
        const result = computeSpatialVolumes(
          [Banana],
          1,
          defaultStructures,
          undefined,
          undefined,
          speciesCountConfig,
        );

        const ids = result.volumes.map((v) => v.ingredientId);
        expect(ids).toContain("banana__0");
        expect(ids).toContain("banana__1");
        expect(ids).toContain("banana__2");
      });

      it("does not include index when count is 1 explicitly", () => {
        const speciesCountConfig: SpeciesCountConfig = { banana: 1 };
        const result = computeSpatialVolumes(
          [Banana],
          1,
          defaultStructures,
          undefined,
          undefined,
          speciesCountConfig,
        );

        // Count of 1 is removed from config, so should use simple ID
        const bananaVolume = result.volumes.find(
          (v) => v.ingredientId === "banana",
        );
        expect(bananaVolume).toBeDefined();
      });
    });

    describe("Position distribution", () => {
      it("positions multiple instances at different locations", () => {
        const speciesCountConfig: SpeciesCountConfig = { banana: 5 };
        const result = computeSpatialVolumes(
          [Banana],
          1,
          defaultStructures,
          undefined,
          undefined,
          speciesCountConfig,
        );

        const bananaVolumes = findAllVolumes(result.volumes, "banana");
        const positions = bananaVolumes.map((v) => v.position);

        // All positions should be unique
        const uniquePositions = new Set(
          positions.map((p) => `${p.x.toFixed(2)},${p.z.toFixed(2)}`),
        );
        expect(uniquePositions.size).toBe(5);
      });

      it("uses spiral pattern for positioning", () => {
        const speciesCountConfig: SpeciesCountConfig = { banana: 10 };
        const result = computeSpatialVolumes(
          [Banana],
          1,
          defaultStructures,
          undefined,
          undefined,
          speciesCountConfig,
        );

        const bananaVolumes = findAllVolumes(result.volumes, "banana");

        // First instance should be at or near center
        // Subsequent instances should spiral outward
        const firstPos = bananaVolumes[0].position;
        const lastPos = bananaVolumes[bananaVolumes.length - 1].position;

        const firstDist = Math.sqrt(firstPos.x ** 2 + firstPos.z ** 2);
        const lastDist = Math.sqrt(lastPos.x ** 2 + lastPos.z ** 2);

        // Last instance should be further from center than first
        expect(lastDist).toBeGreaterThan(firstDist);
      });
    });

    describe("Mixed species counts", () => {
      it("handles different counts for different species", () => {
        // Use Cacao and Mango which overlap at year 10
        // Cacao: plant 0.5, harvest 3.5-23.5
        // Mango: plant 1, harvest 4-24 (approx)
        const speciesCountConfig: SpeciesCountConfig = {
          cacao: 3,
          mango: 2,
        };
        const result = computeSpatialVolumes(
          [Cacao, Mango],
          10,
          defaultStructures,
          undefined,
          undefined,
          speciesCountConfig,
        );

        const cacaoVolumes = findAllVolumes(result.volumes, "cacao");
        const mangoVolumes = findAllVolumes(result.volumes, "mango");

        expect(cacaoVolumes.length).toBe(3);
        expect(mangoVolumes.length).toBe(2);
      });

      it("uses default count (1) for species not in config", () => {
        // Use Cacao and Mango at year 10 when both are active
        const speciesCountConfig: SpeciesCountConfig = { cacao: 5 };
        const result = computeSpatialVolumes(
          [Cacao, Mango],
          10,
          defaultStructures,
          undefined,
          undefined,
          speciesCountConfig,
        );

        const cacaoVolumes = findAllVolumes(result.volumes, "cacao");
        const mangoVolumes = findAllVolumes(result.volumes, "mango");

        expect(cacaoVolumes.length).toBe(5);
        expect(mangoVolumes.length).toBe(1); // Default
      });
    });

    describe("Volume properties consistency", () => {
      it("all instances share same layer", () => {
        const speciesCountConfig: SpeciesCountConfig = { banana: 5 };
        const result = computeSpatialVolumes(
          [Banana],
          1,
          defaultStructures,
          undefined,
          undefined,
          speciesCountConfig,
        );

        const bananaVolumes = findAllVolumes(result.volumes, "banana");
        const layers = new Set(bananaVolumes.map((v) => v.layer));
        expect(layers.size).toBe(1);
        expect(layers.has("understory")).toBe(true);
      });

      it("all instances share same intensity", () => {
        const speciesCountConfig: SpeciesCountConfig = { banana: 5 };
        const result = computeSpatialVolumes(
          [Banana],
          1,
          defaultStructures,
          undefined,
          undefined,
          speciesCountConfig,
        );

        const bananaVolumes = findAllVolumes(result.volumes, "banana");
        const intensities = bananaVolumes.map((v) => v.intensity);

        // All should have same intensity (same year, same lifecycle)
        const firstIntensity = intensities[0];
        intensities.forEach((i) => {
          expect(i).toBeCloseTo(firstIntensity, 5);
        });
      });

      it("all instances share same display name", () => {
        const speciesCountConfig: SpeciesCountConfig = { banana: 3 };
        const result = computeSpatialVolumes(
          [Banana],
          1,
          defaultStructures,
          undefined,
          undefined,
          speciesCountConfig,
        );

        const bananaVolumes = findAllVolumes(result.volumes, "banana");
        const names = new Set(bananaVolumes.map((v) => v.displayName));
        expect(names.size).toBe(1);
      });
    });
  });

  // =========================================================================
  // Species Count + Soil Grouping Interaction
  // =========================================================================
  describe("computeSpatialVolumes - speciesCountConfig with soilGrouping", () => {
    const soilGrouping: DimensionGrouping = {
      enabled: true,
      groups: [
        {
          id: "group1",
          label: "Group 1",
          ingredientIds: ["banana"],
        },
      ],
      defaultGroupId: "__default__",
    };

    it("creates multiple instances within a soil group", () => {
      const speciesCountConfig: SpeciesCountConfig = { banana: 3 };
      const structures: StructureSettings = {
        ...defaultStructures,
        separateSoil: true,
      };

      const result = computeSpatialVolumes(
        [Banana],
        1,
        structures,
        soilGrouping,
        undefined,
        speciesCountConfig,
      );

      const bananaVolumes = findAllVolumes(result.volumes, "banana");
      expect(bananaVolumes.length).toBe(3);
    });

    it("uses combined ID format with instance index and group", () => {
      const speciesCountConfig: SpeciesCountConfig = { banana: 2 };
      const structures: StructureSettings = {
        ...defaultStructures,
        separateSoil: true,
      };

      const result = computeSpatialVolumes(
        [Banana],
        1,
        structures,
        soilGrouping,
        undefined,
        speciesCountConfig,
      );

      const ids = result.volumes.map((v) => v.ingredientId);
      // Should have format: banana__0__group1, banana__1__group1
      expect(ids).toContain("banana__0__group1");
      expect(ids).toContain("banana__1__group1");
    });

    it("positions all instances within their group cluster", () => {
      const speciesCountConfig: SpeciesCountConfig = { banana: 5 };
      const structures: StructureSettings = {
        ...defaultStructures,
        separateSoil: true,
      };

      const result = computeSpatialVolumes(
        [Banana],
        1,
        structures,
        soilGrouping,
        undefined,
        speciesCountConfig,
      );

      const bananaVolumes = findAllVolumes(result.volumes, "banana");

      // All instances should be relatively close together (within group)
      const positions = bananaVolumes.map((v) => v.position);
      const centerX =
        positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
      const centerZ =
        positions.reduce((sum, p) => sum + p.z, 0) / positions.length;

      // All should be within reasonable distance of their group center
      positions.forEach((p) => {
        const dist = Math.sqrt((p.x - centerX) ** 2 + (p.z - centerZ) ** 2);
        expect(dist).toBeLessThan(20); // Reasonable cluster radius
      });
    });

    it("handles multiple species with counts in same group", () => {
      // Use Cacao and Mango which are both active at year 10
      const multiGrouping: DimensionGrouping = {
        enabled: true,
        groups: [
          {
            id: "group1",
            label: "Group 1",
            ingredientIds: ["cacao", "mango"],
          },
        ],
        defaultGroupId: "__default__",
      };

      const speciesCountConfig: SpeciesCountConfig = {
        cacao: 3,
        mango: 2,
      };
      const structures: StructureSettings = {
        ...defaultStructures,
        separateSoil: true,
      };

      const result = computeSpatialVolumes(
        [Cacao, Mango],
        10,
        structures,
        multiGrouping,
        undefined,
        speciesCountConfig,
      );

      const cacaoVolumes = findAllVolumes(result.volumes, "cacao");
      const mangoVolumes = findAllVolumes(result.volumes, "mango");

      expect(cacaoVolumes.length).toBe(3);
      expect(mangoVolumes.length).toBe(2);
    });
  });

  // =========================================================================
  // Species Count + Respawning Interaction
  // =========================================================================
  describe("computeSpatialVolumes - speciesCountConfig with respawning", () => {
    it("creates multiple instances at each respawn cycle", () => {
      const speciesCountConfig: SpeciesCountConfig = { banana: 2 };
      const respawnConfig: RespawnConfig = { banana: 1 }; // One respawn = 2 cycles

      // At year 1, first cycle is active
      const result1 = computeSpatialVolumes(
        [Banana],
        1,
        defaultStructures,
        undefined,
        respawnConfig,
        speciesCountConfig,
      );
      const bananaVolumes1 = findAllVolumes(result1.volumes, "banana");
      expect(bananaVolumes1.length).toBe(2);

      // At year 4, second cycle is active (first cycle ends ~2.8)
      const result2 = computeSpatialVolumes(
        [Banana],
        4,
        defaultStructures,
        undefined,
        respawnConfig,
        speciesCountConfig,
      );
      const bananaVolumes2 = findAllVolumes(result2.volumes, "banana");
      expect(bananaVolumes2.length).toBe(2);
    });

    it("all instances share same lifecycle timing", () => {
      const speciesCountConfig: SpeciesCountConfig = { banana: 3 };
      const result = computeSpatialVolumes(
        [Banana],
        1,
        defaultStructures,
        undefined,
        undefined,
        speciesCountConfig,
      );

      const bananaVolumes = findAllVolumes(result.volumes, "banana");
      const ages = bananaVolumes.map((v) => v.ageYears);

      // All instances planted at same time = same age
      const firstAge = ages[0];
      ages.forEach((age) => {
        expect(age).toBeCloseTo(firstAge, 5);
      });
    });
  });

  // =========================================================================
  // Position Stability Across Time (Deterministic Positioning)
  // =========================================================================
  describe("computeSpatialVolumes - position stability", () => {
    it("positions remain stable when species fade in/out", () => {
      // This tests the fix for position shifting during time simulation.
      // Positions should be deterministic based on ingredient ID, not visibility.
      //
      // Species lifecycles:
      // - Cacao: plant 0.5, harvest 3.5-23.5
      // - Mango: plant 1, harvest 4-24 (approx)
      // - Durian: plant 2, harvest 9-49

      const ingredients = [Cacao, Durian];

      // Year 5: Only Cacao is active (Durian not harvesting yet until year 9)
      const resultYear5 = computeSpatialVolumes(
        ingredients,
        5,
        defaultStructures,
      );
      const cacaoAtYear5 = findVolume(resultYear5.volumes, "cacao");

      // Year 15: Both Cacao and Durian are active
      const resultYear15 = computeSpatialVolumes(
        ingredients,
        15,
        defaultStructures,
      );
      const cacaoAtYear15 = findVolume(resultYear15.volumes, "cacao");
      const durianAtYear15 = findVolume(resultYear15.volumes, "durian");

      // Year 40: Only Durian is active (Cacao lifecycle ended at ~24.5)
      const resultYear40 = computeSpatialVolumes(
        ingredients,
        40,
        defaultStructures,
      );
      const durianAtYear40 = findVolume(resultYear40.volumes, "durian");

      // Cacao position should be the same at year 5 and year 15
      expect(cacaoAtYear5).toBeDefined();
      expect(cacaoAtYear15).toBeDefined();
      expect(cacaoAtYear5!.position.x).toBeCloseTo(
        cacaoAtYear15!.position.x,
        5,
      );
      expect(cacaoAtYear5!.position.z).toBeCloseTo(
        cacaoAtYear15!.position.z,
        5,
      );

      // Durian position should be the same at year 15 and year 40
      expect(durianAtYear15).toBeDefined();
      expect(durianAtYear40).toBeDefined();
      expect(durianAtYear15!.position.x).toBeCloseTo(
        durianAtYear40!.position.x,
        5,
      );
      expect(durianAtYear15!.position.z).toBeCloseTo(
        durianAtYear40!.position.z,
        5,
      );
    });

    it("positions are stable with speciesCountConfig as species fade", () => {
      // Use Cacao (3.5-23.5) and Mango (4-24) which have long overlapping lifecycles
      const speciesCountConfig: SpeciesCountConfig = { cacao: 3, mango: 2 };
      const ingredients = [Cacao, Mango];

      // Year 5: Both visible and early in lifecycle
      const resultYear5 = computeSpatialVolumes(
        ingredients,
        5,
        defaultStructures,
        undefined,
        undefined,
        speciesCountConfig,
      );

      // Year 15: Both still visible mid-lifecycle
      const resultYear15 = computeSpatialVolumes(
        ingredients,
        15,
        defaultStructures,
        undefined,
        undefined,
        speciesCountConfig,
      );

      // Get positions of cacao instances at both years
      const cacaosYear5 = findAllVolumes(resultYear5.volumes, "cacao");
      const cacaosYear15 = findAllVolumes(resultYear15.volumes, "cacao");

      // Should have same number of cacao instances
      expect(cacaosYear5.length).toBe(3);
      expect(cacaosYear15.length).toBe(3);

      // Positions should match by index
      for (let i = 0; i < cacaosYear5.length; i++) {
        expect(cacaosYear5[i].position.x).toBeCloseTo(
          cacaosYear15[i].position.x,
          5,
        );
        expect(cacaosYear5[i].position.z).toBeCloseTo(
          cacaosYear15[i].position.z,
          5,
        );
      }
    });

    it("species maintain stable positions without legacy placement overrides", () => {
      const ingredients = [Cacao, Durian];

      // Year 5: Cacao visible, Durian not yet productive
      const resultYear5 = computeSpatialVolumes(
        ingredients,
        5,
        defaultStructures,
      );
      const cacaoAtYear5 = findVolume(resultYear5.volumes, "cacao");

      // Year 15: Both visible, Cacao remains in the same deterministic position
      const resultYear15 = computeSpatialVolumes(
        ingredients,
        15,
        defaultStructures,
      );
      const cacaoAtYear15 = findVolume(resultYear15.volumes, "cacao");

      expect(cacaoAtYear5).toBeDefined();
      expect(cacaoAtYear15).toBeDefined();
      expect(cacaoAtYear5!.position.x).toBeCloseTo(
        cacaoAtYear15!.position.x,
        5,
      );
      expect(cacaoAtYear5!.position.z).toBeCloseTo(
        cacaoAtYear15!.position.z,
        5,
      );
    });
  });

  // =========================================================================
  // Scene bounds with multiple instances
  // =========================================================================
  describe("computeSpatialVolumes - bounds with species counts", () => {
    it("bounds stay roughly constant regardless of instance count", () => {
      // Adding more instances should cluster locally, NOT expand the global spiral.
      // This prevents the soil/ground plane from growing when the user adds copies.
      const result1 = computeSpatialVolumes([Banana], 1, defaultStructures);

      const speciesCountConfig: SpeciesCountConfig = { banana: 18 };
      const result2 = computeSpatialVolumes(
        [Banana],
        1,
        defaultStructures,
        undefined,
        undefined,
        speciesCountConfig,
      );

      const width1 = result1.bounds.maxX - result1.bounds.minX;
      const width2 = result2.bounds.maxX - result2.bounds.minX;

      // Bounds may grow slightly from local scatter but should NOT scale
      // proportionally with instance count (old bug: sqrt(17)*2.1 ≈ 8.66m expansion).
      // Local scatter max ≈ sqrt(17)*0.8 ≈ 3.3m, so bounds growth should be modest.
      expect(width2 - width1).toBeLessThan(8);
    });

    it("instances cluster near their species base position", () => {
      const speciesCountConfig: SpeciesCountConfig = { banana: 10 };
      const result = computeSpatialVolumes(
        [Banana],
        1,
        defaultStructures,
        undefined,
        undefined,
        speciesCountConfig,
      );

      const bananaVolumes = findAllVolumes(result.volumes, "banana");
      const basePos = bananaVolumes[0].position; // First instance = species base

      // All instances should be within local scatter radius of the base
      // Max scatter: sqrt(9) * localSpacing where localSpacing = max(1.2, baseRadius*0.7)
      // For banana (understory, baseRadius=2): localSpacing=1.4, max dist = sqrt(9)*1.4 = 4.2m
      for (const vol of bananaVolumes) {
        const dist = Math.sqrt(
          (vol.position.x - basePos.x) ** 2 + (vol.position.z - basePos.z) ** 2,
        );
        expect(dist).toBeLessThan(6); // Generous margin over theoretical ~4.2m
      }
    });
  });

  // =========================================================================
  // getLayerAtHeight
  // =========================================================================
  describe("getLayerAtHeight", () => {
    it("returns canopy for heights 10-15m", () => {
      expect(getLayerAtHeight(12)).toBe("canopy");
      expect(getLayerAtHeight(10)).toBe("canopy");
      expect(getLayerAtHeight(15)).toBe("canopy");
    });

    it("returns midstory for heights 5-10m", () => {
      expect(getLayerAtHeight(7)).toBe("midstory");
      expect(getLayerAtHeight(5)).toBe("midstory");
    });

    it("returns understory for heights 2-5m", () => {
      expect(getLayerAtHeight(3)).toBe("understory");
      expect(getLayerAtHeight(2)).toBe("understory");
    });

    it("returns shrub for heights 1-2m", () => {
      expect(getLayerAtHeight(1.5)).toBe("shrub");
    });

    it("returns herbaceous for heights 0.3-1m", () => {
      expect(getLayerAtHeight(0.5)).toBe("herbaceous");
    });

    it("returns groundcover for heights 0-0.3m", () => {
      expect(getLayerAtHeight(0.1)).toBe("groundcover");
      expect(getLayerAtHeight(0)).toBe("groundcover");
    });

    it("returns root for negative heights", () => {
      expect(getLayerAtHeight(-0.3)).toBe("root");
    });

    it("returns null for heights above canopy", () => {
      expect(getLayerAtHeight(20)).toBe(null);
    });
  });

  // =========================================================================
  // computeLightAtHeight
  // =========================================================================
  describe("computeLightAtHeight", () => {
    it("returns full light (1.0) at top of canopy", () => {
      const light = computeLightAtHeight(15, 0);
      expect(light).toBe(1);
    });

    it("reduces light with canopy closure", () => {
      const lightNoClosure = computeLightAtHeight(5, 0);
      const lightWithClosure = computeLightAtHeight(5, 0.8);

      expect(lightWithClosure).toBeLessThan(lightNoClosure);
    });

    it("never returns less than 0.1 (minimum light)", () => {
      const light = computeLightAtHeight(0, 1.0);
      expect(light).toBeGreaterThanOrEqual(0.1);
    });

    it("lower layers get less light", () => {
      const lightHigh = computeLightAtHeight(10, 0.5);
      const lightLow = computeLightAtHeight(2, 0.5);

      expect(lightHigh).toBeGreaterThan(lightLow);
    });
  });
});
