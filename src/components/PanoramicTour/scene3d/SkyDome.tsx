import { useMemo } from "react";
import * as THREE from "three";

const DOME_RADIUS = 170;

/**
 * Procedural golden-hour sky: warm horizon glow concentrated around the sun
 * direction blending to soft blue overhead, with a bright sun disc + halo.
 * Pure shader — no HDR/environment fetch.
 */
const createSkyMaterial = (sunDirection: THREE.Vector3) =>
  new THREE.ShaderMaterial({
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uSunDir: { value: sunDirection.clone().normalize() },
      uZenith: { value: new THREE.Color("#7fb6d9") },
      uHorizon: { value: new THREE.Color("#f6d9a0") },
      uSunGlow: { value: new THREE.Color("#ffdf9e") },
      uSunCore: { value: new THREE.Color("#fff4d6") },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uSunDir;
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uSunGlow;
      uniform vec3 uSunCore;
      varying vec3 vDir;

      void main() {
        vec3 dir = normalize(vDir);
        float elevation = clamp(dir.y, 0.0, 1.0);

        // Base vertical gradient: warm haze low, soft blue high.
        vec3 color = mix(uHorizon, uZenith, smoothstep(0.02, 0.5, elevation));

        // Warmth pooled around the sun's azimuth near the horizon.
        float sunAmount = max(dot(dir, uSunDir), 0.0);
        color = mix(color, uSunGlow, pow(sunAmount, 4.0) * (1.0 - smoothstep(0.0, 0.45, elevation)) * 0.85);

        // Halo + sun core.
        color += uSunGlow * pow(sunAmount, 24.0) * 0.55;
        color += uSunCore * pow(sunAmount, 320.0) * 1.6;

        // Slight ground-haze brightening right at the horizon line.
        color = mix(color, uHorizon, (1.0 - smoothstep(0.0, 0.08, abs(dir.y))) * 0.4);

        gl_FragColor = vec4(color, 1.0);
      }
    `,
  });

const cloudMaterial = new THREE.MeshBasicMaterial({
  color: "#fdeed8",
  transparent: true,
  opacity: 0.85,
  fog: false,
  depthWrite: false,
});

const cloudShadedMaterial = new THREE.MeshBasicMaterial({
  color: "#ecc9a2",
  transparent: true,
  opacity: 0.75,
  fog: false,
  depthWrite: false,
});

const cloudGeometry = new THREE.SphereGeometry(1, 10, 8);

interface CloudPuff {
  position: [number, number, number];
  scale: [number, number, number];
  shaded: boolean;
}

interface CloudSpec {
  position: [number, number, number];
  scale: number;
  puffs: CloudPuff[];
}

/** Hand-placed soft clouds clustered around the sunset side of the sky. */
const CLOUDS: CloudSpec[] = [
  {
    position: [55, 34, -135],
    scale: 1.4,
    puffs: [
      { position: [0, 0, 0], scale: [9, 2.6, 4], shaded: false },
      { position: [6.5, 1.4, 0], scale: [6, 2.2, 3.4], shaded: false },
      { position: [-6, -0.8, 0.5], scale: [5.5, 1.8, 3], shaded: true },
    ],
  },
  {
    position: [-32, 42, -140],
    scale: 1.1,
    puffs: [
      { position: [0, 0, 0], scale: [8, 2.2, 3.6], shaded: false },
      { position: [5, 1, 0], scale: [5, 1.8, 3], shaded: true },
    ],
  },
  {
    position: [16, 24, -148],
    scale: 1,
    puffs: [
      { position: [0, 0, 0], scale: [7, 1.8, 3], shaded: true },
      { position: [-4.5, 0.9, 0], scale: [4.6, 1.5, 2.6], shaded: false },
    ],
  },
  {
    position: [90, 46, -100],
    scale: 1.2,
    puffs: [
      { position: [0, 0, 0], scale: [7.5, 2.4, 3.6], shaded: false },
      { position: [5.5, -0.8, 0], scale: [5, 1.8, 3], shaded: true },
    ],
  },
];

interface SkyDomeProps {
  sunDirection: THREE.Vector3;
}

export default function SkyDome({ sunDirection }: SkyDomeProps) {
  const skyMaterial = useMemo(
    () => createSkyMaterial(sunDirection),
    [sunDirection],
  );

  return (
    <group>
      <mesh material={skyMaterial} frustumCulled={false} renderOrder={-10}>
        <sphereGeometry args={[DOME_RADIUS, 32, 20]} />
      </mesh>

      {CLOUDS.map((cloud, i) => (
        <group key={i} position={cloud.position} scale={cloud.scale}>
          {cloud.puffs.map((puff, j) => (
            <mesh
              key={j}
              geometry={cloudGeometry}
              material={puff.shaded ? cloudShadedMaterial : cloudMaterial}
              position={puff.position}
              scale={puff.scale}
            />
          ))}
        </group>
      ))}
    </group>
  );
}
