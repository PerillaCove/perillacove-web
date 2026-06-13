import { useLayoutEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { hash01, unitRock } from "./sharedAssets";
import {
  createFoliageGeometry,
  createGrassBladeGeometry,
  createTerrainGeometry,
  isInPond,
  terrainHeight,
} from "./organicGeometry";
import { useReducedMotionPref } from "./motion";

/**
 * Lush meadow floor: vertex-colored rolling terrain, thousands of
 * wind-blown instanced grass blades, scattered flowers, leafy shrub clumps,
 * and a few rocks. Grass wind is a tiny vertex-shader injection driven by a
 * shared time uniform — one draw call for the whole field.
 */

const GRASS_COUNT = 6200;
const FLOWER_COUNT = 320;
const SHRUB_COUNT = 170;
const ROCK_COUNT = 7;
const FIELD_RADIUS = 38;

const windUniform = { value: 0 };

const terrainMaterial = new THREE.MeshStandardMaterial({
  vertexColors: true,
  roughness: 1,
});

const grassMaterial = new THREE.MeshStandardMaterial({
  roughness: 1,
  side: THREE.DoubleSide,
});
grassMaterial.onBeforeCompile = (shader) => {
  shader.uniforms.uWindTime = windUniform;
  shader.vertexShader = shader.vertexShader
    .replace("#include <common>", "#include <common>\nuniform float uWindTime;")
    .replace(
      "#include <begin_vertex>",
      /* glsl */ `#include <begin_vertex>
      #ifdef USE_INSTANCING
        float windPhase = instanceMatrix[3][0] * 0.45 + instanceMatrix[3][2] * 0.7;
        float windBend = sin(uWindTime * 1.3 + windPhase) + sin(uWindTime * 0.7 + windPhase * 1.7) * 0.5;
        transformed.x += windBend * 0.05 * transformed.y;
        transformed.z += cos(uWindTime * 0.9 + windPhase) * 0.03 * transformed.y;
      #endif
      `,
    );
};
grassMaterial.customProgramCacheKey = () => "scene3d-grass-wind";

const flowerMaterial = new THREE.MeshStandardMaterial({ roughness: 0.8 });
const shrubMaterial = new THREE.MeshStandardMaterial({ roughness: 1 });
const rockMaterial = new THREE.MeshStandardMaterial({
  color: "#8a8474",
  roughness: 1,
  flatShading: true,
});

const GRASS_DARK = new THREE.Color("#3f7a2c");
const GRASS_LIGHT = new THREE.Color("#7fae3f");
const GRASS_WARM = new THREE.Color("#a3b54a");

const FLOWER_COLORS = [
  new THREE.Color("#fff6d8"),
  new THREE.Color("#f7d348"),
  new THREE.Color("#e8893a"),
  new THREE.Color("#fff6d8"),
  new THREE.Color("#f7d348"),
];

const SHRUB_DARK = new THREE.Color("#2e5e26");
const SHRUB_LIGHT = new THREE.Color("#4d8a33");

/** Deterministic disc scatter that stays out of the pond. */
const scatterPoint = (
  seed: number,
  maxRadius: number,
  pondMargin: number,
): [number, number] | null => {
  const angle = hash01(seed) * Math.PI * 2;
  const radius = Math.sqrt(hash01(seed + 0.17)) * maxRadius;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  if (isInPond(x, z, pondMargin)) return null;
  return [x, z];
};

export default function Ground() {
  const reduced = useReducedMotionPref();
  const terrainGeometry = useMemo(createTerrainGeometry, []);
  const bladeGeometry = useMemo(createGrassBladeGeometry, []);
  const flowerGeometry = useMemo(() => new THREE.IcosahedronGeometry(1, 0), []);
  const shrubGeometry = useMemo(() => createFoliageGeometry(31, 0.3), []);

  const grassRef = useRef<THREE.InstancedMesh>(null);
  const flowersRef = useRef<THREE.InstancedMesh>(null);
  const shrubsRef = useRef<THREE.InstancedMesh>(null);

  useFrame(({ clock }) => {
    if (reduced) return;
    windUniform.value = clock.elapsedTime;
  });

  useLayoutEffect(() => {
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    const grass = grassRef.current;
    if (grass) {
      let count = 0;
      for (let i = 0; i < GRASS_COUNT; i += 1) {
        const point = scatterPoint(i * 1.13, FIELD_RADIUS, 1.0);
        if (!point) continue;
        const [x, z] = point;

        dummy.position.set(x, terrainHeight(x, z) - 0.02, z);
        dummy.rotation.set(
          (hash01(i + 0.31) - 0.5) * 0.35,
          hash01(i + 0.57) * Math.PI * 2,
          (hash01(i + 0.79) - 0.5) * 0.45,
        );
        const height = 0.35 + hash01(i + 0.91) * 0.55;
        dummy.scale.set(0.9 + hash01(i + 1.7) * 0.8, height, 1);
        dummy.updateMatrix();
        grass.setMatrixAt(count, dummy.matrix);

        color.copy(GRASS_DARK).lerp(GRASS_LIGHT, hash01(i + 2.3));
        if (hash01(i + 3.7) < 0.12) color.lerp(GRASS_WARM, 0.7);
        grass.setColorAt(count, color);
        count += 1;
      }
      grass.count = count;
      grass.instanceMatrix.needsUpdate = true;
      if (grass.instanceColor) grass.instanceColor.needsUpdate = true;
    }

    const flowers = flowersRef.current;
    if (flowers) {
      let count = 0;
      for (let i = 0; i < FLOWER_COUNT; i += 1) {
        const point = scatterPoint(i * 7.31 + 100, FIELD_RADIUS * 0.92, 1.12);
        if (!point) continue;
        const [x, z] = point;

        dummy.position.set(
          x,
          terrainHeight(x, z) + 0.16 + hash01(i + 5.1) * 0.18,
          z,
        );
        dummy.rotation.set(0, 0, 0);
        const size = 0.035 + hash01(i + 6.3) * 0.035;
        dummy.scale.set(size, size, size);
        dummy.updateMatrix();
        flowers.setMatrixAt(count, dummy.matrix);
        flowers.setColorAt(
          count,
          FLOWER_COLORS[Math.floor(hash01(i + 8.9) * FLOWER_COLORS.length)],
        );
        count += 1;
      }
      flowers.count = count;
      flowers.instanceMatrix.needsUpdate = true;
      if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
    }

    const shrubs = shrubsRef.current;
    if (shrubs) {
      let count = 0;
      for (let i = 0; i < SHRUB_COUNT; i += 1) {
        const point = scatterPoint(i * 3.77 + 500, FIELD_RADIUS, 1.2);
        if (!point) continue;
        const [x, z] = point;

        const size = 0.35 + hash01(i + 11.3) * 0.6;
        dummy.position.set(x, terrainHeight(x, z) + size * 0.3, z);
        dummy.rotation.set(0, hash01(i + 13.1) * Math.PI * 2, 0);
        dummy.scale.set(size, size * 0.6, size);
        dummy.updateMatrix();
        shrubs.setMatrixAt(count, dummy.matrix);

        color.copy(SHRUB_DARK).lerp(SHRUB_LIGHT, hash01(i + 17.9));
        shrubs.setColorAt(count, color);
        count += 1;
      }
      shrubs.count = count;
      shrubs.instanceMatrix.needsUpdate = true;
      if (shrubs.instanceColor) shrubs.instanceColor.needsUpdate = true;
    }
  }, []);

  const rocks = useMemo(
    () =>
      Array.from({ length: ROCK_COUNT }, (_, i) => {
        const angle = hash01(i + 71.3) * Math.PI * 2;
        const radius = 8 + hash01(i + 73.9) * 22;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        if (isInPond(x, z, 1.15)) return null;
        return {
          position: [x, terrainHeight(x, z) + 0.08, z] as [
            number,
            number,
            number,
          ],
          rotation: [
            hash01(i + 79.1) * Math.PI,
            hash01(i + 83.3) * Math.PI,
            0,
          ] as [number, number, number],
          scale: 0.2 + hash01(i + 89.7) * 0.3,
        };
      }).filter((rock): rock is NonNullable<typeof rock> => rock !== null),
    [],
  );

  return (
    <group>
      <mesh
        geometry={terrainGeometry}
        material={terrainMaterial}
        receiveShadow
      />

      <instancedMesh
        ref={grassRef}
        args={[bladeGeometry, grassMaterial, GRASS_COUNT]}
        frustumCulled={false}
        receiveShadow
      />
      <instancedMesh
        ref={flowersRef}
        args={[flowerGeometry, flowerMaterial, FLOWER_COUNT]}
        frustumCulled={false}
      />
      <instancedMesh
        ref={shrubsRef}
        args={[shrubGeometry, shrubMaterial, SHRUB_COUNT]}
        frustumCulled={false}
        receiveShadow
      />

      {rocks.map((rock, i) => (
        <mesh
          key={i}
          castShadow
          geometry={unitRock}
          material={rockMaterial}
          position={rock.position}
          rotation={rock.rotation}
          scale={rock.scale}
        />
      ))}
    </group>
  );
}
