import {
  forwardRef,
  lazy,
  Suspense,
  useImperativeHandle,
  useMemo,
  useRef,
} from "react";
import type { FlatPanoramicViewerHandle } from "./FlatPanoramicViewer";
import type { EquirectangularViewerHandle } from "./EquirectangularViewer";
import type { Scene3DViewerHandle } from "./scene3d/Scene3DViewer";
import { percentToYawPitch, yawPitchToPercent } from "./sphericalMath";
import type {
  PanoramaProjection,
  PanoramicViewerHandle,
  PickedCoordinate,
  TourHotspotV2,
  ViewerFocusTarget,
} from "./types";
import type { ControlsLegendAction } from "../ControlsLegend";

const FlatPanoramicViewer = lazy(() => import("./FlatPanoramicViewer"));
const EquirectangularViewer = lazy(() => import("./EquirectangularViewer"));
const Scene3DViewer = lazy(() => import("./scene3d/Scene3DViewer"));

interface PanoramicViewerProps {
  imageSrc: string;
  projection?: PanoramaProjection;
  hotspots: TourHotspotV2[];
  activeHotspotId?: string | null;
  onHotspotSelect?: (hotspotId: string) => void;
  onBackgroundSelect?: () => void;
  onCoordinatePick?: (point: PickedCoordinate) => void;
  tourAction?: ControlsLegendAction | null;
  autoPanHint?: boolean;
  showControlsLegend?: boolean;
  className?: string;
}

function PanoramicViewerChunkFallback({ className }: { className?: string }) {
  return (
    <div
      className={`relative z-10 min-h-0 flex-1 overflow-hidden rounded-2xl border border-emerald-200/25 bg-[rgba(5,11,8,0.88)] ${className ?? ""}`.trim()}
    />
  );
}

const PanoramicViewer = forwardRef<PanoramicViewerHandle, PanoramicViewerProps>(
  function PanoramicViewer(
    {
      imageSrc,
      projection = "flat",
      hotspots,
      activeHotspotId = null,
      onHotspotSelect,
      onBackgroundSelect,
      onCoordinatePick,
      tourAction = null,
      autoPanHint = true,
      showControlsLegend = true,
      className,
    },
    ref,
  ) {
    const flatViewerRef = useRef<FlatPanoramicViewerHandle | null>(null);
    const equirectViewerRef = useRef<EquirectangularViewerHandle | null>(null);
    const scene3dViewerRef = useRef<Scene3DViewerHandle | null>(null);

    const flatHotspots = useMemo(
      () =>
        hotspots.map((hotspot) => {
          const fallbackPercent =
            hotspot.position.projection === "equirectangular"
              ? yawPitchToPercent(hotspot.position.yaw, hotspot.position.pitch)
              : null;
          const percent =
            hotspot.position.projection === "flat"
              ? {
                  x: hotspot.position.x,
                  y: hotspot.position.y,
                }
              : {
                  x: hotspot.position.x ?? fallbackPercent?.x ?? 50,
                  y: hotspot.position.y ?? fallbackPercent?.y ?? 50,
                };

          return {
            id: hotspot.id,
            speciesName: hotspot.speciesName,
            shortLabel: hotspot.shortLabel,
            x: percent.x,
            y: percent.y,
          };
        }),
      [hotspots],
    );

    const equirectHotspots = useMemo(
      () =>
        hotspots.map((hotspot): TourHotspotV2 => {
          if (hotspot.position.projection === "equirectangular") {
            return hotspot;
          }

          const spherical = percentToYawPitch(
            hotspot.position.x,
            hotspot.position.y,
          );

          return {
            ...hotspot,
            position: {
              projection: "equirectangular",
              yaw: spherical.yaw,
              pitch: spherical.pitch,
              x: hotspot.position.x,
              y: hotspot.position.y,
            },
          };
        }),
      [hotspots],
    );

    useImperativeHandle(
      ref,
      () => ({
        focusHotspot: (target: ViewerFocusTarget, options) => {
          if (projection === "scene3d") {
            if (target.projection === "flat") {
              scene3dViewerRef.current?.focusHotspot(
                { x: target.x, y: target.y, hotspotId: target.hotspotId },
                options,
              );
              return;
            }

            const converted = yawPitchToPercent(target.yaw, target.pitch);
            scene3dViewerRef.current?.focusHotspot(
              { x: converted.x, y: converted.y },
              options,
            );
            return;
          }

          if (projection === "flat") {
            if (target.projection === "flat") {
              flatViewerRef.current?.focusHotspot(target.x, options);
              return;
            }

            const converted = yawPitchToPercent(target.yaw, target.pitch);
            flatViewerRef.current?.focusHotspot(converted.x, options);
            return;
          }

          if (target.projection === "equirectangular") {
            equirectViewerRef.current?.focusHotspot(
              target.yaw,
              target.pitch,
              options,
            );
            return;
          }

          const converted = percentToYawPitch(target.x, 50);
          equirectViewerRef.current?.focusHotspot(
            converted.yaw,
            converted.pitch,
            options,
          );
        },
        resetView: () => {
          if (projection === "scene3d") {
            scene3dViewerRef.current?.resetView();
            return;
          }

          if (projection === "flat") {
            flatViewerRef.current?.resetView();
            return;
          }

          equirectViewerRef.current?.resetView();
        },
      }),
      [projection],
    );

    if (projection === "scene3d") {
      return (
        <Suspense
          fallback={<PanoramicViewerChunkFallback className={className} />}
        >
          <Scene3DViewer
            ref={scene3dViewerRef}
            imageSrc={imageSrc}
            hotspots={flatHotspots}
            activeHotspotId={activeHotspotId}
            onHotspotSelect={onHotspotSelect}
            onBackgroundSelect={onBackgroundSelect}
            onCoordinatePick={onCoordinatePick}
            tourAction={tourAction}
            autoPanHint={autoPanHint}
            showControlsLegend={showControlsLegend}
            className={className}
          />
        </Suspense>
      );
    }

    if (projection === "equirectangular") {
      return (
        <Suspense
          fallback={<PanoramicViewerChunkFallback className={className} />}
        >
          <EquirectangularViewer
            ref={equirectViewerRef}
            imageSrc={imageSrc}
            hotspots={equirectHotspots}
            activeHotspotId={activeHotspotId}
            onHotspotSelect={onHotspotSelect}
            onBackgroundSelect={onBackgroundSelect}
            onCoordinatePick={onCoordinatePick}
            tourAction={tourAction}
            autoPanHint={autoPanHint}
            showControlsLegend={showControlsLegend}
            className={className}
          />
        </Suspense>
      );
    }

    return (
      <Suspense
        fallback={<PanoramicViewerChunkFallback className={className} />}
      >
        <FlatPanoramicViewer
          ref={flatViewerRef}
          imageSrc={imageSrc}
          hotspots={flatHotspots}
          activeHotspotId={activeHotspotId}
          onHotspotSelect={onHotspotSelect}
          onBackgroundSelect={onBackgroundSelect}
          onCoordinatePick={(point) => onCoordinatePick?.(point)}
          tourAction={tourAction}
          autoPanHint={autoPanHint}
          showControlsLegend={showControlsLegend}
          className={className}
        />
      </Suspense>
    );
  },
);

export default PanoramicViewer;
