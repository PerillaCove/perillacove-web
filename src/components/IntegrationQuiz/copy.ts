import {
  DOMAIN_LABELS,
  type DomainId,
  type QuestionId,
  type QuizLayer,
} from "./types";

export const INTERNAL_GAP_COPY: Record<DomainId, string> = {
  nourishment:
    "Within Nourishment, there is a split between what feels good and what actually sustains you.",
  craft:
    "Within Craft, there is a split between what pulls you and what you force yourself through.",
  body: "Within Body, there is a split between imposed discipline and natural physical momentum.",
  perception:
    "Within Perception, there is a split between signal clarity and integrated systems-level understanding.",
  relationships:
    "Within Relationships, there is a split between living connection and obligation-driven maintenance.",
  money:
    "Within Money, there is a split between your real way of living and a borrowed financial playbook.",
  environment:
    "Within Environment, there is a split between how you actually live and the spaces you inhabit.",
};

export const PAIR_DISCONNECT_COPY: Partial<Record<QuestionId, string>> = {
  Q15: "Your Craft and Body are working against each other — the way you work is costing physical integration.",
  Q16: "Your Craft and Money are working against each other — the way you earn is not expressing what you build.",
  Q17: "Your Nourishment and Perception are out of sync — what you consume is not reinforcing clarity.",
  Q18: "Your Body and Perception are disconnected — movement is not compounding cognitive precision.",
  Q19: "Your Relationships and Craft are in tension — your social world is not reliably energizing your work.",
  Q20: "Your Money and Relationships are in tension — financial dynamics are distorting closeness.",
  Q21: "Your Nourishment and Relationships are disconnected — meals are not functioning as meaningful connection points.",
  Q22: "Your Money and Body are in conflict — your earning and health behaviors are not reinforcing each other.",
  Q23: "Your Environment and Craft are disconnected — your setting is not feeding your creative output.",
  Q24: "Your Environment and Body are disconnected — your surroundings are not naturally inviting movement and contact with the elements.",
};

export const INTEGRATION_BAND_COPY = {
  high: "All domains of your life are working together in harmony, and you are something of an integrated system.",
  medium:
    "Partial integration. Some domains are aligned, but others may be operating from a borrowed playbook.",
  low: "Significant fragmentation. Your domains may be individually functional but they're not speaking the same language.",
} as const;

export function getInternalGapMessage(domain: DomainId): string {
  return INTERNAL_GAP_COPY[domain];
}

export function getPairDisconnectMessage(questionId: QuestionId): string {
  return (
    PAIR_DISCONNECT_COPY[questionId] ??
    "This cross-domain pairing is currently a point of friction rather than reinforcement."
  );
}

export function getIntegrationReading(score: number): string {
  if (score >= 8) {
    return INTEGRATION_BAND_COPY.high;
  }

  if (score >= 5) {
    return INTEGRATION_BAND_COPY.medium;
  }

  return INTEGRATION_BAND_COPY.low;
}

export function getOutlierMessage(
  domain: DomainId,
  layer: QuizLayer,
  direction: "higher" | "lower",
): string {
  const domainLabel = DOMAIN_LABELS[domain];
  const layerLabel =
    layer === 1 ? "internal integration" : "cross-domain integration";
  const directionText =
    direction === "higher" ? "more developed than" : "less developed than";

  return `${domainLabel} is significantly ${directionText} the rest of your ${layerLabel} pattern, creating the sharpest edge in your shape.`;
}
