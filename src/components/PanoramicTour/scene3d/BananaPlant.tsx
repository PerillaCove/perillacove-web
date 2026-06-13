import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  GOLDEN_ANGLE,
  hash01,
  standardMaterial,
  unitSphere,
} from "./sharedAssets";
import {
  createBananaLeafGeometry,
  createTrunkGeometry,
} from "./organicGeometry";
import { useReducedMotionPref } from "./motion";

const STEM = standardMaterial("#8aa353", { roughness: 0.85 });
const LEAF = standardMaterial("#3f8a2c", { roughness: 0.8 });
const LEAF_LIGHT = standardMaterial("#5aa838", { roughness: 0.8 });
const LEAF_BACK = standardMaterial("#79b545", { roughness: 0.8 });
const BUNCH = standardMaterial("#cfc04a", { roughness: 0.7 });
const FLOWER_BUD = standardMaterial("#7d2e3f", { roughness: 0.7 });

const LEAF_MATERIALS = [LEAF, LEAF_LIGHT, LEAF_BACK];

interface LeafSpec {
  geometry: THREE.BufferGeometry;
  yaw: number;
  droop: number;
  length: number;
  materialIndex: number;
}

const buildLeaves = (seed: number, count: number): LeafSpec[] =>
  Array.from({ length: count }, (_, i) => ({
    geometry: createBananaLeafGeometry(Math.floor(seed * 31 + i * 7)),
    yaw: i * GOLDEN_ANGLE + hash01(seed + i) * 0.5,
    // Lower (older) leaves droop more, top leaves reach upward.
    droop: 0.25 + (i / count) * 0.9 + hash01(seed + i + 11) * 0.25,
    length: 2 + hash01(seed + i + 23) * 0.9,
    materialIndex: Math.floor(hash01(seed + i + 37) * LEAF_MATERIALS.length),
  }));

interface StemProps {
  seed: number;
  height: number;
  swayPhase: number;
  withBunch?: boolean;
  reduced: boolean;
}

function BananaStem({
  seed,
  height,
  swayPhase,
  withBunch = false,
  reduced,
}: StemProps) {
  const leavesRef = useRef<THREE.Group>(null);
  const trunkGeometry = useMemo(() => createTrunkGeometry(seed, 0.1), [seed]);
  const leaves = useMemo(() => buildLeaves(seed, 8), [seed]);

  useFrame(({ clock }) => {
    const group = leavesRef.current;
    if (reduced || !group) return;
    const t = clock.elapsedTime;
    group.children.forEach((leaf, i) => {
      const spec = leaves[i];
      if (!spec) return;
      // Individual leaf sway, slightly larger than tree foliage.
      leaf.rotation.x =
        spec.droop + Math.sin(t * 0.7 + swayPhase + i * 1.7) * 0.05;
      leaf.rotation.z = Math.sin(t * 0.55 + swayPhase + i * 2.3) * 0.04;
    });
  });

  return (
    <group>
      <mesh
        castShadow
        geometry={trunkGeometry}
        material={STEM}
        scale={[0.22, height, 0.22]}
      />

      <group position={[0, height * 0.96, 0]}>
        <group ref={leavesRef}>
          {leaves.map((spec, i) => (
            <group key={i} rotation={[spec.droop, spec.yaw, 0]}>
              <mesh
                castShadow
                geometry={spec.geometry}
                material={LEAF_MATERIALS[spec.materialIndex]}
                scale={[spec.length, spec.length, spec.length]}
              />
            </group>
          ))}
        </group>

        {withBunch ? (
          <group position={[0.3, -0.25, 0.2]} rotation={[0.4, 0, -0.5]}>
            {/* Hands of bananas in tiers */}
            {[0, 1, 2].map((tier) => (
              <group key={tier} position={[0, -tier * 0.22, 0]}>
                {[0, 1, 2, 3, 4].map((j) => {
                  const angle = (j / 5) * Math.PI * 2;
                  return (
                    <mesh
                      key={j}
                      geometry={unitSphere}
                      material={BUNCH}
                      position={[
                        Math.cos(angle) * 0.13,
                        0,
                        Math.sin(angle) * 0.13,
                      ]}
                      rotation={[0.4, angle, 0]}
                      scale={[0.05, 0.16, 0.05]}
                    />
                  );
                })}
              </group>
            ))}
            {/* Hanging flower bud */}
            <mesh
              geometry={unitSphere}
              material={FLOWER_BUD}
              position={[0, -0.85, 0]}
              scale={[0.11, 0.2, 0.11]}
            />
          </group>
        ) : null}
      </group>
    </group>
  );
}

interface BananaPlantProps {
  position: [number, number, number];
  swayPhase?: number;
}

/**
 * Banana mat: a main fruiting stem with arched ribbon leaves plus two pups,
 * matching the clumped banana stands around the pond in the panorama.
 */
export default function BananaPlant({
  position,
  swayPhase = 0,
}: BananaPlantProps) {
  const reduced = useReducedMotionPref();
  const seed = useMemo(() => Math.abs(swayPhase) * 11.7 + 4, [swayPhase]);

  return (
    <group position={position}>
      <BananaStem
        seed={seed}
        height={3.2}
        swayPhase={swayPhase}
        withBunch
        reduced={reduced}
      />
      <group position={[1.1, 0, -0.6]} rotation={[0, 2.2, 0.06]} scale={0.68}>
        <BananaStem
          seed={seed + 5}
          height={3}
          swayPhase={swayPhase + 2.1}
          reduced={reduced}
        />
      </group>
      <group position={[-0.9, 0, 0.7]} rotation={[0, 4.4, -0.05]} scale={0.45}>
        <BananaStem
          seed={seed + 9}
          height={2.8}
          swayPhase={swayPhase + 4.4}
          reduced={reduced}
        />
      </group>
    </group>
  );
}
