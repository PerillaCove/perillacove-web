import { describe, expect, it } from "vitest";
import { SCENE_PLACEMENTS, anchorKey, resolveHotspotAnchors } from "./layout";
import { SAMPLE_TROPICAL_COORDINATES } from "../data/sampleTropical";

describe("scene3d layout", () => {
  it("maps every sample-tropical hotspot to an anchor", () => {
    const anchors = resolveHotspotAnchors(SAMPLE_TROPICAL_COORDINATES);

    expect(anchors).toHaveLength(SAMPLE_TROPICAL_COORDINATES.length);
    anchors.forEach((anchor, index) => {
      expect(anchor).not.toBeNull();
      expect(anchor?.hotspotId).toBe(SAMPLE_TROPICAL_COORDINATES[index].id);
    });
  });

  it("resolves the two cow hotspots to distinct placements in declaration order", () => {
    const anchors = resolveHotspotAnchors(SAMPLE_TROPICAL_COORDINATES);
    const cowAnchors = anchors.filter((anchor) => anchor?.hotspotId === "cow");
    const cowPlacements = SCENE_PLACEMENTS.filter(
      (placement) => placement.hotspotId === "cow",
    );

    expect(cowAnchors).toHaveLength(2);
    expect(cowAnchors[0]?.occurrenceIndex).toBe(0);
    expect(cowAnchors[1]?.occurrenceIndex).toBe(1);

    cowAnchors.forEach((anchor, occurrence) => {
      const placement = cowPlacements[occurrence];
      expect(anchor?.position).toEqual([
        placement.position[0] + placement.markerOffset[0],
        placement.position[1] + placement.markerOffset[1],
        placement.position[2] + placement.markerOffset[2],
      ]);
    });

    expect(cowAnchors[0]?.position).not.toEqual(cowAnchors[1]?.position);
    expect(anchorKey("cow", 0)).not.toBe(anchorKey("cow", 1));
  });

  it("only declares placements for hotspot ids present in the tour data", () => {
    const knownIds = new Set(
      SAMPLE_TROPICAL_COORDINATES.map((seed) => seed.id),
    );

    for (const placement of SCENE_PLACEMENTS) {
      expect(placement.hotspotId).not.toBeNull();
      expect(knownIds.has(placement.hotspotId as string)).toBe(true);
    }
  });
});
