export const INTEGRATION_POOR_THRESHOLD = 0.52;
export const INTEGRATION_HIGH_THRESHOLD = 0.78;

const OVERALL_LOW = "#ef4444";
const OVERALL_MID = "#f59e0b";
const OVERALL_HIGH = "#22c55e";
const OVERALL_EXCELLENT = "#10b981";

export function clampIntegration(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  const expanded =
    normalized.length === 3
      ? normalized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : normalized;
  return [
    parseInt(expanded.slice(0, 2), 16),
    parseInt(expanded.slice(2, 4), 16),
    parseInt(expanded.slice(4, 6), 16),
  ];
}

function channelToHex(value: number): string {
  return Math.round(value).toString(16).padStart(2, "0");
}

function mixHex(from: string, to: string, amount: number): string {
  const t = clampIntegration(amount);
  const [fromR, fromG, fromB] = hexToRgb(from);
  const [toR, toG, toB] = hexToRgb(to);
  return `#${channelToHex(fromR + (toR - fromR) * t)}${channelToHex(
    fromG + (toG - fromG) * t,
  )}${channelToHex(fromB + (toB - fromB) * t)}`;
}

export function getOverallIntegrationColor(value: number): string {
  const score = clampIntegration(value);
  if (score <= INTEGRATION_POOR_THRESHOLD) {
    return mixHex(OVERALL_LOW, OVERALL_MID, score / INTEGRATION_POOR_THRESHOLD);
  }
  if (score <= INTEGRATION_HIGH_THRESHOLD) {
    return mixHex(
      OVERALL_MID,
      OVERALL_HIGH,
      (score - INTEGRATION_POOR_THRESHOLD) /
        (INTEGRATION_HIGH_THRESHOLD - INTEGRATION_POOR_THRESHOLD),
    );
  }
  return mixHex(
    OVERALL_HIGH,
    OVERALL_EXCELLENT,
    (score - INTEGRATION_HIGH_THRESHOLD) / (1 - INTEGRATION_HIGH_THRESHOLD),
  );
}
