import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { hash01 } from "./sharedAssets";
import { POND } from "./layout";

/**
 * Procedural geometry generators that replace plain primitives with organic,
 * irregular shapes: crinkly foliage clumps, bent tapered trunks, ribbon
 * banana leaves, bumpy fruit, grass blades, and a gently rolling terrain
 * with a pond basin. All deterministic (seeded hash noise), all generated in
 * code — still zero asset downloads.
 */

const geometryCache = new Map<string, THREE.BufferGeometry>();

const cached = (
  key: string,
  build: () => THREE.BufferGeometry,
): THREE.BufferGeometry => {
  let geometry = geometryCache.get(key);
  if (!geometry) {
    geometry = build();
    geometryCache.set(key, geometry);
  }
  return geometry;
};

export const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** Hash keyed on a vertex's spatial position so coincident vertices displace identically. */
const positionHash = (seed: number, x: number, y: number, z: number): number =>
  hash01(
    seed +
      Math.round(x * 512) * 0.731 +
      Math.round(y * 512) * 0.527 +
      Math.round(z * 512) * 0.313,
  );

// ---------------------------------------------------------------------------
// Terrain
// ---------------------------------------------------------------------------

/**
 * Gentle rolling ground height with a smooth pond basin. Everything that sits
 * on the ground (plants, cows, grass, flowers) samples this so the world
 * reads as one continuous meadow instead of objects floating on a disc.
 */
export function terrainHeight(x: number, z: number): number {
  const height =
    Math.sin(x * 0.12 + 1.7) * Math.cos(z * 0.1 + 0.4) * 0.32 +
    Math.sin(x * 0.05 - 0.6) * Math.cos(z * 0.07 + 1.1) * 0.22;

  const dx = (x - POND.x) / POND.radiusX;
  const dz = (z - POND.z) / POND.radiusZ;
  const pondDistance = Math.sqrt(dx * dx + dz * dz);
  // 1 inside the pond, easing to 0 just past the rim.
  const inside = 1 - smoothstep(0.78, 1.22, pondDistance);

  return height * (1 - inside) - inside * 0.55;
}

export const isInPond = (x: number, z: number, margin = 1.08): boolean => {
  const dx = (x - POND.x) / (POND.radiusX * margin);
  const dz = (z - POND.z) / (POND.radiusZ * margin);
  return dx * dx + dz * dz < 1;
};

const TERRAIN_SIZE = 130;
const TERRAIN_SEGMENTS = 80;

const GROUND_DARK = new THREE.Color("#3a6a2c");
const GROUND_LIGHT = new THREE.Color("#5f9a3d");
const GROUND_WARM = new THREE.Color("#7da648");
const SHORE = new THREE.Color("#8c8a52");

export function createTerrainGeometry(): THREE.BufferGeometry {
  return cached("terrain", () => {
    const geometry = new THREE.PlaneGeometry(
      TERRAIN_SIZE,
      TERRAIN_SIZE,
      TERRAIN_SEGMENTS,
      TERRAIN_SEGMENTS,
    );
    geometry.rotateX(-Math.PI / 2);

    const positions = geometry.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    const color = new THREE.Color();

    for (let i = 0; i < positions.count; i += 1) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      positions.setY(i, terrainHeight(x, z));

      const n = hash01(x * 0.731 + z * 1.317);
      const patch = hash01(
        Math.round(x * 0.22) * 3.1 + Math.round(z * 0.22) * 5.7,
      );
      color.copy(GROUND_DARK).lerp(GROUND_LIGHT, n * 0.5 + patch * 0.5);
      // Warm sunlit tint toward the pond clearing where direct light lands.
      const sunlit = 1 - smoothstep(6, 22, Math.hypot(x - POND.x, z - POND.z));
      color.lerp(GROUND_WARM, sunlit * 0.45);

      // Sandy shoreline ring just around the pond rim.
      const dx = (x - POND.x) / POND.radiusX;
      const dz = (z - POND.z) / POND.radiusZ;
      const d = Math.sqrt(dx * dx + dz * dz);
      const shore = (1 - smoothstep(1.04, 1.3, d)) * smoothstep(0.78, 0.98, d);
      color.lerp(SHORE, shore * 0.8);

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.computeVertexNormals();
    return geometry;
  });
}

// ---------------------------------------------------------------------------
// Foliage
// ---------------------------------------------------------------------------

/**
 * Organic leaf-clump blob: an icosahedron with welded vertices and seeded
 * radial displacement. Welding before displacing means recomputed normals
 * are smooth, so clumps read as soft foliage masses instead of faceted rocks.
 */
export function createFoliageGeometry(
  seed: number,
  roughness = 0.3,
): THREE.BufferGeometry {
  return cached(`foliage:${seed}:${roughness}`, () => {
    const raw = new THREE.IcosahedronGeometry(1, 2);
    const geometry = mergeVertices(raw);
    raw.dispose();
    const positions = geometry.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < positions.count; i += 1) {
      v.fromBufferAttribute(positions, i);
      const n = positionHash(seed, v.x, v.y, v.z);
      v.multiplyScalar(1 + (n - 0.5) * roughness * 2);
      positions.setXYZ(i, v.x, v.y, v.z);
    }

    geometry.computeVertexNormals();
    return geometry;
  });
}

// ---------------------------------------------------------------------------
// Trunks
// ---------------------------------------------------------------------------

/**
 * Unit trunk (base at y=0, height 1) with taper, a gentle bend, and radial
 * bark noise. Scale [r, h, r] at use sites.
 */
export function createTrunkGeometry(
  seed: number,
  bend = 0.3,
): THREE.BufferGeometry {
  return cached(`trunk:${seed}:${bend}`, () => {
    const geometry = new THREE.CylinderGeometry(0.6, 1, 1, 10, 8);
    geometry.translate(0, 0.5, 0);

    const positions = geometry.attributes.position;
    const v = new THREE.Vector3();
    const lean = (hash01(seed + 3.7) - 0.5) * 2;

    for (let i = 0; i < positions.count; i += 1) {
      v.fromBufferAttribute(positions, i);
      const t = v.y;
      const n = positionHash(seed, v.x, v.y, v.z);
      const radial = 1 + (n - 0.5) * 0.16;
      v.x = v.x * radial + Math.sin(t * Math.PI) * bend * lean;
      v.z *= radial;
      positions.setXYZ(i, v.x, v.y, v.z);
    }

    geometry.computeVertexNormals();
    return geometry;
  });
}

// ---------------------------------------------------------------------------
// Fruit
// ---------------------------------------------------------------------------

/** Elongated bumpy jackfruit (unit-ish, hangs along -y). */
export function createJackfruitGeometry(seed: number): THREE.BufferGeometry {
  return cached(`jackfruit:${seed}`, () => {
    const geometry = new THREE.SphereGeometry(1, 12, 14);
    geometry.scale(0.62, 1, 0.62);

    const positions = geometry.attributes.position;
    const v = new THREE.Vector3();
    for (let i = 0; i < positions.count; i += 1) {
      v.fromBufferAttribute(positions, i);
      const n = positionHash(seed, v.x, v.y, v.z);
      v.multiplyScalar(1 + (n - 0.5) * 0.12);
      positions.setXYZ(i, v.x, v.y, v.z);
    }

    geometry.computeVertexNormals();
    return geometry;
  });
}

/** Spiky durian: icosahedron with strong outward vertex spikes. */
export function createDurianGeometry(seed: number): THREE.BufferGeometry {
  return cached(`durian:${seed}`, () => {
    const geometry = new THREE.IcosahedronGeometry(1, 1);
    const positions = geometry.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < positions.count; i += 1) {
      v.fromBufferAttribute(positions, i);
      const n = positionHash(seed, v.x, v.y, v.z);
      v.multiplyScalar(1 + n * 0.32);
      positions.setXYZ(i, v.x, v.y, v.z);
    }

    geometry.scale(0.92, 1.05, 0.92);
    geometry.computeVertexNormals();
    return geometry;
  });
}

// ---------------------------------------------------------------------------
// Banana leaf
// ---------------------------------------------------------------------------

/**
 * Arched banana-leaf ribbon: a tapering strip with a raised midrib, a droop
 * curve, and irregular edge notches (the wind-split look). Unit length along
 * +Z, origin at the petiole.
 */
export function createBananaLeafGeometry(seed: number): THREE.BufferGeometry {
  return cached(`bananaLeaf:${seed}`, () => {
    const SEGMENTS = 16;
    const positions: number[] = [];
    const index: number[] = [];

    for (let i = 0; i <= SEGMENTS; i += 1) {
      const t = i / SEGMENTS;
      const z = t;
      const profile = Math.sin(Math.min(t / 0.92, 1) * Math.PI) ** 0.7;
      const halfWidth = 0.15 * profile + 0.008;

      const notchLeft =
        i > 1 && i < SEGMENTS && hash01(seed + i * 3.17) < 0.34
          ? 0.5 + 0.35 * hash01(seed + i * 7.7)
          : 1;
      const notchRight =
        i > 1 && i < SEGMENTS && hash01(seed + i * 5.31) < 0.34
          ? 0.5 + 0.35 * hash01(seed + i * 9.1)
          : 1;

      const droop = -(t * t) * 0.85;
      const fold = 0.085 * profile;

      positions.push(
        -halfWidth * notchLeft,
        droop - fold,
        z,
        0,
        droop + 0.015,
        z,
        halfWidth * notchRight,
        droop - fold,
        z,
      );

      if (i < SEGMENTS) {
        const a = i * 3;
        index.push(
          a,
          a + 3,
          a + 1,
          a + 1,
          a + 3,
          a + 4,
          a + 1,
          a + 4,
          a + 2,
          a + 2,
          a + 4,
          a + 5,
        );
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(positions, 3),
    );
    geometry.setIndex(index);
    geometry.computeVertexNormals();
    return geometry;
  });
}

// ---------------------------------------------------------------------------
// Grass blade
// ---------------------------------------------------------------------------

/** Thin tapered blade, origin at the base, height 1 — instanced thousands of times. */
export function createGrassBladeGeometry(): THREE.BufferGeometry {
  return cached("grassBlade", () => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([
      -0.045, 0, 0, 0.045, 0, 0, -0.026, 0.55, 0.03, 0.026, 0.55, 0.03, 0, 1,
      0.09,
    ]);
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4]);
    geometry.computeVertexNormals();
    return geometry;
  });
}
