import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { ElementId, IntegrationSceneReading } from "../substrate/types";
import { ELEMENT_COLORS } from "../substrate/labels";
import { ELEMENT_IDS } from "../substrate/types";
import {
  clampIntegration,
  getOverallIntegrationColor,
} from "./integrationColors";

interface FieldOverlayProps {
  reading: IntegrationSceneReading;
  element: ElementId | null;
  isDarkMode: boolean;
  opacity?: number;
}

interface OverlayCell {
  key: number;
  x: number;
  z: number;
  size: number;
  color: THREE.Color;
  alpha: number;
}

interface CellVisualState {
  color: THREE.Color;
  alpha: number;
}

const FIELD_EASING_PER_SECOND = 7;

function colorDistance(a: THREE.Color, b: THREE.Color): number {
  const red = a.r - b.r;
  const green = a.g - b.g;
  const blue = a.b - b.b;
  return Math.sqrt(red * red + green * green + blue * blue);
}

function colorForValue(
  element: ElementId | null,
  value: number,
  isDarkMode: boolean,
): THREE.Color {
  const absoluteValue = clampIntegration(value);

  if (!element) {
    return new THREE.Color(getOverallIntegrationColor(absoluteValue));
  }

  const base = new THREE.Color(ELEMENT_COLORS[element]);
  const hsl = { h: 0, s: 0, l: 0 };
  base.getHSL(hsl);
  const saturation =
    (isDarkMode ? 0.34 : 0.28) + absoluteValue * Math.min(0.58, hsl.s + 0.12);
  const lightness = isDarkMode
    ? 0.18 + absoluteValue * 0.48
    : 0.34 + absoluteValue * 0.42;
  return new THREE.Color().setHSL(hsl.h, saturation, lightness);
}

export default function FieldOverlay({
  reading,
  element,
  isDarkMode,
  opacity = 0.7,
}: FieldOverlayProps) {
  const materialRefs = useRef(new Map<number, THREE.MeshBasicMaterial>());
  const visualStateRef = useRef(new Map<number, CellVisualState>());
  const targetCellsRef = useRef<OverlayCell[]>([]);
  const isAnimatingRef = useRef(false);

  const overlayCells = useMemo<OverlayCell[]>(() => {
    const referenceField = reading.fields.fire;
    const radius = referenceField.grid.radius;
    return referenceField.cells.map((cell) => {
      const value = clampIntegration(
        cell.inside && element
          ? (reading.fields[element].cells[cell.index]?.integration ?? 0)
          : cell.inside
            ? overallCellIntegration(reading, cell.index)
            : 0,
      );
      const edgeFeather = cell.size * 1.75;
      const distanceToEdge =
        cell.distanceToEdge ?? radius - cell.distanceFromCenter;
      const edgeAlpha = Math.max(
        0,
        Math.min(1, (distanceToEdge + cell.size * 0.45) / edgeFeather),
      );
      return {
        key: cell.index,
        x: cell.x,
        z: cell.z,
        size: cell.size * 0.94,
        color: colorForValue(element, value, isDarkMode),
        alpha:
          opacity *
          (isDarkMode ? 0.42 + value * 0.38 : 0.5 + value * 0.32) *
          edgeAlpha *
          (cell.domainWeight ?? (cell.inside ? 1 : 0)),
      };
    });
  }, [element, isDarkMode, opacity, reading]);

  useEffect(() => {
    targetCellsRef.current = overlayCells;
    isAnimatingRef.current = true;
  }, [overlayCells]);

  useFrame((_, deltaSeconds) => {
    if (!isAnimatingRef.current) return;

    const easing = 1 - Math.exp(-FIELD_EASING_PER_SECOND * deltaSeconds);
    let maxDelta = 0;

    for (const cell of targetCellsRef.current) {
      const material = materialRefs.current.get(cell.key);
      if (!material) continue;

      let current = visualStateRef.current.get(cell.key);
      if (!current) {
        current = {
          color: material.color.clone(),
          alpha: material.opacity,
        };
        visualStateRef.current.set(cell.key, current);
      }

      current.color.lerp(cell.color, easing);
      current.alpha += (cell.alpha - current.alpha) * easing;

      const colorDelta = colorDistance(current.color, cell.color);
      const alphaDelta = Math.abs(current.alpha - cell.alpha);
      maxDelta = Math.max(maxDelta, colorDelta, alphaDelta);

      if (colorDelta <= 0.001) current.color.copy(cell.color);
      if (alphaDelta <= 0.001) current.alpha = cell.alpha;

      material.color.copy(current.color);
      material.opacity = current.alpha;
    }

    if (maxDelta <= 0.001) {
      isAnimatingRef.current = false;
    }
  });

  return (
    // GroundPlane is displaced from about -0.03m to +0.05m, so the field layer
    // needs to sit above that terrain instead of coplanar with it. Otherwise the
    // cells depth-fight with the soil and appear only on part of the field.
    <group position={[0, 0.09, 0]}>
      {overlayCells.map((cell) => (
        <mesh
          key={cell.key}
          renderOrder={2}
          position={[cell.x, 0, cell.z]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[cell.size, cell.size]} />
          <meshBasicMaterial
            ref={(material) => {
              if (material) {
                materialRefs.current.set(cell.key, material);
              } else {
                materialRefs.current.delete(cell.key);
              }
            }}
            color={visualStateRef.current.get(cell.key)?.color ?? cell.color}
            transparent
            opacity={visualStateRef.current.get(cell.key)?.alpha ?? cell.alpha}
            toneMapped={false}
            depthWrite={false}
            polygonOffset
            polygonOffsetFactor={-2}
            polygonOffsetUnits={-2}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}

function overallCellIntegration(
  reading: IntegrationSceneReading,
  cellIndex: number,
): number {
  let weighted = 0;
  let weightTotal = 0;
  for (const elementId of ELEMENT_IDS) {
    const elementCell = reading.fields[elementId].cells[cellIndex];
    if (!elementCell) continue;
    const weight = Math.max(0, elementCell.supply);
    weighted += elementCell.integration * weight;
    weightTotal += weight;
  }

  if (weightTotal > 0) return weighted / weightTotal;

  return (
    ELEMENT_IDS.reduce(
      (sum, elementId) =>
        sum + (reading.fields[elementId].cells[cellIndex]?.integration ?? 0),
      0,
    ) / ELEMENT_IDS.length
  );
}
