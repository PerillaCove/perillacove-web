import type {
  ElementId,
  IntegrationTransformationId,
  IntegrationProfileTransformation,
} from "../types";

export const TRANSFORMATION_PASS_COUNT = 2;

// Ingredients do not carry hard-coded supply. They carry form, capacity, and
// transformation potential. Supply is what the local field makes available,
// plus what living turnover has already emitted into that field. This keeps
// the model first-principles: a leaf does not magically "add humidity" just by
// existing; light and water have to be actively turned over before transpired
// humidity becomes new air/water supply in the next deterministic pass. The
// same pattern covers litter, root turnover, and nitrogen fixation.
export interface TransformationOutputDefinition {
  id: IntegrationTransformationId;
  label: string;
  definition: string;
  inputs: ElementId[];
  outputs: Partial<Record<ElementId, number>>;
  requires: string[];
  persistence: "fast" | "medium" | "slow";
}

export const TRANSFORMATION_OUTPUTS: Record<
  IntegrationTransformationId,
  TransformationOutputDefinition
> = {
  transpired_humidity: {
    id: "transpired_humidity",
    label: "Transpired humidity",
    definition:
      "Water moved through active leaves into the local air envelope when light and water are both being turned over.",
    inputs: ["fire", "water"],
    outputs: { air: 0.7, water: 0.3 },
    requires: ["leaf_area", "active_growth"],
    persistence: "fast",
  },
  leaf_litter: {
    id: "leaf_litter",
    label: "Leaf litter",
    definition:
      "Soft plant matter returned to the ground: leaves, twigs, flowers, fruit fragments, and pruning residue.",
    inputs: ["fire", "water", "earth"],
    outputs: { earth: 0.82, water: 0.14, air: 0.04 },
    requires: ["active_growth", "biomass_turnover"],
    persistence: "medium",
  },
  root_turnover: {
    id: "root_turnover",
    label: "Root turnover",
    definition:
      "Fine roots and root channels renewing below ground, returning structure and exchange surfaces to the earth.",
    inputs: ["water", "earth"],
    outputs: { earth: 0.76, air: 0.16, water: 0.08 },
    requires: ["active_roots"],
    persistence: "slow",
  },
  nitrogen_fixation: {
    id: "nitrogen_fixation",
    label: "Nitrogen fixation",
    definition:
      "Root symbiosis converting atmospheric fertility potential into plant-available earth fertility when roots, water, and air are active.",
    inputs: ["air", "water", "earth"],
    outputs: { earth: 1 },
    requires: ["active_roots", "root_symbiosis"],
    persistence: "medium",
  },
  grazing_manure: {
    id: "grazing_manure",
    label: "Grazing manure",
    definition:
      "Forage, water, warmth, and air turned through a grazing animal and returned to the ground as manure fertility.",
    inputs: ["fire", "water", "earth", "air"],
    outputs: { earth: 0.88, water: 0.08, air: 0.04 },
    requires: ["forage", "drinking_water", "breathing_exchange", "digestion"],
    persistence: "medium",
  },
};

export function createTransformationPotential(
  id: IntegrationTransformationId,
  rate: number,
  overrides: Partial<
    Pick<IntegrationProfileTransformation, "inputs" | "outputs" | "requires">
  > = {},
): IntegrationProfileTransformation {
  const definition = TRANSFORMATION_OUTPUTS[id];
  return {
    id,
    label: definition.label,
    inputs: overrides.inputs ?? definition.inputs,
    outputs: overrides.outputs ?? definition.outputs,
    rate,
    requires: overrides.requires ?? definition.requires,
  };
}
