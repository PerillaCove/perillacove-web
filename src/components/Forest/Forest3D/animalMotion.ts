export interface AnimalAnchor {
  x: number;
  z: number;
}

export interface AnimalOffset {
  x: number;
  z: number;
}

export interface AnimalMotionState {
  offset: AnimalOffset;
  nextOffset: AnimalOffset;
  isMoving: boolean;
}

export interface AnimalObstacle {
  x: number;
  z: number;
  radius: number;
}

const TAU = Math.PI * 2;

function positiveModulo(value: number, mod: number): number {
  return ((value % mod) + mod) % mod;
}

function smoothstep(value: number): number {
  const t = Math.min(1, Math.max(0, value));
  return t * t * (3 - 2 * t);
}

function targetNoise(index: number, targetIndex: number, seed: number): number {
  const raw = Math.sin(
    (index + 1) * 12.9898 + (targetIndex + 1) * 78.233 + seed * 37.719,
  );
  return raw - Math.floor(raw);
}

function grazingTarget(
  index: number,
  targetIndex: number,
  radius: number,
  seed: number,
): AnimalOffset {
  const angle = targetNoise(index, targetIndex, seed) * TAU;
  const distance =
    radius * (0.32 + targetNoise(index + 17, targetIndex, seed) * 0.56);
  return {
    x: Math.cos(angle) * distance,
    z: Math.sin(angle) * distance,
  };
}

export function getGrazingMotionState(
  elapsedSeconds: number,
  index: number,
  radius: number,
  moveDurationSeconds: number,
  pauseDurationSeconds: [number, number],
  seed = 0,
): AnimalMotionState {
  const pauseMix = positiveModulo(index * 53 + Math.floor(seed * 97), 17) / 16;
  const pauseDuration =
    pauseDurationSeconds[0] +
    (pauseDurationSeconds[1] - pauseDurationSeconds[0]) * pauseMix;
  const phaseOffset = index * 2.37 + positiveModulo(seed, TAU) * 0.6;
  const period = Math.max(1, moveDurationSeconds + pauseDuration);
  const phasedTime = elapsedSeconds + phaseOffset;
  const cycleIndex = Math.floor(phasedTime / period);
  const localTime = positiveModulo(phasedTime, period);
  const from = grazingTarget(index, cycleIndex, radius, seed);
  const to = grazingTarget(index, cycleIndex + 1, radius, seed);

  if (localTime >= moveDurationSeconds) {
    return {
      offset: to,
      nextOffset: to,
      isMoving: false,
    };
  }

  const eased = smoothstep(localTime / Math.max(moveDurationSeconds, 0.1));
  const nextEased = smoothstep(
    Math.min(moveDurationSeconds, localTime + 0.25) /
      Math.max(moveDurationSeconds, 0.1),
  );
  return {
    offset: {
      x: from.x + (to.x - from.x) * eased,
      z: from.z + (to.z - from.z) * eased,
    },
    nextOffset: {
      x: from.x + (to.x - from.x) * nextEased,
      z: from.z + (to.z - from.z) * nextEased,
    },
    isMoving: true,
  };
}

export function resolveSeparatedAnimalPositions(
  baseAnchors: AnimalAnchor[],
  desiredOffsets: AnimalOffset[],
  minSeparation: number,
  grazingRadius: number,
  obstacles: AnimalObstacle[] = [],
): AnimalAnchor[] {
  const positions = baseAnchors.map((anchor, index) => {
    const offset = desiredOffsets[index] ?? { x: 0, z: 0 };
    return {
      x: anchor.x + offset.x,
      z: anchor.z + offset.z,
    };
  });

  if (positions.length < 2 || minSeparation <= 0) return positions;

  const fallbackPush = Math.max(minSeparation, grazingRadius * 0.2);
  for (let pass = 0; pass < 16; pass++) {
    let adjusted = false;

    for (let i = 0; i < positions.length; i++) {
      const position = positions[i];
      for (
        let obstacleIndex = 0;
        obstacleIndex < obstacles.length;
        obstacleIndex++
      ) {
        const obstacle = obstacles[obstacleIndex];
        if (obstacle.radius <= 0) continue;

        let dx = position.x - obstacle.x;
        let dz = position.z - obstacle.z;
        let distance = Math.hypot(dx, dz);

        if (distance >= obstacle.radius) continue;

        if (distance < 0.0001) {
          const angle = positiveModulo(
            (i + 1) * 19.123 + (obstacleIndex + 1) * 47.77,
            TAU,
          );
          dx = Math.cos(angle);
          dz = Math.sin(angle);
          distance = 1;
        }

        const push = obstacle.radius - distance;
        position.x += (dx / distance) * push;
        position.z += (dz / distance) * push;
        adjusted = true;
      }
    }

    for (let i = 0; i < positions.length; i++) {
      for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i];
        const b = positions[j];
        let dx = b.x - a.x;
        let dz = b.z - a.z;
        let distance = Math.hypot(dx, dz);
        let wasCoincident = false;

        if (distance >= minSeparation) continue;

        if (distance < 0.0001) {
          const angle = positiveModulo(
            (i + 1) * 12.9898 + (j + 1) * 78.233,
            TAU,
          );
          dx = Math.cos(angle);
          dz = Math.sin(angle);
          distance = 1;
          wasCoincident = true;
        }

        const nx = dx / distance;
        const nz = dz / distance;
        const push = wasCoincident
          ? fallbackPush / 2
          : (minSeparation - distance) / 2;

        a.x -= nx * push;
        a.z -= nz * push;
        b.x += nx * push;
        b.z += nz * push;
        adjusted = true;
      }
    }

    if (!adjusted) break;
  }

  return positions;
}

export function animalLifecycleScale(
  ageYears: number,
  juvenileScale: number,
  growthDurationYears: number,
): number {
  const startScale = Math.min(1, Math.max(0.05, juvenileScale));
  const duration = Math.max(0.1, growthDurationYears);
  const progress = smoothstep(Math.max(0, ageYears) / duration);
  return startScale + (1 - startScale) * progress;
}

export function animalLifecycleOpacity(
  intensity: number,
  isDarkMode: boolean,
  ageYears = Number.POSITIVE_INFINITY,
  growthDurationYears = 0,
): number {
  const maxOpacity = isDarkMode ? 0.95 : 1;
  if (ageYears < Math.max(0.1, growthDurationYears)) return maxOpacity;
  return Math.max(0.03, Math.min(maxOpacity, intensity * maxOpacity));
}

export function smoothAnimalPositions(
  currentPositions: AnimalAnchor[] | undefined,
  targetPositions: AnimalAnchor[],
  deltaSeconds: number,
  smoothingRate = 5,
  maxSpeedMetersPerSecond = Number.POSITIVE_INFINITY,
): AnimalAnchor[] {
  if (
    !currentPositions ||
    currentPositions.length !== targetPositions.length ||
    targetPositions.length === 0
  ) {
    return targetPositions.map((position) => ({ ...position }));
  }

  const safeDelta = Math.min(0.05, Math.max(0, deltaSeconds));
  const alpha = 1 - Math.exp(-Math.max(0.1, smoothingRate) * safeDelta);
  const maxStep =
    Number.isFinite(maxSpeedMetersPerSecond) && maxSpeedMetersPerSecond >= 0
      ? maxSpeedMetersPerSecond * safeDelta
      : Number.POSITIVE_INFINITY;

  return targetPositions.map((target, index) => {
    const current = currentPositions[index];
    const next = {
      x: current.x + (target.x - current.x) * alpha,
      z: current.z + (target.z - current.z) * alpha,
    };

    const stepX = next.x - current.x;
    const stepZ = next.z - current.z;
    const stepDistance = Math.hypot(stepX, stepZ);
    if (stepDistance > maxStep) {
      if (maxStep <= 0) return { ...current };
      const ratio = maxStep / stepDistance;
      return {
        x: current.x + stepX * ratio,
        z: current.z + stepZ * ratio,
      };
    }

    return {
      x: next.x,
      z: next.z,
    };
  });
}

export function minPairwiseDistance(points: AnimalAnchor[]): number {
  if (points.length < 2) return Infinity;
  let min = Infinity;
  for (let i = 0; i < points.length; i++) {
    for (let j = i + 1; j < points.length; j++) {
      min = Math.min(
        min,
        Math.hypot(points[i].x - points[j].x, points[i].z - points[j].z),
      );
    }
  }
  return min;
}
