import { describe, expect, it } from "vitest";
import {
  buildElementCapacityFactors,
  getCapacityDisplayValues,
  getIntegrationTraitDisplay,
  getTransformationDisplayRows,
} from "./display";
import { buildIngredientIntegrationProfile } from ".";
import { PigeonPea } from "../../../IngredientsPage/data";
import {
  createTransformationPotential,
  TRANSFORMATION_OUTPUTS,
} from "../transformations/constants";

describe("integration profile display metadata", () => {
  it("maps moist well-drained earth to a cross-element soil bridge", () => {
    const trait = getIntegrationTraitDisplay("moist_well_drained");

    expect(trait.primaryElement).toBe("earth");
    expect(trait.relatedElements).toEqual(["water", "air"]);
  });

  it("maps humid air to air with water as the related element", () => {
    const trait = getIntegrationTraitDisplay("humid_air");

    expect(trait.primaryElement).toBe("air");
    expect(trait.relatedElements).toEqual(["water"]);
  });

  it("keeps soil preferences in the soil capacity factors", () => {
    const profile = buildIngredientIntegrationProfile(PigeonPea);
    const earthFactors = buildElementCapacityFactors(profile, "earth");
    const waterFactors = buildElementCapacityFactors(profile, "water");

    expect(earthFactors.map((factor) => factor.token)).toContain(
      "moist_well_drained",
    );
    expect(waterFactors.map((factor) => factor.token)).not.toContain(
      "moist_well_drained",
    );
  });

  it("computes active capacity from potential and lifecycle intensity", () => {
    const values = getCapacityDisplayValues(0.72, {
      mode: "active",
      intensity: 0.5,
    });

    expect(values.potential).toBeCloseTo(0.72);
    expect(values.active).toBeCloseTo(0.36);
    expect(values.display).toBeCloseTo(0.36);
  });

  it("preserves transformation inputs and outputs from substrate constants", () => {
    const transformation = createTransformationPotential("leaf_litter", 0.2);
    const [row] = getTransformationDisplayRows([transformation], "earth");

    expect(row.inputs).toEqual(TRANSFORMATION_OUTPUTS.leaf_litter.inputs);
    expect(row.outputs).toEqual(TRANSFORMATION_OUTPUTS.leaf_litter.outputs);
  });

  it("merges repeated transformation rows into one readable flow", () => {
    const baseRootTurnover = createTransformationPotential(
      "root_turnover",
      0.12,
    );
    const mineralLiftRootTurnover = createTransformationPotential(
      "root_turnover",
      0.09,
      {
        requires: ["active_roots", "mineral_lift"],
      },
    );

    const rows = getTransformationDisplayRows(
      [baseRootTurnover, mineralLiftRootTurnover],
      "earth",
    );

    expect(rows).toHaveLength(1);
    expect(rows[0].id).toBe("root_turnover");
    expect(rows[0].rate).toBeCloseTo(0.21);
    expect(rows[0].requires).toEqual(["active_roots", "mineral_lift"]);
  });
});
