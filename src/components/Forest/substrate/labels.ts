import type { ElementId, ElementMetric } from "./types";

export const ELEMENT_LABELS: Record<ElementId, string> = {
  fire: "Fire",
  water: "Water",
  earth: "Earth",
  air: "Air",
};

export const ELEMENT_COLORS: Record<ElementId, string> = {
  fire: "#f59e0b",
  water: "#2f80ed",
  earth: "#6f8f3a",
  air: "#14a6a6",
};

export const ELEMENT_ICONS: Record<ElementId, string> = {
  fire: "fa-fire",
  water: "fa-droplet",
  earth: "fa-earth-asia",
  air: "fa-wind",
};

export const METRIC_LABELS: Record<ElementMetric, string> = {
  supply: "Supply",
  capacity: "Capacity",
  use: "Use",
  integration: "Integration",
};

export function getElementLabel(element: ElementId): string {
  return ELEMENT_LABELS[element];
}
