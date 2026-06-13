import { useMemo, useRef } from "react";
import type * as THREE from "three";
import {
  GOLDEN_ANGLE,
  hash01,
  standardMaterial,
  unitCylinder,
  unitSphere,
} from "./sharedAssets";
import { createFoliageGeometry, terrainHeight } from "./organicGeometry";
import { useFoliageSway } from "./motion";

const STEM = standardMaterial("#73643f", { roughness: 1 });
const FOLIAGE = standardMaterial("#5d8a4a", { roughness: 1 });
const FOLIAGE_LIGHT = standardMaterial("#74a059", { roughness: 1 });
const BLOOM = standardMaterial("#e8c33c", { roughness: 0.8 });

const SHRUB_COUNT = 4;
const PATCH_SPREAD = 2.1;

interface ShrubSpec {
  offset: [number, number];
  rotationY: number;
  scale: number;
}

const buildShrubs = (seed: number): ShrubSpec[] =>
  Array.from({ length: SHRUB_COUNT }, (_, i) => {
    const angle = i * GOLDEN_ANGLE + hash01(seed + i) * 0.7;
    const radius = PATCH_SPREAD * Math.sqrt((i + 0.5) / SHRUB_COUNT);
    return {
      offset: [Math.cos(angle) * radius, Math.sin(angle) * radius],
      rotationY: hash01(seed + i + 7) * Math.PI * 2,
      scale: 0.8 + hash01(seed + i + 17) * 0.45,
    };
  });

interface PigeonPeaShrubProps {
  position: [number, number, number];
  swayPhase?: number;
}

/** Vase-shaped nitrogen-fixing shrubs with airy foliage and yellow blooms. */
export default function PigeonPeaShrub({
  position,
  swayPhase = 0,
}: PigeonPeaShrubProps) {
  const clusterRef = useRef<THREE.Group>(null);
  useFoliageSway(clusterRef, swayPhase, 0.014);

  const seed = useMemo(() => Math.abs(swayPhase) * 5.7 + 6, [swayPhase]);
  const clumpGeometry = useMemo(
    () => createFoliageGeometry(seed, 0.34),
    [seed],
  );
  const shrubs = useMemo(() => buildShrubs(seed), [seed]);

  return (
    <group position={position}>
      <group ref={clusterRef}>
        {shrubs.map((shrub, i) => {
          const worldX = position[0] + shrub.offset[0];
          const worldZ = position[2] + shrub.offset[1];
          const localY = terrainHeight(worldX, worldZ) - position[1];
          return (
            <group
              key={i}
              position={[shrub.offset[0], localY, shrub.offset[1]]}
              rotation={[0, shrub.rotationY, 0]}
              scale={shrub.scale}
            >
              {/* Vase of three angled stems */}
              <mesh
                castShadow
                geometry={unitCylinder}
                material={STEM}
                position={[0.18, 0.7, 0]}
                rotation={[0, 0, -0.3]}
                scale={[0.04, 1.4, 0.04]}
              />
              <mesh
                castShadow
                geometry={unitCylinder}
                material={STEM}
                position={[-0.16, 0.7, 0.08]}
                rotation={[0.1, 0, 0.28]}
                scale={[0.04, 1.4, 0.04]}
              />
              <mesh
                castShadow
                geometry={unitCylinder}
                material={STEM}
                position={[0, 0.75, -0.16]}
                rotation={[-0.26, 0, 0]}
                scale={[0.04, 1.5, 0.04]}
              />
              {/* Airy foliage tops */}
              <mesh
                castShadow
                geometry={clumpGeometry}
                material={FOLIAGE}
                position={[0.34, 1.5, 0]}
                scale={[0.46, 0.36, 0.46]}
              />
              <mesh
                castShadow
                geometry={clumpGeometry}
                material={FOLIAGE_LIGHT}
                position={[-0.32, 1.46, 0.18]}
                rotation={[0, 2.2, 0]}
                scale={[0.44, 0.34, 0.44]}
              />
              <mesh
                castShadow
                geometry={clumpGeometry}
                material={FOLIAGE}
                position={[0, 1.66, -0.3]}
                rotation={[0, 4.1, 0]}
                scale={[0.48, 0.38, 0.48]}
              />
              {/* Yellow pea blossoms */}
              <mesh
                geometry={unitSphere}
                material={BLOOM}
                position={[0.3, 1.78, 0.1]}
                scale={0.05}
              />
              <mesh
                geometry={unitSphere}
                material={BLOOM}
                position={[-0.22, 1.7, -0.12]}
                scale={0.04}
              />
            </group>
          );
        })}
      </group>
    </group>
  );
}
