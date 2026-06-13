import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";
import { clone as cloneSkeleton } from "three/examples/jsm/utils/SkeletonUtils.js";
import { type SpatialVolume } from "../spatial";
import {
  animalLifecycleOpacity,
  animalLifecycleScale,
  getGrazingMotionState,
  resolveSeparatedAnimalPositions,
  smoothAnimalPositions,
  type AnimalObstacle,
  type AnimalAnchor,
} from "./animalMotion";
import {
  getSpeciesConfig,
  type SpeciesSkeletalAnimationConfig,
} from "./SpeciesRenderConfig";
import { useTreeModel } from "./TreeModelLoader";
import { createGroundRaycaster } from "./useDragToReposition";

type AnimalAnimationMode = "walk" | "graze" | "idle" | "chew";

interface AnimationModeRef {
  current: AnimalAnimationMode;
}

interface AnimatedAnimalGroupProps {
  volumes: SpatialVolume[];
  isDarkMode: boolean;
  isSimulating?: boolean;
  onClick?: (ingredientId: string) => void;
  onHover?: (ingredientId: string | null) => void;
  groundRadius?: number;
  onDragStart?: () => void;
  onDragEnd?: (volumeId: string, position: { x: number; z: number }) => void;
  onHoverName?: (name: string | null) => void;
  obstacleVolumes?: SpatialVolume[];
}

function hashAngle(value: string): number {
  let h = 0;
  for (let c = 0; c < value.length; c++) {
    h = (h * 31 + value.charCodeAt(c)) | 0;
  }
  return ((Math.abs(h) % 10000) / 10000) * Math.PI * 2;
}

function resolveActionName(
  mode: AnimalAnimationMode,
  animationConfig: SpeciesSkeletalAnimationConfig,
  actions: Record<string, THREE.AnimationAction>,
): string | null {
  const clips = animationConfig.clips;
  const requested =
    mode === "walk"
      ? clips.walk
      : mode === "graze"
        ? clips.graze
        : mode === "chew"
          ? (clips.chew ?? clips.graze)
          : clips.idle;
  if (requested && actions[requested]) return requested;

  const fallbackNames = [
    clips.idle,
    clips.graze,
    clips.walk,
    clips.chew,
  ].filter(Boolean) as string[];
  return fallbackNames.find((name) => actions[name]) ?? null;
}

function applyOpacityToMaterial(
  material: THREE.Material | THREE.Material[],
  opacity: number,
) {
  const materials = Array.isArray(material) ? material : [material];
  for (const mat of materials) {
    const shouldBeTransparent = opacity < 0.995;
    if (mat.transparent !== shouldBeTransparent) {
      mat.transparent = shouldBeTransparent;
      mat.needsUpdate = true;
    }
    mat.opacity = opacity;
    mat.depthWrite = opacity > 0.25;
  }
}

function applyOpacityToScene(scene: THREE.Group, opacity: number) {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
      applyOpacityToMaterial(child.material, opacity);
    }
  });
}

function AnimatedAnimalModel({
  scene,
  animations,
  animationConfig,
  modeRef,
  index,
  opacity,
}: {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
  animationConfig: SpeciesSkeletalAnimationConfig;
  modeRef: AnimationModeRef;
  index: number;
  opacity: number;
}) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const actionsRef = useRef<Record<string, THREE.AnimationAction>>({});
  const currentActionNameRef = useRef<string | null>(null);
  const targetOpacityRef = useRef(opacity);
  const currentOpacityRef = useRef(opacity);

  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh || child instanceof THREE.SkinnedMesh) {
        child.material = Array.isArray(child.material)
          ? child.material.map((material) => material.clone())
          : child.material.clone();
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    applyOpacityToScene(scene, currentOpacityRef.current);

    const mixer = new THREE.AnimationMixer(scene);
    const actions: Record<string, THREE.AnimationAction> = {};
    for (const clip of animations) {
      actions[clip.name] = mixer.clipAction(clip);
    }

    mixerRef.current = mixer;
    actionsRef.current = actions;
    currentActionNameRef.current = null;

    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(scene);
      mixerRef.current = null;
      actionsRef.current = {};
      currentActionNameRef.current = null;
    };
  }, [animations, scene]);

  useEffect(() => {
    targetOpacityRef.current = opacity;
  }, [opacity]);

  useFrame((_, delta) => {
    const mixer = mixerRef.current;
    if (!mixer) return;

    const actions = actionsRef.current;
    const nextActionName = resolveActionName(
      modeRef.current,
      animationConfig,
      actions,
    );

    if (
      nextActionName &&
      nextActionName !== currentActionNameRef.current &&
      actions[nextActionName]
    ) {
      const previous = currentActionNameRef.current
        ? actions[currentActionNameRef.current]
        : null;
      const next = actions[nextActionName];
      next.enabled = true;
      next.timeScale =
        nextActionName === animationConfig.clips.walk ? 0.72 : 0.9;
      next.reset();
      next.time = (index * 0.41) % Math.max(next.getClip().duration, 0.1);
      next.fadeIn(0.25).play();
      previous?.fadeOut(0.2);
      currentActionNameRef.current = nextActionName;
    }

    mixer.update(delta);

    const opacityAlpha = 1 - Math.exp(-Math.max(0, delta) * 7);
    const nextOpacity =
      currentOpacityRef.current +
      (targetOpacityRef.current - currentOpacityRef.current) * opacityAlpha;
    if (Math.abs(nextOpacity - currentOpacityRef.current) > 0.001) {
      currentOpacityRef.current = nextOpacity;
      applyOpacityToScene(scene, nextOpacity);
    }
  });

  return <primitive object={scene} />;
}

export default function AnimatedAnimalGroup({
  volumes,
  isDarkMode,
  onClick,
  onHover,
  groundRadius: groundRadiusProp,
  onDragStart,
  onDragEnd,
  onHoverName,
  obstacleVolumes = [],
}: AnimatedAnimalGroupProps) {
  const representative = volumes[0];
  const speciesId =
    representative.sourceIngredientId ?? representative.ingredientId;
  const speciesConfig = getSpeciesConfig(speciesId);
  const animationConfig =
    speciesConfig?.animation?.mode === "skinned"
      ? speciesConfig.animation
      : null;
  const motion =
    speciesConfig?.motion?.kind === "graze" ? speciesConfig.motion : null;
  const { scene, animations } = useTreeModel(speciesId);

  const clonedScenes = useMemo(
    () =>
      volumes.map(() => (scene ? (cloneSkeleton(scene) as THREE.Group) : null)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scene, volumes.length],
  );
  const modeRefs = useMemo<AnimationModeRef[]>(
    () => volumes.map(() => ({ current: "idle" })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [volumes.length],
  );
  const instanceRefs = useRef<(THREE.Group | null)[]>([]);
  const lastRotationsRef = useRef<number[]>([]);
  const targetPositionsRef = useRef<AnimalAnchor[]>();
  const visualPositionsRef = useRef<AnimalAnchor[]>();
  const justDraggedRef = useRef(false);
  const dragInstanceIdxRef = useRef<number | null>(null);
  const dragOverridePosRef = useRef<{ x: number; z: number } | null>(null);
  const { camera, gl, events } = useThree();
  const raycastToGround = useMemo(
    () => createGroundRaycaster(camera, gl.domElement),
    [camera, gl],
  );

  const instanceAngles = useMemo(
    () => volumes.map((volume) => hashAngle(volume.ingredientId)),
    [volumes],
  );
  const obstacles = useMemo<AnimalObstacle[]>(
    () =>
      obstacleVolumes.map((volume) => ({
        x: volume.position.x,
        z: volume.position.z,
        radius: Math.max(
          1.8,
          Math.min(
            5.8,
            Math.max(volume.footprintRadius, volume.canopyRadius) * 0.68 + 1.4,
          ),
        ),
      })),
    [obstacleVolumes],
  );

  useFrame((state, delta) => {
    if (!animationConfig || !motion) return;
    const t = state.clock.elapsedTime;
    const minSeparation =
      animationConfig.minSeparation ?? motion.minSeparation ?? 2.4;
    const baseAnchors = volumes.map((volume, index) => {
      const isDragTarget =
        dragInstanceIdxRef.current === index && dragOverridePosRef.current;
      return isDragTarget
        ? dragOverridePosRef.current!
        : { x: volume.position.x, z: volume.position.z };
    });
    const motionStates = volumes.map((_, index) => {
      const isDragTarget =
        dragInstanceIdxRef.current === index && dragOverridePosRef.current;
      return isDragTarget
        ? {
            offset: { x: 0, z: 0 },
            nextOffset: { x: 0, z: 0 },
            isMoving: false,
          }
        : getGrazingMotionState(
            t,
            index,
            motion.radius,
            animationConfig.moveDurationSeconds,
            animationConfig.pauseDurationSeconds,
            instanceAngles[index],
          );
    });
    const resolvedPositions = resolveSeparatedAnimalPositions(
      baseAnchors,
      motionStates.map((motionState) => motionState.offset),
      minSeparation,
      motion.radius,
      obstacles,
    );
    const targetPositions = smoothAnimalPositions(
      targetPositionsRef.current,
      resolvedPositions,
      delta,
      9,
    );
    targetPositionsRef.current = targetPositions;
    const previousVisualPositions = visualPositionsRef.current;
    const maxVisualSpeed = Math.max(
      0.22,
      Math.min(0.4, motion.speed * motion.radius * 1.25),
    );
    const visualPositions = smoothAnimalPositions(
      previousVisualPositions,
      targetPositions,
      delta,
      6,
      maxVisualSpeed,
    );
    if (dragInstanceIdxRef.current != null && dragOverridePosRef.current) {
      const dragIndex = dragInstanceIdxRef.current;
      targetPositions[dragIndex] = resolvedPositions[dragIndex];
      visualPositions[dragIndex] = resolvedPositions[dragIndex];
    }
    visualPositionsRef.current = visualPositions;

    for (let index = 0; index < volumes.length; index++) {
      const group = instanceRefs.current[index];
      if (!group) continue;

      const volume = volumes[index];
      const isDragTarget =
        dragInstanceIdxRef.current === index && dragOverridePosRef.current;
      const py = isDragTarget ? 0.3 : 0;
      const targetPosition = targetPositions[index];
      const position = visualPositions[index];
      const previousPosition = previousVisualPositions?.[index] ?? position;
      const dx = position.x - previousPosition.x;
      const dz = position.z - previousPosition.z;
      const distanceToTarget = Math.hypot(
        targetPosition.x - position.x,
        targetPosition.z - position.z,
      );
      const isMoving =
        (motionStates[index].isMoving || distanceToTarget > 0.04) &&
        Math.hypot(dx, dz) > 0.001;
      const matureHeight = speciesConfig?.matureHeight ?? volume.heightRange[1];
      const breathe = Math.sin(t * 0.5 + volume.position.x) * 0.012;
      const growthScale = animalLifecycleScale(
        volume.ageYears,
        animationConfig.juvenileScale ?? 0.45,
        animationConfig.growthDurationYears ?? 3,
      );
      const scale = matureHeight * growthScale * (1 + breathe);

      group.position.set(position.x, py, position.z);
      group.scale.setScalar(scale);
      if (isMoving) {
        lastRotationsRef.current[index] = Math.atan2(dx, dz);
      } else if (lastRotationsRef.current[index] === undefined) {
        lastRotationsRef.current[index] = instanceAngles[index];
      }
      group.rotation.y =
        lastRotationsRef.current[index] +
        (animationConfig.headingOffsetRadians ?? 0);
      modeRefs[index].current = isMoving
        ? "walk"
        : index % 3 === 0 && animationConfig.clips.chew
          ? "chew"
          : index % 2 === 0
            ? "graze"
            : "idle";
    }
  });

  if (!scene || !animationConfig || !motion) return null;

  const handlePointerOver = (
    index: number,
    event: ThreeEvent<PointerEvent>,
  ) => {
    event.stopPropagation();
    onHover?.(speciesId);
    onHoverName?.(volumes[index].displayName);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = (event: ThreeEvent<PointerEvent>) => {
    event.stopPropagation();
    onHover?.(null);
    onHoverName?.(null);
    document.body.style.cursor = "";
  };

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (justDraggedRef.current) return;
    onClick?.(speciesId);
  };

  const handlePointerDown = (
    index: number,
    event: ThreeEvent<PointerEvent>,
  ) => {
    if (!onDragEnd) return;
    const startPos = {
      x: event.nativeEvent.clientX,
      y: event.nativeEvent.clientY,
    };
    const isTouchEvent = event.nativeEvent.pointerType === "touch";
    const delay = isTouchEvent ? 500 : 300;
    let holdFired = false;

    const timer = window.setTimeout(() => {
      holdFired = true;
      dragInstanceIdxRef.current = index;
      dragOverridePosRef.current = {
        x: volumes[index].position.x,
        z: volumes[index].position.z,
      };
      onDragStart?.();
      document.body.style.cursor = "grabbing";
    }, delay);

    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancel);
      window.removeEventListener("blur", onWindowBlur);
    };

    const onMove = (moveEvent: PointerEvent) => {
      if (!holdFired) {
        if (
          Math.hypot(
            moveEvent.clientX - startPos.x,
            moveEvent.clientY - startPos.y,
          ) > 5
        ) {
          window.clearTimeout(timer);
          cleanup();
        }
        return;
      }
      const pos = raycastToGround(
        moveEvent.clientX,
        moveEvent.clientY,
        groundRadiusProp ?? 20,
      );
      if (pos) dragOverridePosRef.current = pos;
    };

    const onUp = () => {
      window.clearTimeout(timer);
      if (holdFired && dragOverridePosRef.current != null) {
        const volumeId = volumes[dragInstanceIdxRef.current!].ingredientId;
        onDragEnd(volumeId, dragOverridePosRef.current);
        justDraggedRef.current = true;
        window.setTimeout(() => {
          justDraggedRef.current = false;
        }, 100);
        window.requestAnimationFrame(() => {
          events.update?.();
        });
      }
      document.body.style.cursor = "";
      dragInstanceIdxRef.current = null;
      dragOverridePosRef.current = null;
      cleanup();
    };

    const onCancel = () => {
      onUp();
    };

    const onWindowBlur = () => {
      onUp();
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel);
    window.addEventListener("blur", onWindowBlur);
  };

  return (
    <group>
      {clonedScenes.map((clonedScene, index) =>
        clonedScene ? (
          <group
            key={volumes[index].ingredientId}
            ref={(element) => {
              instanceRefs.current[index] = element;
            }}
            onClick={handleClick}
            onPointerDown={(event) => handlePointerDown(index, event)}
            onPointerOver={(event) => handlePointerOver(index, event)}
            onPointerOut={handlePointerOut}
          >
            <AnimatedAnimalModel
              scene={clonedScene}
              animations={animations}
              animationConfig={animationConfig}
              modeRef={modeRefs[index]}
              index={index}
              opacity={animalLifecycleOpacity(
                volumes[index].intensity,
                isDarkMode,
                volumes[index].ageYears,
                animationConfig.growthDurationYears ?? 3,
              )}
            />
          </group>
        ) : null,
      )}
    </group>
  );
}
