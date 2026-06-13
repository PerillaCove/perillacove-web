import type { FieldCell, PlotBounds, PlotGrid } from "../types";

export const DEFAULT_GRID_RESOLUTION = 32;
export const LOW_PERFORMANCE_GRID_RESOLUTION = 16;
export const LOW_PERFORMANCE_MODE = false;

const VERTICAL_SAMPLES = [0.2, 0.8, 1.6, 3, 6, 10, 14];
const VISUAL_FIELD_PADDING = 10;
const MIN_VISUAL_FIELD_DIAMETER = 20;
const ACTIVE_DOMAIN_PADDING = 1.6;

export interface IntegrationDomainFootprint {
  x: number;
  z: number;
  radius: number;
}

function fieldRadiusFromBounds(bounds: PlotBounds): number {
  const spanX = Math.abs(bounds.maxX - bounds.minX);
  const spanZ = Math.abs(bounds.maxZ - bounds.minZ);
  return (
    Math.max(
      spanX + VISUAL_FIELD_PADDING,
      spanZ + VISUAL_FIELD_PADDING,
      MIN_VISUAL_FIELD_DIAMETER,
    ) / 2
  );
}

function distanceToActiveDomainEdge(
  x: number,
  z: number,
  footprints: IntegrationDomainFootprint[],
): number {
  let distanceToEdge = Number.NEGATIVE_INFINITY;
  for (const footprint of footprints) {
    const radius = Math.max(0.05, footprint.radius) + ACTIVE_DOMAIN_PADDING;
    const distance = Math.hypot(x - footprint.x, z - footprint.z);
    distanceToEdge = Math.max(distanceToEdge, radius - distance);
  }
  return distanceToEdge;
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function smoothstep(value: number): number {
  const t = clamp01(value);
  return t * t * (3 - 2 * t);
}

function domainWeightFromEdge(
  distanceToEdge: number,
  featherDistance: number,
): number {
  if (distanceToEdge <= 0) return 0;
  // The cell exists on a stable lattice, while this weight says how deeply it
  // belongs to the current living domain. That keeps time/respawn changes from
  // moving the grid, and lets edges fade and score gradually.
  return smoothstep(distanceToEdge / Math.max(0.001, featherDistance));
}

export function createPlotGrid(
  bounds: PlotBounds,
  resolution = LOW_PERFORMANCE_MODE
    ? LOW_PERFORMANCE_GRID_RESOLUTION
    : DEFAULT_GRID_RESOLUTION,
  activeDomainFootprints: IntegrationDomainFootprint[] = [],
): PlotGrid {
  const hasActiveDomain = activeDomainFootprints.length > 0;
  const centerX = 0;
  const centerZ = 0;
  const radius = fieldRadiusFromBounds(bounds) + ACTIVE_DOMAIN_PADDING;
  const cellSize = (radius * 2) / resolution;
  const cells: FieldCell[] = [];

  for (let row = 0; row < resolution; row++) {
    for (let col = 0; col < resolution; col++) {
      const x = centerX - radius + cellSize * (col + 0.5);
      const z = centerZ - radius + cellSize * (row + 0.5);
      const distanceFromCenter = Math.hypot(x - centerX, z - centerZ);
      const distanceToEdge = hasActiveDomain
        ? distanceToActiveDomainEdge(x, z, activeDomainFootprints)
        : radius - distanceFromCenter;
      const domainWeight = domainWeightFromEdge(
        distanceToEdge,
        hasActiveDomain ? ACTIVE_DOMAIN_PADDING : cellSize * 1.5,
      );
      const inside = domainWeight > 0;
      cells.push({
        index: row * resolution + col,
        row,
        col,
        x,
        z,
        size: cellSize,
        distanceFromCenter,
        distanceToEdge,
        domainWeight,
        inside,
        weight: cellSize * cellSize * domainWeight,
      });
    }
  }

  return {
    resolution,
    radius,
    centerX,
    centerZ,
    bounds,
    cells,
    verticalSamples: VERTICAL_SAMPLES,
  };
}
