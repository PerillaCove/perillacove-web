import {
  STRUCTURE_DEFINITIONS,
  type StructureDefinition,
} from "./substrate/structures";
import type {
  ElementId,
  FlowStructure,
  FlowStructureKind,
} from "./substrate/types";
import {
  ELEMENT_COLORS,
  ELEMENT_ICONS,
  ELEMENT_LABELS,
} from "./substrate/labels";

export type ElementType = ElementId;
export type StructureId = FlowStructureKind;
export type { FlowStructure, StructureDefinition };

export interface ElementalFlowEffect {
  element: ElementType;
  effect: string;
}

export interface Structure {
  id: StructureId;
  name: string;
  shortLabel: string;
  description: string;
  flowEffects: ElementalFlowEffect[];
  defaultEnabled: boolean;
}

function flowEffect(element: ElementId): ElementalFlowEffect {
  return {
    element,
    effect: `${ELEMENT_LABELS[element]} flow is shaped through the structure footprint.`,
  };
}

export const STRUCTURES: Record<StructureId, Structure> = Object.fromEntries(
  Object.values(STRUCTURE_DEFINITIONS).map((definition) => [
    definition.kind,
    {
      id: definition.kind,
      name: definition.label,
      shortLabel: definition.label,
      description: definition.description,
      flowEffects: definition.elements.map(flowEffect),
      defaultEnabled: false,
    },
  ]),
) as Record<StructureId, Structure>;

export const ELEMENT_DEFINITIONS = (
  Object.keys(ELEMENT_LABELS) as ElementId[]
).map((id) => ({
  id,
  name: ELEMENT_LABELS[id],
  icon: ELEMENT_ICONS[id],
  color: ELEMENT_COLORS[id],
  description:
    id === "fire"
      ? "Fire entering as light and heat, being intercepted, or reaching bare ground unused."
      : id === "earth"
        ? "Earth minerals, organic matter, roots, pores, and fertility turnover."
        : id === "water"
          ? "Rainfall, residence, infiltration, evaporation, and runoff."
          : "Lateral air exchange, humidity, wind drag, and breathability.",
  examples:
    id === "fire"
      ? ["Incoming sun", "Canopy interception", "Bare-ground fire waste"]
      : id === "earth"
        ? ["Organic matter", "Root uptake", "Earth structure"]
        : id === "water"
          ? ["Rainfall", "Swale residence", "Perimeter runoff"]
          : ["Humidity", "Wind softening", "Boundary exchange"],
}));

export const STRUCTURES_CONCEPT = {
  title: "What are Structures?",
  description:
    "A structure is any living or non-living form that changes elemental supply or harnessing capacity across the plot.",
  learnMoreText:
    "Integration compares supply and capacity cell by cell to show how close the system is to flawless turnover.",
};
