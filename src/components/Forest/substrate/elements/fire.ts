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
  return createBaseElementField(
    "fire",
    context,
    context.environment.incomingLight,
    0.34,
  );
}

export function applyStructure(
  field: ElementField,
  structure: FlowStructure,
): ElementField {
  return applyStructureEffect(field, structure);
}

export function resolve(field: ElementField): ElementField {
  return resolveField(field);
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
