/**
 * FRUIT MODEL LOADER
 *
 * Provides species-specific 3D fruit geometries for the fruit particle system.
 *
 * ARCHITECTURE:
 * - Models hosted on Cloudflare R2 at assets.perillacove.com
 * - Maps ingredient IDs to GLB model URLs
 * - Preloads models on app start for instant availability
 * - Falls back to sphere geometry for unmapped species
 * - Extracts BufferGeometry from loaded GLTF scenes
 *
 * ADDING NEW FRUITS:
 * 1. Create model in Blender (~500-1000 vertices, medium-poly)
 * 2. Upload GLB to R2 bucket as {ingredientId}.glb
 * 3. Add entry to FRUIT_MODELS mapping below
 * 4. Add color to FRUIT_COLORS in FruitParticles.tsx
 * 5. Optionally add to FRUIT_PRELOAD array for eager loading
 */

import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { useMemo } from "react";

// ============================================================================
// MODEL REGISTRY
// ============================================================================

/** Base URL for fruit models hosted on Cloudflare R2 */
const ASSETS_BASE_URL = "https://assets.perillacove.com";

/**
 * Maps ingredient IDs to their fruit model URLs.
 * Missing entries will fall back to default sphere geometry.
 */
export const FRUIT_MODELS: Record<string, string> = {
  banana: `${ASSETS_BASE_URL}/banana.glb`,
  cacao: `${ASSETS_BASE_URL}/cacao.glb`,
  durian: `${ASSETS_BASE_URL}/durian.glb`,
  jackfruit: `${ASSETS_BASE_URL}/jackfruit.glb`,
  jalapeno: `${ASSETS_BASE_URL}/jalapeno.glb`,
  // jalapeno: "/jalapeno.glb",
  black_magic_jalapeno: `${ASSETS_BASE_URL}/jalapeno.glb`,
  // black_magic_jalapeno: "/jalapeno.glb",
  peanut: `${ASSETS_BASE_URL}/peanut.glb`,
  pigeon_pea: `${ASSETS_BASE_URL}/pigeon_pea.glb`,
  turmeric: `${ASSETS_BASE_URL}/turmeric.glb`,
  ginger: `${ASSETS_BASE_URL}/ginger.glb`,
};

/**
 * Models to preload on app start.
 * Add frequently-used models here for instant availability.
 */
export const FRUIT_PRELOAD = [`${ASSETS_BASE_URL}/banana.glb`];

// ============================================================================
// PRELOADER
// ============================================================================

/**
 * Preloads all fruit models in FRUIT_PRELOAD array.
 * Call this once on app initialization.
 */
export function preloadFruitModels(): void {
  FRUIT_PRELOAD.forEach((path) => {
    useGLTF.preload(path);
  });
}

// ============================================================================
// GEOMETRY EXTRACTION
// ============================================================================

/**
 * Default sphere geometry for species without custom models.
 * Created once and reused for efficiency.
 *
 * NOTE: Use radius 0.5 (diameter 1) to match normalized custom model scale
 * where max dimension is 1 unit. Radius 1 made fallback fruits appear ~2x too large.
 */
const defaultSphereGeometry = new THREE.SphereGeometry(0.3, 8, 6);

/**
 * Extracts the first mesh geometry from a GLTF scene and normalizes to unit size.
 * Traverses the scene graph to find the first Mesh node.
 *
 * NORMALIZATION:
 * Models come in various sizes (e.g., banana is 0.17 units).
 * We scale them so the largest dimension equals 1 unit (like the default sphere).
 * This ensures consistent sizing when the instance scale is applied.
 *
 * @param scene - GLTF scene object
 * @returns BufferGeometry of the first mesh found (normalized), or null
 */
function extractGeometryFromScene(
  scene: THREE.Object3D,
): THREE.BufferGeometry | null {
  let geometry: THREE.BufferGeometry | null = null;

  scene.traverse((child) => {
    if (!geometry && child instanceof THREE.Mesh) {
      geometry = child.geometry as THREE.BufferGeometry;
    }
  });

  // Type assertion to override TypeScript's control flow analysis
  // (TypeScript doesn't track mutations inside callbacks, so it thinks geometry is always null)
  const foundGeometry = geometry as THREE.BufferGeometry | null;

  if (foundGeometry) {
    // Clone to avoid modifying original cached geometry
    const cloned = foundGeometry.clone();

    // Compute bounding box to find model size
    cloned.computeBoundingBox();
    const box = cloned.boundingBox;

    if (box) {
      // Find largest dimension
      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);

      if (maxDim > 0) {
        // Scale to normalize: largest dimension becomes 1 unit
        const scaleFactor = 1 / maxDim;
        cloned.scale(scaleFactor, scaleFactor, scaleFactor);

        // Center geometry at origin
        cloned.computeBoundingBox();
        const newBox = cloned.boundingBox!;
        const center = new THREE.Vector3();
        newBox.getCenter(center);
        cloned.translate(-center.x, -center.y, -center.z);
      }
    }

    return cloned;
  }

  return null;
}

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to get fruit geometry for a specific ingredient.
 *
 * USAGE:
 * ```tsx
 * const geometry = useFruitGeometry("banana");
 * <instancedMesh args={[geometry, undefined, count]} />
 * ```
 *
 * BEHAVIOR:
 * - Returns custom model geometry if available
 * - Falls back to sphere for unmapped ingredients
 * - Handles loading states gracefully
 *
 * @param ingredientId - The ingredient ID to get geometry for
 * @returns BufferGeometry for the fruit model
 */
export function useFruitGeometry(
  ingredientId: string | undefined,
): THREE.BufferGeometry {
  // Extract base ID (handles "banana__group1" -> "banana")
  const baseId = ingredientId ?? null;
  const modelPath = baseId ? FRUIT_MODELS[baseId] : null;
  const hasModel = Boolean(modelPath);

  // useGLTF must be called unconditionally - use banana as placeholder when no model
  // The actual fetch only happens if the path exists in the preloaded cache
  const gltf = useGLTF(modelPath || `${ASSETS_BASE_URL}/banana.glb`);

  // Extract geometry from loaded model only if this ingredient has a model
  const geometry = useMemo(() => {
    if (hasModel && gltf?.scene) {
      const extracted = extractGeometryFromScene(gltf.scene);
      if (extracted) {
        return extracted; // Already cloned and normalized
      }
    }
    return defaultSphereGeometry;
  }, [hasModel, gltf?.scene]);

  return geometry;
}

/**
 * Hook to check if an ingredient has a custom fruit model.
 *
 * @param ingredientId - The ingredient ID to check
 * @returns true if a custom model exists, false for sphere fallback
 */
export function hasFruitModel(ingredientId: string | undefined): boolean {
  if (!ingredientId) return false;
  return ingredientId in FRUIT_MODELS;
}
