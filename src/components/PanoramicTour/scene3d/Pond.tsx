import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { POND } from "./layout";
import { terrainHeight } from "./organicGeometry";
import {
  GOLDEN_ANGLE,
  hash01,
  standardMaterial,
  unitCone,
} from "./sharedAssets";
import { useReducedMotionPref } from "./motion";

/**
 * Pond water: fresnel mix of deep water and warm sky reflection, animated
 * ripple normals, and a sun glint streak — all in one small shader, no
 * env-map fetch.
 */
const createWaterMaterial = (sunDirection: THREE.Vector3) =>
  new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uSunDir: { value: sunDirection.clone().normalize() },
      uDeep: { value: new THREE.Color("#28565e") },
      uShallow: { value: new THREE.Color("#5d9c93") },
      uSky: { value: new THREE.Color("#f4d49c") },
      uGlint: { value: new THREE.Color("#fff0c8") },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vWorldPos;
      void main() {
        vUv = uv;
        vec4 worldPos = modelMatrix * vec4(position, 1.0);
        vWorldPos = worldPos.xyz;
        gl_Position = projectionMatrix * viewMatrix * worldPos;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform vec3 uSunDir;
      uniform vec3 uDeep;
      uniform vec3 uShallow;
      uniform vec3 uSky;
      uniform vec3 uGlint;
      varying vec2 vUv;
      varying vec3 vWorldPos;

      void main() {
        // Distance from pond center in UV space (0 center, 1 rim).
        float rim = length(vUv - 0.5) * 2.0;

        // Animated ripple normal from layered moving waves.
        float r1 = sin(vWorldPos.x * 2.3 + uTime * 0.8)
                 + sin(vWorldPos.z * 3.1 - uTime * 0.6);
        float r2 = sin((vWorldPos.x + vWorldPos.z) * 1.7 + uTime * 1.1)
                 + sin((vWorldPos.x - vWorldPos.z) * 2.6 - uTime * 0.9);
        vec3 normal = normalize(vec3(r1 * 0.045, 1.0, r2 * 0.045));

        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 2.4);

        // Shallower, greener water toward the shore.
        vec3 color = mix(uDeep, uShallow, smoothstep(0.5, 1.0, rim) * 0.75);
        // Warm sky reflection.
        color = mix(color, uSky, clamp(fresnel * 0.85 + 0.12, 0.0, 1.0));

        // Sun glint sparkle.
        vec3 reflected = reflect(-viewDir, normal);
        float glint = pow(max(dot(reflected, uSunDir), 0.0), 90.0);
        color += uGlint * glint * 1.4;

        // Soft shoreline edge.
        float alpha = 0.94 * (1.0 - smoothstep(0.92, 1.0, rim));
        gl_FragColor = vec4(color, alpha);
      }
    `,
  });

const REED = standardMaterial("#5f7e35", { flatShading: true });
const REED_DRY = standardMaterial("#8d9450", { flatShading: true });
const LILY = standardMaterial("#3c6e33", { roughness: 0.6 });

const REED_COUNT = 34;
const LILY_COUNT = 6;

interface ReedSpec {
  position: [number, number, number];
  height: number;
  lean: number;
  rotationY: number;
  dry: boolean;
}

const buildReeds = (): ReedSpec[] =>
  Array.from({ length: REED_COUNT }, (_, i) => {
    const angle = i * GOLDEN_ANGLE * 1.7 + hash01(i + 0.3) * 0.5;
    // Sit on the shore ring just outside the water.
    const ring = 1.04 + hash01(i + 7.1) * 0.18;
    const x = POND.x + Math.cos(angle) * POND.radiusX * ring;
    const z = POND.z + Math.sin(angle) * POND.radiusZ * ring;
    return {
      position: [x, terrainHeight(x, z), z],
      height: 0.5 + hash01(i + 13.7) * 0.8,
      lean: (hash01(i + 23.9) - 0.5) * 0.5,
      rotationY: hash01(i + 31.3) * Math.PI * 2,
      dry: hash01(i + 41.7) < 0.35,
    };
  });

const buildLilies = (): {
  position: [number, number, number];
  scale: number;
}[] =>
  Array.from({ length: LILY_COUNT }, (_, i) => {
    const angle = i * GOLDEN_ANGLE * 2.3 + 0.8;
    const ring = 0.55 + hash01(i + 3.7) * 0.3;
    return {
      position: [
        POND.x + Math.cos(angle) * POND.radiusX * ring,
        POND.waterLevel + 0.02,
        POND.z + Math.sin(angle) * POND.radiusZ * ring,
      ],
      scale: 0.22 + hash01(i + 9.1) * 0.18,
    };
  });

interface PondProps {
  sunDirection: THREE.Vector3;
}

export default function Pond({ sunDirection }: PondProps) {
  const reduced = useReducedMotionPref();
  const waterMaterial = useMemo(
    () => createWaterMaterial(sunDirection),
    [sunDirection],
  );
  const reeds = useMemo(buildReeds, []);
  const lilies = useMemo(buildLilies, []);
  const reedsRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (reduced) return;
    waterMaterial.uniforms.uTime.value = clock.elapsedTime;
    // Reeds shiver gently together.
    if (reedsRef.current) {
      reedsRef.current.rotation.z = Math.sin(clock.elapsedTime * 0.7) * 0.012;
    }
  });

  return (
    <group>
      <mesh
        material={waterMaterial}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[POND.x, POND.waterLevel, POND.z]}
        scale={[POND.radiusX, POND.radiusZ, 1]}
        renderOrder={1}
      >
        <circleGeometry args={[1, 48]} />
      </mesh>

      <group ref={reedsRef}>
        {reeds.map((reed, i) => (
          <group
            key={i}
            position={reed.position}
            rotation={[0, reed.rotationY, reed.lean]}
          >
            <mesh
              geometry={unitCone}
              material={reed.dry ? REED_DRY : REED}
              position={[0, reed.height / 2, 0]}
              scale={[0.045, reed.height, 0.045]}
            />
            <mesh
              geometry={unitCone}
              material={reed.dry ? REED_DRY : REED}
              position={[0.08, (reed.height * 0.8) / 2, 0.04]}
              rotation={[0, 0, -0.18]}
              scale={[0.04, reed.height * 0.8, 0.04]}
            />
          </group>
        ))}
      </group>

      {lilies.map((lily, i) => (
        <mesh
          key={i}
          material={LILY}
          rotation={[-Math.PI / 2, 0, hash01(i + 51.3) * Math.PI * 2]}
          position={lily.position}
          scale={lily.scale}
          renderOrder={2}
        >
          <circleGeometry args={[1, 9, 0.5, Math.PI * 1.8]} />
        </mesh>
      ))}
    </group>
  );
}
