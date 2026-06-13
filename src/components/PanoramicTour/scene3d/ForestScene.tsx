import { useMemo } from "react";
import type { ComponentType } from "react";
import type { ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import Ground from "./Ground";
import Pond from "./Pond";
import SkyDome from "./SkyDome";
import LightShafts from "./LightShafts";
import BackgroundForest from "./BackgroundForest";
import DurianTree from "./DurianTree";
import JackfruitTree from "./JackfruitTree";
import CacaoTree from "./CacaoTree";
import BananaPlant from "./BananaPlant";
import PeanutPatch from "./PeanutPatch";
import PigeonPeaShrub from "./PigeonPeaShrub";
import Cow from "./Cow";
import { SCENE_PLACEMENTS, anchorKey } from "./layout";
import { terrainHeight } from "./organicGeometry";

interface PlantProps {
  position: [number, number, number];
  swayPhase?: number;
}

const PLANT_COMPONENTS: Record<string, ComponentType<PlantProps>> = {
  durian: DurianTree,
  jackfruit: JackfruitTree,
  cacao: CacaoTree,
  banana: BananaPlant,
  peanut: PeanutPatch,
  pigeon_pea: PigeonPeaShrub,
};

/**
 * Low golden-hour sun over the pond clearing (back-right of the scene),
 * matching the panorama: the durian/jackfruit canopies throw long dappled
 * shade toward the understory cacao while the banana and pond clearing sit
 * in direct light.
 */
const SUN_DIRECTION = new THREE.Vector3(20, 13, -60).normalize();
const SUN_LIGHT_POSITION: [number, number, number] = [10, 6.5, -30];

/** Decorative backdrop trees framing the left like the panorama's grove. */
const DECOR_TREES: {
  kind: "durian" | "jackfruit";
  position: [number, number, number];
  scale: number;
  swayPhase: number;
}[] = [
  { kind: "durian", position: [-21, 0, -10], scale: 1.15, swayPhase: 2.4 },
  { kind: "jackfruit", position: [-9, 0, -12], scale: 1.05, swayPhase: 4.8 },
  { kind: "durian", position: [-17, 0, 3], scale: 0.9, swayPhase: 7.1 },
  { kind: "jackfruit", position: [-25, 0, -2], scale: 0.95, swayPhase: 9.7 },
  { kind: "durian", position: [-3, 0, -13], scale: 1.1, swayPhase: 12.3 },
];

const onGround = (x: number, z: number): [number, number, number] => [
  x,
  terrainHeight(x, z),
  z,
];

interface ForestSceneProps {
  /** Live anchor positions for moving elements (cows), keyed by anchorKey. */
  dynamicAnchors: Map<string, THREE.Vector3>;
  /** Click on any scene mesh (ground or plant) — guarded by the viewer. */
  onSceneClick?: (event: ThreeEvent<MouseEvent>) => void;
}

export default function ForestScene({
  dynamicAnchors,
  onSceneClick,
}: ForestSceneProps) {
  const decorTrees = useMemo(
    () =>
      DECOR_TREES.map((tree) => ({
        ...tree,
        position: onGround(tree.position[0], tree.position[2]),
      })),
    [],
  );

  return (
    <>
      <fog attach="fog" args={["#d9e3b8", 55, 150]} />

      <SkyDome sunDirection={SUN_DIRECTION} />

      {/* Golden-hour key light + generous warm sky fill: the sun stays
          dramatic but no side of the scene falls into murk. */}
      <hemisphereLight args={["#ffe9c8", "#4d7440", 0.85]} />
      <ambientLight intensity={0.34} color="#fbf2df" />
      <directionalLight
        castShadow
        position={SUN_LIGHT_POSITION}
        intensity={1.6}
        color="#ffd9a3"
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-36}
        shadow-camera-right={36}
        shadow-camera-top={36}
        shadow-camera-bottom={-36}
        shadow-camera-near={1}
        shadow-camera-far={90}
        shadow-bias={-0.0006}
        shadow-normalBias={0.4}
      />
      {/* Soft fill from the camera side so backlit faces stay readable */}
      <directionalLight
        position={[-14, 12, 26]}
        intensity={0.55}
        color="#c4d6ea"
      />
      <directionalLight
        position={[26, 10, 14]}
        intensity={0.3}
        color="#ffe3b8"
      />

      <group onClick={onSceneClick}>
        <Ground />
        <Pond sunDirection={SUN_DIRECTION} />
        <BackgroundForest />

        {SCENE_PLACEMENTS.map((placement, index) => {
          if (!placement.hotspotId) return null;

          const occurrenceIndex = SCENE_PLACEMENTS.slice(0, index).filter(
            (other) => other.hotspotId === placement.hotspotId,
          ).length;
          const key = anchorKey(placement.hotspotId, occurrenceIndex);
          // Deterministic per-element phase so sway/graze cycles never sync.
          const phase =
            placement.position[0] * 0.7 + placement.position[2] * 1.3;

          if (placement.hotspotId === "cow") {
            return (
              <Cow
                key={key}
                position={placement.position}
                phase={phase}
                tint={occurrenceIndex === 0 ? "brown" : "tan"}
                markerHeight={placement.markerOffset[1]}
                anchorKey={key}
                dynamicAnchors={dynamicAnchors}
              />
            );
          }

          const Plant = PLANT_COMPONENTS[placement.hotspotId];
          if (!Plant) return null;

          return (
            <Plant
              key={key}
              position={onGround(placement.position[0], placement.position[2])}
              swayPhase={phase}
            />
          );
        })}

        {/* Decorative grove framing the left edge */}
        {decorTrees.map((tree, i) =>
          tree.kind === "durian" ? (
            <group
              key={`decor-${i}`}
              position={tree.position}
              scale={tree.scale}
            >
              <DurianTree position={[0, 0, 0]} swayPhase={tree.swayPhase} />
            </group>
          ) : (
            <group
              key={`decor-${i}`}
              position={tree.position}
              scale={tree.scale}
            >
              <JackfruitTree position={[0, 0, 0]} swayPhase={tree.swayPhase} />
            </group>
          ),
        )}

        {/* Banana stand on the pond's far side, like the panorama */}
        <group position={onGround(4.5, -7)} scale={0.85}>
          <BananaPlant position={[0, 0, 0]} swayPhase={6.2} />
        </group>

        {/* Third cow resting in the grass near the pond */}
        <Cow position={[2, 0, 2.2]} phase={5.3} tint="tan" resting />
      </group>

      {/* God rays slanting through the left grove */}
      <LightShafts />
    </>
  );
}
