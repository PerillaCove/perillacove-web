/**
 * GROUND DRESSING — Ambient Forest Floor Decoration
 *
 * Renders environmental dressing on the forest floor: grass clumps, low patches,
 * wildflowers, leaf litter, and small rocks. Instanced meshes for minimal GPU
 * cost (~5 draw calls total).
 *
 * =============================================================================
 * HOW TO CONFIGURE
 * =============================================================================
 *
 * Configuration lives in four places:
 *
 * 1. TYPE_CONFIGS    — count, clustering, and placement behavior per type
 * 2. PALETTES        — color variation per type (light/dark mode)
 * 3. TURNOVER        — lifecycle churn: instances fade out and reappear elsewhere
 *                      (TURNOVER_LIFETIME_MIN/MAX, TURNOVER_FADE_FRACTION)
 * 4. CLEARANCE       — smooth scale fade near planted species (inner/outer radii,
 *                      lerp speed)
 *
 * Common tweaks:
 *   - Want more rocks?           → Increase `rock.count` in TYPE_CONFIGS
 *   - Want denser patches?       → Increase `clusters` or `clusterSpread`
 *   - Want bigger grass?         → Edit createGrassGeometry() (hw, h constants)
 *   - Want new colors?           → Add/change hex strings in PALETTES
 *   - Want faster/slower churn?   → Adjust TURNOVER_LIFETIME_MIN/MAX (seconds)
 *   - Want snappier/softer fades? → Adjust TURNOVER_FADE_FRACTION (0.05 = quick, 0.2 = slow)
 *   - Want faster/slower hide?    → Adjust CLEARANCE_LERP_SPEED
 *   - Want wider/tighter clear?   → Adjust CLEARANCE_OUTER_MULT (multiplier on footprintRadius)
 *   - Want a new object type?    → Add a key to ObjectTypeKey, a geometry builder,
 *                                  an entry in TYPE_CONFIGS, PALETTES, and TYPE_KEYS
 *
 * =============================================================================
 * PLACEMENT ALGORITHM
 * =============================================================================
 *
 * Uses cluster-based scattering for natural-looking patches:
 *   1. For each type, N cluster centers are placed randomly across the ground
 *   2. Each instance picks a random cluster and scatters around it (gaussian-like)
 *   3. Edge bias pushes cluster centers toward the perimeter (vegetation types)
 *   4. Seeded PRNG (mulberry32) ensures deterministic, flicker-free positions
 *
 * Types with clusters=0 (e.g. rocks) use pure uniform random placement instead.
 *
 * Placement positions are STABLE — they depend only on groundRadius and theme,
 * NOT on current volumes/year. This prevents the fidgety snapping that occurs
 * when positions are recomputed every time the timeline changes.
 *
 * =============================================================================
 * PER-FRAME ANIMATION (useFrame)
 * =============================================================================
 *
 * Three effects are computed per-frame for all ~255 instances:
 *
 * 1. TURNOVER LIFECYCLE — Each instance independently cycles through: fully
 *    visible → fade out → teleport to new random soil position → fade in →
 *    repeat. Phases are staggered so only a few transition at any time.
 *    Only advances when isSimulating is true (paused = frozen in place).
 *    Controlled by TURNOVER_LIFETIME_MIN/MAX and TURNOVER_FADE_FRACTION.
 *
 * 2. SMOOTH CLEARANCE — Instances near planted species lerp their scale toward
 *    zero over ~0.4s (CLEARANCE_LERP_SPEED). Uses quadratic falloff between
 *    inner radius (footprintRadius) and outer radius (footprintRadius *
 *    CLEARANCE_OUTER_MULT). When plants disappear, dressing smoothly grows back.
 *
 * 3. UNDERGROUND OPACITY — Material opacity fades to 20% at max underground
 *    tilt (driven by undergroundFactorRef from UndergroundEffect.tsx).
 *
 * =============================================================================
 * Z-FIGHTING PREVENTION (baseY values)
 * =============================================================================
 *
 * GroundPlane mesh sits at y = -0.01 with displacement (scale=0.08, bias=-0.02).
 * Dressing baseY values are slightly negative to sit within the displaced terrain:
 *   - Leaf litter:       y = 0.0     (flat on ground)
 *   - Low patches:       y = 0.0     (flat patches)
 *   - Grass/weeds/rocks: y = -0.01   (base sunk into terrain, extend upward)
 *   - Soil zone rings:   y = 0.02    (above all dressing — set in GroundPlane.tsx)
 */

import { useRef, useMemo, useEffect } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { SpatialVolume } from "../spatial";

interface GroundDressingProps {
  /** Circular soil boundary radius (matches GroundPlane sizing) */
  groundRadius: number;
  /** Active plant volumes — used to compute clearance zones */
  volumes: SpatialVolume[];
  isDarkMode: boolean;
  /** Current year (reserved for future maturity-based density response) */
  year: number;
  /** Underground viewing factor (0=above ground, 1=max underground tilt) — drives dressing fade */
  undergroundFactorRef?: React.MutableRefObject<number>;
  /** When true, dressing items drift. When false, they stay put. */
  isSimulating?: boolean;
}

// ---------------------------------------------------------------------------
// Seeded PRNG — mulberry32 (deterministic, no Math.random flicker)
// Returns values in [0, 1). Same seed always produces the same sequence.
// ---------------------------------------------------------------------------

function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------
// Color palettes — per-type, per-theme
// ---------------------------------------------------------------------------
//
// Each type has a list of base hex colors for light and dark mode.
// Per-instance color is picked randomly from the list, then jittered in HSL
// (hue ±0.03, saturation ±0.1, lightness ±0.08) for organic variation.
//
// To add colors: just append more hex strings to the array.
// To make a type brighter/darker: adjust the hex values or the jitter range
// in jitteredColor() below.
// ---------------------------------------------------------------------------

const PALETTES = {
  grass: {
    light: ["#5a8a3a", "#4d7a33", "#6b9a45"],
    dark: ["#7aaa5a", "#6d9a53", "#8bba65"],
  },
  lowPatch: {
    light: ["#4a8a3a", "#5a9a45", "#3d7a30"],
    dark: ["#6a9a5a", "#7aaa65", "#5d8a50"],
  },
  wildflower: {
    light: ["#d4a0d4", "#e8c84a", "#e07050", "#b0d0f0"],
    dark: ["#e4b0e4", "#f8d85a", "#f08060", "#c0e0ff"],
  },
  leafLitter: {
    light: ["#8a6a3a", "#7a5a2a", "#9a7a4a"],
    dark: ["#aa8a5a", "#9a7a4a", "#baa06a"],
  },
  rock: {
    light: ["#9a9a8a", "#7a7a6a", "#8a8a7a"],
    dark: ["#bababa", "#9a9a8a", "#aaaaaa"],
  },
};

/** Pick a random base color from palette, then jitter hue/sat/lightness for variation */
function jitteredColor(bases: string[], rand: () => number): THREE.Color {
  const base = new THREE.Color(bases[Math.floor(rand() * bases.length)]);
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);
  hsl.h += (rand() - 0.5) * 0.06;
  hsl.s = Math.max(0, Math.min(1, hsl.s + (rand() - 0.5) * 0.2));
  hsl.l = Math.max(0, Math.min(1, hsl.l + (rand() - 0.5) * 0.16));
  return base.setHSL(hsl.h, hsl.s, hsl.l);
}

// ---------------------------------------------------------------------------
// Programmatic geometry builders
// ---------------------------------------------------------------------------
// Each function creates one low-poly shape. Called once on mount.
// To change sizes, edit the constants (hw, h, r, etc.) inside each function.
// ---------------------------------------------------------------------------

/** Grass clump: 3 thin blade quads with slight bend at the top (~6 tris) */
function createGrassGeometry(): THREE.BufferGeometry {
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  for (let i = 0; i < 3; i++) {
    const angle = (i / 3) * Math.PI * 2 + 0.3;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const hw = 0.02; // blade half-width (meters)
    const h = 0.2; // blade height (meters)
    const px = -sin * hw;
    const pz = cos * hw;
    const bendX = cos * 0.04; // tip bend offset
    const bendZ = sin * 0.04;

    const base = positions.length / 3;
    positions.push(-px, 0, -pz);
    normals.push(0, 0.3, 1);
    positions.push(px, 0, pz);
    normals.push(0, 0.3, 1);
    positions.push(-px + bendX, h, -pz + bendZ);
    normals.push(0, 0.7, 0.7);
    positions.push(px + bendX, h, pz + bendZ);
    normals.push(0, 0.7, 0.7);

    indices.push(base, base + 1, base + 2);
    indices.push(base + 1, base + 3, base + 2);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

/** Low patch: flat hexagon fan lying on the ground (~6 tris) */
function createLowPatchGeometry(): THREE.BufferGeometry {
  const positions: number[] = [0, 0, 0]; // center vertex
  const normals: number[] = [0, 1, 0];
  const r = 0.15; // patch radius (meters)

  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    positions.push(Math.cos(a) * r, 0, Math.sin(a) * r);
    normals.push(0, 1, 0);
  }

  const indices: number[] = [];
  for (let i = 1; i <= 6; i++) {
    indices.push(0, i, i < 6 ? i + 1 : 1);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

/** Small weed/wildflower: thin cone pointing up (~4 tris) */
function createWeedGeometry(): THREE.BufferGeometry {
  // args: (radiusBottom, height, radialSegments)
  return new THREE.ConeGeometry(0.02, 0.18, 4);
}

/** Fallen leaf: flat asymmetric diamond quad lying on the ground (~2 tris) */
function createLeafLitterGeometry(): THREE.BufferGeometry {
  // Asymmetric to look organic — not a perfect diamond
  const positions = [
    -0.12, 0, 0, 0.12, 0, 0.03, 0.03, 0, 0.18, -0.03, 0, -0.15,
  ];
  const normals = [0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0];
  const indices = [0, 1, 2, 0, 3, 1];

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geo.setIndex(indices);
  return geo;
}

/** Small pebble: squashed icosahedron (Y scaled 0.5) (~20 tris) */
function createRockGeometry(): THREE.BufferGeometry {
  const geo = new THREE.IcosahedronGeometry(0.12, 0); // radius in meters
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    pos.setY(i, pos.getY(i) * 0.5); // flatten vertically
  }
  pos.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

// ---------------------------------------------------------------------------
// Placement types
// ---------------------------------------------------------------------------

// Shared temps for useFrame — avoids per-frame allocations
const _mat4 = new THREE.Matrix4();
const _scaleVec = new THREE.Vector3();

interface Placement {
  x: number;
  z: number;
  rotY: number; // random Y rotation (radians)
  scale: number; // uniform scale multiplier (0.5–1.5)
  color: THREE.Color; // jittered instance color
}

type ObjectTypeKey =
  | "grass"
  | "lowPatch"
  | "wildflower"
  | "leafLitter"
  | "rock";

// ---------------------------------------------------------------------------
// TYPE_CONFIGS — main configuration table
// ---------------------------------------------------------------------------
//
// This is the primary place to tune ground dressing behavior. Each key maps to
// one instanced mesh type rendered on the forest floor.
//
// Fields:
//   count         — Total number of instances to place. Higher = denser.
//                   Performance is cheap (instanced), so even 500+ is fine.
//   baseY         — Y offset from ground plane. Prevents z-fighting.
//                   Flat things (litter, patches) need small positive values.
//   edgeBias      — If true, cluster centers favor the circle perimeter.
//                   Gives a natural "vegetation thickens at forest edge" look.
//   paletteKey    — Which color palette from PALETTES to use.
//   subSeed       — PRNG sub-seed (ensures each type gets independent randomness).
//                   Change this to reshuffle a specific type's positions.
//   clusters      — Number of cluster centers. Instances scatter around these
//                   in gaussian-like patches. Set to 0 for uniform random.
//   clusterSpread — How far instances scatter from their cluster center,
//                   as a fraction of groundRadius. 0.1 = tight patches,
//                   0.3 = loose/overlapping patches.
// ---------------------------------------------------------------------------

interface ObjectTypeConfig {
  count: number;
  baseY: number;
  edgeBias: boolean;
  paletteKey: keyof typeof PALETTES;
  subSeed: number;
  clusters: number;
  clusterSpread: number;
}

const TYPE_CONFIGS: Record<ObjectTypeKey, ObjectTypeConfig> = {
  grass: {
    count: 90,
    baseY: -0.01,
    edgeBias: true,
    paletteKey: "grass",
    subSeed: 1,
    clusters: 12,
    clusterSpread: 0.15,
  },
  lowPatch: {
    count: 40,
    baseY: 0.0,
    edgeBias: true,
    paletteKey: "lowPatch",
    subSeed: 2,
    clusters: 8,
    clusterSpread: 0.12,
  },
  wildflower: {
    count: 25,
    baseY: -0.01,
    edgeBias: true,
    paletteKey: "wildflower",
    subSeed: 3,
    clusters: 6,
    clusterSpread: 0.1,
  },
  leafLitter: {
    count: 70,
    baseY: 0.0,
    edgeBias: false,
    paletteKey: "leafLitter",
    subSeed: 4,
    clusters: 10,
    clusterSpread: 0.18,
  },
  rock: {
    count: 30,
    baseY: -0.01,
    edgeBias: false,
    paletteKey: "rock",
    subSeed: 5,
    clusters: 0,
    clusterSpread: 0,
  },
};

/** Render order — also determines which keys exist in TYPE_CONFIGS */
const TYPE_KEYS: ObjectTypeKey[] = [
  "grass",
  "lowPatch",
  "wildflower",
  "leafLitter",
  "rock",
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function GroundDressing({
  groundRadius,
  volumes,
  isDarkMode,
  undergroundFactorRef,
  isSimulating = false,
  // year — reserved for future maturity-based density response
}: GroundDressingProps) {
  const grassRef = useRef<THREE.InstancedMesh>(null);
  const coverRef = useRef<THREE.InstancedMesh>(null);
  const weedRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);
  const rockRef = useRef<THREE.InstancedMesh>(null);

  const refs = useMemo<
    Record<ObjectTypeKey, React.RefObject<THREE.InstancedMesh | null>>
  >(
    () => ({
      grass: grassRef,
      lowPatch: coverRef,
      wildflower: weedRef,
      leafLitter: leafRef,
      rock: rockRef,
    }),
    [],
  );

  // Build geometries once (recreated only if component remounts)
  const geometries = useMemo(
    () => ({
      grass: createGrassGeometry(),
      lowPatch: createLowPatchGeometry(),
      wildflower: createWeedGeometry(),
      leafLitter: createLeafLitterGeometry(),
      rock: createRockGeometry(),
    }),
    [],
  );

  // Track volumes and groundRadius in refs so useFrame can read them without re-renders
  const volumesRef = useRef(volumes);
  volumesRef.current = volumes;
  const groundRadiusRef = useRef(groundRadius);
  groundRadiusRef.current = groundRadius;

  // Per-instance current scales — lerped toward targets each frame for smooth transitions
  const currentScalesRef = useRef<Record<ObjectTypeKey, Float32Array>>({
    grass: new Float32Array(0),
    lowPatch: new Float32Array(0),
    wildflower: new Float32Array(0),
    leafLitter: new Float32Array(0),
    rock: new Float32Array(0),
  });

  // ---------------------------------------------------------------------------
  // TURNOVER — per-instance lifecycle (fade out → respawn elsewhere → fade in)
  // ---------------------------------------------------------------------------
  // Each instance independently cycles through: visible → fade out → teleport
  // to a new random position → fade in → visible. Staggered so only a few
  // transition at any given time. Only advances when isSimulating is true.
  //
  //   TURNOVER_LIFETIME_MIN/MAX — how long (seconds) an instance stays before
  //                               cycling. Each instance gets a random value in
  //                               this range. 8–18s = slow, natural churn.
  //   TURNOVER_FADE_FRACTION   — what fraction of the lifetime is spent fading
  //                               in/out. 0.12 = 12% fade-in at start, 12% fade-out
  //                               at end, 76% fully visible in the middle.
  // ---------------------------------------------------------------------------
  const TURNOVER_LIFETIME_MIN = 8;
  const TURNOVER_LIFETIME_MAX = 18;
  const TURNOVER_FADE_FRACTION = 0.12;

  // Per-instance lifecycle state: phase (0–1 progress), lifetime (seconds),
  // current position (x, z) which changes on respawn, current Y rotation
  const turnoverRef = useRef<
    Record<
      ObjectTypeKey,
      {
        phase: Float32Array; // 0 = just spawned, 1 = about to respawn
        lifetime: Float32Array; // seconds for this cycle
        curX: Float32Array; // current x (changes on respawn)
        curZ: Float32Array; // current z (changes on respawn)
        rotY: Float32Array; // current Y rotation (changes on respawn)
      }
    >
  >({
    grass: {
      phase: new Float32Array(0),
      lifetime: new Float32Array(0),
      curX: new Float32Array(0),
      curZ: new Float32Array(0),
      rotY: new Float32Array(0),
    },
    lowPatch: {
      phase: new Float32Array(0),
      lifetime: new Float32Array(0),
      curX: new Float32Array(0),
      curZ: new Float32Array(0),
      rotY: new Float32Array(0),
    },
    wildflower: {
      phase: new Float32Array(0),
      lifetime: new Float32Array(0),
      curX: new Float32Array(0),
      curZ: new Float32Array(0),
      rotY: new Float32Array(0),
    },
    leafLitter: {
      phase: new Float32Array(0),
      lifetime: new Float32Array(0),
      curX: new Float32Array(0),
      curZ: new Float32Array(0),
      rotY: new Float32Array(0),
    },
    rock: {
      phase: new Float32Array(0),
      lifetime: new Float32Array(0),
      curX: new Float32Array(0),
      curZ: new Float32Array(0),
      rotY: new Float32Array(0),
    },
  });

  // Compute stable placements (only changes with groundRadius or theme, NOT with volumes)
  const allPlacements = useMemo(() => {
    const result: Record<ObjectTypeKey, Placement[]> = {
      grass: [],
      lowPatch: [],
      wildflower: [],
      leafLitter: [],
      rock: [],
    };

    for (const key of TYPE_KEYS) {
      const cfg = TYPE_CONFIGS[key];
      const rand = mulberry32(42 + cfg.subSeed * 1000);
      const palette = isDarkMode
        ? PALETTES[cfg.paletteKey].dark
        : PALETTES[cfg.paletteKey].light;

      // Step 1: Generate cluster centers (patches where this type grows)
      const clusterCenters: { x: number; z: number }[] = [];
      if (cfg.clusters > 0) {
        for (let c = 0; c < cfg.clusters; c++) {
          const angle = rand() * Math.PI * 2;
          // Edge-biased types place clusters at 30-95% of radius
          const r = cfg.edgeBias
            ? (0.3 + rand() * 0.65) * (groundRadius - 1)
            : rand() * (groundRadius - 1);
          clusterCenters.push({
            x: Math.cos(angle) * r,
            z: Math.sin(angle) * r,
          });
        }
      }

      // Step 2: Scatter instances around cluster centers (or uniformly)
      const placements: Placement[] = [];
      const maxAttempts = cfg.count * 6;
      let attempts = 0;

      while (placements.length < cfg.count && attempts < maxAttempts) {
        attempts++;

        let x: number, z: number;

        if (clusterCenters.length > 0) {
          // Pick a random cluster and scatter with gaussian-like falloff
          const center =
            clusterCenters[Math.floor(rand() * clusterCenters.length)];
          const spread = cfg.clusterSpread * groundRadius;
          const angle = rand() * Math.PI * 2;
          const dist =
            spread * Math.sqrt(-2 * Math.log(Math.max(rand(), 0.001)));
          x = center.x + Math.cos(angle) * dist;
          z = center.z + Math.sin(angle) * dist;
        } else {
          // Uniform random (for types like rocks that don't cluster)
          x = (rand() * 2 - 1) * groundRadius;
          z = (rand() * 2 - 1) * groundRadius;
        }

        const dist = Math.sqrt(x * x + z * z);

        // Reject anything outside the circular soil boundary.
        // Use a generous 2m inset so items never land in the soft-fade zone
        // at the edge of the GroundPlane shader mask.
        if (dist > groundRadius - 2) continue;

        placements.push({
          x,
          z,
          rotY: rand() * Math.PI * 2,
          scale: 0.5 + rand() * 1.0, // range: 0.5× to 1.5×
          color: jitteredColor(palette, rand),
        });
      }

      result[key] = placements;
    }

    return result;
  }, [groundRadius, isDarkMode]);

  // Write placement data into InstancedMesh matrices/colors and init lifecycle tracking
  useEffect(() => {
    const tempMatrix = new THREE.Matrix4();
    const tempColor = new THREE.Color();
    const initRand = mulberry32(9999);

    for (const key of TYPE_KEYS) {
      const mesh = refs[key].current;
      if (!mesh) continue;

      const placements = allPlacements[key];
      const cfg = TYPE_CONFIGS[key];
      const n = placements.length;

      // Initialize per-instance scale tracking (starts at base scale)
      const scales = new Float32Array(n);
      // Initialize turnover lifecycle — stagger phases so respawns are spread out
      const phase = new Float32Array(n);
      const lifetime = new Float32Array(n);
      const curX = new Float32Array(n);
      const curZ = new Float32Array(n);
      const rotY = new Float32Array(n);

      for (let i = 0; i < n; i++) {
        const p = placements[i];
        scales[i] = p.scale;
        curX[i] = p.x;
        curZ[i] = p.z;
        rotY[i] = p.rotY;
        // Random initial phase (0–1) so they don't all cycle at the same time
        phase[i] = initRand();
        lifetime[i] =
          TURNOVER_LIFETIME_MIN +
          initRand() * (TURNOVER_LIFETIME_MAX - TURNOVER_LIFETIME_MIN);

        tempMatrix.makeRotationY(p.rotY);
        tempMatrix.scale(_scaleVec.set(p.scale, p.scale, p.scale));
        tempMatrix.setPosition(p.x, cfg.baseY, p.z);
        mesh.setMatrixAt(i, tempMatrix);
        mesh.setColorAt(i, tempColor.copy(p.color));
      }

      // Hide any unused instance slots (scale to zero, move underground)
      for (let i = n; i < cfg.count; i++) {
        tempMatrix.makeScale(0, 0, 0);
        tempMatrix.setPosition(0, -10, 0);
        mesh.setMatrixAt(i, tempMatrix);
      }

      currentScalesRef.current[key] = scales;
      turnoverRef.current[key] = { phase, lifetime, curX, curZ, rotY };
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.count = n;
    }
  }, [allPlacements, refs]);

  // ---------------------------------------------------------------------------
  // Materials
  // ---------------------------------------------------------------------------
  // Instance colors (setColorAt) multiply with the material's base color,
  // so we set base to white (0xffffff) so instance colors show through as-is.
  // Do NOT use vertexColors here — that looks for per-vertex color attributes
  // on the geometry, which these don't have.
  // ---------------------------------------------------------------------------

  // All materials initialized with transparent: true to avoid runtime shader
  // recompilation when underground factor changes opacity
  const grassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        roughness: 0.85,
        transparent: true,
        opacity: 1,
      }),
    [],
  );

  const coverMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        roughness: 0.9,
        transparent: true,
        opacity: 1,
      }),
    [],
  );

  const weedMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7,
        transparent: true,
        opacity: 1,
      }),
    [],
  );

  const leafMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        side: THREE.DoubleSide,
        roughness: 0.95,
        transparent: true,
        opacity: 1,
      }),
    [],
  );

  const rockMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.05,
        transparent: true,
        opacity: 1,
      }),
    [],
  );

  const materials: Record<ObjectTypeKey, THREE.MeshStandardMaterial> = {
    grass: grassMat,
    lowPatch: coverMat,
    wildflower: weedMat,
    leafLitter: leafMat,
    rock: rockMat,
  };

  // ---------------------------------------------------------------------------
  // CLEARANCE — smooth scale fade near planted species
  // ---------------------------------------------------------------------------
  // Instead of rejecting placement positions (which causes abrupt snapping when
  // volumes change), clearance is applied per-frame as a smooth scale lerp.
  // Instances within a plant's footprint shrink to zero; between inner and outer
  // they get a quadratic falloff. When the plant disappears, they grow back.
  //
  //   CLEARANCE_LERP_SPEED — how fast scale lerps to target (higher = snappier).
  //                          2.5 ≈ 0.4s to 63% of target. Try 1.0 for sluggish,
  //                          5.0 for near-instant.
  //   CLEARANCE_OUTER_MULT — outer clearance radius as multiplier on footprintRadius.
  //                          2.0 = dressing fades over 1× the footprint beyond the trunk.
  //                          1.5 = tighter, 3.0 = wider fade zone.
  // ---------------------------------------------------------------------------
  const CLEARANCE_LERP_SPEED = 2.5;
  const CLEARANCE_OUTER_MULT = 2.0;

  /** Compute turnover fade multiplier from lifecycle phase (0–1).
   *  Returns 0 at edges (fade in/out), 1 in the middle (fully visible). */
  function turnoverFade(phase: number): number {
    if (phase < TURNOVER_FADE_FRACTION) {
      // Fade in: 0 → 1 over the first TURNOVER_FADE_FRACTION of the cycle
      return phase / TURNOVER_FADE_FRACTION;
    } else if (phase > 1 - TURNOVER_FADE_FRACTION) {
      // Fade out: 1 → 0 over the last TURNOVER_FADE_FRACTION of the cycle
      return (1 - phase) / TURNOVER_FADE_FRACTION;
    }
    return 1;
  }

  /** Pick a random position within the soil circle (groundRadius - 2m inset). */
  function randomSoilPosition(radius: number): [number, number] {
    // Rejection-sample inside circle
    for (let attempt = 0; attempt < 20; attempt++) {
      const x = (Math.random() * 2 - 1) * radius;
      const z = (Math.random() * 2 - 1) * radius;
      if (x * x + z * z < (radius - 2) * (radius - 2)) return [x, z];
    }
    // Fallback: polar coordinates
    const a = Math.random() * Math.PI * 2;
    const r = Math.random() * (radius - 2);
    return [Math.cos(a) * r, Math.sin(a) * r];
  }

  // Per-frame: turnover lifecycle + smooth clearance + underground opacity
  useFrame((_, delta) => {
    // Underground opacity fade (0 = fully above ground, 1 = max underground tilt)
    const ugFactor = undergroundFactorRef?.current ?? 0;
    const ugOpacity = 1 - ugFactor * 0.8;

    // Framerate-independent lerp factor for clearance
    const lerpFactor = 1 - Math.exp(-delta * CLEARANCE_LERP_SPEED);
    const vols = volumesRef.current;
    const gr = groundRadiusRef.current;

    for (const key of TYPE_KEYS) {
      const mesh = refs[key].current;
      if (!mesh) continue;

      materials[key].opacity = ugOpacity;

      const placements = allPlacements[key];
      const cfg = TYPE_CONFIGS[key];
      const scales = currentScalesRef.current[key];
      const lc = turnoverRef.current[key];
      if (!scales || scales.length === 0 || !lc.phase.length) continue;

      for (let i = 0; i < placements.length; i++) {
        const p = placements[i];

        // --- Turnover: advance lifecycle phase when simulating ---
        if (isSimulating) {
          lc.phase[i] += delta / lc.lifetime[i];

          // Cycle complete → respawn at a new random position
          if (lc.phase[i] >= 1) {
            lc.phase[i] = 0;
            // New random lifetime for variety
            lc.lifetime[i] =
              TURNOVER_LIFETIME_MIN +
              Math.random() * (TURNOVER_LIFETIME_MAX - TURNOVER_LIFETIME_MIN);
            // Teleport to a new random soil position
            const [nx, nz] = randomSoilPosition(gr);
            lc.curX[i] = nx;
            lc.curZ[i] = nz;
            lc.rotY[i] = Math.random() * Math.PI * 2;
          }
        }

        const fade = turnoverFade(lc.phase[i]);
        const ix = lc.curX[i];
        const iz = lc.curZ[i];

        // --- Clearance: compute target scale based on proximity to plants ---
        let target = p.scale;
        for (let v = 0; v < vols.length; v++) {
          const vol = vols[v];
          const dx = ix - vol.position.x;
          const dz = iz - vol.position.z;
          const distSq = dx * dx + dz * dz;
          const inner = vol.footprintRadius;
          const outer = inner * CLEARANCE_OUTER_MULT;
          if (distSq < inner * inner) {
            target = 0;
            break;
          } else if (distSq < outer * outer) {
            const dist = Math.sqrt(distSq);
            const f = (dist - inner) / (outer - inner);
            target = Math.min(target, p.scale * f * f);
          }
        }

        // Lerp clearance scale smoothly toward target
        const cur = scales[i];
        const next = cur + (target - cur) * lerpFactor;
        scales[i] = next;

        // Final scale: clearance × turnover fade
        const finalScale = next * fade;

        // Rebuild instance matrix: rotation → scale → position
        _mat4.makeRotationY(lc.rotY[i]);
        _mat4.scale(_scaleVec.set(finalScale, finalScale, finalScale));
        _mat4.setPosition(ix, cfg.baseY, iz);
        mesh.setMatrixAt(i, _mat4);
      }

      mesh.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group>
      {TYPE_KEYS.map((key) => (
        <instancedMesh
          key={key}
          ref={refs[key] as React.RefObject<THREE.InstancedMesh>}
          args={[geometries[key], materials[key], TYPE_CONFIGS[key].count]}
          frustumCulled={false}
          receiveShadow
        />
      ))}
    </group>
  );
}
