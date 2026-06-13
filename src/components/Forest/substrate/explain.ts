import { ELEMENT_LABELS } from "./labels";
import type {
  ElementId,
  IntegrationDirection,
  IntegrationElementReading,
  IntegrationSceneReading,
} from "./types";

export interface IntegrationExplanation {
  overall: string;
  byElement: Record<ElementId, string>;
}

export const ELEMENT_INFO: Record<
  ElementId,
  { title: string; body: string; supply: string; capacity: string }
> = {
  fire: {
    title: "Fire",
    body: "Fire is sun, light, heat, and warmth moving through the canopy, asking to become leaf, shade, fruit, and earth life.",
    supply:
      "When Fire is integrated, leaves catch what arrives, taller canopies soften the glare, and lower layers receive a gentler brightness they can use.",
    capacity:
      "When Fire is not integrated, energy slips past the planting or lands too harshly for the layer beneath it.",
  },
  water: {
    title: "Water",
    body: "Water is rain, stored moisture, seepage, pooling, evaporation, and the slow drink of roots.",
    supply:
      "When Water is integrated, the plot slows it down, lets it sink, shares it with roots, and keeps it cycling instead of rushing away.",
    capacity:
      "When Water is not integrated, moisture either escapes too quickly or the planting is ready for more than the sky and soil are giving it.",
  },
  earth: {
    title: "Earth",
    body: "Earth is minerals, organic matter, roots, pores, and the underground turning of fertility into growth.",
    supply:
      "When Earth is integrated, fallen matter, minerals, roots, and earth life keep feeding one another without fertility sitting idle.",
    capacity:
      "When Earth is not integrated, fertility is either waiting to be taken up or roots and earth life are ready for more living turnover.",
  },
  air: {
    title: "Air",
    body: "Air is breath, wind, humidity, shelter, and the moving atmosphere around leaves.",
    supply:
      "When Air is integrated, foliage and open space shape wind into useful exchange: enough breath, enough shelter, enough humidity.",
    capacity:
      "When Air is not integrated, the planting either leaks atmosphere too freely or has sheltered structure waiting for more movement.",
  },
};

function scoreWord(score: number): string {
  if (score >= 0.84) return "highly integrated";
  if (score >= 0.68) return "mostly integrated";
  if (score >= 0.45) return "partly integrated";
  return "poorly integrated";
}

function directionLabel(direction: IntegrationDirection): string {
  if (direction === "capacity_exceeds_supply") {
    return "the forest has living structure waiting to participate";
  }
  if (direction === "supply_exceeds_capacity") {
    return "some of the element is still escaping the loop";
  }
  return "turnover is balanced";
}

function dominantDirection(
  reading: IntegrationElementReading,
): IntegrationDirection {
  const entries = Object.entries(reading.directionalSummary) as Array<
    [IntegrationDirection, number]
  >;
  entries.sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  return entries[0]?.[0] ?? "balanced";
}

export function explainElementReading(
  reading: IntegrationElementReading,
): string {
  const label = ELEMENT_LABELS[reading.element];
  const direction = dominantDirection(reading);
  const limitingChannel = reading.bundle.limitingChannel;
  const limitingClause =
    limitingChannel && limitingChannel.id !== `${reading.element}_flow`
      ? ` The tightest part of the bundle is ${limitingChannel.label.toLowerCase()}.`
      : "";

  if (reading.integration >= 0.84 && direction === "balanced") {
    return `${label} is close to flawless turnover: what arrives is being caught, used, and returned with very little waste.${limitingClause}`;
  }

  if (direction === "supply_exceeds_capacity") {
    return `${label} is spilling past the planting: more of this element is moving through than the current structure can turn into growth.${limitingClause}`;
  }

  if (direction === "capacity_exceeds_supply") {
    return `${label} has readiness waiting: the forest has living structure that could turn more of this element into growth.${limitingClause}`;
  }

  return `${label} is ${scoreWord(reading.integration)}: the turnover is forming, and the element is mostly staying inside the living loop.${limitingClause}`;
}

export function explainIntegrationReading(
  reading: IntegrationSceneReading,
): IntegrationExplanation {
  const byElement = {
    fire: explainElementReading(reading.elements.fire),
    water: explainElementReading(reading.elements.water),
    earth: explainElementReading(reading.elements.earth),
    air: explainElementReading(reading.elements.air),
  };

  const ranked = Object.values(reading.elements).sort(
    (a, b) =>
      a.integration - b.integration || a.element.localeCompare(b.element),
  );
  const weakest = ranked[0];
  const weakestLabel = ELEMENT_LABELS[weakest.element];
  const weakestDirection = dominantDirection(weakest);
  const overall =
    reading.overallIntegration === 0
      ? "No active elemental turnover is being measured yet."
      : `This system is ${scoreWord(reading.overallIntegration)}: its elements are ${
          reading.overallIntegration >= 0.84
            ? "turning over with very little waste"
            : "beginning to feed one another, though the loop is not flawless yet"
        }, with ${weakestLabel.toLowerCase()} showing where integration needs the most care because ${directionLabel(
          weakestDirection,
        )}.`;

  return { overall, byElement };
}
