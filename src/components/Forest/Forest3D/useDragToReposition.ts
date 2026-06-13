/**
 * DRAG-TO-REPOSITION HOOK
 *
 * Provides hold-to-drag plant repositioning in the 3D scene.
 *
 * STATE MACHINE:
 *   IDLE → onPointerDown → WAITING (hold timer starts)
 *     → pointer moves >5px before timer: CANCEL (orbit controls take over)
 *     → timer fires (300ms mouse / 500ms touch): DRAGGING
 *       → pointermove: raycast to Y=0 ground plane, update position via ref
 *       → pointerup: commit final position to React state, re-enable orbit
 *
 * PERFORMANCE: Ref-based position updates during drag (60fps, zero re-renders).
 * React state commit only on release via onDragEnd callback.
 *
 * TWO CONSUMERS:
 * - VolumeRenderer (single-instance): uses the `useDragToReposition` hook directly.
 *   The hook manages a `dragGroupRef` that points to the plant's root <group>.
 * - InstancedVolumeGroup (multi-instance): uses `createGroundRaycaster` utility
 *   only, with inline hold-to-drag logic, because InstancedMesh doesn't have
 *   per-instance group refs — drag position is applied via instance matrix in useFrame.
 *
 * EVENT PROPAGATION: Do NOT stopPropagation on pointerDown. R3F synthetic events
 * and OrbitControls DOM events travel separate paths. OrbitControls is disabled
 * via `enabled={false}` when dragging starts (managed in Forest3D/index.tsx).
 *
 * POST-DRAG HOVER FIX: After ref-based position mutations, R3F's internal hover
 * map is stale. `events.update?.()` in requestAnimationFrame forces a re-raycast
 * with the last-known pointer position.
 */

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

// ---- Ground plane raycasting utility ----
// Shared by both useDragToReposition (VolumeRenderer) and InstancedVolumeGroup.

/**
 * Creates a reusable function that raycasts pointer coordinates to the Y=0
 * ground plane. Returns {x, z} clamped within maxRadius circle.
 *
 * Pre-allocates THREE objects to avoid GC pressure during drag (called every pointermove).
 */
export function createGroundRaycaster(
  camera: THREE.Camera,
  canvas: HTMLCanvasElement,
) {
  const raycaster = new THREE.Raycaster();
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersection = new THREE.Vector3();
  const pointer = new THREE.Vector2();

  return function raycastToGround(
    clientX: number,
    clientY: number,
    maxRadius: number,
  ): { x: number; z: number } | null {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.ray.intersectPlane(groundPlane, intersection);
    if (!hit) return null;

    // Clamp within circular ground boundary
    const dist = Math.sqrt(hit.x * hit.x + hit.z * hit.z);
    if (dist > maxRadius) {
      const scale = maxRadius / dist;
      hit.x *= scale;
      hit.z *= scale;
    }

    return { x: hit.x, z: hit.z };
  };
}

// ---- Hook for single-instance drag (VolumeRenderer) ----
// For multi-instance drag (InstancedVolumeGroup), see the inline
// handlePointerDown in InstancedGLBGroup / InstancedDefaultGroup.

interface UseDragToRepositionOptions {
  groundRadius: number;
  onDragStart: () => void;
  onDragEnd: (position: { x: number; z: number }) => void;
  enabled?: boolean;
}

export function useDragToReposition({
  groundRadius,
  onDragStart,
  onDragEnd,
  enabled = true,
}: UseDragToRepositionOptions) {
  const { camera, gl, events } = useThree();
  const [isDragging, setIsDragging] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const dragGroupRef = useRef<THREE.Group | null>(null);
  const dragPositionRef = useRef<{ x: number; z: number } | null>(null);
  const justDraggedRef = useRef(false);

  // Refs for cleanup
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDraggingRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  const raycastToGround = useMemo(
    () => createGroundRaycaster(camera, gl.domElement),
    [camera, gl],
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      cleanupRef.current?.();
    };
  }, []);

  const handlePointerDown = useCallback(
    (e: ThreeEvent<PointerEvent>) => {
      if (!enabled) return;
      // Don't stop propagation — orbit controls use separate DOM events

      const startPos = {
        x: e.nativeEvent.clientX,
        y: e.nativeEvent.clientY,
      };
      const isTouchEvent = e.nativeEvent.pointerType === "touch";
      const delay = isTouchEvent ? 500 : 300;
      let holdFired = false;

      holdTimerRef.current = setTimeout(() => {
        holdFired = true;
        isDraggingRef.current = true;
        setIsDragging(true);
        setIsHolding(false);
        onDragStart();
        document.body.style.cursor = "grabbing";

        // Lift the plant
        if (dragGroupRef.current) {
          dragGroupRef.current.position.y = 0.3;
        }
      }, delay);

      setIsHolding(true);

      const onMove = (me: PointerEvent) => {
        if (!holdFired) {
          // If pointer moves more than 5px before timer fires, cancel (orbit takes over)
          if (
            Math.hypot(me.clientX - startPos.x, me.clientY - startPos.y) > 5
          ) {
            if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
            setIsHolding(false);
            cleanup();
          }
          return;
        }

        // Dragging — raycast to ground and update position via ref
        const pos = raycastToGround(me.clientX, me.clientY, groundRadius);
        if (pos && dragGroupRef.current) {
          dragGroupRef.current.position.x = pos.x;
          dragGroupRef.current.position.z = pos.z;
          dragPositionRef.current = pos;
        }
      };

      const onUp = () => {
        if (holdTimerRef.current) clearTimeout(holdTimerRef.current);

        if (holdFired && dragGroupRef.current) {
          const finalPos = dragPositionRef.current ?? {
            x: dragGroupRef.current.position.x,
            z: dragGroupRef.current.position.z,
          };
          // Reset Y lift
          dragGroupRef.current.position.y = 0;
          onDragEnd(finalPos);
          justDraggedRef.current = true;
          setTimeout(() => {
            justDraggedRef.current = false;
          }, 100);

          // Force R3F to re-raycast and update its internal hovered set.
          // R3F only raycasts on pointer events; after ref-based position
          // mutations, the hovered map is stale. events.update() re-raycasts
          // with the last-known pointer position.
          document.body.style.cursor = "";
          requestAnimationFrame(() => {
            events.update?.();
          });
        } else {
          document.body.style.cursor = "";
        }

        isDraggingRef.current = false;
        setIsDragging(false);
        setIsHolding(false);
        dragPositionRef.current = null;
        cleanup();
      };

      const onCancel = () => {
        onUp();
      };

      const onWindowBlur = () => {
        onUp();
      };

      const cleanup = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        window.removeEventListener("pointercancel", onCancel);
        window.removeEventListener("blur", onWindowBlur);
        cleanupRef.current = null;
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
      window.addEventListener("pointercancel", onCancel);
      window.addEventListener("blur", onWindowBlur);
      cleanupRef.current = cleanup;
    },
    [enabled, groundRadius, onDragStart, onDragEnd, raycastToGround, events],
  );

  return {
    handlePointerDown,
    isDragging,
    isHolding,
    dragGroupRef,
    dragPositionRef,
    justDraggedRef,
  };
}
