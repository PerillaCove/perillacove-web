/**
 * Handcrafted layout for the sample-tropical from-scratch 3D forest scene.
 *
 * The layout mirrors the original panorama image: the default camera looks
 * down -Z, so X maps to left/right in the image. Durian + jackfruit form the
 * canopy on the left/center with cacao tucked between them in their shade;
 * banana stands apart on the right in direct sun; peanut and pigeon pea cover
 * the ground in front; two cows graze on the open right.
 *
 * Pure data + pure anchor resolution — no three.js imports so the matching
 * logic stays trivially testable.
 */

export interface ScenePlacement {
  /** Hotspot id this placement anchors; duplicates matched by occurrence order. */
  hotspotId: string | null;
  /** Ground position of the element (y = 0 plane). */
  position: [number, number, number];
  /** Offset from position to the hotspot dot anchor (e.g. mid-canopy). */
  markerOffset: [number, number, number];
  /** Camera distance when the tour focuses this anchor. */
  focusDistance?: number;
}

export const SCENE_PLACEMENTS: ScenePlacement[] = [
  {
    hotspotId: "durian",
    position: [-14, 0, -4],
    markerOffset: [0, 9.4, 0],
    focusDistance: 24,
  },
  {
    hotspotId: "cacao",
    position: [-7, 0, -1],
    markerOffset: [0, 3.1, 0],
    focusDistance: 11,
  },
  {
    hotspotId: "jackfruit",
    position: [-1, 0, -5],
    markerOffset: [0, 7.2, 0],
    focusDistance: 22,
  },
  {
    hotspotId: "banana",
    position: [16, 0, 1],
    markerOffset: [0, 3.8, 0],
    focusDistance: 12,
  },
  {
    hotspotId: "peanut",
    position: [0, 0, 6],
    markerOffset: [0, 1, 0],
    focusDistance: 9,
  },
  {
    hotspotId: "pigeon_pea",
    position: [7, 0, 8],
    markerOffset: [0, 2, 0],
    focusDistance: 9,
  },
  {
    hotspotId: "cow",
    position: [5, 0, 4],
    // Low enough that the dot sits on the cow's back, not above it.
    markerOffset: [0, 1.3, 0],
    focusDistance: 11,
  },
  {
    hotspotId: "cow",
    position: [11.5, 0, 5.5],
    markerOffset: [0, 1.3, 0],
    focusDistance: 11,
  },
];

/**
 * Pond footprint (ellipse on the XZ plane), right-of-center like the
 * panorama. Shared by the terrain depression, the water surface, shore
 * dressing, and the scatter logic that keeps grass out of the water.
 */
export const POND = {
  x: 9,
  z: -2,
  radiusX: 5.5,
  radiusZ: 3.6,
  waterLevel: -0.07,
};

export const SCENE_CAMERA = {
  // Low, near eye-level viewpoint matching the panorama's horizon framing.
  position: [0, 4.6, 25] as [number, number, number],
  target: [0, 2.2, 0] as [number, number, number],
  fov: 45,
  minDistance: 7,
  maxDistance: 45,
  minPolarAngle: Math.PI / 6,
  maxPolarAngle: Math.PI * 0.52,
  defaultFocusDistance: 14,
};

export interface HotspotAnchor {
  hotspotId: string;
  /** Index among hotspots sharing the same id, in declaration order. */
  occurrenceIndex: number;
  /** World-space marker anchor = placement position + marker offset. */
  position: [number, number, number];
  focusDistance?: number;
}

/** Stable key shared by markers and dynamic (cow) anchor lookups. */
export const anchorKey = (hotspotId: string, occurrenceIndex: number): string =>
  `${hotspotId}:${occurrenceIndex}`;

/**
 * Maps hotspots to scene anchors by id, matching duplicate ids (the two
 * "cow" hotspots) to placements in occurrence order. The result is aligned
 * index-for-index with the input hotspot list; entries without a matching
 * placement are null.
 */
export function resolveHotspotAnchors(
  hotspots: readonly { id: string }[],
  placements: readonly ScenePlacement[] = SCENE_PLACEMENTS,
): (HotspotAnchor | null)[] {
  const seenCounts = new Map<string, number>();

  return hotspots.map((hotspot) => {
    const occurrenceIndex = seenCounts.get(hotspot.id) ?? 0;
    seenCounts.set(hotspot.id, occurrenceIndex + 1);

    let matchedOccurrence = -1;
    for (const placement of placements) {
      if (placement.hotspotId !== hotspot.id) continue;
      matchedOccurrence += 1;
      if (matchedOccurrence !== occurrenceIndex) continue;

      return {
        hotspotId: hotspot.id,
        occurrenceIndex,
        position: [
          placement.position[0] + placement.markerOffset[0],
          placement.position[1] + placement.markerOffset[1],
          placement.position[2] + placement.markerOffset[2],
        ],
        focusDistance: placement.focusDistance,
      };
    }

    return null;
  });
}
