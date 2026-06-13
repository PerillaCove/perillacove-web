/**
 * THE BRIEF — how this 3D scene came to be (summarized from the author's
 * direction, kept here so the intent survives alongside the code):
 *
 * 1. ORIGINAL ASK — replace the image, change nothing else:
 *    Replace ONLY the sample-tropical panorama image (t_panorama_3.webp)
 *    with an explorable, from-scratch React Three Fiber scene depicting the
 *    exact same forest: durian + jackfruit canopy filtering light onto
 *    understory cacao; banana standing apart in direct sun; peanut and
 *    pigeon pea as ground cover; two cows. Subtle "alive" motion — cows
 *    slowly moving/grazing, gentle foliage sway. Everything around it stays
 *    identical: hotspot markers + behavior, HotspotDetailPanel (with its
 *    embedded Forest3D preview — untouched), tour mode, Gems button,
 *    ControlsLegend, immersive shell. Constrained orbit camera
 *    (rotate/pan/zoom with polar/distance limits). The preloaded panorama
 *    image shows instantly as a poster, then crossfades to the live scene.
 *    Built 100% from procedural/handcrafted geometry — NO reuse of the
 *    Forest3D GLB models or loaders, zero model downloads; the whole scene
 *    ships as a small lazy chunk. Scoped to sample-tropical only, architected
 *    as a third projection kind "scene3d".
 *
 * 2. REALISM PASS — "use my image as the inspiration":
 *    The first cut looked blocky (trees, grass, cows) and had no water.
 *    Direction: make it as realistic as possible and get as close to the
 *    panorama image as possible. The image is a painterly golden-hour
 *    illustration, so the scene targets that look: a pond right-of-center
 *    with ripples, sun glints, reeds and lily pads; a low sun over the pond;
 *    god-ray light shafts through the left tree grove; a dense background
 *    forest wall with an opening toward the sunset; lush rolling terrain
 *    with thousands of wind-blown grass blades, flowers, and shrubs;
 *    organic displaced-vertex canopies with hanging jackfruit/durian;
 *    ribbon-geometry banana leaves; rounded brown/tan cows (plus a third
 *    resting cow by the pond, like the image).
 *
 * 3. LIGHTING + POLISH PASS:
 *    - Lighting must be good but realistic — never murky. Looking into the
 *      sun can be dramatic/dark (that's beautiful, keep the visible sun),
 *      but the scene must read bright when it comes into focus → generous
 *      hemisphere/ambient/fill lights + tone-mapping exposure bump.
 *    - The scene OPENS on the sun view, then slowly rotates a full 360°
 *      around the forest to the better-lit side and back (INTRO_ORBIT_MS
 *      below; cancelled by any interaction, skipped for reduced motion).
 *    - Trees improved: smooth-welded foliage normals, denser domed canopies;
 *      fruit must not float — every fruit hangs from a stem rooted in a
 *      specific canopy clump or pressed against the trunk (cauliflory).
 *    - Banana trees and cow motion were approved as-is.
 *    - Cow hotspot dots adjusted slightly to sit ON the cows as they wander.
 *    - One-line escape hatch: SAMPLE_TROPICAL_USE_3D_SCENE in
 *      data/sampleTropical.ts flips the route back to the original flat
 *      panorama image viewer (the 3D chunk then never loads).
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { MapControls } from "@react-three/drei";
import * as THREE from "three";
import HotspotMarker from "../HotspotMarker";
import ControlsLegend from "../../ControlsLegend";
import type { ControlsLegendAction } from "../../ControlsLegend";
import {
  PT_HOTSPOT_BADGE_DOT_SHADOW,
  PT_HOTSPOT_DOT_BACKGROUND,
} from "../uiClasses";
import ForestScene from "./ForestScene";
import {
  SCENE_CAMERA,
  anchorKey,
  resolveHotspotAnchors,
  type HotspotAnchor,
} from "./layout";
import { prefersReducedMotion } from "./motion";

const CENTER_ANIMATE_MS = 460;
/** Intro reveal: one slow full orbit around the forest, starting (and ending)
 * on the sun-facing view. Cancelled by any interaction. */
const INTRO_ORBIT_MS = 36000;
const INTRO_ORBIT_RAD = Math.PI * 2;
const CLICK_GUARD_DELTA = 5;

export interface Scene3DViewerHotspot {
  id: string;
  speciesName: string;
  shortLabel: string;
  x: number;
  y: number;
}

export interface Scene3DFocusTarget {
  x: number;
  y?: number;
  hotspotId?: string;
}

export interface Scene3DViewerHandle {
  focusHotspot: (
    target: Scene3DFocusTarget,
    options?: { animate?: boolean },
  ) => void;
  resetView: () => void;
}

interface Scene3DViewerProps {
  imageSrc: string;
  hotspots: Scene3DViewerHotspot[];
  activeHotspotId?: string | null;
  onHotspotSelect?: (hotspotId: string) => void;
  onBackgroundSelect?: () => void;
  onCoordinatePick?: (point: {
    projection: "flat";
    x: number;
    y: number;
  }) => void;
  tourAction?: ControlsLegendAction | null;
  autoPanHint?: boolean;
  showControlsLegend?: boolean;
  className?: string;
}

interface ProjectedMarker {
  key: string;
  id: string;
  speciesName: string;
  shortLabel: string;
  x: number;
  y: number;
  visible: boolean;
}

interface MapControlsLike {
  target: THREE.Vector3;
  update: () => void;
}

const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) * 0.5;

const shallowMarkerListChanged = (
  previous: ProjectedMarker[],
  next: ProjectedMarker[],
): boolean => {
  if (previous.length !== next.length) return true;

  for (let idx = 0; idx < previous.length; idx += 1) {
    const a = previous[idx];
    const b = next[idx];
    if (
      a.key !== b.key ||
      a.visible !== b.visible ||
      Math.abs(a.x - b.x) > 0.2 ||
      Math.abs(a.y - b.y) > 0.2
    ) {
      return true;
    }
  }

  return false;
};

interface MarkerProjectorProps {
  hotspots: Scene3DViewerHotspot[];
  anchors: (HotspotAnchor | null)[];
  dynamicAnchors: Map<string, THREE.Vector3>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  onProjectedMarkersChange: (markers: ProjectedMarker[]) => void;
  onFirstFrame: () => void;
}

/**
 * Per-frame projection of anchor world positions to screen percent, with
 * epsilon-throttled React state updates (same pattern as the
 * equirectangular viewer's marker loop).
 */
function MarkerProjector({
  hotspots,
  anchors,
  dynamicAnchors,
  cameraRef,
  onProjectedMarkersChange,
  onFirstFrame,
}: MarkerProjectorProps) {
  const { camera } = useThree();
  const previousMarkersRef = useRef<ProjectedMarker[]>([]);
  const firstFrameRef = useRef(false);
  const directionRef = useRef(new THREE.Vector3());
  const toPointRef = useRef(new THREE.Vector3());
  const projectedRef = useRef(new THREE.Vector3());
  const pointRef = useRef(new THREE.Vector3());

  useEffect(() => {
    cameraRef.current = camera as THREE.PerspectiveCamera;
  }, [camera, cameraRef]);

  useFrame(() => {
    if (!firstFrameRef.current) {
      firstFrameRef.current = true;
      onFirstFrame();
    }

    camera.getWorldDirection(directionRef.current);

    const nextMarkers = hotspots.map((hotspot, index): ProjectedMarker => {
      const anchor = anchors[index];
      const key = anchor
        ? anchorKey(anchor.hotspotId, anchor.occurrenceIndex)
        : `${hotspot.id}:${index}`;

      if (!anchor) {
        return {
          key,
          id: hotspot.id,
          speciesName: hotspot.speciesName,
          shortLabel: hotspot.shortLabel,
          x: 0,
          y: 0,
          visible: false,
        };
      }

      const dynamic = dynamicAnchors.get(key);
      if (dynamic) {
        pointRef.current.copy(dynamic);
      } else {
        pointRef.current.set(...anchor.position);
      }

      toPointRef.current
        .copy(pointRef.current)
        .sub(camera.position)
        .normalize();
      const inFront = directionRef.current.dot(toPointRef.current) > 0;

      projectedRef.current.copy(pointRef.current).project(camera);
      const x = ((projectedRef.current.x + 1) / 2) * 100;
      const y = ((1 - projectedRef.current.y) / 2) * 100;

      return {
        key,
        id: hotspot.id,
        speciesName: hotspot.speciesName,
        shortLabel: hotspot.shortLabel,
        x,
        y,
        visible:
          inFront &&
          projectedRef.current.z >= -1 &&
          projectedRef.current.z <= 1 &&
          x >= 0 &&
          x <= 100 &&
          y >= 0 &&
          y <= 100,
      };
    });

    if (shallowMarkerListChanged(previousMarkersRef.current, nextMarkers)) {
      previousMarkersRef.current = nextMarkers;
      onProjectedMarkersChange(nextMarkers);
    }
  });

  return null;
}

const Scene3DViewer = forwardRef<Scene3DViewerHandle, Scene3DViewerProps>(
  function Scene3DViewer(
    {
      imageSrc,
      hotspots,
      activeHotspotId = null,
      onHotspotSelect,
      onBackgroundSelect,
      onCoordinatePick,
      tourAction = null,
      autoPanHint = true,
      showControlsLegend = true,
      className,
    },
    ref,
  ) {
    const [projectedMarkers, setProjectedMarkers] = useState<ProjectedMarker[]>(
      [],
    );
    const [isLocatorHovered, setIsLocatorHovered] = useState(false);
    const [isLocatorPinned, setIsLocatorPinned] = useState(false);
    const [sceneReady, setSceneReady] = useState(false);

    const controlsRef = useRef<MapControlsLike | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const animationRafRef = useRef<number | null>(null);
    const autoPanSetupRafRef = useRef<number | null>(null);
    const userInteractedRef = useRef(false);
    const autoPanCompleteRef = useRef(false);
    const dynamicAnchorsRef = useRef<Map<string, THREE.Vector3>>(new Map());

    const anchors = useMemo(() => resolveHotspotAnchors(hotspots), [hotspots]);

    const stopAnimation = useCallback(() => {
      if (animationRafRef.current !== null) {
        cancelAnimationFrame(animationRafRef.current);
        animationRafRef.current = null;
      }
    }, []);

    const stopAutoPanSetup = useCallback(() => {
      if (autoPanSetupRafRef.current !== null) {
        cancelAnimationFrame(autoPanSetupRafRef.current);
        autoPanSetupRafRef.current = null;
      }
    }, []);

    const handleInteractionStart = useCallback(() => {
      userInteractedRef.current = true;
      stopAnimation();
      stopAutoPanSetup();
    }, [stopAnimation, stopAutoPanSetup]);

    // rAF camera animation outside React, like EquirectangularViewer.animateYawPitch.
    const animateCamera = useCallback(
      (
        endTarget: THREE.Vector3,
        endPosition: THREE.Vector3,
        durationMs: number,
      ) => {
        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) return;

        stopAnimation();
        const startTarget = controls.target.clone();
        const startPosition = camera.position.clone();
        const startTime = performance.now();

        const tick = (now: number) => {
          const progress = Math.min(1, (now - startTime) / durationMs);
          const eased = easeInOutSine(progress);
          controls.target.lerpVectors(startTarget, endTarget, eased);
          camera.position.lerpVectors(startPosition, endPosition, eased);
          controls.update();

          if (progress < 1) {
            animationRafRef.current = requestAnimationFrame(tick);
          } else {
            animationRafRef.current = null;
          }
        };

        animationRafRef.current = requestAnimationFrame(tick);
      },
      [stopAnimation],
    );

    const resolveFocusIndex = useCallback(
      (target: Scene3DFocusTarget): number => {
        let bestIndex = -1;
        let bestScore = Infinity;

        hotspots.forEach((hotspot, index) => {
          if (target.hotspotId && hotspot.id !== target.hotspotId) return;
          if (!anchors[index]) return;

          // Disambiguate duplicate ids by nearest declared percent position.
          const dx = hotspot.x - target.x;
          const dy = target.y !== undefined ? hotspot.y - target.y : 0;
          const score = dx * dx + dy * dy;
          if (score < bestScore) {
            bestScore = score;
            bestIndex = index;
          }
        });

        return bestIndex;
      },
      [anchors, hotspots],
    );

    useImperativeHandle(
      ref,
      () => ({
        focusHotspot: (target, options) => {
          const index = resolveFocusIndex(target);
          const anchor = index >= 0 ? anchors[index] : null;
          if (!anchor) return;

          const camera = cameraRef.current;
          const controls = controlsRef.current;
          if (!camera || !controls) return;

          // Focus motion supersedes any in-flight auto-pan hint.
          autoPanCompleteRef.current = true;
          stopAutoPanSetup();

          const key = anchorKey(anchor.hotspotId, anchor.occurrenceIndex);
          const dynamic = dynamicAnchorsRef.current.get(key);
          const point = dynamic
            ? dynamic.clone()
            : new THREE.Vector3(...anchor.position);

          const distance = THREE.MathUtils.clamp(
            anchor.focusDistance ?? SCENE_CAMERA.defaultFocusDistance,
            SCENE_CAMERA.minDistance,
            SCENE_CAMERA.maxDistance,
          );
          const direction = camera.position.clone().sub(controls.target);
          if (direction.lengthSq() < 1e-6) {
            direction.set(0, 0.5, 1);
          }
          direction.normalize();
          const endPosition = point
            .clone()
            .add(direction.multiplyScalar(distance));

          if (options?.animate === false) {
            stopAnimation();
            controls.target.copy(point);
            camera.position.copy(endPosition);
            controls.update();
            return;
          }

          animateCamera(point, endPosition, CENTER_ANIMATE_MS);
        },
        resetView: () => {
          autoPanCompleteRef.current = true;
          stopAutoPanSetup();
          animateCamera(
            new THREE.Vector3(...SCENE_CAMERA.target),
            new THREE.Vector3(...SCENE_CAMERA.position),
            CENTER_ANIMATE_MS,
          );
        },
      }),
      [
        anchors,
        animateCamera,
        resolveFocusIndex,
        stopAnimation,
        stopAutoPanSetup,
      ],
    );

    // Intro orbit: once the scene is live, a slow full 360° revolution around
    // the forest — opens facing the sun, sweeps through the front-lit side,
    // and settles back home. Cancelled by any interaction or tour focus,
    // skipped for reduced motion.
    useEffect(() => {
      if (!autoPanHint || !sceneReady) return undefined;
      if (autoPanCompleteRef.current || userInteractedRef.current) {
        return undefined;
      }

      if (prefersReducedMotion()) {
        autoPanCompleteRef.current = true;
        return undefined;
      }

      let cancelled = false;
      const yAxis = new THREE.Vector3(0, 1, 0);

      const tryStart = () => {
        if (
          cancelled ||
          autoPanCompleteRef.current ||
          userInteractedRef.current
        ) {
          autoPanSetupRafRef.current = null;
          return;
        }

        const camera = cameraRef.current;
        const controls = controlsRef.current;
        if (!camera || !controls) {
          autoPanSetupRafRef.current = requestAnimationFrame(tryStart);
          return;
        }

        autoPanCompleteRef.current = true;
        autoPanSetupRafRef.current = null;

        const startOffset = camera.position.clone().sub(controls.target);
        const startTime = performance.now();

        const tick = (now: number) => {
          if (userInteractedRef.current) {
            animationRafRef.current = null;
            return;
          }

          const progress = Math.min(1, (now - startTime) / INTRO_ORBIT_MS);
          const eased = easeInOutSine(progress);
          const offset = startOffset
            .clone()
            .applyAxisAngle(yAxis, INTRO_ORBIT_RAD * eased);
          camera.position.copy(controls.target).add(offset);
          controls.update();

          if (progress < 1) {
            animationRafRef.current = requestAnimationFrame(tick);
          } else {
            animationRafRef.current = null;
          }
        };

        animationRafRef.current = requestAnimationFrame(tick);
      };

      autoPanSetupRafRef.current = requestAnimationFrame(tryStart);

      return () => {
        cancelled = true;
        stopAutoPanSetup();
      };
    }, [autoPanHint, sceneReady, stopAutoPanSetup]);

    useEffect(
      () => () => {
        stopAnimation();
        stopAutoPanSetup();
      },
      [stopAnimation, stopAutoPanSetup],
    );

    const handleSceneClick = useCallback(
      (event: ThreeEvent<MouseEvent>) => {
        if (event.delta > CLICK_GUARD_DELTA) return;
        handleInteractionStart();

        if (onCoordinatePick && cameraRef.current) {
          // Rough authoring aid: project the hit point to screen percent.
          const projected = event.point.clone().project(cameraRef.current);
          onCoordinatePick({
            projection: "flat",
            x: Number((((projected.x + 1) / 2) * 100).toFixed(2)),
            y: Number((((1 - projected.y) / 2) * 100).toFixed(2)),
          });
        }

        onBackgroundSelect?.();
      },
      [handleInteractionStart, onBackgroundSelect, onCoordinatePick],
    );

    const handleFirstFrame = useCallback(() => {
      setSceneReady(true);
    }, []);

    const visibleMarkers = useMemo(
      () => projectedMarkers.filter((marker) => marker.visible),
      [projectedMarkers],
    );
    const isSpeciesLocatorActive = isLocatorHovered || isLocatorPinned;
    const responsiveHeightClass = className
      ? ""
      : "h-[calc(100dvh-8.65rem)] md:h-auto";

    return (
      <div
        className={`relative z-10 min-h-0 flex-1 overflow-hidden rounded-2xl border border-emerald-200/25 bg-[rgba(5,11,8,0.88)] ${responsiveHeightClass} ${className ?? ""}`.trim()}
      >
        <div className="relative h-full w-full overflow-hidden">
          <Canvas
            className="h-full w-full touch-none"
            dpr={[1, 1.75]}
            shadows
            frameloop="always"
            gl={{ toneMappingExposure: 1.15 }}
            camera={{
              fov: SCENE_CAMERA.fov,
              near: 0.1,
              far: 400,
              position: SCENE_CAMERA.position,
            }}
            onPointerMissed={() => {
              onBackgroundSelect?.();
            }}
          >
            <ForestScene
              dynamicAnchors={dynamicAnchorsRef.current}
              onSceneClick={handleSceneClick}
            />

            <MarkerProjector
              hotspots={hotspots}
              anchors={anchors}
              dynamicAnchors={dynamicAnchorsRef.current}
              cameraRef={cameraRef}
              onProjectedMarkersChange={setProjectedMarkers}
              onFirstFrame={handleFirstFrame}
            />

            <MapControls
              ref={(instance) => {
                controlsRef.current = instance as MapControlsLike | null;
              }}
              target={SCENE_CAMERA.target}
              enablePan
              enableZoom
              enableRotate
              minDistance={SCENE_CAMERA.minDistance}
              maxDistance={SCENE_CAMERA.maxDistance}
              minPolarAngle={SCENE_CAMERA.minPolarAngle}
              maxPolarAngle={SCENE_CAMERA.maxPolarAngle}
              zoomSpeed={0.5}
              enableDamping
              dampingFactor={0.05}
              screenSpacePanning
              onStart={handleInteractionStart}
            />
          </Canvas>

          {/* Poster crossfade: the preloaded panorama shows instantly, then
              fades out once the live scene has painted its first frame. */}
          {imageSrc ? (
            <img
              src={imageSrc}
              alt=""
              aria-hidden="true"
              draggable={false}
              className={`pointer-events-none absolute inset-0 h-full w-full select-none object-cover transition-opacity duration-700 ease-out ${
                sceneReady ? "opacity-0" : "opacity-100"
              }`}
            />
          ) : null}

          <div
            className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ease-out ${
              sceneReady ? "opacity-100" : "opacity-0"
            }`}
          >
            {visibleMarkers.map((hotspot) => (
              <div key={hotspot.key} className="pointer-events-auto">
                <HotspotMarker
                  hotspot={hotspot}
                  isActive={hotspot.id === activeHotspotId}
                  isDimmed={false}
                  forceGlow={isSpeciesLocatorActive}
                  onSelect={(id) => {
                    userInteractedRef.current = true;
                    onHotspotSelect?.(id);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={`hide-feature absolute bottom-[calc(env(safe-area-inset-bottom)+0.75rem)] left-3 z-20 cursor-default rounded-lg border bg-[rgba(16,20,26,0.84)] px-2.5 py-1.5 lg:px-3 lg:py-1 text-neutral-100 shadow-lg backdrop-blur-md transition-colors md:bottom-auto md:left-4 md:top-4 md:rounded-xl  ${isSpeciesLocatorActive ? "border-red-300/75" : "border-red-400/35"}`}
          onPointerEnter={() => setIsLocatorHovered(true)}
          onPointerLeave={() => setIsLocatorHovered(false)}
          onFocus={() => setIsLocatorHovered(true)}
          onBlur={() => setIsLocatorHovered(false)}
          onPointerDown={(event) => {
            event.stopPropagation();
          }}
          onClick={(event) => {
            event.stopPropagation();
            setIsLocatorPinned((previous) => !previous);
          }}
          aria-label="Toggle gems highlight"
          aria-pressed={isLocatorPinned}
          title="Highlight all gems"
        >
          <div className="flex items-center gap-1.5 md:gap-2">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{
                background: PT_HOTSPOT_DOT_BACKGROUND,
                boxShadow: PT_HOTSPOT_BADGE_DOT_SHADOW,
              }}
              aria-hidden="true"
            />
            <span
              className="text-base leading-none text-white/92 md:text-lg"
              style={{ fontFamily: "'Cormorant Garamond', serif" }}
            >
              Gems
            </span>
          </div>
        </button>

        {showControlsLegend ? (
          <ControlsLegend
            className="absolute right-4 top-4 z-20"
            desktopHints={[
              {
                iconClassName: "fa-solid fa-arrows-up-down-left-right",
                label: "Drag to move, right-drag to orbit",
              },
              {
                iconClassName: "fa-solid fa-magnifying-glass-plus",
                label: "Scroll to zoom",
              },
            ]}
            mobileHints={[
              {
                iconClassName: "fa-solid fa-arrows-up-down-left-right",
                label: "Touch and drag to move view",
              },
              {
                iconClassName: "fa-solid fa-magnifying-glass-plus",
                label: "Pinch to zoom",
              },
            ]}
            action={tourAction}
          />
        ) : null}
      </div>
    );
  },
);

export default Scene3DViewer;
