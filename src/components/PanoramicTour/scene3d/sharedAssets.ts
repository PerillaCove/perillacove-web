import * as THREE from "three";

/**
 * Shared unit geometries for the from-scratch scene. Everything is built by
 * scaling these few primitives, so the whole forest ships as code with zero
 * model downloads.
 */
export const unitSphere = new THREE.SphereGeometry(1, 12, 10);
export const unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 8);
export const unitCone = new THREE.ConeGeometry(1, 1, 7);
export const unitRock = new THREE.DodecahedronGeometry(1, 0);

const materialCache = new Map<string, THREE.MeshStandardMaterial>();

/** Cached stylized material so cloned tufts/blobs share GPU state. */
export function standardMaterial(
  color: string,
  options?: { roughness?: number; flatShading?: boolean },
): THREE.MeshStandardMaterial {
  const roughness = options?.roughness ?? 0.9;
  const flatShading = options?.flatShading ?? false;
  const key = `${color}:${roughness}:${flatShading ? 1 : 0}`;

  let material = materialCache.get(key);
  if (!material) {
    material = new THREE.MeshStandardMaterial({
      color,
      roughness,
      flatShading,
    });
    materialCache.set(key, material);
  }
  return material;
}

export const GOLDEN_ANGLE = 2.399963229728653;

/** Deterministic pseudo-random in [0, 1) — keeps cluster jitter stable across renders. */
export const hash01 = (n: number): number => {
  const s = Math.sin(n * 12.9898) * 43758.5453;
  return s - Math.floor(s);
};
