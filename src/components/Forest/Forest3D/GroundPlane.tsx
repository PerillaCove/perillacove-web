/**
 * GROUND PLANE COMPONENT FOR 3D FOREST VISUALIZATION
 *
 * Renders a realistic PBR soil terrain with:
 * - Poly Haven CC0 PBR texture set (diffuse, normal, roughness, AO, displacement)
 * - Subdivided PlaneGeometry with displacement mapping for terrain undulations
 * - Circular mask via onBeforeCompile (discards fragments outside forest radius)
 * - Noise-based UV distortion to break visible texture tiling
 * - Soil zone blending when separateSoil is enabled (shader-based tinting)
 *
 * =============================================================================
 * SOIL ZONE VISUALIZATION
 * =============================================================================
 *
 * When `separateSoil` structure is enabled and soil grouping is active:
 *
 * 1. Each soil group gets ONE shared circle that encompasses all plants in it
 * 2. The circle is centered at the centroid of all plants in the group
 * 3. The radius is calculated to fit all plants plus padding
 * 4. Different groups get different colors from SOIL_GROUP_COLORS palette
 * 5. Zone colors are blended into the PBR diffuse via the ground shader
 *
 * Visual representation:
 *
 *     ┌─────────────────────────────────────────────┐
 *     │                                             │
 *     │    ╭───────────╮       ╭───────────╮       │
 *     │   ╱  Group A    ╲     ╱  Group B    ╲      │
 *     │  │   🌱  🌿     │   │   🌴  🌾     │      │
 *     │  │     🌻       │   │      🌵       │      │
 *     │   ╲ (brown)    ╱     ╲ (slate-blue)╱       │
 *     │    ╰───────────╯       ╰───────────╯       │
 *     │                                             │
 *     │           (PBR soil texture ground)         │
 *     └─────────────────────────────────────────────┘
 *
 * =============================================================================
 * HANDLING MULTI-GROUP PLANTS
 * =============================================================================
 *
 * When a plant belongs to multiple soil groups, the spatial.ts module creates
 * separate volumes with composite IDs like "banana__groupA", "banana__groupB".
 *
 * This component detects these composite IDs and correctly assigns each volume
 * to its respective group's zone using the getBaseIngredientId() helper.
 *
 * =============================================================================
 */

import { useRef, useMemo, useCallback, useEffect } from "react";
import * as THREE from "three";
import { useTexture, Grid } from "@react-three/drei";
import type { SpatialVolume } from "../spatial";
import type { DimensionGrouping } from "../types";

interface GroundPlaneProps {
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
  };
  isDarkMode: boolean;
  separateSoil: boolean;
  volumes: SpatialVolume[];
  /** Soil grouping for visualizing different soil zones with distinct colors */
  soilGrouping?: DimensionGrouping;
}

/**
 * Earth-tone color palettes for different soil groups.
 *
 * Each group gets a noticeably different color while staying natural.
 * Colors are more saturated and distinct to make groups clearly visible.
 *
 * COLOR ASSIGNMENT:
 * - Group 0 (first/default): Warm brown
 * - Group 1: Cool slate-blue
 * - Group 2: Terracotta red
 * - Group 3: Forest green-brown
 * - Group 4: Plum/purple-brown
 * - Group 5: Olive-gold
 * - Groups 6+: Cycles back to start
 *
 * Each color has two variants:
 * - `bed`: The filled circle surface (used for shader blending)
 * - `ring`: The boundary ring (more saturated/visible)
 */
const SOIL_GROUP_COLORS = {
  light: [
    { bed: "#5a4535", ring: "#9a7030" }, // Warm brown (base/shared)
    { bed: "#4a5560", ring: "#607080" }, // Cool slate-blue
    { bed: "#6a4040", ring: "#a05555" }, // Terracotta red
    { bed: "#455a40", ring: "#608055" }, // Forest green-brown
    { bed: "#5a4a5a", ring: "#806080" }, // Plum/purple-brown
    { bed: "#5a5540", ring: "#808050" }, // Olive-gold
  ],
  dark: [
    { bed: "#3a2a1a", ring: "#6a5030" }, // Warm brown (base/shared)
    { bed: "#2a3540", ring: "#455570" }, // Cool slate-blue
    { bed: "#452828", ring: "#704545" }, // Terracotta red
    { bed: "#2a402a", ring: "#456045" }, // Forest green-brown
    { bed: "#3a2a3a", ring: "#604560" }, // Plum/purple-brown
    { bed: "#3a3828", ring: "#605840" }, // Olive-gold
  ],
};

/** Maximum number of soil zones the shader supports */
const MAX_SOIL_ZONES = 8;

/**
 * Represents a shared soil zone for a group of plants.
 */
interface SoilZone {
  groupIndex: number;
  groupId: string;
  centerX: number;
  centerZ: number;
  radius: number;
}

/**
 * Extracts the base ingredient ID from a volume's ingredientId.
 *
 * When a plant belongs to multiple soil groups, spatial.ts creates volumes
 * with composite IDs in the format: "ingredientId__groupId"
 *
 * Examples:
 *   "banana" → "banana" (simple ID, no change)
 *   "banana__group1" → "banana" (composite ID, extract base)
 *   "cacao__shared" → "cacao"
 *
 * @param ingredientId - The volume's ingredientId (may be simple or composite)
 * @returns The base ingredient ID without the group suffix
 */
function getBaseIngredientId(ingredientId: string): string {
  const idx = ingredientId.indexOf("__");
  return idx >= 0 ? ingredientId.substring(0, idx) : ingredientId;
}

/**
 * Calculates shared soil zones - one circle per group that encompasses all plants.
 *
 * ALGORITHM:
 * ----------
 * For each soil group:
 * 1. Find all volumes that belong to this group
 * 2. Calculate the centroid (average position) of all plants
 * 3. Calculate the minimum radius needed to contain all plants
 * 4. Add padding to the radius for visual breathing room
 *
 * MULTI-GROUP HANDLING:
 * --------------------
 * Volumes can have composite IDs like "banana__group1" when a species
 * belongs to multiple groups. We match these using the suffix:
 * - "banana__group1" matches group with id "group1"
 * - "banana" (simple ID) matches based on ingredientIds list
 *
 * @param volumes - All SpatialVolume objects in the scene
 * @param soilGrouping - The soil grouping configuration
 * @returns Array of SoilZone objects, one per group with plants
 */
function calculateSoilZones(
  volumes: SpatialVolume[],
  soilGrouping: DimensionGrouping | undefined,
): SoilZone[] {
  // No grouping or empty groups - no zones to render
  if (!soilGrouping?.enabled || !soilGrouping.groups.length) {
    return [];
  }

  const zones: SoilZone[] = [];

  soilGrouping.groups.forEach((group, groupIndex) => {
    // Find all volumes that belong to this group
    // Handle both simple IDs and composite IDs (ingredient__groupId)
    const groupVolumes = volumes.filter((v) => {
      // Composite ID case: "banana__groupId" - check if suffix matches this group
      if (v.ingredientId.includes("__")) {
        return v.ingredientId.endsWith(`__${group.id}`);
      }
      // Simple ID case: check if the ingredient is in this group's list
      const baseId = getBaseIngredientId(v.ingredientId);
      return group.ingredientIds.includes(baseId);
    });

    // Skip groups with no plants
    if (groupVolumes.length === 0) return;

    // Calculate centroid (average position) of all plants in this group
    let sumX = 0;
    let sumZ = 0;
    for (const v of groupVolumes) {
      sumX += v.position.x;
      sumZ += v.position.z;
    }
    const centerX = sumX / groupVolumes.length;
    const centerZ = sumZ / groupVolumes.length;

    // Calculate minimum radius to encompass all plants
    // We measure from centroid to each plant's outer edge (position + footprint)
    let maxDist = 0;
    for (const v of groupVolumes) {
      const dx = v.position.x - centerX;
      const dz = v.position.z - centerZ;
      const distToPlantEdge = Math.sqrt(dx * dx + dz * dz) + v.footprintRadius;
      maxDist = Math.max(maxDist, distToPlantEdge);
    }

    zones.push({
      groupIndex,
      groupId: group.id,
      centerX,
      centerZ,
      radius: maxDist + 1.0, // Add 1 meter padding for visual breathing room
    });
  });

  return zones;
}

/**
 * Configures a texture for tiling: sets wrap mode and repeat scale.
 */
function configureTiling(texture: THREE.Texture, repeat: number) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat, repeat);
}

/**
 * GLSL simplex noise function (2D) for shader-based UV distortion.
 * Compact implementation based on Ashima Arts webgl-noise.
 */
const GLSL_NOISE = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                             + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                             dot(x12.zw,x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
    vec3 g;
    g.x = a0.x * x0.x + h.x * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }
`;

/**
 * GroundPlane - Renders a realistic PBR soil terrain.
 *
 * Uses a subdivided PlaneGeometry with PBR textures (diffuse, normal,
 * roughness, AO, displacement) and a custom shader extension for:
 * - Circular mask (discard outside forest radius)
 * - Noise-based UV distortion (breaks visible tiling)
 * - Soil zone blending (when separateSoil is enabled)
 */
export default function GroundPlane({
  bounds,
  isDarkMode,
  separateSoil,
  volumes,
  soilGrouping,
}: GroundPlaneProps) {
  const matRef = useRef<THREE.MeshStandardMaterial>(null);

  // Calculate ground size. Bounds are stable (computed from ALL species positions
  // in spatial.ts, not just visible ones), so this stays constant during simulation.
  const groundSize = Math.max(
    Math.abs(bounds.maxX - bounds.minX) + 10,
    Math.abs(bounds.maxZ - bounds.minZ) + 10,
    20,
  );
  const groundRadius = groundSize / 2;

  // Texture repeat: ~1 tile per 2.5 meters for natural scale
  const textureRepeat = groundSize / 2.5;

  // Load PBR textures
  const [diffuse, normal, roughnessMap, ao, displacement] = useTexture([
    "/textures/soil_diffuse.jpg",
    "/textures/soil_normal.jpg",
    "/textures/soil_roughness.jpg",
    "/textures/soil_ao.jpg",
    "/textures/soil_displacement.jpg",
  ]);

  // Load noise texture for UV distortion
  const noiseTex = useTexture("/textures/noise_256.png");

  // Configure tiling on all textures
  useMemo(() => {
    configureTiling(diffuse, textureRepeat);
    configureTiling(normal, textureRepeat);
    configureTiling(roughnessMap, textureRepeat);
    configureTiling(ao, textureRepeat);
    configureTiling(displacement, textureRepeat);
    configureTiling(noiseTex, textureRepeat / 4); // Noise tiles at larger scale
  }, [
    diffuse,
    normal,
    roughnessMap,
    ao,
    displacement,
    noiseTex,
    textureRepeat,
  ]);

  // Calculate shared soil zones
  const soilZones = useMemo(() => {
    if (!separateSoil) return [];
    return calculateSoilZones(volumes, soilGrouping);
  }, [separateSoil, volumes, soilGrouping]);

  // Get color palette based on theme
  const colorPalette = isDarkMode
    ? SOIL_GROUP_COLORS.dark
    : SOIL_GROUP_COLORS.light;

  // Build soil zone uniforms for the shader
  const zoneUniforms = useMemo(() => {
    const positions = new Float32Array(MAX_SOIL_ZONES * 3); // x, z, radius per zone
    const colors = new Float32Array(MAX_SOIL_ZONES * 3); // r, g, b per zone

    soilZones.forEach((zone, i) => {
      if (i >= MAX_SOIL_ZONES) return;
      positions[i * 3] = zone.centerX;
      positions[i * 3 + 1] = zone.centerZ;
      positions[i * 3 + 2] = zone.radius;

      const c = new THREE.Color(
        colorPalette[zone.groupIndex % colorPalette.length].bed,
      );
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    });

    return {
      positions,
      colors,
      count: Math.min(soilZones.length, MAX_SOIL_ZONES),
    };
  }, [soilZones, colorPalette]);

  // Dark mode color tint (applied in shader). Light mode > 1.0 brightens the naturally dark soil texture.
  const darkModeTint = isDarkMode ? 0.7 : 1.25;

  // Shader customization via onBeforeCompile
  const onBeforeCompile = useCallback(
    (shader: THREE.WebGLProgramParametersWithUniforms) => {
      // Add custom uniforms
      shader.uniforms.u_groundRadius = { value: groundRadius };
      shader.uniforms.u_groundSize = { value: groundSize };
      shader.uniforms.u_noiseTex = { value: noiseTex };
      shader.uniforms.u_noiseScale = { value: 0.03 }; // UV distortion strength
      shader.uniforms.u_darkModeTint = { value: darkModeTint };
      shader.uniforms.u_zoneCount = { value: zoneUniforms.count };
      shader.uniforms.u_zonePositions = {
        value: Array.from(
          { length: MAX_SOIL_ZONES },
          (_, i) =>
            new THREE.Vector3(
              zoneUniforms.positions[i * 3],
              zoneUniforms.positions[i * 3 + 1],
              zoneUniforms.positions[i * 3 + 2],
            ),
        ),
      };
      shader.uniforms.u_zoneColors = {
        value: Array.from(
          { length: MAX_SOIL_ZONES },
          (_, i) =>
            new THREE.Vector3(
              zoneUniforms.colors[i * 3],
              zoneUniforms.colors[i * 3 + 1],
              zoneUniforms.colors[i * 3 + 2],
            ),
        ),
      };

      // ---- VERTEX SHADER ----
      // Pass world position to fragment shader for circular mask + zones
      shader.vertexShader = shader.vertexShader.replace(
        "#include <common>",
        /* glsl */ `
          #include <common>
          varying vec2 vWorldXZ;
        `,
      );
      shader.vertexShader = shader.vertexShader.replace(
        "#include <worldpos_vertex>",
        /* glsl */ `
          #include <worldpos_vertex>
          vWorldXZ = worldPosition.xz;
        `,
      );

      // ---- FRAGMENT SHADER ----
      // Declare uniforms and varyings
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <common>",
        /* glsl */ `
          #include <common>
          varying vec2 vWorldXZ;
          uniform float u_groundRadius;
          uniform float u_groundSize;
          uniform sampler2D u_noiseTex;
          uniform float u_noiseScale;
          uniform float u_darkModeTint;
          uniform int u_zoneCount;
          uniform vec3 u_zonePositions[${MAX_SOIL_ZONES}];
          uniform vec3 u_zoneColors[${MAX_SOIL_ZONES}];

          ${GLSL_NOISE}
        `,
      );

      // Apply noise UV distortion to the diffuse map sampling
      // and circular mask + soil zone blending after the diffuse is computed
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        /* glsl */ `
          // Circular mask — soft edge fade
          float distFromCenter = length(vWorldXZ);
          float edgeSoftness = 0.5;
          float circleMask = 1.0 - smoothstep(u_groundRadius - edgeSoftness, u_groundRadius, distFromCenter);
          if (circleMask <= 0.0) discard;

          // Noise-based UV distortion to break tiling repetition
          vec2 noiseUV = vWorldXZ * 0.08;
          float n1 = snoise(noiseUV);
          float n2 = snoise(noiseUV + vec2(43.0, 17.0));
          vec2 uvDistortion = vec2(n1, n2) * u_noiseScale;

          #ifdef USE_MAP
            vec4 sampledDiffuseColor = texture2D(map, vMapUv + uvDistortion);
            diffuseColor *= sampledDiffuseColor;
          #endif

          // Apply dark mode tint
          diffuseColor.rgb *= u_darkModeTint;

          // Edge darkening — subtle vignette toward border
          float edgeDarken = smoothstep(u_groundRadius * 0.6, u_groundRadius, distFromCenter);
          diffuseColor.rgb *= mix(1.0, 0.7, edgeDarken);

          // Subtle color variation across the surface using noise
          float colorNoise = snoise(vWorldXZ * 0.15) * 0.08;
          diffuseColor.rgb += colorNoise;

          // Soil zone blending — tint areas inside each zone
          for (int i = 0; i < ${MAX_SOIL_ZONES}; i++) {
            if (i >= u_zoneCount) break;
            vec2 zoneCenter = u_zonePositions[i].xy;
            float zoneRadius = u_zonePositions[i].z;
            vec3 zoneColor = u_zoneColors[i];

            float distToZone = length(vWorldXZ - zoneCenter);
            float zoneFactor = 1.0 - smoothstep(zoneRadius * 0.3, zoneRadius, distToZone);
            diffuseColor.rgb = mix(diffuseColor.rgb, zoneColor, zoneFactor * 0.35);
          }

          // Apply soft edge alpha fade
          diffuseColor.a *= circleMask;
        `,
      );

      // Apply noise distortion to normal map sampling too
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <normal_fragment_maps>",
        /* glsl */ `
          #ifdef USE_NORMALMAP_OBJECTSPACE
            normal = texture2D(normalMap, vNormalMapUv).xyz * 2.0 - 1.0;
            #ifdef FLIP_SIDED
              normal = -normal;
            #endif
            #ifdef DOUBLE_SIDED
              normal = normal * faceDirection;
            #endif
            normal = normalize(normalMatrix * normal);
          #elif defined(USE_NORMALMAP_TANGENTSPACE)
            vec3 mapN = texture2D(normalMap, vNormalMapUv + uvDistortion).xyz * 2.0 - 1.0;
            mapN.xy *= normalScale;
            normal = normalize(tbn * mapN);
          #elif defined(USE_BUMPMAP)
            normal = perturbNormalArb(-vViewPosition, normal, dHdxy_fwd(), faceDirection);
          #endif
        `,
      );

      // Apply noise distortion to roughness map sampling
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <roughnessmap_fragment>",
        /* glsl */ `
          float roughnessFactor = roughness;
          #ifdef USE_ROUGHNESSMAP
            vec4 texelRoughness = texture2D( roughnessMap, vRoughnessMapUv + uvDistortion );
            roughnessFactor *= texelRoughness.g;
          #endif
        `,
      );

      // Apply noise distortion to AO map sampling
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <aomap_fragment>",
        /* glsl */ `
          #ifdef USE_AOMAP
            float ambientOcclusion = ( texture2D( aoMap, vAoMapUv + uvDistortion ).r - 1.0 ) * aoMapIntensity + 1.0;
            reflectedLight.indirectDiffuse *= ambientOcclusion;
            #if defined( USE_CLEARCOAT )
              clearcoatSpecularIndirect *= ambientOcclusion;
            #endif
            #if defined( USE_SHEEN )
              sheenSpecularIndirect *= ambientOcclusion;
            #endif
            #if defined( USE_ENVMAP ) && defined( STANDARD )
              float dotNV = saturate( dot( geometryNormal, geometryViewDir ) );
              reflectedLight.indirectSpecular *= computeSpecularOcclusion( dotNV, ambientOcclusion, material.roughness );
            #endif
          #endif
        `,
      );
    },
    [groundRadius, groundSize, noiseTex, darkModeTint, zoneUniforms],
  );

  // Force material recompile when shader params change
  useEffect(() => {
    if (matRef.current) {
      matRef.current.needsUpdate = true;
    }
  }, [onBeforeCompile]);

  return (
    <group>
      {/* Main PBR terrain plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.01, 0]}
        receiveShadow
      >
        <planeGeometry args={[groundSize, groundSize, 128, 128]} />
        <meshStandardMaterial
          ref={matRef}
          map={diffuse}
          normalMap={normal}
          normalScale={new THREE.Vector2(1.0, 1.0)}
          roughnessMap={roughnessMap}
          aoMap={ao}
          aoMapIntensity={0.8}
          displacementMap={displacement}
          displacementScale={0.08}
          displacementBias={-0.02}
          transparent
          side={THREE.DoubleSide}
          onBeforeCompile={onBeforeCompile}
        />
      </mesh>

      {/* Subtle grid for spatial reference */}
      <Grid
        position={[0, 0.01, 0]}
        args={[groundSize, groundSize]}
        cellSize={1}
        cellThickness={0.5}
        cellColor={isDarkMode ? "#2a3f2a" : "#5a8c5a"}
        sectionSize={5}
        sectionThickness={1}
        sectionColor={isDarkMode ? "#3a4f3a" : "#6a9c6a"}
        fadeDistance={groundSize}
        fadeStrength={1}
        infiniteGrid={false}
      />
    </group>
  );
}
