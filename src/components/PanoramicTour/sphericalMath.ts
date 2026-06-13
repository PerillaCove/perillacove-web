const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

export const MIN_PITCH_DEG = -89.9;
export const MAX_PITCH_DEG = 89.9;

export const clampNumber = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

export const clampPitch = (pitch: number): number =>
  clampNumber(pitch, MIN_PITCH_DEG, MAX_PITCH_DEG);

export const normalizeYaw = (yaw: number): number => {
  const wrapped = ((((yaw + 180) % 360) + 360) % 360) - 180;
  return wrapped === -180 ? 180 : wrapped;
};

export const percentToYawPitch = (
  xPercent: number,
  yPercent: number,
): { yaw: number; pitch: number } => {
  const x = clampNumber(xPercent, 0, 100);
  const y = clampNumber(yPercent, 0, 100);

  const yaw = normalizeYaw((x / 100) * 360 - 180);
  const pitch = clampPitch(90 - (y / 100) * 180);

  return { yaw, pitch };
};

export const yawPitchToPercent = (
  yawDeg: number,
  pitchDeg: number,
): { x: number; y: number } => {
  const yaw = normalizeYaw(yawDeg);
  const pitch = clampPitch(pitchDeg);
  const x = yaw === 180 ? 100 : ((yaw + 180) / 360) * 100;
  const y = ((90 - pitch) / 180) * 100;

  return {
    x: clampNumber(x, 0, 100),
    y: clampNumber(y, 0, 100),
  };
};

export const yawPitchToCartesian = (
  yawDeg: number,
  pitchDeg: number,
  radius = 1,
): { x: number; y: number; z: number } => {
  const yaw = normalizeYaw(yawDeg) * DEG_TO_RAD;
  const pitch = clampPitch(pitchDeg) * DEG_TO_RAD;
  const cosPitch = Math.cos(pitch);

  return {
    x: radius * cosPitch * Math.sin(yaw),
    y: radius * Math.sin(pitch),
    z: -radius * cosPitch * Math.cos(yaw),
  };
};

export const cartesianToYawPitch = (
  x: number,
  y: number,
  z: number,
): { yaw: number; pitch: number } => {
  const length = Math.hypot(x, y, z);
  if (length === 0) {
    return { yaw: 0, pitch: 0 };
  }

  const nx = x / length;
  const ny = y / length;
  const nz = z / length;

  const pitch = clampPitch(Math.asin(ny) * RAD_TO_DEG);
  const yaw = normalizeYaw(Math.atan2(nx, -nz) * RAD_TO_DEG);

  return { yaw, pitch };
};

export const isEquirectangularAspect = (
  width: number,
  height: number,
  tolerance = 0.03,
): boolean => {
  if (width <= 0 || height <= 0) return false;
  const ratio = width / height;
  return Math.abs(ratio - 2) <= tolerance;
};
