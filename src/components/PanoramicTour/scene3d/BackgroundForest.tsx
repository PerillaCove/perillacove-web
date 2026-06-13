import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { hash01 } from "./sharedAssets";
import {
  createFoliageGeometry,
  createTrunkGeometry,
  terrainHeight,
} from "./organicGeometry";

/**
 * Distant forest wall enclosing the clearing, with a deliberate opening
 * toward the sunset over the pond (mirroring the panorama's composition).
 * Two instanced draws total: one for trunks, one for canopy clumps.
 */

// Sunset opening azimuth (matches the sun direction in ForestScene).
const GAP_CENTER = Math.atan2(20, 60);
const GAP_HALF_WIDTH = 0.55;

const TRUNK_COLOR_NEAR = new THREE.Color("#4f3b24");
const TRUNK_COLOR_FAR = new THREE.Color("#5e5440");
const CANOPY_NEAR = new THREE.Color("#2c5226");
const CANOPY_FAR = new THREE.Color("#49663d");

interface BackdropTree {
  x: number;
  z: number;
  height: number;
  radius: number;
  depth: number; // 0 near ring, 1 far ring
  seed: number;
}

const buildTrees = (): BackdropTree[] => {
  const trees: BackdropTree[] = [];
  const rings = [
    { radius: 42, count: 26, heightMin: 11, heightMax: 17, depth: 0 },
    { radius: 56, count: 22, heightMin: 14, heightMax: 21, depth: 1 },
  ];

  rings.forEach((ring, ringIndex) => {
    for (let i = 0; i < ring.count; i += 1) {
      const seed = ringIndex * 100 + i;
      // Spread across the back/left/right arc, skipping the sunset gap.
      const theta =
        -2.7 + (5.4 * i) / (ring.count - 1) + (hash01(seed + 0.7) - 0.5) * 0.16;
      if (
        Math.abs(theta - GAP_CENTER) <
        GAP_HALF_WIDTH * (1 + ring.depth * 0.4)
      ) {
        continue;
      }

      const radius = ring.radius + (hash01(seed + 1.3) - 0.5) * 7;
      trees.push({
        x: Math.sin(theta) * radius,
        z: -Math.cos(theta) * radius,
        height:
          ring.heightMin +
          hash01(seed + 2.9) * (ring.heightMax - ring.heightMin),
        radius: 0.32 + hash01(seed + 4.1) * 0.25,
        depth: ring.depth,
        seed,
      });
    }
  });

  return trees;
};

export default function BackgroundForest() {
  const trees = useMemo(buildTrees, []);
  const trunkGeometry = useMemo(() => createTrunkGeometry(99, 0.2), []);
  const canopyGeometry = useMemo(() => createFoliageGeometry(17), []);
  const trunkMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 1 }),
    [],
  );
  const canopyMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 1 }),
    [],
  );

  const trunksRef = useRef<THREE.InstancedMesh>(null);
  const canopiesRef = useRef<THREE.InstancedMesh>(null);

  const canopyCount = trees.length * 3;

  useLayoutEffect(() => {
    const trunks = trunksRef.current;
    const canopies = canopiesRef.current;
    if (!trunks || !canopies) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let canopyIndex = 0;

    trees.forEach((tree, i) => {
      const groundY = terrainHeight(tree.x, tree.z);

      dummy.position.set(tree.x, groundY, tree.z);
      dummy.rotation.set(0, hash01(tree.seed + 5.3) * Math.PI * 2, 0);
      dummy.scale.set(tree.radius, tree.height, tree.radius);
      dummy.updateMatrix();
      trunks.setMatrixAt(i, dummy.matrix);
      color.copy(TRUNK_COLOR_NEAR).lerp(TRUNK_COLOR_FAR, tree.depth);
      trunks.setColorAt(i, color);

      // Three canopy clumps near the top of each trunk.
      for (let c = 0; c < 3; c += 1) {
        const spread = tree.height * 0.16;
        dummy.position.set(
          tree.x + (hash01(tree.seed + c * 7.7) - 0.5) * spread * 2,
          groundY + tree.height * (0.78 + hash01(tree.seed + c * 3.1) * 0.22),
          tree.z + (hash01(tree.seed + c * 9.3) - 0.5) * spread * 2,
        );
        dummy.rotation.set(
          0,
          hash01(tree.seed + c * 11.9) * Math.PI * 2,
          (hash01(tree.seed + c * 13.7) - 0.5) * 0.4,
        );
        const size = tree.height * (0.2 + hash01(tree.seed + c * 17.3) * 0.12);
        dummy.scale.set(size, size * 0.75, size);
        dummy.updateMatrix();
        canopies.setMatrixAt(canopyIndex, dummy.matrix);
        color
          .copy(CANOPY_NEAR)
          .lerp(CANOPY_FAR, tree.depth * 0.8 + hash01(tree.seed + c) * 0.2);
        canopies.setColorAt(canopyIndex, color);
        canopyIndex += 1;
      }
    });

    trunks.count = trees.length;
    canopies.count = canopyIndex;
    trunks.instanceMatrix.needsUpdate = true;
    canopies.instanceMatrix.needsUpdate = true;
    if (trunks.instanceColor) trunks.instanceColor.needsUpdate = true;
    if (canopies.instanceColor) canopies.instanceColor.needsUpdate = true;
  }, [trees]);

  return (
    <group>
      <instancedMesh
        ref={trunksRef}
        args={[trunkGeometry, trunkMaterial, trees.length]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={canopiesRef}
        args={[canopyGeometry, canopyMaterial, canopyCount]}
        frustumCulled={false}
      />
    </group>
  );
}
