import { describe, expect, it } from "vitest";
import {
  ELEMENT_DEFINITIONS,
  STRUCTURES,
  STRUCTURES_CONCEPT,
} from "./structures";
import {
  createCompileTimeStub,
  createGreenhouseShell,
  createMulchZone,
  createPath,
  createPond,
  createSoilZone,
  createSwale,
  STRUCTURE_DEFINITIONS,
} from "./substrate/structures";

describe("Integration structures metadata", () => {
  it("defines uniform substrate structures without legacy behavior registry", () => {
    expect(STRUCTURES.plant_stage.name).toBe("Plant stage");
    expect(
      STRUCTURES.swale.flowEffects.map((effect) => effect.element),
    ).toContain("water");
    expect(Object.keys(STRUCTURES).sort()).toEqual(
      Object.keys(STRUCTURE_DEFINITIONS).sort(),
    );
  });

  it("keeps element definitions on internal ids with integration labels", () => {
    const labels = ELEMENT_DEFINITIONS.map((element) => element.name);
    expect(labels).toEqual(["Fire", "Water", "Earth", "Air"]);
  });

  it("describes structures as integration flow shapers", () => {
    expect(STRUCTURES_CONCEPT.title).toBe("What are Structures?");
    expect(STRUCTURES_CONCEPT.learnMoreText).toContain("Integration");
  });
});

describe("FlowStructure interface", () => {
  it("all concrete v1 structures declare footprint, effects, and capacity uniformly", () => {
    const footprint = { x: 0, z: 0, radius: 2 };
    const structures = [
      createMulchZone("mulch", footprint),
      createSoilZone("soil", "Soil", footprint),
      createSwale("swale", footprint),
      createGreenhouseShell("greenhouse", footprint),
      createPath("path", footprint),
      createPond("pond", footprint),
      createCompileTimeStub("pruning_gap", "gap", footprint),
      createCompileTimeStub("rock_wall", "wall", footprint),
      createCompileTimeStub("fence", "fence", footprint),
    ];

    for (const structure of structures) {
      expect(structure.id).toBeTruthy();
      expect(structure.kind).toBeTruthy();
      expect(structure.footprint.radius).toBeGreaterThan(0);
      expect(structure.effects).toBeDefined();
      expect(structure.capacity).toBeDefined();
    }
  });

  it("each structure alters only elements it declares", () => {
    const swale = createSwale("swale", { x: 0, z: 0, radius: 2 });
    expect(Object.keys(swale.effects).sort()).toEqual([
      "air",
      "earth",
      "water",
    ]);
    expect(swale.effects.fire).toBeUndefined();
  });
});
