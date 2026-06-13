import { useMemo, useRef } from "react";
import type * as THREE from "three";
import {
  hash01,
  standardMaterial,
  unitCone,
  unitCylinder,
} from "./sharedAssets";
import {
  createFoliageGeometry,
  createJackfruitGeometry,
  createTrunkGeometry,
} from "./organicGeometry";
import { useFoliageSway } from "./motion";

const BARK = standardMaterial("#6b4f33", { roughness: 1 });
const FOLIAGE_DEEP = standardMaterial("#356329", { roughness: 1 });
const FOLIAGE_MID = standardMaterial("#467e31", { roughness: 1 });
const FOLIAGE_SUNLIT = standardMaterial("#6ca73e", { roughness: 0.95 });
const FRUIT = standardMaterial("#b1a94e", { roughness: 0.9 });
const STEM = standardMaterial("#54422a", { roughness: 1 });

const BLOB_COUNT = 16;

interface BlobSpec {
  position: [number, number, number];
  scale: [number, number, number];
  rotationY: number;
  tier: number;
}

/** Broad domed canopy: central mass + a wide shell with drooping outer clumps. */
const buildCanopy = (seed: number): BlobSpec[] =>
  Array.from({ length: BLOB_COUNT }, (_, i) => {
    if (i === 0) {
      return {
        position: [0, 0.3, 0] as [number, number, number],
        scale: [2.9, 2.1, 2.9] as [number, number, number],
        rotationY: hash01(seed) * Math.PI * 2,
        tier: 1,
      };
    }
    const angle = (i / (BLOB_COUNT - 1)) * Math.PI * 2 + hash01(seed + i) * 0.7;
    const ring = 1.7 + hash01(seed + i + 3.3) * 1.9;
    const lift = hash01(seed + i + 7.7);
    const y = lift * 1.8 - (ring - 1.7) * 0.5 - 0.4;
    const size = 1.3 + hash01(seed + i + 11.3) * 1;
    return {
      position: [Math.cos(angle) * ring, y, Math.sin(angle) * ring],
      scale: [size, size * (0.66 + hash01(seed + i + 13.7) * 0.2), size],
      rotationY: hash01(seed + i + 17.1) * Math.PI * 2,
      tier: y > 0.8 ? 2 : y > -0.3 ? 1 : 0,
    };
  });

const TIER_MATERIALS = [FOLIAGE_DEEP, FOLIAGE_MID, FOLIAGE_SUNLIT];

interface TrunkFruitSpec {
  position: [number, number, number];
  scale: number;
  tilt: number;
}

/**
 * Cauliflorous fruit pressed against the trunk surface on short stems —
 * the trunk tapers from r≈0.72 at the base to r≈0.43 up top, so the ring
 * radius follows the taper to keep each fruit touching bark.
 */
const buildTrunkFruit = (seed: number): TrunkFruitSpec[] =>
  Array.from({ length: 3 }, (_, i) => {
    const y = 2.2 + i * 1.1 + hash01(seed + i + 23.1) * 0.5;
    const trunkRadius = 0.72 * (1 - (y / 7) * 0.4);
    const angle = hash01(seed + i + 29.3) * Math.PI * 2;
    const scale = 0.34 + hash01(seed + i + 41.3) * 0.12;
    return {
      position: [
        Math.cos(angle) * (trunkRadius + scale * 0.45),
        y,
        Math.sin(angle) * (trunkRadius + scale * 0.45),
      ],
      scale,
      tilt: (hash01(seed + i + 43.7) - 0.5) * 0.3,
    };
  });

interface CanopyFruitSpec {
  position: [number, number, number];
  scale: number;
  stem: number;
}

/** Big jackfruit hanging from the lowest canopy clumps, stems rooted in them. */
const buildCanopyFruit = (
  seed: number,
  canopy: BlobSpec[],
): CanopyFruitSpec[] => {
  const hosts = canopy
    .slice(1)
    .sort((a, b) => a.position[1] - b.position[1])
    .slice(0, 3);

  return hosts.map((blob, i) => {
    const scale = 0.4 + hash01(seed + i + 47.9) * 0.16;
    const stem = 0.25 + hash01(seed + i + 53.3) * 0.25;
    return {
      position: [
        blob.position[0],
        blob.position[1] - blob.scale[1] * 0.7 - stem - scale * 0.85,
        blob.position[2],
      ],
      scale,
      stem,
    };
  });
};

interface JackfruitTreeProps {
  position: [number, number, number];
  swayPhase?: number;
}

/** Massive broad-canopied jackfruit with fruit on the trunk and under the crown. */
export default function JackfruitTree({
  position,
  swayPhase = 0,
}: JackfruitTreeProps) {
  const foliageRef = useRef<THREE.Group>(null);
  useFoliageSway(foliageRef, swayPhase, 0.012);

  const seed = useMemo(() => Math.abs(swayPhase) * 17.3 + 2, [swayPhase]);
  const trunkGeometry = useMemo(() => createTrunkGeometry(seed), [seed]);
  const foliageGeometry = useMemo(
    () => createFoliageGeometry(seed + 0.5),
    [seed],
  );
  const fruitGeometry = useMemo(
    () => createJackfruitGeometry(seed + 1.5),
    [seed],
  );
  const canopy = useMemo(() => buildCanopy(seed), [seed]);
  const trunkFruit = useMemo(() => buildTrunkFruit(seed), [seed]);
  const canopyFruit = useMemo(
    () => buildCanopyFruit(seed, canopy),
    [seed, canopy],
  );

  return (
    <group position={position}>
      <mesh
        castShadow
        geometry={trunkGeometry}
        material={BARK}
        scale={[0.72, 7, 0.72]}
      />
      {/* Buttress roots */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i / 5) * Math.PI * 2 + hash01(seed + i + 51.7) * 0.7;
        return (
          <mesh
            key={i}
            castShadow
            geometry={unitCone}
            material={BARK}
            position={[Math.cos(angle) * 0.55, 0.6, Math.sin(angle) * 0.55]}
            rotation={[Math.sin(angle) * 0.4, 0, -Math.cos(angle) * 0.4]}
            scale={[0.34, 1.7, 0.6]}
          />
        );
      })}
      {/* Spreading limbs */}
      <mesh
        castShadow
        geometry={unitCylinder}
        material={BARK}
        position={[1.3, 6, 0.4]}
        rotation={[0, 0, -0.95]}
        scale={[0.22, 3.4, 0.22]}
      />
      <mesh
        castShadow
        geometry={unitCylinder}
        material={BARK}
        position={[-1.2, 6.3, -0.5]}
        rotation={[0.4, 0, 0.9]}
        scale={[0.2, 3.2, 0.2]}
      />
      <mesh
        castShadow
        geometry={unitCylinder}
        material={BARK}
        position={[0.2, 6.6, 1.2]}
        rotation={[-0.85, 0, -0.15]}
        scale={[0.18, 2.8, 0.18]}
      />

      <group ref={foliageRef} position={[0, 7.6, 0]}>
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

        {canopyFruit.map((f, i) => (
          <group key={`canopy-fruit-${i}`} position={f.position}>
            <mesh
              geometry={unitCylinder}
              material={STEM}
              position={[0, f.scale * 0.65 + (f.stem + 0.6) / 2, 0]}
              scale={[0.055, f.stem + 0.6, 0.055]}
            />
            <mesh
              castShadow
              geometry={fruitGeometry}
              material={FRUIT}
              rotation={[0, hash01(seed + i + 61.9) * Math.PI, 0.06]}
              scale={f.scale}
            />
          </group>
        ))}
      </group>

      {trunkFruit.map((f, i) => (
        <group key={`trunk-fruit-${i}`} position={f.position}>
          {/* Short stalk tying the fruit back into the trunk */}
          <mesh
            geometry={unitCylinder}
            material={STEM}
            position={[
              -f.position[0] * 0.18,
              f.scale * 0.75,
              -f.position[2] * 0.18,
            ]}
            rotation={[0.5, 0, 0.5]}
            scale={[0.04, 0.5, 0.04]}
          />
          <mesh
            castShadow
            geometry={fruitGeometry}
            material={FRUIT}
            rotation={[f.tilt, hash01(seed + i + 67.1) * Math.PI, f.tilt]}
            scale={f.scale}
          />
        </group>
      ))}
    </group>
  );
}
