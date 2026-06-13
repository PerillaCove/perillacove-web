import type {
  ElementContext,
  ElementField,
  ElementMetric,
  FieldOverlay,
  FlowStructure,
  IntegrationElementReading,
} from "../types";
import {
  applyStructureEffect,
  createBaseElementField,
  fieldToOverlay,
  measureField,
  resolveField,
} from "./common";

export function createBaseField(context: ElementContext): ElementField {
  const field = createBaseElementField(
    "earth",
    context,
    context.environment.soilMineralSupply,
    0.14,
  );
  return {
    ...field,
    metadata: { subsoilLeakage: context.environment.subsoilLeakage },
  };
}

export function applyStructure(
  field: ElementField,
  structure: FlowStructure,
): ElementField {
  return applyStructureEffect(field, structure);
}

export function resolve(field: ElementField): ElementField {
  const resolved = resolveField(field);
  const leakageRate =
    typeof field.metadata?.subsoilLeakage === "number"
      ? field.metadata.subsoilLeakage
      : 0;
  const leakage = resolved.boundaryFlux.inflow * Math.max(0, leakageRate);
  return {
    ...resolved,
    boundaryFlux: {
      ...resolved.boundaryFlux,
      outflow: resolved.boundaryFlux.outflow + leakage,
    },
  };
}

export function measure(field: ElementField): IntegrationElementReading {
  return measureField(field);
}

export function toOverlay(
  field: ElementField,
  metric: ElementMetric,
): FieldOverlay {
  return fieldToOverlay(field, metric);
}
