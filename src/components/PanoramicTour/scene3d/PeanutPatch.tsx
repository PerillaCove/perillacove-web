import { useMemo, useRef } from "react";
import type * as THREE from "three";
import {
  GOLDEN_ANGLE,
  hash01,
  standardMaterial,
  unitSphere,
} from "./sharedAssets";
import { createFoliageGeometry, terrainHeight } from "./organicGeometry";
import { useFoliageSway } from "./motion";

const LEAF = standardMaterial("#54923a", { roughness: 1 });
const LEAF_LIGHT = standardMaterial("#6fae45", { roughness: 1 });
const BLOOM = standardMaterial("#f0c93f", { roughness: 0.8 });

const TUFT_COUNT = 10;
const PATCH_SPREAD = 2.6;

interface TuftSpec {
  offset: [number, number];
  rotationY: number;
  scale: number;
  light: boolean;
  bloom: boolean;
}

const buildTufts = (seed: number): TuftSpec[] =>
  Array.from({ length: TUFT_COUNT }, (_, i) => {
    const angle = i * GOLDEN_ANGLE + hash01(seed + i) * 0.6;
    const radius = PATCH_SPREAD * Math.sqrt((i + 0.4) / TUFT_COUNT);
    return {
      offset: [Math.cos(angle) * radius, Math.sin(angle) * radius],
      rotationY: hash01(seed + i + 5) * Math.PI * 2,
      scale: 0.55 + hash01(seed + i + 13) * 0.5,
      light: hash01(seed + i + 19) < 0.5,
      bloom: hash01(seed + i + 29) < 0.6,
    };
  });

interface PeanutPatchProps {
  position: [number, number, number];
  swayPhase?: number;
}

/** Dense low ground-cover patch with tiny yellow peanut blooms. */
export default function PeanutPatch({
  position,
  swayPhase = 0,
}: PeanutPatchProps) {
  const patchRef = useRef<THREE.Group>(null);
  useFoliageSway(patchRef, swayPhase, 0.01);

  const seed = useMemo(() => Math.abs(swayPhase) * 3.1 + 5, [swayPhase]);
  const clumpGeometry = useMemo(
    () => createFoliageGeometry(seed, 0.32),
    [seed],
  );
  const tufts = useMemo(() => buildTufts(seed), [seed]);

  return (
    <group position={position}>
      <group ref={patchRef}>
        {tufts.map((tuft, i) => {
          const worldX = position[0] + tuft.offset[0];
          const worldZ = position[2] + tuft.offset[1];
          const localY = terrainHeight(worldX, worldZ) - position[1];
          return (
            <group
              key={i}
              position={[tuft.offset[0], localY, tuft.offset[1]]}
              rotation={[0, tuft.rotationY, 0]}
              scale={tuft.scale}
            >
              <mesh
                castShadow
                geometry={clumpGeometry}
                material={tuft.light ? LEAF_LIGHT : LEAF}
                position={[0, 0.14, 0]}
                scale={[0.42, 0.2, 0.42]}
              />
              <mesh
                geometry={clumpGeometry}
                material={tuft.light ? LEAF : LEAF_LIGHT}
                position={[0.24, 0.1, 0.12]}
                rotation={[0, 2.4, 0]}
                scale={[0.28, 0.15, 0.28]}
              />
              {tuft.bloom ? (
                <mesh
                  geometry={unitSphere}
                  material={BLOOM}
                  position={[0.1, 0.3, -0.06]}
                  scale={0.045}
                />
              ) : null}
            </group>
          );
        })}
      </group>
    </group>
  );
}
