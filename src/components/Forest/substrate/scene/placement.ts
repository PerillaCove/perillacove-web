import type { PositionOverrides } from "../../types";
import type { IntegrationSceneState } from "../types";

export interface SmartArrangementOptions {
  seed?: string;
  temperature?: number;
  candidateCount?: number;
}

export const SMART_ARRANGEMENT_DEFAULT_SEED = "integration-arrange-v1";
export const SMART_ARRANGEMENT_TEMPERATURE = 0.22;

function hashSeed(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function softmaxPick(
  scores: number[],
  random: () => number,
  temperature: number,
): number {
  const maxScore = Math.max(...scores);
  const weights = scores.map((score) =>
    Math.exp((score - maxScore) / Math.max(0.01, temperature)),
  );
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let cursor = random() * total;
  for (let i = 0; i < weights.length; i++) {
    cursor -= weights[i];
    if (cursor <= 0) return i;
  }
  return weights.length - 1;
}

function candidateScore(
  x: number,
  z: number,
  radius: number,
  placed: Array<{ x: number; z: number; radius: number }>,
  plotRadius: number,
): number {
  const edgePenalty = Math.max(0, Math.hypot(x, z) + radius - plotRadius);
  let nearest = placed.length === 0 ? plotRadius : Infinity;
  for (const other of placed) {
    const distance = Math.hypot(x - other.x, z - other.z);
    nearest = Math.min(nearest, distance - radius - other.radius * 0.7);
  }
  const spacingScore = Math.min(1.8, nearest / Math.max(0.5, radius));
  const centerBias = 1 - Math.hypot(x, z) / Math.max(1, plotRadius);
  return spacingScore + centerBias * 0.25 - edgePenalty * 3;
}

function generateCandidate(
  random: () => number,
  plotRadius: number,
): { x: number; z: number } {
  const angle = random() * Math.PI * 2;
  const radius = Math.sqrt(random()) * plotRadius * 0.88;
  return {
    x: Math.cos(angle) * radius,
    z: Math.sin(angle) * radius,
  };
}

export function arrangeIntegrationScene(
  scene: IntegrationSceneState,
  existingOverrides: PositionOverrides = {},
  options: SmartArrangementOptions = {},
): PositionOverrides {
  const random = mulberry32(
    hashSeed(`${options.seed ?? SMART_ARRANGEMENT_DEFAULT_SEED}:${scene.seed}`),
  );
  const temperature = options.temperature ?? SMART_ARRANGEMENT_TEMPERATURE;
  const candidateCount = options.candidateCount ?? 36;
  const overrides: PositionOverrides = { ...existingOverrides };
  const placed = scene.volumes
    .filter((volume) => overrides[volume.ingredientId])
    .map((volume) => ({
      x: overrides[volume.ingredientId].x,
      z: overrides[volume.ingredientId].z,
      radius: Math.max(0.4, volume.footprintRadius),
    }));

  const volumes = [...scene.volumes].sort((a, b) => {
    const radiusDelta = b.footprintRadius - a.footprintRadius;
    return radiusDelta || a.ingredientId.localeCompare(b.ingredientId);
  });

  for (const volume of volumes) {
    if (overrides[volume.ingredientId]) continue;
    const volumeRadius = Math.max(0.4, volume.footprintRadius);
    const candidates = Array.from({ length: candidateCount }, () =>
      generateCandidate(random, scene.grid.radius),
    );
    const scores = candidates.map((candidate) =>
      candidateScore(
        candidate.x,
        candidate.z,
        volumeRadius,
        placed,
        scene.grid.radius,
      ),
    );
    const selected = candidates[softmaxPick(scores, random, temperature)];
    overrides[volume.ingredientId] = {
      x: Math.round(selected.x * 1000) / 1000,
      z: Math.round(selected.z * 1000) / 1000,
    };
    placed.push({
      x: overrides[volume.ingredientId].x,
      z: overrides[volume.ingredientId].z,
      radius: volumeRadius,
    });
  }

  return overrides;
}
