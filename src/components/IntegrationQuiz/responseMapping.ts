import { RESPONSE_MAX, RESPONSE_MIN } from "./types";

export const WORD_SPECTRUM_VALUES = [1, 2.5, 4, 5.5, 7] as const;
export const SCENARIO_INTENSITIES = [
  "slightly",
  "clearly",
  "completely",
] as const;

export type ScenarioSide = "a" | "b";
export type ScenarioIntensity = (typeof SCENARIO_INTENSITIES)[number];

const SCENARIO_TO_VALUE: Record<
  ScenarioSide,
  Record<ScenarioIntensity, number>
> = {
  a: {
    slightly: 3,
    clearly: 2,
    completely: 1,
  },
  b: {
    slightly: 5,
    clearly: 6,
    completely: 7,
  },
};

const VALUE_TO_SCENARIO: Partial<
  Record<number, { side: ScenarioSide; intensity: ScenarioIntensity }>
> = {
  1: { side: "a", intensity: "completely" },
  2: { side: "a", intensity: "clearly" },
  3: { side: "a", intensity: "slightly" },
  5: { side: "b", intensity: "slightly" },
  6: { side: "b", intensity: "clearly" },
  7: { side: "b", intensity: "completely" },
};

export function isValidResponseValue(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value) &&
    value >= RESPONSE_MIN &&
    value <= RESPONSE_MAX
  );
}

export function mapScenarioSelectionToValue(
  side: ScenarioSide,
  intensity: ScenarioIntensity,
): number {
  return SCENARIO_TO_VALUE[side][intensity];
}

export function decodeScenarioValue(
  value: number | undefined,
): { side: ScenarioSide; intensity: ScenarioIntensity } | null {
  if (!isValidResponseValue(value)) {
    return null;
  }

  return VALUE_TO_SCENARIO[value] ?? null;
}

export function getWordSpectrumValue(index: number): number {
  const value = WORD_SPECTRUM_VALUES[index];
  if (value === undefined) {
    throw new Error(`Invalid word spectrum index: ${index}`);
  }

  return value;
}

export function getWordSpectrumIndex(value: number): number | null {
  const index = WORD_SPECTRUM_VALUES.findIndex(
    (entry) => Math.abs(entry - value) < 1e-9,
  );

  return index === -1 ? null : index;
}
