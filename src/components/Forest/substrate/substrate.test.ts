import { describe, expect, it, beforeEach } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import {
  Acacia,
  AppleGreen,
  Banana,
  Basil,
  Blueberry,
  Cacao,
  Comfrey,
  Cow,
  Durian,
  IngredientMap,
  Jackfruit,
  Mango,
  Oregano,
  Peanut,
  PigeonPea,
  Rice,
  Rosemary,
  GrowableIngredients,
} from "../../IngredientsPage/data";
import { sampleTropicalTour } from "../../PanoramicTour/data/sampleTropical";
import { normalizePanoramaTourData } from "../../PanoramicTour/tourNormalization";
import type { Ingredient } from "../../IngredientsPage/types";
import { getIngredientSensoryProfile } from "../../IngredientsPage/sensory";
import { buildIntegrationScene } from "./scene";
import { arrangeIntegrationScene } from "./scene/placement";
import {
  clearIntegrationSceneCache,
  getIntegrationSceneCacheStats,
  resolveIntegrationScene,
} from "./engine";
import { buildSpeciesTrajectory } from "./species";
import { ELEMENT_LABELS } from "./labels";
import { buildIngredientIntegrationProfile } from "./profiles";
import { getSpeciesConfig } from "../Forest3D/SpeciesRenderConfig";
import { match01, rangeFit01 } from "./bundles";
import { createGreenhouseShell, createSwale } from "./structures";
import { TRANSFORMATION_PASS_COUNT } from "./transformations/constants";
import { ELEMENT_IDS } from "./types";
import type {
  ElementId,
  IntegrationElementReading,
  IntegrationSceneState,
} from "./types";

function nearestLocal(
  reading: IntegrationElementReading,
  position: { x: number; z: number },
) {
  return [...reading.locals].sort(
    (a, b) =>
      Math.hypot(a.x - position.x, a.z - position.z) -
      Math.hypot(b.x - position.x, b.z - position.z),
  )[0];
}

function matureScene(ingredients: Ingredient[], year = 12) {
  return buildIntegrationScene({
    ingredients,
    year,
    respawnConfig: {
      banana: 8,
      peanut: 12,
      pigeon_pea: 8,
      basil: 12,
      oregano: 12,
      rosemary: 6,
    },
    speciesCountConfig: {
      banana: 3,
      peanut: 12,
      pigeon_pea: 4,
      basil: 8,
      oregano: 8,
      rosemary: 5,
    },
  });
}

function withExtraStructure(
  scene: IntegrationSceneState,
  structure: IntegrationSceneState["structures"][number],
): IntegrationSceneState {
  return {
    ...scene,
    structures: [...scene.structures, structure],
    hash: `${scene.hash}:${structure.id}`,
  };
}

function collectFiles(root: string): string[] {
  return readdirSync(root).flatMap((entry) => {
    const path = join(root, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) return collectFiles(path);
    return path;
  });
}

function hasContributor(
  reading: IntegrationElementReading,
  token: string,
): boolean {
  return reading.locals.some((local) =>
    local.contributors.some((contributor) => contributor.includes(token)),
  );
}

function bundleChannel(reading: IntegrationElementReading, id: string) {
  const channel = reading.bundle.channels.find((item) => item.id === id);
  expect(channel, `${reading.element} missing ${id}`).toBeDefined();
  return channel!;
}

beforeEach(() => {
  clearIntegrationSceneCache();
});

describe("element labels", () => {
  it("maps internal element identifiers to canonical user labels", () => {
    expect(ELEMENT_LABELS).toEqual({
      fire: "Fire",
      water: "Water",
      earth: "Earth",
      air: "Air",
    });
  });
});

describe("species trajectories", () => {
  it("builds integration profiles from legacy ecology data without declaring direct supply", () => {
    const acacia = buildIngredientIntegrationProfile(Acacia);
    const pigeonPea = buildIngredientIntegrationProfile(PigeonPea);
    const durian = buildIngredientIntegrationProfile(Durian);
    const cacao = buildIngredientIntegrationProfile(Cacao);
    const banana = buildIngredientIntegrationProfile(Banana);
    const peanut = buildIngredientIntegrationProfile(Peanut);

    expect(acacia.transformations.map((item) => item.id)).toContain(
      "nitrogen_fixation",
    );
    expect(pigeonPea.transformations.map((item) => item.id)).toContain(
      "nitrogen_fixation",
    );
    expect(durian.structure.layer).toBe("canopy");
    expect(cacao.capacity.fire.value).toBeLessThan(durian.capacity.fire.value);
    expect(banana.transformations.map((item) => item.id)).toContain(
      "leaf_litter",
    );
    expect(peanut.capacity.earth.value).toBeGreaterThan(0);
    expect(acacia.sourceTraits.earth.rootStrategy).toBeDefined();
  });

  it("builds valid trajectories for canonical ingredient types", () => {
    const ingredients = [Durian, Cacao, Banana, Peanut, Basil, PigeonPea];

    for (const ingredient of ingredients) {
      const trajectory = buildSpeciesTrajectory(ingredient);
      const early = trajectory.sampleAtYear(1);
      const mature = trajectory.sampleAtYear(12);
      expect(early.ingredientId).toBe(ingredient.id);
      expect(mature.radius).toBeGreaterThan(0);
      expect(mature.height).toBeGreaterThan(0);
    }
  });

  it("builds a four-element grazer profile for cow yields rather than meat", () => {
    const cow = buildIngredientIntegrationProfile(Cow);

    expect(cow.profileKind).toBe("animal");
    expect(Object.keys(cow.capacity).sort()).toEqual([...ELEMENT_IDS].sort());
    expect(cow.structure.layer).toBe("groundcover");
    expect(cow.transformations.map((item) => item.id)).toContain(
      "grazing_manure",
    );
    expect(cow.animalLifecycle).toEqual({
      startYear: 0,
      maturityYears: 2,
      lifespanYears: 10,
    });
    expect(cow.time.lifeCycles).toEqual([]);
    expect(cow.yieldIngredientIds).toEqual([
      "whole_milk__cow",
      "butter__cow",
      "ghee__cow",
      "plain_yogurt__cow",
    ]);
    expect(cow.yieldIngredientIds?.join("|")).not.toMatch(/beef|meat/i);
    expect(cow.yieldIngredientIds).not.toContain("greek_yogurt__cow");
  });

  it("declares cow skeletal animation clips for grazing movement", () => {
    const cowConfig = getSpeciesConfig("cow");

    expect(cowConfig?.animation?.mode).toBe("skinned");
    expect(cowConfig?.treeModel).toBe(
      "https://assets.perillacove.com/animal_cow.glb",
    );
    expect(cowConfig?.animation?.clips).toEqual({
      walk: "walk",
      graze: "graze",
      idle: "idle",
      chew: "chew",
    });
  });

  it("exposes explicit sensory intensities for cow yield ingredients", () => {
    for (const yieldId of Cow.yieldIngredientIds ?? []) {
      const yieldIngredient = IngredientMap[yieldId];
      expect(yieldIngredient).toBeDefined();
      expect(yieldIngredient.properties.tasteProfile?.length).toBeGreaterThan(
        0,
      );
      expect(yieldIngredient.properties.qualityProfile?.length).toBeGreaterThan(
        0,
      );

      const profile = getIngredientSensoryProfile(yieldIngredient);
      expect(profile.tastes.length).toBeGreaterThan(0);
      expect(profile.qualities.length).toBeGreaterThan(0);
      expect(
        [...profile.tastes, ...profile.qualities].every(
          (signal) => signal.intensity >= 1 && signal.intensity <= 5,
        ),
      ).toBe(true);
    }
  });

  it("marks trajectory-incomplete growable ingredients without failing", () => {
    const incomplete = GrowableIngredients.find(
      (ingredient) =>
        ingredient.properties.growth &&
        (!ingredient.properties.succession ||
          !ingredient.properties.growth.soilInteraction),
    );
    expect(incomplete).toBeDefined();
    const sample = buildSpeciesTrajectory(incomplete!).sampleAtYear(4);
    expect(sample.incomplete).toBe(true);
    expect(sample.radius).toBeGreaterThan(0);
  });

  it("increases canopy interception as durian matures", () => {
    const trajectory = buildSpeciesTrajectory(Durian);
    const young = trajectory.sampleAtYear(3);
    const mature = trajectory.sampleAtYear(12);
    expect(mature.intensity).toBeGreaterThan(young.intensity);
    expect(mature.lightDemand * mature.intensity).toBeGreaterThan(
      young.lightDemand * young.intensity,
    );
  });
});

describe("element scenarios", () => {
  it("plot grid follows the active living footprint after drag overrides", () => {
    const base = buildIntegrationScene({
      ingredients: [Durian, Cacao],
      year: 12,
    });
    const durian = base.volumes.find(
      (volume) => volume.sourceIngredientId === "durian",
    );
    const cacao = base.volumes.find(
      (volume) => volume.sourceIngredientId === "cacao",
    );
    expect(durian).toBeDefined();
    expect(cacao).toBeDefined();

    const movedCacaoPosition = {
      x: durian!.position.x + 30,
      z: durian!.position.z,
    };
    const scene = buildIntegrationScene({
      ingredients: [Durian, Cacao],
      year: 12,
      positionOverrides: {
        [cacao!.ingredientId]: movedCacaoPosition,
      },
    });
    const reading = resolveIntegrationScene(scene);
    const nearestMovedCell = nearestLocal(
      reading.elements.fire,
      movedCacaoPosition,
    );
    const midpoint = {
      x: (durian!.position.x + movedCacaoPosition.x) / 2,
      z: durian!.position.z,
    };
    const midpointCell = [...scene.grid.cells].sort(
      (a, b) =>
        Math.hypot(a.x - midpoint.x, a.z - midpoint.z) -
        Math.hypot(b.x - midpoint.x, b.z - midpoint.z),
    )[0];

    expect(movedCacaoPosition.x).toBeGreaterThanOrEqual(
      scene.grid.centerX - scene.grid.radius,
    );
    expect(movedCacaoPosition.x).toBeLessThanOrEqual(
      scene.grid.centerX + scene.grid.radius,
    );
    expect(
      Math.hypot(
        nearestMovedCell.x - movedCacaoPosition.x,
        nearestMovedCell.z - movedCacaoPosition.z,
      ),
    ).toBeLessThan(scene.grid.cells[0].size * 1.5);
    expect(midpointCell.inside).toBe(false);
  });

  it("keeps the cell lattice stable while respawns move through time", () => {
    const input = {
      ingredients: [Durian, Cacao, Banana, Peanut, PigeonPea],
      respawnConfig: {
        banana: 12,
        peanut: 24,
        pigeon_pea: 16,
        cacao: 2,
        durian: 1,
      },
      speciesCountConfig: {
        banana: 6,
        peanut: 24,
        pigeon_pea: 10,
        cacao: 2,
        durian: 1,
      },
    };
    const scenes = [2, 8, 15, 24, 32].map((year) =>
      buildIntegrationScene({ ...input, year }),
    );
    const [first] = scenes;

    for (const scene of scenes.slice(1)) {
      expect(scene.grid.centerX).toBe(first.grid.centerX);
      expect(scene.grid.centerZ).toBe(first.grid.centerZ);
      expect(scene.grid.radius).toBeCloseTo(first.grid.radius, 6);
      expect(scene.grid.cells[0].x).toBeCloseTo(first.grid.cells[0].x, 6);
      expect(scene.grid.cells[0].z).toBeCloseTo(first.grid.cells[0].z, 6);
    }
  });

  it("resolves sample tropical cow as seven scattered moving-species volumes", () => {
    const workspace =
      normalizePanoramaTourData(sampleTropicalTour).forestWorkspace;
    expect(workspace).toBeDefined();
    expect(workspace?.speciesIds).toContain("cow");
    expect(workspace?.speciesCountConfig?.cow).toBe(7);
    expect(workspace?.respawnConfig?.cow).toBe(5);

    const ingredients = (workspace?.speciesIds ?? [])
      .map((id) => IngredientMap[id])
      .filter((ingredient): ingredient is Ingredient => Boolean(ingredient));
    const scene = buildIntegrationScene({
      ingredients,
      year: 3,
      speciesCountConfig: workspace?.speciesCountConfig,
      respawnConfig: workspace?.respawnConfig,
    });
    const cowVolumes = scene.volumes.filter(
      (volume) => volume.sourceIngredientId === "cow",
    );

    expect(cowVolumes).toHaveLength(7);
    expect(cowVolumes.map((volume) => volume.ingredientId).sort()).toEqual([
      "cow__0",
      "cow__1",
      "cow__2",
      "cow__3",
      "cow__4",
      "cow__5",
      "cow__6",
    ]);
    expect(
      new Set(
        cowVolumes.map(
          (volume) =>
            `${volume.position.x.toFixed(3)}:${volume.position.z.toFixed(3)}`,
        ),
      ).size,
    ).toBe(7);
    expect(
      Math.min(...cowVolumes.map((volume) => volume.position.x)),
    ).toBeLessThan(0);
    expect(
      Math.max(...cowVolumes.map((volume) => volume.position.x)),
    ).toBeGreaterThan(0);
    expect(
      Math.min(...cowVolumes.map((volume) => volume.position.z)),
    ).toBeLessThan(0);
    expect(
      Math.max(...cowVolumes.map((volume) => volume.position.z)),
    ).toBeGreaterThan(0);
    expect(cowVolumes.every((volume) => volume.ageYears >= 0)).toBe(true);
  });

  it("keeps cow present across respawn cycles", () => {
    const early = buildIntegrationScene({
      ingredients: [Cow],
      year: 3,
      speciesCountConfig: { cow: 3 },
      respawnConfig: { cow: 5 },
    });
    const respawned = buildIntegrationScene({
      ingredients: [Cow],
      year: 23,
      speciesCountConfig: { cow: 3 },
      respawnConfig: { cow: 5 },
    });

    expect(
      early.volumes.filter((volume) => volume.sourceIngredientId === "cow"),
    ).toHaveLength(3);
    expect(
      respawned.volumes.filter((volume) => volume.sourceIngredientId === "cow"),
    ).toHaveLength(3);
    expect(respawned.volumes[0].ageYears).toBeCloseTo(3);
  });

  it("crosses cow respawn cycles before the previous cow has fully faded", () => {
    const scene = buildIntegrationScene({
      ingredients: [Cow],
      year: 11.3,
      speciesCountConfig: { cow: 3 },
      respawnConfig: { cow: 5 },
    });
    const cowVolumes = scene.volumes.filter(
      (volume) => volume.sourceIngredientId === "cow",
    );

    expect(cowVolumes).toHaveLength(3);
    expect(cowVolumes[0].ageYears).toBeLessThan(2);
    expect(cowVolumes[0].ageYears).toBeGreaterThan(1);
  });

  it("uses grazer structures and grazing manure turnover for cow", () => {
    const scene = buildIntegrationScene({
      ingredients: [Cow],
      year: 3,
      speciesCountConfig: { cow: 3 },
      respawnConfig: { cow: 5 },
    });
    const cowStructures = scene.structures.filter(
      (structure) => structure.sourceIngredientId === "cow",
    );

    expect(cowStructures).toHaveLength(3);
    expect(
      cowStructures.every((structure) => structure.kind === "animal_grazer"),
    ).toBe(true);
    expect(
      scene.structures.some((structure) => structure.kind === "mulch_zone"),
    ).toBe(false);
    for (const structure of cowStructures) {
      expect(
        structure.transformations?.map((transformation) => transformation.id),
      ).toContain("grazing_manure");
      expect(structure.metadata?.stockingDensity).toBe(3);
      expect(Number(structure.metadata?.tramplingReduction)).toBeGreaterThan(0);
    }

    const reading = resolveIntegrationScene(scene);
    expect(hasContributor(reading.elements.earth, "grazing_manure")).toBe(true);
  });

  it("dense food forest has high integration on all four axes", () => {
    const scene = matureScene([
      Durian,
      Jackfruit,
      Cacao,
      Banana,
      Peanut,
      PigeonPea,
      Oregano,
    ]);
    const reading = resolveIntegrationScene(scene);
    for (const element of ["fire", "water", "earth", "air"] as ElementId[]) {
      expect(reading.elements[element].integration).toBeGreaterThan(0.48);
    }
    expect(reading.overallIntegration).toBeGreaterThan(0.52);
  });

  it("cacao under durian integrates light better than cacao in open sun", () => {
    const base = buildIntegrationScene({
      ingredients: [Durian, Cacao],
      year: 12,
    });
    const durian = base.volumes.find(
      (volume) => volume.sourceIngredientId === "durian",
    );
    const cacao = base.volumes.find(
      (volume) => volume.sourceIngredientId === "cacao",
    );
    expect(durian).toBeDefined();
    expect(cacao).toBeDefined();

    const under = buildIntegrationScene({
      ingredients: [Durian, Cacao],
      year: 12,
      positionOverrides: {
        [cacao!.ingredientId]: durian!.position,
      },
    });
    const open = buildIntegrationScene({
      ingredients: [Durian, Cacao],
      year: 12,
      positionOverrides: {
        [cacao!.ingredientId]: {
          x: durian!.position.x + 9,
          z: durian!.position.z,
        },
      },
    });

    const underReading = resolveIntegrationScene(under);
    const openReading = resolveIntegrationScene(open);
    const underCacao = nearestLocal(
      underReading.elements.fire,
      durian!.position,
    );
    const openCacao = nearestLocal(openReading.elements.fire, {
      x: durian!.position.x + 9,
      z: durian!.position.z,
    });
    const openDurian = nearestLocal(
      openReading.elements.fire,
      durian!.position,
    );

    expect(underCacao.integration).toBeGreaterThan(openCacao.integration);
    expect(openCacao.direction).toBe("supply_exceeds_capacity");
    expect(openDurian.integration).toBeGreaterThan(openCacao.integration);
    expect(
      openReading.elements.fire.directionalSummary.supply_exceeds_capacity,
    ).toBeGreaterThan(0);
  });

  it("open herb garden harnesses available light with sun-loving herbs", () => {
    const scene = matureScene([Basil, Oregano, Rosemary], 2);
    const reading = resolveIntegrationScene(scene);
    expect(reading.elements.fire.integration).toBeGreaterThan(0.5);
    expect(reading.elements.earth.integration).toBeGreaterThan(0.45);
  });

  it("greenhouse shell raises water and air integration for the same herbs", () => {
    const open = matureScene([Basil, Oregano, Rosemary], 2);
    const greenhouse = withExtraStructure(
      open,
      createGreenhouseShell("greenhouse:test", {
        x: 0,
        z: 0,
        radius: open.grid.radius * 0.75,
      }),
    );
    const openReading = resolveIntegrationScene(open);
    const greenhouseReading = resolveIntegrationScene(greenhouse);
    expect(greenhouseReading.elements.water.integration).toBeGreaterThan(
      openReading.elements.water.integration,
    );
    expect(greenhouseReading.elements.air.integration).toBeGreaterThan(
      openReading.elements.air.integration,
    );
  });

  it("swale system in dry conditions improves water integration", () => {
    const withoutSwale = buildIntegrationScene({
      ingredients: [Comfrey, Peanut],
      year: 4,
      environment: { rainfall: 0.32 },
    });
    const withSwale = withExtraStructure(
      withoutSwale,
      createSwale("swale:test", { x: 0, z: 0, radius: 7 }),
    );
    expect(
      resolveIntegrationScene(withSwale).elements.water.integration,
    ).toBeGreaterThan(
      resolveIntegrationScene(withoutSwale).elements.water.integration,
    );
  });

  it("sparse plot shows waste on poorly harnessed axes", () => {
    const scene = buildIntegrationScene({ ingredients: [Mango], year: 12 });
    const reading = resolveIntegrationScene(scene);
    expect(reading.overallIntegration).toBeLessThan(0.8);
    expect(
      reading.elements.water.directionalSummary.supply_exceeds_capacity,
    ).toBeGreaterThan(0);
  });

  it("grid orchard flags bare interrow soil and water waste", () => {
    const scene = buildIntegrationScene({
      ingredients: [Mango],
      year: 12,
      speciesCountConfig: { mango: 8 },
    });
    const reading = resolveIntegrationScene(scene);
    expect(reading.elements.fire.integration).toBeGreaterThan(0.45);
    expect(
      reading.elements.earth.directionalSummary.supply_exceeds_capacity,
    ).toBeGreaterThan(0);
    expect(
      reading.elements.water.directionalSummary.supply_exceeds_capacity,
    ).toBeGreaterThan(0);
  });
});

describe("element bundle scoring", () => {
  it("keeps the turnover math simple for bundle helpers", () => {
    expect(match01(1, 1)).toBe(1);
    expect(match01(1, 0.5)).toBe(0.5);
    expect(match01(0.25, 1)).toBe(0.25);
    expect(rangeFit01(12, [8, 18])).toBe(1);
    expect(rangeFit01(28, [8, 18])).toBe(0);
  });

  it("keeps the four public element readings while adding bundle channels", () => {
    const reading = resolveIntegrationScene(matureScene([Durian, Cacao], 12));
    expect(Object.keys(reading.elements).sort()).toEqual([
      "air",
      "earth",
      "fire",
      "water",
    ]);
    expect(reading.elements.fire.baseIntegration).toBe(
      bundleChannel(reading.elements.fire, "fire_flow").integration,
    );
    expect(reading.elements.fire.bundle.channels.length).toBeGreaterThan(1);
  });

  it("changes fire score through warmth without changing geometry", () => {
    const cool = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [AppleGreen],
        year: 12,
        environment: { ambientTempC: 12 },
      }),
    );
    const hot = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [AppleGreen],
        year: 12,
        environment: { ambientTempC: 30 },
      }),
    );

    expect(
      bundleChannel(cool.elements.fire, "warmth_window").integration,
    ).toBeGreaterThan(
      bundleChannel(hot.elements.fire, "warmth_window").integration,
    );
    expect(cool.elements.fire.integration).toBeGreaterThan(
      hot.elements.fire.integration,
    );
  });

  it("changes water score through moisture fit and root-zone oxygen", () => {
    const wet = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [Rice],
        year: 0.5,
        environment: { rainfall: 0.95, humidity: 0.75 },
      }),
    );
    const dry = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [Rice],
        year: 0.5,
        environment: { rainfall: 0.18, humidity: 0.2 },
      }),
    );

    expect(
      bundleChannel(wet.elements.water, "moisture_fit").integration,
    ).toBeGreaterThan(
      bundleChannel(dry.elements.water, "moisture_fit").integration,
    );
    expect(wet.elements.water.integration).toBeGreaterThan(
      dry.elements.water.integration,
    );
  });

  it("changes earth score through available root depth", () => {
    const deep = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [AppleGreen],
        year: 12,
        environment: { soilDepthAccess: 0.9 },
      }),
    );
    const shallow = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [AppleGreen],
        year: 12,
        environment: { soilDepthAccess: 0.24 },
      }),
    );

    expect(
      bundleChannel(deep.elements.earth, "root_depth").integration,
    ).toBeGreaterThan(
      bundleChannel(shallow.elements.earth, "root_depth").integration,
    );
    expect(deep.elements.earth.integration).toBeGreaterThan(
      shallow.elements.earth.integration,
    );
  });

  it("changes air score through humidity fit without adding radar axes", () => {
    const humid = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [Cacao],
        year: 12,
        environment: { humidity: 0.78 },
      }),
    );
    const dry = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [Cacao],
        year: 12,
        environment: { humidity: 0.18 },
      }),
    );

    const humidChannel = bundleChannel(humid.elements.air, "humidity_fit");
    const dryChannel = bundleChannel(dry.elements.air, "humidity_fit");
    expect(humidChannel.integration).toBeGreaterThan(dryChannel.integration);
    expect(humidChannel.label).toBe("Humid air");
    expect(humidChannel.primaryElement).toBe("air");
    expect(humidChannel.relatedElements).toContain("water");
    expect(humid.elements.air.integration).toBeGreaterThan(
      dry.elements.air.integration,
    );
  });

  it("uses chill and frost traits when they are present", () => {
    const enoughChill = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [Blueberry],
        year: 12,
        environment: { winterChillHours: 700 },
      }),
    );
    const noChill = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [Blueberry],
        year: 12,
        environment: { winterChillHours: 0 },
      }),
    );

    expect(
      bundleChannel(enoughChill.elements.fire, "cold_chill").integration,
    ).toBeGreaterThan(
      bundleChannel(noChill.elements.fire, "cold_chill").integration,
    );
  });
});

describe("determinism and cache", () => {
  it("same seed plus same scene plus same cursor gives identical readings", () => {
    const a = matureScene([Durian, Cacao, Banana], 12);
    const b = matureScene([Durian, Cacao, Banana], 12);
    expect(resolveIntegrationScene(a)).toEqual(resolveIntegrationScene(b));
  });

  it("repeated cursor positions hit the memoization cache", () => {
    const scene = matureScene([Durian, Cacao, Banana], 12);
    resolveIntegrationScene(scene);
    resolveIntegrationScene(scene);
    const stats = getIntegrationSceneCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
  });

  it("smart arrangement is deterministic by seed and preserves existing positions", () => {
    const scene = matureScene([Durian, Cacao, Banana, Peanut], 12);
    const preserved = { [scene.volumes[0].ingredientId]: { x: 1, z: 2 } };
    const a = arrangeIntegrationScene(scene, preserved, { seed: "same" });
    const b = arrangeIntegrationScene(scene, preserved, { seed: "same" });
    const c = arrangeIntegrationScene(scene, preserved, { seed: "different" });
    expect(a).toEqual(b);
    expect(a[scene.volumes[0].ingredientId]).toEqual({ x: 1, z: 2 });
    expect(JSON.stringify(a)).not.toEqual(JSON.stringify(c));
  });
});

describe("living turnover transformations", () => {
  it("runs a fixed two-pass deterministic turnover cycle", () => {
    expect(TRANSFORMATION_PASS_COUNT).toBe(2);
  });

  it("does not emit transpired humidity without both light and water use", () => {
    const wetAndBright = resolveIntegrationScene(
      buildIntegrationScene({ ingredients: [Banana], year: 3 }),
    );
    const dark = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [Banana],
        year: 3,
        environment: { incomingLight: 0 },
      }),
    );
    const dry = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [Banana],
        year: 3,
        environment: { rainfall: 0 },
      }),
    );

    expect(
      hasContributor(wetAndBright.elements.air, "transpired_humidity"),
    ).toBe(true);
    expect(hasContributor(dark.elements.air, "transpired_humidity")).toBe(
      false,
    );
    expect(hasContributor(dry.elements.air, "transpired_humidity")).toBe(false);
  });

  it("only fixes nitrogen with root symbiosis and active local inputs", () => {
    const activeFixer = resolveIntegrationScene(matureScene([PigeonPea], 12));
    const inactiveFixer = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [PigeonPea],
        year: 12,
        respawnConfig: { pigeon_pea: 8 },
        speciesCountConfig: { pigeon_pea: 4 },
        environment: { rainfall: 0, airExchange: 0, humidity: 0 },
      }),
    );
    const nonFixer = resolveIntegrationScene(
      buildIntegrationScene({ ingredients: [Banana], year: 4 }),
    );

    expect(
      hasContributor(activeFixer.elements.earth, "nitrogen_fixation"),
    ).toBe(true);
    expect(
      hasContributor(inactiveFixer.elements.earth, "nitrogen_fixation"),
    ).toBe(false);
    expect(hasContributor(nonFixer.elements.earth, "nitrogen_fixation")).toBe(
      false,
    );
  });

  it("returns leaf litter to earth only after active growth is turning over inputs", () => {
    const active = resolveIntegrationScene(
      buildIntegrationScene({ ingredients: [Banana], year: 3 }),
    );
    const dark = resolveIntegrationScene(
      buildIntegrationScene({
        ingredients: [Banana],
        year: 3,
        environment: { incomingLight: 0 },
      }),
    );

    expect(hasContributor(active.elements.earth, "leaf_litter")).toBe(true);
    expect(hasContributor(dark.elements.earth, "leaf_litter")).toBe(false);
  });

  it("emitted supply changes the resolved field while preserving determinism", () => {
    const scene = buildIntegrationScene({
      ingredients: [Banana, PigeonPea],
      year: 4,
    });
    const withoutTurnover: IntegrationSceneState = {
      ...scene,
      structures: scene.structures.map((structure) => ({
        ...structure,
        transformations: [],
      })),
      hash: `${scene.hash}:no-turnover`,
    };

    const withReading = resolveIntegrationScene(scene);
    const withoutReading = resolveIntegrationScene(withoutTurnover);
    expect(withReading.elements.earth.totalSupply).toBeGreaterThan(
      withoutReading.elements.earth.totalSupply,
    );
    clearIntegrationSceneCache();
    expect(resolveIntegrationScene(scene)).toEqual(
      resolveIntegrationScene(scene),
    );
  });
});

describe("explanations and regression guards", () => {
  it("explanation text is deterministic and avoids model language", async () => {
    const { ELEMENT_INFO, explainIntegrationReading } = await import(
      "./explain"
    );
    const scene = matureScene([Durian, Cacao, Banana], 12);
    const reading = resolveIntegrationScene(scene);
    const a = explainIntegrationReading(reading);
    const b = explainIntegrationReading(reading);
    const publicCopy = JSON.stringify({
      explanation: a,
      elementInfo: ELEMENT_INFO,
    });
    expect(a).toEqual(b);
    expect(publicCopy).not.toMatch(/\b(AI|model|predicts)\b/);
    expect(publicCopy).not.toMatch(/\b(north|south|east|west|center)\b/i);
    expect(publicCopy).not.toMatch(/\b(Supply is|Capacity is)\b/);
  });

  it("production Forest code does not import deleted compatibility or diagnostics symbols", () => {
    const root = join(process.cwd(), "src/components/Forest");
    const files = collectFiles(root).filter(
      (file) =>
        /\.(ts|tsx)$/.test(file) &&
        !file.endsWith(".test.ts") &&
        !file.endsWith(".test.tsx") &&
        !file.includes("/plans/"),
    );
    const banned = [
      "compatibility",
      "STRUCTURE_BEHAVIORS",
      "scoreGrowthCompatibility",
      "scoreIngredientSetCompatibility",
      "DiagnosticsCard",
      "CompatibilityDisplay",
    ];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const token of banned) {
        expect(source, `${file} contains ${token}`).not.toContain(token);
      }
    }
  });

  it("ingredient ecology UI surfaces Integration instead of old process and soil panels", () => {
    const source = readFileSync(
      join(process.cwd(), "src/components/IngredientsPage/Qualities/index.tsx"),
      "utf8",
    );
    expect(source).toContain("IntegrationProfileDisplay");
    expect(source).toContain("properties.animalIntegration");
    expect(source).toContain("YieldSensoryCarousel");
    expect(source).toContain('variant="bare"');
    expect(source).not.toContain("EcologicalProcessDrawer");
    expect(source).not.toContain("SoilInteractionDisplay");
    expect(source).not.toContain("SuccessionDisplay");
    expect(source).not.toContain("managementRotation");
  });

  it("Forest and PanoramicTour app source uses respawn naming only", () => {
    const roots = [
      join(process.cwd(), "src/components/Forest"),
      join(process.cwd(), "src/components/PanoramicTour"),
    ];
    const files = roots.flatMap((root) =>
      collectFiles(root).filter(
        (file) =>
          /\.(ts|tsx)$/.test(file) &&
          !file.endsWith(".test.ts") &&
          !file.endsWith(".test.tsx") &&
          !file.includes("/plans/"),
      ),
    );
    const banned = ["re" + "plant", "Re" + "plant"];

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      for (const token of banned) {
        expect(source, `${file} contains old lifecycle token`).not.toContain(
          token,
        );
      }
    }
  });

  it("element internals are not imported outside the substrate", () => {
    const srcRoot = join(process.cwd(), "src/components");
    const files = collectFiles(srcRoot).filter(
      (file) =>
        /\.(ts|tsx)$/.test(file) &&
        !file.includes("/Forest/substrate/") &&
        !file.endsWith(".test.ts") &&
        !file.endsWith(".test.tsx"),
    );

    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source).not.toContain("substrate/elements/");
    }
  });
});

describe("performance", () => {
  it("resolves a scene with 100 structures under the v1 budget", () => {
    const scene = buildIntegrationScene({
      ingredients: [Banana, Peanut, Basil, Oregano, Rosemary],
      year: 2,
      speciesCountConfig: {
        banana: 10,
        peanut: 35,
        basil: 20,
        oregano: 20,
        rosemary: 15,
      },
      respawnConfig: {
        peanut: 4,
        basil: 4,
        oregano: 4,
      },
    });
    expect(scene.structures.length).toBeGreaterThanOrEqual(100);
    const start = performance.now();
    resolveIntegrationScene(scene);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(50);
  });
});
