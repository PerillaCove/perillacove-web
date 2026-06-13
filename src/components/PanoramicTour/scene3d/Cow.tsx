import { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  standardMaterial,
  unitCone,
  unitCylinder,
  unitSphere,
} from "./sharedAssets";
import { terrainHeight } from "./organicGeometry";
import { useReducedMotionPref } from "./motion";

const TINTS = {
  brown: {
    hide: standardMaterial("#9a6334", { roughness: 0.95 }),
    accent: standardMaterial("#7d4e26", { roughness: 0.95 }),
    muzzle: standardMaterial("#c9a06b", { roughness: 0.9 }),
  },
  tan: {
    hide: standardMaterial("#c49a62", { roughness: 0.95 }),
    accent: standardMaterial("#a87f4c", { roughness: 0.95 }),
    muzzle: standardMaterial("#e3cb9e", { roughness: 0.9 }),
  },
} as const;

const HOOF = standardMaterial("#3c322a", { roughness: 0.95 });
const HORN = standardMaterial("#d8cdb2", { roughness: 0.8 });

interface CowProps {
  position: [number, number, number];
  /** Per-cow phase so the cows never move in sync. */
  phase: number;
  tint?: keyof typeof TINTS;
  /** Resting cows lie in the grass: no wander, legs tucked. */
  resting?: boolean;
  /** Radius of the slow graze wander around the base position. */
  grazeRadius?: number;
  /** Marker anchor height above the cow's ground position. */
  markerHeight?: number;
  /** Key into dynamicAnchors (e.g. "cow:0") so its marker tracks it per frame. */
  anchorKey?: string;
  /** Mutable map of live anchor world positions, owned by the viewer. */
  dynamicAnchors?: Map<string, THREE.Vector3>;
}

/**
 * Rounded low-poly cow built from overlapping spheres (chest/belly/hip) so
 * the silhouette reads organic. Wanders slowly over the terrain, bobs, dips
 * its head to graze, flicks ears and tail — all procedural sin/cos drift.
 */
export default function Cow({
  position,
  phase,
  tint = "brown",
  resting = false,
  grazeRadius = 1.2,
  markerHeight = 1.8,
  anchorKey,
  dynamicAnchors,
}: CowProps) {
  const rootRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const neckRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);
  const earLeftRef = useRef<THREE.Mesh>(null);
  const earRightRef = useRef<THREE.Mesh>(null);
  const reduced = useReducedMotionPref();
  const worldPosRef = useRef(new THREE.Vector3());

  const materials = TINTS[tint];

  const writeAnchor = (root: THREE.Group) => {
    if (!anchorKey || !dynamicAnchors) return;
    root.getWorldPosition(worldPosRef.current);
    let anchor = dynamicAnchors.get(anchorKey);
    if (!anchor) {
      anchor = new THREE.Vector3();
      dynamicAnchors.set(anchorKey, anchor);
    }
    anchor.copy(worldPosRef.current);
    anchor.y += markerHeight;
  };

  useEffect(() => {
    if (!anchorKey || !dynamicAnchors) return undefined;
    const map = dynamicAnchors;
    const key = anchorKey;
    return () => {
      map.delete(key);
    };
  }, [anchorKey, dynamicAnchors]);

  useFrame(({ clock }) => {
    const root = rootRef.current;
    if (!root) return;

    if (reduced) {
      root.position.set(
        position[0],
        terrainHeight(position[0], position[2]),
        position[2],
      );
      writeAnchor(root);
      return;
    }

    const t = clock.elapsedTime;

    if (resting) {
      root.position.set(
        position[0],
        terrainHeight(position[0], position[2]),
        position[2],
      );
      // Slow breathing while lying down.
      if (bodyRef.current) {
        bodyRef.current.scale.setScalar(1 + Math.sin(t * 0.9 + phase) * 0.012);
      }
      if (neckRef.current) {
        neckRef.current.rotation.x = Math.sin(t * 0.18 + phase) * 0.08 - 0.1;
      }
    } else {
      // Slow wander: two incommensurate drifts trace a meandering path.
      const wx = Math.sin(t * 0.07 + phase) * grazeRadius;
      const wz = Math.cos(t * 0.05 + phase * 1.7) * grazeRadius;
      const x = position[0] + wx;
      const z = position[2] + wz;
      root.position.set(x, terrainHeight(x, z), z);

      // Face the direction of travel (analytic derivative of the wander path).
      const dx = Math.cos(t * 0.07 + phase) * 0.07 * grazeRadius;
      const dz = -Math.sin(t * 0.05 + phase * 1.7) * 0.05 * grazeRadius;
      root.rotation.y = Math.atan2(dx, dz);

      // Gentle body bob while walking.
      if (bodyRef.current) {
        bodyRef.current.position.y = Math.sin(t * 1.6 + phase) * 0.018;
      }

      // Occasional head dip to graze: positive half of a slow sine, sharpened
      // so the head stays up most of the time.
      if (neckRef.current) {
        const g = Math.sin(t * 0.23 + phase * 2.3);
        const dip = g > 0 ? g * g : 0;
        neckRef.current.rotation.x = dip * 1.05;
      }
    }

    // Ear flicks + tail swats in bursts (both poses).
    const earFlick =
      Math.sin(t * 5.1 + phase) *
      Math.max(0, Math.sin(t * 0.31 + phase * 4.1)) ** 4;
    if (earLeftRef.current)
      earLeftRef.current.rotation.z = -0.45 - earFlick * 0.4;
    if (earRightRef.current)
      earRightRef.current.rotation.z = 0.45 + earFlick * 0.4;
    if (tailRef.current) {
      const envelope = Math.max(0, Math.sin(t * 0.45 + phase * 3.1));
      tailRef.current.rotation.z = Math.sin(t * 2.8 + phase) * envelope * 0.55;
    }

    writeAnchor(root);
  });

  const bodyLift = resting ? -0.42 : 0;

  return (
    <group ref={rootRef} position={position}>
      <group ref={bodyRef} position={[0, bodyLift, 0]}>
        {/* Rounded body: chest + belly + hindquarters */}
        <mesh
          castShadow
          geometry={unitSphere}
          material={materials.hide}
          position={[0, 1.04, 0.42]}
          scale={[0.5, 0.55, 0.55]}
        />
        <mesh
          castShadow
          geometry={unitSphere}
          material={materials.hide}
          position={[0, 0.96, 0]}
          scale={[0.55, 0.58, 0.72]}
        />
        <mesh
          castShadow
          geometry={unitSphere}
          material={materials.hide}
          position={[0, 1.02, -0.44]}
          scale={[0.48, 0.54, 0.5]}
        />
        {/* Darker shading along the topline */}
        <mesh
          geometry={unitSphere}
          material={materials.accent}
          position={[0, 1.3, -0.05]}
          scale={[0.4, 0.28, 0.62]}
        />

        {/* Neck + head, pivoting at the shoulders for grazing dips */}
        <group ref={neckRef} position={[0, 1.22, 0.72]}>
          <mesh
            castShadow
            geometry={unitCylinder}
            material={materials.hide}
            position={[0, 0.06, 0.16]}
            rotation={[1, 0, 0]}
            scale={[0.21, 0.5, 0.24]}
          />
          <group position={[0, 0.14, 0.42]}>
            <mesh
              castShadow
              geometry={unitSphere}
              material={materials.hide}
              scale={[0.24, 0.27, 0.32]}
            />
            {/* Muzzle */}
            <mesh
              geometry={unitSphere}
              material={materials.muzzle}
              position={[0, -0.08, 0.24]}
              scale={[0.17, 0.15, 0.18]}
            />
            {/* Eyes */}
            <mesh
              geometry={unitSphere}
              material={HOOF}
              position={[0.13, 0.06, 0.17]}
              scale={0.03}
            />
            <mesh
              geometry={unitSphere}
              material={HOOF}
              position={[-0.13, 0.06, 0.17]}
              scale={0.03}
            />
            {/* Ears */}
            <mesh
              ref={earLeftRef}
              geometry={unitSphere}
              material={materials.accent}
              position={[0.24, 0.12, -0.02]}
              rotation={[0, 0, -0.45]}
              scale={[0.13, 0.05, 0.08]}
            />
            <mesh
              ref={earRightRef}
              geometry={unitSphere}
              material={materials.accent}
              position={[-0.24, 0.12, -0.02]}
              rotation={[0, 0, 0.45]}
              scale={[0.13, 0.05, 0.08]}
            />
            {/* Small horns */}
            <mesh
              geometry={unitCone}
              material={HORN}
              position={[0.12, 0.24, -0.04]}
              rotation={[0, 0, -0.45]}
              scale={[0.035, 0.14, 0.035]}
            />
            <mesh
              geometry={unitCone}
              material={HORN}
              position={[-0.12, 0.24, -0.04]}
              rotation={[0, 0, 0.45]}
              scale={[0.035, 0.14, 0.035]}
            />
          </group>
        </group>

        {/* Legs (tucked away when resting — the grass hides them) */}
        {!resting
          ? (
              [
                [0.26, 0.42],
                [-0.26, 0.42],
                [0.24, -0.42],
                [-0.24, -0.42],
              ] as const
            ).map(([x, z], i) => (
              <group key={i} position={[x, 0, z]}>
                <mesh
                  castShadow
                  geometry={unitCylinder}
                  material={materials.hide}
                  position={[0, 0.38, 0]}
                  scale={[0.085, 0.68, 0.085]}
                />
                <mesh
                  geometry={unitCylinder}
                  material={HOOF}
                  position={[0, 0.05, 0]}
                  scale={[0.09, 0.1, 0.09]}
                />
              </group>
            ))
          : null}

        {/* Tail, pivoting at the rump */}
        <group ref={tailRef} position={[0, 1.28, -0.62]}>
          <mesh
            geometry={unitCylinder}
            material={materials.hide}
            position={[0, -0.3, -0.05]}
            rotation={[0.14, 0, 0]}
            scale={[0.035, 0.6, 0.035]}
          />
          <mesh
            geometry={unitSphere}
            material={materials.accent}
            position={[0, -0.62, -0.12]}
            scale={[0.06, 0.12, 0.06]}
          />
        </group>
      </group>
    </group>
  );
}
