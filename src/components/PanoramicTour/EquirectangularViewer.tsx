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
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import HotspotMarker from "./HotspotMarker";
import ControlsLegend from "../ControlsLegend";
import type { ControlsLegendAction } from "../ControlsLegend";
import {
  cartesianToYawPitch,
  clampPitch,
  normalizeYaw,
  percentToYawPitch,
  yawPitchToCartesian,
  yawPitchToPercent,
} from "./sphericalMath";
import {
  PT_HOTSPOT_BADGE_DOT_SHADOW,
  PT_HOTSPOT_DOT_BACKGROUND,
} from "./uiClasses";
import type { PickedCoordinate, TourHotspotV2 } from "./types";

const CAMERA_RADIUS = 0.1;
const SPHERE_RADIUS = 500;
const CENTER_ANIMATE_MS = 460;
const AUTO_PAN_MS = 5600;
const AUTO_PAN_TARGET_BLEND = 0.72;
const AUTO_PAN_MAX_YAW_DELTA = 72;
const AUTO_PAN_MAX_PITCH_DELTA = 12;
const AUTO_PAN_FALLBACK_TARGET = { yaw: -16, pitch: 0 };
const CLICK_GUARD_DELTA = 5;
const MIN_POLAR_ANGLE = THREE.MathUtils.degToRad(5);
const MAX_POLAR_ANGLE = THREE.MathUtils.degToRad(175);

interface EquirectangularViewerProps {
  imageSrc: string;
  hotspots: TourHotspotV2[];
  activeHotspotId?: string | null;
  onHotspotSelect?: (hotspotId: string) => void;
  onBackgroundSelect?: () => void;
  onCoordinatePick?: (point: PickedCoordinate) => void;
  tourAction?: ControlsLegendAction | null;
  autoPanHint?: boolean;
  showControlsLegend?: boolean;
  className?: string;
}

interface ProjectedMarker {
  id: string;
  speciesName: string;
  shortLabel: string;
  x: number;
  y: number;
  visible: boolean;
}

interface OrbitControlsLike {
  autoRotate: boolean;
  autoRotateSpeed: number;
  target: THREE.Vector3;
  update: () => void;
}

interface EquirectangularSceneProps {
  imageSrc: string;
  hotspots: TourHotspotV2[];
  controlsRef: React.MutableRefObject<OrbitControlsLike | null>;
  cameraRef: React.MutableRefObject<THREE.PerspectiveCamera | null>;
  meshRef: React.MutableRefObject<THREE.Mesh | null>;
  onProjectedMarkersChange: (markers: ProjectedMarker[]) => void;
  onBackgroundClick: (point: PickedCoordinate) => void;
  onInteractionStart: () => void;
}

export interface EquirectangularViewerHandle {
  focusHotspot: (
    yaw: number,
    pitch: number,
    options?: { animate?: boolean },
  ) => void;
  resetView: () => void;
}

const shallowMarkerListChanged = (
  previous: ProjectedMarker[],
  next: ProjectedMarker[],
): boolean => {
  if (previous.length !== next.length) return true;

  for (let idx = 0; idx < previous.length; idx += 1) {
    const a = previous[idx];
    const b = next[idx];
    if (
      a.id !== b.id ||
      a.visible !== b.visible ||
      Math.abs(a.x - b.x) > 0.2 ||
      Math.abs(a.y - b.y) > 0.2
    ) {
      return true;
    }
  }

  return false;
};

function EquirectangularScene({
  imageSrc,
  hotspots,
  controlsRef,
  cameraRef,
  meshRef,
  onProjectedMarkersChange,
  onBackgroundClick,
  onInteractionStart,
}: EquirectangularSceneProps) {
  const texture = useMemo(() => {
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    const loaded = loader.load(imageSrc);
    loaded.colorSpace = THREE.SRGBColorSpace;
    loaded.minFilter = THREE.LinearFilter;
    loaded.magFilter = THREE.LinearFilter;
    return loaded;
  }, [imageSrc]);
  const { camera } = useThree();
  const previousMarkersRef = useRef<ProjectedMarker[]>([]);
  const directionRef = useRef(new THREE.Vector3());
  const toPointRef = useRef(new THREE.Vector3());
  const projectedRef = useRef(new THREE.Vector3());
  const pointRef = useRef(new THREE.Vector3());

  useEffect(() => {
    cameraRef.current = camera as THREE.PerspectiveCamera;
  }, [camera, cameraRef]);

  useEffect(() => {
    return () => {
      texture.dispose();
    };
  }, [texture]);

  useFrame(() => {
    const activeCamera = cameraRef.current;
    if (!activeCamera) return;

    activeCamera.getWorldDirection(directionRef.current);
    const nextMarkers = hotspots.map((hotspot): ProjectedMarker => {
      const position =
        hotspot.position.projection === "equirectangular"
          ? hotspot.position
          : percentToYawPitch(hotspot.position.x, hotspot.position.y);
      const cartesian = yawPitchToCartesian(
        position.yaw,
        position.pitch,
        SPHERE_RADIUS,
      );
      pointRef.current.set(cartesian.x, cartesian.y, cartesian.z);

      toPointRef.current
        .copy(pointRef.current)
        .sub(activeCamera.position)
        .normalize();
      const inFront = directionRef.current.dot(toPointRef.current) > 0;

      projectedRef.current.copy(pointRef.current).project(activeCamera);
      const x = ((projectedRef.current.x + 1) / 2) * 100;
      const y = ((1 - projectedRef.current.y) / 2) * 100;

      return {
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

  return (
    <>
      <mesh
        ref={meshRef}
        onClick={(event) => {
          if (event.delta > CLICK_GUARD_DELTA) return;
          onInteractionStart();
          const { yaw, pitch } = cartesianToYawPitch(
            event.point.x,
            event.point.y,
            event.point.z,
          );
          const percent = yawPitchToPercent(yaw, pitch);
          onBackgroundClick({
            projection: "equirectangular",
            yaw: Number(yaw.toFixed(2)),
            pitch: Number(pitch.toFixed(2)),
            x: Number(percent.x.toFixed(2)),
            y: Number(percent.y.toFixed(2)),
          });
        }}
      >
        <sphereGeometry args={[SPHERE_RADIUS, 128, 96]} />
        <meshBasicMaterial map={texture} side={THREE.BackSide} />
      </mesh>

      <OrbitControls
        ref={(instance) => {
          controlsRef.current = instance as OrbitControlsLike | null;
        }}
        enablePan={false}
        enableDamping
        dampingFactor={0.09}
        rotateSpeed={0.4}
        zoomSpeed={0.7}
        minDistance={CAMERA_RADIUS * 0.8}
        maxDistance={CAMERA_RADIUS * 2.4}
        minPolarAngle={MIN_POLAR_ANGLE}
        maxPolarAngle={MAX_POLAR_ANGLE}
        onStart={onInteractionStart}
      />
    </>
  );
}

const easeInOutSine = (t: number): number => -(Math.cos(Math.PI * t) - 1) * 0.5;

const toOrbitAngles = (
  yaw: number,
  pitch: number,
): { azimuth: number; polar: number } => {
  const clampedPitch = clampPitch(pitch);
  const azimuth = THREE.MathUtils.degToRad(-normalizeYaw(yaw));
  const polar = THREE.MathUtils.clamp(
    Math.PI / 2 + THREE.MathUtils.degToRad(clampedPitch),
    MIN_POLAR_ANGLE,
    MAX_POLAR_ANGLE,
  );
  return { azimuth, polar };
};

const orbitAnglesToCameraPosition = (
  azimuth: number,
  polar: number,
  radius: number,
): THREE.Vector3 => {
  const sinPolar = Math.sin(polar);
  return new THREE.Vector3(
    radius * sinPolar * Math.sin(azimuth),
    radius * Math.cos(polar),
    radius * sinPolar * Math.cos(azimuth),
  );
};

const resolveAutoPanTarget = (
  hotspots: TourHotspotV2[],
): { yaw: number; pitch: number } => {
  if (hotspots.length === 0) {
    return AUTO_PAN_FALLBACK_TARGET;
  }

  let sumYawSin = 0;
  let sumYawCos = 0;
  let sumPitch = 0;
  let samples = 0;

  for (const hotspot of hotspots) {
    const position =
      hotspot.position.projection === "equirectangular"
        ? hotspot.position
        : percentToYawPitch(hotspot.position.x, hotspot.position.y);
    const yawRad = THREE.MathUtils.degToRad(normalizeYaw(position.yaw));

    sumYawSin += Math.sin(yawRad);
    sumYawCos += Math.cos(yawRad);
    sumPitch += position.pitch;
    samples += 1;
  }

  if (
    samples === 0 ||
    (Math.abs(sumYawSin) < 1e-6 && Math.abs(sumYawCos) < 1e-6)
  ) {
    return AUTO_PAN_FALLBACK_TARGET;
  }

  return {
    yaw: normalizeYaw(
      THREE.MathUtils.radToDeg(Math.atan2(sumYawSin, sumYawCos)),
    ),
    pitch: clampPitch(sumPitch / samples),
  };
};

const EquirectangularViewer = forwardRef<
  EquirectangularViewerHandle,
  EquirectangularViewerProps
>(function EquirectangularViewer(
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
  const controlsRef = useRef<OrbitControlsLike | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationRafRef = useRef<number | null>(null);
  const autoPanSetupRafRef = useRef<number | null>(null);
  const userInteractedRef = useRef(false);
  const autoPanCompleteRef = useRef(false);
  const autoPanTarget = useMemo(
    () => resolveAutoPanTarget(hotspots),
    [hotspots],
  );

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

  const applyYawPitch = useCallback((yaw: number, pitch: number) => {
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    if (!camera || !controls) return;

    const radius = Math.max(camera.position.length(), CAMERA_RADIUS);
    const angles = toOrbitAngles(yaw, pitch);
    const targetPosition = orbitAnglesToCameraPosition(
      angles.azimuth,
      angles.polar,
      radius,
    );

    camera.position.copy(targetPosition);
    camera.lookAt(0, 0, 0);
    controls.target.set(0, 0, 0);
    controls.update();
  }, []);

  const animateYawPitch = useCallback(
    (yaw: number, pitch: number, durationMs: number) => {
      const camera = cameraRef.current;
      const controls = controlsRef.current;
      if (!camera || !controls) return;

      stopAnimation();
      const startPosition = camera.position.clone();
      const radius = Math.max(camera.position.length(), CAMERA_RADIUS);
      const angles = toOrbitAngles(yaw, pitch);
      const endPosition = orbitAnglesToCameraPosition(
        angles.azimuth,
        angles.polar,
        radius,
      );
      const startTime = performance.now();

      const tick = (now: number) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = easeInOutSine(progress);
        camera.position.lerpVectors(startPosition, endPosition, eased);
        camera.lookAt(0, 0, 0);
        controls.target.set(0, 0, 0);
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

  useImperativeHandle(
    ref,
    () => ({
      focusHotspot: (yaw, pitch, options) => {
        if (options?.animate === false) {
          applyYawPitch(yaw, pitch);
          return;
        }
        animateYawPitch(yaw, pitch, CENTER_ANIMATE_MS);
      },
      resetView: () => {
        applyYawPitch(0, 0);
      },
    }),
    [animateYawPitch, applyYawPitch],
  );

  useEffect(() => {
    stopAutoPanSetup();
    stopAnimation();
    applyYawPitch(0, 0);
    userInteractedRef.current = false;
    autoPanCompleteRef.current = false;
  }, [applyYawPitch, imageSrc, stopAnimation, stopAutoPanSetup]);

  useEffect(() => {
    if (!autoPanHint || typeof window === "undefined") return undefined;
    if (autoPanCompleteRef.current || userInteractedRef.current) {
      return undefined;
    }

    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) {
      autoPanCompleteRef.current = true;
      return undefined;
    }

    let cancelled = false;

    const tryStart = () => {
      if (
        cancelled ||
        autoPanCompleteRef.current ||
        userInteractedRef.current
      ) {
        autoPanSetupRafRef.current = null;
        return;
      }

      if (!cameraRef.current || !controlsRef.current) {
        autoPanSetupRafRef.current = requestAnimationFrame(tryStart);
        return;
      }

      autoPanCompleteRef.current = true;
      autoPanSetupRafRef.current = null;
      const targetYaw = normalizeYaw(
        THREE.MathUtils.clamp(
          autoPanTarget.yaw * AUTO_PAN_TARGET_BLEND,
          -AUTO_PAN_MAX_YAW_DELTA,
          AUTO_PAN_MAX_YAW_DELTA,
        ),
      );
      const targetPitch = clampPitch(
        THREE.MathUtils.clamp(
          autoPanTarget.pitch * AUTO_PAN_TARGET_BLEND,
          -AUTO_PAN_MAX_PITCH_DELTA,
          AUTO_PAN_MAX_PITCH_DELTA,
        ),
      );

      animateYawPitch(targetYaw, targetPitch, AUTO_PAN_MS);
    };

    autoPanSetupRafRef.current = requestAnimationFrame(tryStart);

    return () => {
      cancelled = true;
      stopAutoPanSetup();
    };
  }, [animateYawPitch, autoPanHint, autoPanTarget, imageSrc, stopAutoPanSetup]);

  useEffect(
    () => () => {
      stopAnimation();
      stopAutoPanSetup();
    },
    [stopAnimation, stopAutoPanSetup],
  );

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
          camera={{
            fov: 75,
            near: 0.01,
            far: SPHERE_RADIUS * 3,
            position: [0, 0, CAMERA_RADIUS],
          }}
          onPointerMissed={() => {
            onBackgroundSelect?.();
          }}
        >
          <EquirectangularScene
            imageSrc={imageSrc}
            hotspots={hotspots}
            controlsRef={controlsRef}
            cameraRef={cameraRef}
            meshRef={meshRef}
            onProjectedMarkersChange={setProjectedMarkers}
            onBackgroundClick={(point) => {
              onCoordinatePick?.(point);
              onBackgroundSelect?.();
            }}
            onInteractionStart={() => {
              userInteractedRef.current = true;
              stopAnimation();
              stopAutoPanSetup();
            }}
          />
        </Canvas>

        <div className="pointer-events-none absolute inset-0">
          {visibleMarkers.map((hotspot) => (
            <div key={hotspot.id} className="pointer-events-auto">
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
              iconClassName: "fa-solid fa-arrows-rotate",
              label: "Click and drag to look around",
            },
            {
              iconClassName: "fa-solid fa-magnifying-glass-plus",
              label: "Scroll to zoom",
            },
          ]}
          mobileHints={[
            {
              iconClassName: "fa-solid fa-arrows-rotate",
              label: "Touch and drag to look around",
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
});

export default EquirectangularViewer;
