import { useMemo, useRef } from "react";
import type * as THREE from "three";
import {
  hash01,
  standardMaterial,
  unitCylinder,
  unitSphere,
} from "./sharedAssets";
import {
  createBananaLeafGeometry,
  createFoliageGeometry,
  createTrunkGeometry,
} from "./organicGeometry";
import { useFoliageSway } from "./motion";

const BARK = standardMaterial("#4f3a22", { roughness: 1 });
const FOLIAGE = standardMaterial("#3c6e30", { roughness: 1 });
const FOLIAGE_DEEP = standardMaterial("#2f5a28", { roughness: 1 });
const LEAF = standardMaterial("#447c34", { roughness: 0.9 });
const LEAF_YOUNG = standardMaterial("#9c5a30", { roughness: 0.9 });
const POD_ORANGE = standardMaterial("#cf7a28", { roughness: 0.6 });
const POD_RED = standardMaterial("#a83c20", { roughness: 0.6 });
const POD_YELLOW = standardMaterial("#dba32f", { roughness: 0.6 });

const POD_MATERIALS = [POD_ORANGE, POD_RED, POD_YELLOW, POD_ORANGE];

interface CacaoTreeProps {
  position: [number, number, number];
  swayPhase?: number;
}

/**
 * Slender understory tree with whorled branches, big droopy leaves (a few
 * young red ones), and colorful pods hanging from trunk and branches.
 */
export default function CacaoTree({ position, swayPhase = 0 }: CacaoTreeProps) {
  const crownRef = useRef<THREE.Group>(null);
  useFoliageSway(crownRef, swayPhase, 0.016);

  const seed = useMemo(() => Math.abs(swayPhase) * 9.1 + 3, [swayPhase]);
  const trunkGeometry = useMemo(() => createTrunkGeometry(seed, 0.18), [seed]);
  const foliageGeometry = useMemo(
    () => createFoliageGeometry(seed + 0.5, 0.3),
    [seed],
  );

  const branches = useMemo(
    () =>
      Array.from({ length: 5 }, (_, i) => {
        const angle = (i / 5) * Math.PI * 2 + hash01(seed + i + 3.1) * 0.8;
        return {
          angle,
          y: 1.5 + i * 0.4 + hash01(seed + i + 5.7) * 0.3,
          length: 1 + hash01(seed + i + 7.3) * 0.7,
        };
      }),
    [seed],
  );

  const leaves = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        geometry: createBananaLeafGeometry(seed * 3 + i),
        yaw: hash01(seed + i + 11.9) * Math.PI * 2,
        droop: 0.7 + hash01(seed + i + 13.3) * 0.6,
        y: 2.2 + hash01(seed + i + 17.7) * 1.3,
        length: 0.55 + hash01(seed + i + 19.1) * 0.3,
        young: hash01(seed + i + 23.9) < 0.2,
      })),
    [seed],
  );

  const pods = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const onTrunk = i < 3;
        const angle = hash01(seed + i + 29.3) * Math.PI * 2;
        return {
          position: [
            Math.cos(angle) *
              (onTrunk ? 0.14 : 0.7 + hash01(seed + i + 31.1) * 0.5),
            onTrunk
              ? 0.8 + hash01(seed + i + 37.7) * 1.2
              : 2 + hash01(seed + i + 41.3) * 0.8,
            Math.sin(angle) *
              (onTrunk ? 0.14 : 0.7 + hash01(seed + i + 43.9) * 0.5),
          ] as [number, number, number],
          scale: 0.08 + hash01(seed + i + 47.1) * 0.05,
          material:
            POD_MATERIALS[
              Math.floor(hash01(seed + i + 53.7) * POD_MATERIALS.length)
            ],
          tilt: (hash01(seed + i + 59.3) - 0.5) * 0.7,
        };
      }),
    [seed],
  );

  return (
    <group position={position}>
      <mesh
        castShadow
        geometry={trunkGeometry}
        material={BARK}
        scale={[0.16, 3.1, 0.16]}
      />

      {/* Whorled near-horizontal branches */}
      {branches.map((branch, i) => (
        <mesh
          key={i}
          castShadow
          geometry={unitCylinder}
          material={BARK}
          position={[
            Math.cos(branch.angle) * branch.length * 0.45,
            branch.y,
            Math.sin(branch.angle) * branch.length * 0.45,
          ]}
          rotation={[
            Math.sin(branch.angle) * 1.25,
            0,
            -Math.cos(branch.angle) * 1.25,
          ]}
          scale={[0.05, branch.length, 0.05]}
        />
      ))}

      <group ref={crownRef}>
        {/* Sparse foliage clumps */}
        <mesh
          castShadow
          geometry={foliageGeometry}
          material={FOLIAGE}
          position={[0, 3.1, 0]}
          scale={[1.25, 0.85, 1.25]}
        />
        <mesh
          castShadow
          geometry={foliageGeometry}
          material={FOLIAGE_DEEP}
          position={[0.9, 2.5, 0.4]}
          rotation={[0, 2.1, 0]}
          scale={[0.85, 0.55, 0.85]}
        />
        <mesh
          castShadow
          geometry={foliageGeometry}
          material={FOLIAGE_DEEP}
          position={[-0.85, 2.7, -0.35]}
          rotation={[0, 4.2, 0]}
          scale={[0.8, 0.5, 0.8]}
        />

        {/* Big droopy individual leaves; occasional young red flush */}
        {leaves.map((leaf, i) => (
          <group key={i} position={[0, leaf.y, 0]} rotation={[0, leaf.yaw, 0]}>
            <group position={[0, 0, 0.3]} rotation={[leaf.droop, 0, 0]}>
              <mesh
                geometry={leaf.geometry}
                material={leaf.young ? LEAF_YOUNG : LEAF}
                scale={[0.45 * leaf.length, leaf.length, leaf.length]}
              />
            </group>
          </group>
        ))}
      </group>

      {/* Pods on trunk and branches */}
      {pods.map((pod, i) => (
        <mesh
          key={i}
          castShadow
          geometry={unitSphere}
          material={pod.material}
          position={pod.position}
          rotation={[pod.tilt, 0, pod.tilt * 0.7]}
          scale={[pod.scale, pod.scale * 2.1, pod.scale]}
        />
      ))}
    </group>
  );
}
