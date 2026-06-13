import type {
  ElementContext,
  ElementField,
  ElementFieldCell,
  ElementId,
  ElementMetric,
  FieldCell,
  FieldOverlay,
  FlowStructure,
  IntegrationDirection,
  IntegrationElementReading,
} from "../types";

export function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

export function roundReading(value: number): number {
  return Math.round(value * 1_000_000) / 1_000_000;
}

function effectiveCapacity(value: number): number {
  if (value <= 1) return value;
  // Structures add harnessing capacity at a location. This is deliberately
  // first-principles rather than a vertical rules engine: whether we say a
  // canopy intercepted part of the incoming flow, or say canopy plus understory
  // together added enough capacity to catch that flow, the integration question
  // is the same: how much supply turns over without waste in this cell?
  //
  // Capacity is additive because a forest works by layered participation. The
  // cap below keeps stacked structures from pretending that the same incoming
  // flow can be harnessed infinitely many times.
  return 1 + Math.log1p(value - 1) * 0.35;
}

export function createFieldCell(
  cell: FieldCell,
  supply: number,
  capacity: number,
): ElementFieldCell {
  return {
    ...cell,
    supply: cell.inside ? Math.max(0, supply) : 0,
    capacity: cell.inside ? Math.max(0, capacity) : 0,
    use: 0,
    integration: 0,
    direction: "balanced",
    contributors: [],
  };
}

export function footprintFalloff(
  cell: FieldCell,
  structure: FlowStructure,
): number {
  if (!cell.inside) return 0;
  const dx = cell.x - structure.footprint.x;
  const dz = cell.z - structure.footprint.z;
  const distance = Math.hypot(dx, dz);
  const radius = Math.max(0.05, structure.footprint.radius);
  if (distance > radius) return 0;
  const normalized = distance / radius;
  const radial = 1 - normalized * normalized;
  return 0.35 + radial * 0.65;
}

export function applyStructureEffect(
  field: ElementField,
  structure: FlowStructure,
): ElementField {
  const effect = structure.effects[field.element];
  const capacity = structure.capacity[field.element];
  if (!effect && capacity === undefined) return field;

  const { centerX, centerZ, resolution, radius } = field.grid;
  const cellSize = field.grid.cells[0]?.size ?? 1;
  const footprintRadius = Math.max(0.05, structure.footprint.radius);
  const footprintRadiusSq = footprintRadius * footprintRadius;
  const minX = centerX - radius;
  const minZ = centerZ - radius;
  const minCol = Math.max(
    0,
    Math.floor((structure.footprint.x - footprintRadius - minX) / cellSize),
  );
  const maxCol = Math.min(
    resolution - 1,
    Math.ceil((structure.footprint.x + footprintRadius - minX) / cellSize),
  );
  const minRow = Math.max(
    0,
    Math.floor((structure.footprint.z - footprintRadius - minZ) / cellSize),
  );
  const maxRow = Math.min(
    resolution - 1,
    Math.ceil((structure.footprint.z + footprintRadius - minZ) / cellSize),
  );

  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const cell = field.cells[row * resolution + col];
      if (!cell) continue;
      const dx = cell.x - structure.footprint.x;
      const dz = cell.z - structure.footprint.z;
      const distanceSq = dx * dx + dz * dz;
      if (!cell.inside || distanceSq > footprintRadiusSq) continue;
      const radialFalloff = 1 - distanceSq / footprintRadiusSq;
      const falloff = 0.35 + radialFalloff * 0.65;
      const supplyMultiplier =
        1 + ((effect?.supplyMultiplier ?? 1) - 1) * radialFalloff;
      const capacityMultiplier =
        1 + ((effect?.capacityMultiplier ?? 1) - 1) * radialFalloff;
      const declaredCapacity = capacity ?? effect?.capacity ?? 0;
      cell.supply =
        cell.supply * supplyMultiplier +
        Math.max(0, effect?.supply ?? 0) * falloff;
      cell.capacity =
        cell.capacity * capacityMultiplier +
        Math.max(0, declaredCapacity) * falloff;
      cell.contributors.push(structure.id);
    }
  }

  return field;
}

export function directionFromValues(
  supply: number,
  capacity: number,
): IntegrationDirection {
  const maxValue = Math.max(supply, capacity);
  if (maxValue <= 0) return "balanced";
  const delta = supply - capacity;
  if (Math.abs(delta) / maxValue < 0.08) return "balanced";
  return delta > 0 ? "supply_exceeds_capacity" : "capacity_exceeds_supply";
}

export function resolveField(field: ElementField): ElementField {
  let inflow = 0;
  let retained = 0;
  let outflow = 0;

  for (const cell of field.cells) {
    if (!cell.inside) continue;
    const supply = Math.max(0, cell.supply);
    const rawCapacity = Math.max(0, cell.capacity);
    const capacity =
      field.element === "earth" ? rawCapacity : effectiveCapacity(rawCapacity);
    const use = Math.min(supply, capacity);
    const maxValue = Math.max(supply, capacity);
    // Integration is the local language of flawless turnover. It does not ask
    // whether a named rule succeeded; it asks whether the flows arriving here
    // are met by structures ready to harness them. Supply without capacity is
    // waste. Capacity without supply is waiting. When the two meet, the system
    // is coherent at this location.
    const integration =
      maxValue <= 0 ? 0 : clamp01(1 - Math.abs(supply - capacity) / maxValue);
    const direction = directionFromValues(supply, capacity);
    inflow += supply * cell.weight;
    retained += use * cell.weight;
    outflow += Math.max(0, supply - use) * cell.weight;
    cell.supply = roundReading(supply);
    cell.capacity = roundReading(capacity);
    cell.use = roundReading(use);
    cell.integration = roundReading(integration);
    cell.direction = direction;
  }

  return {
    ...field,
    boundaryFlux: {
      inflow: roundReading(inflow),
      retained: roundReading(retained),
      outflow: roundReading(outflow),
    },
  };
}

export function measureField(field: ElementField): IntegrationElementReading {
  let weightedIntegration = 0;
  let totalWeight = 0;
  let totalSupply = 0;
  let totalCapacity = 0;
  let totalUse = 0;
  const directionalSummary: IntegrationElementReading["directionalSummary"] = {
    supply_exceeds_capacity: 0,
    capacity_exceeds_supply: 0,
    balanced: 0,
  };

  const locals = field.cells
    .filter((cell) => cell.inside)
    .map((cell) => {
      const weight = Math.max(cell.supply, cell.capacity) * cell.weight;
      weightedIntegration += cell.integration * weight;
      totalWeight += weight;
      totalSupply += cell.supply * cell.weight;
      totalCapacity += cell.capacity * cell.weight;
      totalUse += cell.use * cell.weight;
      directionalSummary[cell.direction] += weight;
      return {
        element: field.element,
        cellIndex: cell.index,
        row: cell.row,
        col: cell.col,
        x: cell.x,
        z: cell.z,
        supply: cell.supply,
        capacity: cell.capacity,
        use: cell.use,
        integration: cell.integration,
        direction: cell.direction,
        weight,
        contributors: cell.contributors,
      };
    });

  const integration =
    totalWeight <= 0 ? 0 : roundReading(weightedIntegration / totalWeight);
  const closure = totalSupply <= 0 ? 0 : roundReading(totalUse / totalSupply);

  return {
    element: field.element,
    baseIntegration: integration,
    integration,
    bundle: {
      integration,
      channels: [
        {
          id: `${field.element}_field`,
          label: "Field turnover",
          summary:
            "The local field score where available flow meets living capacity.",
          primaryElement: field.element,
          relatedElements: [],
          integration,
          weight: 1,
          direction: "balanced",
        },
      ],
    },
    closure,
    totalSupply: roundReading(totalSupply),
    totalCapacity: roundReading(totalCapacity),
    totalUse: roundReading(totalUse),
    boundaryFlux: field.boundaryFlux,
    directionalSummary: {
      supply_exceeds_capacity: roundReading(
        directionalSummary.supply_exceeds_capacity,
      ),
      capacity_exceeds_supply: roundReading(
        directionalSummary.capacity_exceeds_supply,
      ),
      balanced: roundReading(directionalSummary.balanced),
    },
    locals,
  };
}

export function fieldToOverlay(
  field: ElementField,
  metric: ElementMetric,
): FieldOverlay {
  const values = field.cells
    .filter((cell) => cell.inside)
    .map((cell) => cell[metric]);
  const min = values.length > 0 ? Math.min(...values) : 0;
  const max = values.length > 0 ? Math.max(...values) : 0;
  const denom = Math.max(0.0001, max - min);
  return {
    element: field.element,
    metric,
    min,
    max,
    cells: field.cells.map((cell) => ({
      index: cell.index,
      row: cell.row,
      col: cell.col,
      x: cell.x,
      z: cell.z,
      size: cell.size,
      value: cell.inside ? clamp01((cell[metric] - min) / denom) : 0,
      direction: cell.direction,
      visible: cell.inside,
    })),
  };
}

export function createBaseElementField(
  element: ElementId,
  context: ElementContext,
  supply: number,
  capacity: number,
): ElementField {
  const cells = context.grid.cells.map((cell) =>
    createFieldCell(cell, supply, capacity),
  );
  return {
    element,
    grid: context.grid,
    cells,
    boundaryFlux: { inflow: 0, outflow: 0, retained: 0 },
  };
}
