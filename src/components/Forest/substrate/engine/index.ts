import * as fire from "../elements/fire";
import * as air from "../elements/air";
import * as water from "../elements/water";
import * as earth from "../elements/earth";
import {
  ELEMENT_IDS,
  type ElementId,
  type IntegrationSceneReading,
  type IntegrationSceneState,
} from "../types";
import { applyElementBundles } from "../bundles";
import type {
  ActiveIntegrationTransformation,
  ElementContext,
  ElementField,
  ElementFieldCell,
  FlowStructure,
} from "../types";
import { roundReading } from "../elements/common";
import { TRANSFORMATION_PASS_COUNT } from "../transformations/constants";

const ELEMENT_MODULES = {
  fire,
  air,
  water,
  earth,
} as const;

const RESOLVE_ORDER: ElementId[] = ["fire", "air", "water", "earth"];
const readingCache = new Map<string, IntegrationSceneReading>();
let cacheHits = 0;
let cacheMisses = 0;

function cacheKey(scene: IntegrationSceneState, time: number): string {
  return `${scene.hash}:${Math.round(time * 1000) / 1000}`;
}

function resolveElement(
  element: ElementId,
  context: ElementContext,
): ElementField {
  const module = ELEMENT_MODULES[element];
  let field = module.createBaseField(context);
  for (const structure of context.structures) {
    field = module.applyStructure(field, structure);
  }
  return module.resolve(field);
}

function resolveExistingField(
  element: ElementId,
  field: ElementField,
): ElementField {
  return ELEMENT_MODULES[element].resolve(field);
}

function limitingInputUse(
  fields: Record<ElementId, ElementField>,
  transformation: ActiveIntegrationTransformation,
  cellIndex: number,
): number {
  if (transformation.inputs.length === 0) return 0;
  let limitingUse = Number.POSITIVE_INFINITY;
  for (const element of transformation.inputs) {
    const use = fields[element].cells[cellIndex]?.use ?? 0;
    if (use < limitingUse) limitingUse = use;
    if (limitingUse <= 0) return 0;
  }
  return Number.isFinite(limitingUse) ? limitingUse : 0;
}

function applyTransformationPass(
  fields: Record<ElementId, ElementField>,
  structures: FlowStructure[],
): boolean {
  let emitted = false;

  for (const structure of structures) {
    if (!structure.transformations?.length) continue;
    for (const transformation of structure.transformations) {
      if (transformation.intensity <= 0 || transformation.rate <= 0) continue;
      const outputElements = Object.keys(transformation.outputs) as ElementId[];
      if (outputElements.length === 0) continue;
      const referenceField = fields[outputElements[0]];
      const { centerX, centerZ, resolution, radius } = referenceField.grid;
      const cellSize = referenceField.grid.cells[0]?.size ?? 1;
      const footprintRadius = Math.max(0.05, structure.footprint.radius);
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
          const referenceCell = referenceField.cells[row * resolution + col] as
            | ElementFieldCell
            | undefined;
          if (!referenceCell?.inside) continue;
          const dx = referenceCell.x - structure.footprint.x;
          const dz = referenceCell.z - structure.footprint.z;
          const distanceSq = dx * dx + dz * dz;
          const footprintRadiusSq = footprintRadius * footprintRadius;
          if (distanceSq > footprintRadiusSq) continue;
          const radialFalloff = 1 - distanceSq / footprintRadiusSq;
          const falloff = 0.35 + radialFalloff * 0.65;
          const inputUse = limitingInputUse(
            fields,
            transformation,
            referenceCell.index,
          );
          if (inputUse <= 0) continue;
          const emission =
            transformation.rate * transformation.intensity * inputUse * falloff;
          if (emission <= 0) continue;

          for (const outputElement of outputElements) {
            const share = transformation.outputs[outputElement] ?? 0;
            if (share <= 0) continue;
            const targetCell = fields[outputElement].cells[referenceCell.index];
            if (!targetCell?.inside) continue;
            targetCell.supply += emission * share;
            targetCell.contributors.push(
              `${structure.id}:${transformation.id}`,
            );
            emitted = true;
          }
        }
      }
    }
  }

  return emitted;
}

export function resolveIntegrationScene(
  scene: IntegrationSceneState,
  time = scene.year,
): IntegrationSceneReading {
  const key = cacheKey(scene, time);
  const cached = readingCache.get(key);
  if (cached) {
    cacheHits += 1;
    return cached;
  }
  cacheMisses += 1;

  const context: ElementContext = {
    grid: scene.grid,
    structures: scene.structures,
    environment: scene.environment,
  };

  const fields = {} as IntegrationSceneReading["fields"];
  const elements = {} as IntegrationSceneReading["elements"];

  for (const element of RESOLVE_ORDER) {
    fields[element] = resolveElement(element, context);
  }

  for (let pass = 0; pass < TRANSFORMATION_PASS_COUNT; pass++) {
    const emitted = applyTransformationPass(fields, context.structures);
    if (!emitted) break;
    for (const element of RESOLVE_ORDER) {
      fields[element] = resolveExistingField(element, fields[element]);
    }
  }

  for (const element of RESOLVE_ORDER) {
    elements[element] = ELEMENT_MODULES[element].measure(fields[element]);
  }

  const bundledElements = applyElementBundles(
    elements,
    fields,
    context.structures,
    context.environment,
  );
  for (const element of ELEMENT_IDS) {
    elements[element] = bundledElements[element];
  }

  let weightedIntegration = 0;
  let totalSupply = 0;
  let totalUse = 0;
  for (const element of ELEMENT_IDS) {
    const reading = elements[element];
    weightedIntegration += reading.integration * reading.totalSupply;
    totalSupply += reading.totalSupply;
    totalUse += reading.totalUse;
  }

  const overallIntegration =
    totalSupply <= 0 ? 0 : roundReading(weightedIntegration / totalSupply);
  const closure = totalSupply <= 0 ? 0 : roundReading(totalUse / totalSupply);
  const reading: IntegrationSceneReading = {
    sceneId: scene.id,
    sceneHash: scene.hash,
    year: time,
    fields,
    elements,
    overallIntegration,
    score: overallIntegration,
    closure,
  };

  readingCache.set(key, reading);
  return reading;
}

export function clearIntegrationSceneCache(): void {
  readingCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

export function getIntegrationSceneCacheStats(): {
  size: number;
  hits: number;
  misses: number;
} {
  return {
    size: readingCache.size,
    hits: cacheHits,
    misses: cacheMisses,
  };
}

export { RESOLVE_ORDER };
