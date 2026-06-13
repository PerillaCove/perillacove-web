/**
 * TREE MODEL LOADER
 *
 * Loads species-specific 3D tree/plant models for VolumeRenderer.
 * Parallel to FruitModelLoader.tsx (which handles fruit geometry).
 *
 * ARCHITECTURE:
 * - Models hosted on Cloudflare R2 at assets.perillacove.com
 * - Species configs in SpeciesRenderConfig.ts point to model URLs
 * - Extracts fruit attachment points from named empties ("fruit_attach_*")
 * - Falls back gracefully when no model exists (returns null)
 *
 * USAGE:
 * ```tsx
 * const { scene, attachPoints, animations } = useTreeModel("banana");
 * if (scene) {
 *   <primitive object={scene} scale={growthMaturity} />
 * }
 * ```
 */

import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { useMemo } from "react";
import { getSpeciesConfig } from "./SpeciesRenderConfig";

/** Placeholder URL for unconditional useGLTF call (React hooks rule) */
const PLACEHOLDER_URL = "https://assets.perillacove.com/banana.glb";

// ============================================================================
// HOOKS
// ============================================================================

/**
 * Hook to load a species' custom tree model and extract attachment points.
 *
 * @param ingredientId - Canonical ingredient ID from ingredients.ts
 * @returns scene (cloned THREE.Group or null) and attachPoints (THREE.Vector3[])
 */
export function useTreeModel(ingredientId: string | undefined): {
  scene: THREE.Group | null;
  attachPoints: THREE.Vector3[];
  animations: THREE.AnimationClip[];
} {
  const config = getSpeciesConfig(ingredientId);
  const modelUrl = config?.treeModel ?? null;
  const hasModel = Boolean(modelUrl);

  // Must call unconditionally (React hooks rule)
  const gltf = useGLTF(modelUrl || PLACEHOLDER_URL);

  return useMemo(() => {
    if (!hasModel || !gltf?.scene) {
      return { scene: null, attachPoints: [], animations: [] };
    }

    // Clone to avoid modifying the cached original; SkeletonUtils preserves
    // skinned rigs for animated animals while also working for static plants.
    const clonedScene = cloneSkeleton(gltf.scene) as THREE.Group;
    const attachPoints = extractAttachPoints(clonedScene);

    return { scene: clonedScene, attachPoints, animations: gltf.animations };
  }, [hasModel, gltf?.animations, gltf?.scene]);
}

/**
 * Mesh data extracted from a GLTF scene for instanced rendering.
 * Each entry represents one mesh in the model with its shared geometry+material.
 */
export interface TreeMeshData {
  geometry: THREE.BufferGeometry;
  material: THREE.Material | THREE.Material[];
}

/**
 * Hook to extract geometry+material pairs from a tree model for instanced rendering.
 *
 * Unlike useTreeModel (which clones the scene), this extracts raw mesh data
 * so InstancedMesh can render many copies with a single draw call per mesh.
 *
 * @param ingredientId - Canonical ingredient ID from ingredients.ts
 * @returns meshes (geometry+material pairs) and attachPoints (Vector3[])
 */
export function useTreeModelMeshes(ingredientId: string | undefined): {
  meshes: TreeMeshData[];
  attachPoints: THREE.Vector3[];
} {
  const config = getSpeciesConfig(ingredientId);
  const modelUrl = config?.treeModel ?? null;
  const hasModel = Boolean(modelUrl);

  // Must call unconditionally (React hooks rule)
  const gltf = useGLTF(modelUrl || PLACEHOLDER_URL);

  return useMemo(() => {
    if (!hasModel || !gltf?.scene) {
      return { meshes: [], attachPoints: [] };
    }

    const meshes: TreeMeshData[] = [];
    const attachPoints: THREE.Vector3[] = [];

    // Ensure all world matrices are up-to-date before extracting transforms
    gltf.scene.updateMatrixWorld(true);

    gltf.scene.traverse((child) => {
      // Extract fruit attachment points
      if (child.name.startsWith("fruit_attach")) {
        const worldPos = new THREE.Vector3();
        child.getWorldPosition(worldPos);
        attachPoints.push(worldPos);
      }

      // Extract meshes with baked world transforms.
      // Each mesh in the GLTF has a local transform in the hierarchy (e.g., leaves
      // are positioned relative to the trunk). We bake the accumulated world matrix
      // into a cloned geometry so InstancedMesh only needs per-instance position/scale.
      if (child instanceof THREE.Mesh && child.geometry) {
        const bakedGeometry = child.geometry.clone();
        bakedGeometry.applyMatrix4(child.matrixWorld);
        // Clone materials so instanced meshes own independent copies.
        // Without this, HMR-triggered unmount/remount can lose materials
        // when R3F resets the attach="material" binding on the shared GLTF cache.
        const clonedMaterial = Array.isArray(child.material)
          ? child.material.map((m) => m.clone())
          : child.material.clone();
        meshes.push({
          geometry: bakedGeometry,
          material: clonedMaterial,
        });
      }
    });

    return { meshes, attachPoints };
  }, [hasModel, gltf?.scene]);
}

/**
 * Check if a species has a custom tree model.
 */
export function hasTreeModel(ingredientId: string | undefined): boolean {
  const config = getSpeciesConfig(ingredientId);
  return Boolean(config?.treeModel);
}

// ============================================================================
// ATTACHMENT POINT EXTRACTION
// ============================================================================

/**
 * Extract fruit attachment points from named empties in the model.
 *
 * In Blender, add Empty objects named "fruit_attach_01", "fruit_attach_02", etc.
 * at positions where fruits should spawn (branch tips, trunk surface, etc.).
 *
 * Points are returned in model-local coordinates at mature scale.
 * Multiply by growthMaturity to get actual positions.
 *
 * @param scene - The loaded GLTF scene
 * @returns Array of positions from "fruit_attach_*" empties
 */
function extractAttachPoints(scene: THREE.Object3D): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  scene.traverse((child) => {
    if (child.name.startsWith("fruit_attach")) {
      const worldPos = new THREE.Vector3();
      child.getWorldPosition(worldPos);
      points.push(worldPos);
    }
  });
  return points;
}
