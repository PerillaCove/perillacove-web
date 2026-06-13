import { useMemo, useRef } from "react";
import type * as THREE from "three";
import {
  hash01,
  standardMaterial,
  unitCone,
  unitCylinder,
} from "./sharedAssets";
import {
  createDurianGeometry,
  createFoliageGeometry,
  createTrunkGeometry,
} from "./organicGeometry";
import { useFoliageSway } from "./motion";

const BARK = standardMaterial("#5a4128", { roughness: 1 });
const FOLIAGE_DEEP = standardMaterial("#33632c", { roughness: 1 });
const FOLIAGE_MID = standardMaterial("#427a33", { roughness: 1 });
const FOLIAGE_SUNLIT = standardMaterial("#69a23f", { roughness: 0.95 });
const FRUIT = standardMaterial("#8a9c42", { roughness: 1 });
const STEM = standardMaterial("#4a3a22", { roughness: 1 });

const BLOB_COUNT = 14;
const FRUIT_COUNT = 4;

interface BlobSpec {
  position: [number, number, number];
  scale: [number, number, number];
  rotationY: number;
  tier: number; // 0 deep, 1 mid, 2 sunlit top
}

/**
 * Canopy: a central mass plus a shell of smaller clumps, with the lower-ring
 * clumps drooping so the silhouette rounds off like a real crown.
 */
const buildCanopy = (seed: number): BlobSpec[] =>
  Array.from({ length: BLOB_COUNT }, (_, i) => {
    if (i === 0) {
      return {
        position: [0, 0.2, 0] as [number, number, number],
        scale: [2.5, 2, 2.5] as [number, number, number],
        rotationY: hash01(seed) * Math.PI * 2,
        tier: 1,
      };
    }
    const angle = (i / (BLOB_COUNT - 1)) * Math.PI * 2 + hash01(seed + i) * 0.7;
    const ring = 1.2 + hash01(seed + i + 3.3) * 1.2;
    // Shell height: blobs near the top sit high, outer-ring blobs droop.
    const lift = hash01(seed + i + 7.7);
    const y = lift * 2 - (ring - 1.2) * 0.55 - 0.4;
    const size = 1.1 + hash01(seed + i + 11.3) * 0.85;
    return {
      position: [Math.cos(angle) * ring, y, Math.sin(angle) * ring],
      scale: [size, size * (0.7 + hash01(seed + i + 13.7) * 0.2), size],
      rotationY: hash01(seed + i + 17.1) * Math.PI * 2,
      tier: y > 0.9 ? 2 : y > -0.3 ? 1 : 0,
    };
  });

interface FruitSpec {
  position: [number, number, number];
  scale: number;
  stem: number;
}

/** Hang each durian directly beneath a low canopy clump, stem rooted in it. */
const buildFruit = (seed: number, canopy: BlobSpec[]): FruitSpec[] => {
  const hosts = canopy
    .slice(1)
    .filter((blob) => blob.tier <= 1)
    .sort((a, b) => a.position[1] - b.position[1])
    .slice(0, FRUIT_COUNT);

  return hosts.map((blob, i) => {
    const scale = 0.3 + hash01(seed + i + 37.3) * 0.12;
    const stem = 0.3 + hash01(seed + i + 41.9) * 0.25;
    return {
      position: [
        blob.position[0],
        blob.position[1] - blob.scale[1] * 0.72 - stem - scale * 0.8,
        blob.position[2],
      ],
      scale,
      stem,
    };
  });
};

const TIER_MATERIALS = [FOLIAGE_DEEP, FOLIAGE_MID, FOLIAGE_SUNLIT];

interface DurianTreeProps {
  position: [number, number, number];
  swayPhase?: number;
}

/** Tall emergent canopy tree with spiky durians hanging from the crown. */
export default function DurianTree({
  position,
  swayPhase = 0,
}: DurianTreeProps) {
  const foliageRef = useRef<THREE.Group>(null);
  useFoliageSway(foliageRef, swayPhase, 0.011);

  const seed = useMemo(() => Math.abs(swayPhase) * 13.7 + 1, [swayPhase]);
  const trunkGeometry = useMemo(() => createTrunkGeometry(seed), [seed]);
  const foliageGeometry = useMemo(
    () => createFoliageGeometry(seed + 0.5),
    [seed],
  );
  const fruitGeometry = useMemo(() => createDurianGeometry(seed + 1.5), [seed]);
  const canopy = useMemo(() => buildCanopy(seed), [seed]);
  const fruit = useMemo(() => buildFruit(seed, canopy), [seed, canopy]);

  return (
    <group position={position}>
      <mesh
        castShadow
        geometry={trunkGeometry}
        material={BARK}
        scale={[0.55, 10, 0.55]}
      />
      {/* Buttress roots flaring at the base */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2 + hash01(seed + i + 51.1) * 0.6;
        return (
          <mesh
            key={i}
            castShadow
            geometry={unitCone}
            material={BARK}
            position={[Math.cos(angle) * 0.42, 0.55, Math.sin(angle) * 0.42]}
            rotation={[Math.sin(angle) * 0.35, 0, -Math.cos(angle) * 0.35]}
            scale={[0.28, 1.5, 0.5]}
          />
        );
      })}
      {/* Visible limbs reaching into the crown */}
      <mesh
        castShadow
        geometry={unitCylinder}
        material={BARK}
        position={[0.7, 8.6, 0.2]}
        rotation={[0, 0, -0.7]}
        scale={[0.14, 2.6, 0.14]}
      />
      <mesh
        castShadow
        geometry={unitCylinder}
        material={BARK}
        position={[-0.6, 8.9, -0.3]}
        rotation={[0.3, 0, 0.65]}
        scale={[0.12, 2.4, 0.12]}
      />

      <group ref={foliageRef} position={[0, 9.9, 0]}>
        {canopy.map((blob, i) => (
          <mesh
            key={i}
            castShadow
            geometry={foliageGeometry}
            material={TIER_MATERIALS[blob.tier]}
            position={blob.position}
            rotation={[0, blob.rotationY, 0]}
            scale={blob.scale}
          />
        ))}

        {fruit.map((f, i) => (
          <group key={`fruit-${i}`} position={f.position}>
            {/* Stem runs from the fruit up into its host clump */}
            <mesh
              geometry={unitCylinder}
              material={STEM}
              position={[0, f.scale * 0.6 + (f.stem + 0.6) / 2, 0]}
              scale={[0.05, f.stem + 0.6, 0.05]}
            />
            <mesh
              castShadow
              geometry={fruitGeometry}
              material={FRUIT}
              rotation={[0, hash01(seed + i + 61.3) * Math.PI, 0]}
              scale={f.scale}
            />
          </group>
        ))}
      </group>
    </group>
  );
}
