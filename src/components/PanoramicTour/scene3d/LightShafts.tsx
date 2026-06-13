import { useMemo } from "react";
import * as THREE from "three";

/**
 * Faked god rays: additive-blended gradient quads slanted through the left
 * tree cluster, like the light shafts in the panorama. Cheap, static, and
 * purely decorative.
 */
const shaftMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  side: THREE.DoubleSide,
  fog: false,
  uniforms: {
    uColor: { value: new THREE.Color("#ffe3a8") },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec3 uColor;
    varying vec2 vUv;
    void main() {
      // Bright at the top, fading down; soft side edges.
      float vertical = pow(vUv.y, 1.5);
      float horizontal = smoothstep(0.0, 0.3, vUv.x) * (1.0 - smoothstep(0.7, 1.0, vUv.x));
      gl_FragColor = vec4(uColor, vertical * horizontal * 0.14);
    }
  `,
});

interface ShaftSpec {
  position: [number, number, number];
  rotationY: number;
  lean: number;
  width: number;
  height: number;
}

const SHAFTS: ShaftSpec[] = [
  {
    position: [-19, 8, -7],
    rotationY: 0.15,
    lean: 0.34,
    width: 2.6,
    height: 17,
  },
  {
    position: [-15.5, 7.5, -5.5],
    rotationY: -0.1,
    lean: 0.3,
    width: 1.6,
    height: 15,
  },
  {
    position: [-11.5, 7, -7],
    rotationY: 0.2,
    lean: 0.36,
    width: 2.2,
    height: 15,
  },
  {
    position: [-7.5, 6.5, -4],
    rotationY: 0,
    lean: 0.3,
    width: 1.2,
    height: 13,
  },
  {
    position: [-4, 7, -6.5],
    rotationY: 0.25,
    lean: 0.33,
    width: 1.8,
    height: 14,
  },
  {
    position: [-1.5, 6, -3],
    rotationY: -0.12,
    lean: 0.28,
    width: 1,
    height: 12,
  },
];

export default function LightShafts() {
  const plane = useMemo(() => new THREE.PlaneGeometry(1, 1), []);

  return (
    <group>
      {SHAFTS.map((shaft, i) => (
        <mesh
          key={i}
          geometry={plane}
          material={shaftMaterial}
          position={shaft.position}
          rotation={[0, shaft.rotationY, shaft.lean]}
          scale={[shaft.width, shaft.height, 1]}
          renderOrder={5}
        />
      ))}
    </group>
  );
}
