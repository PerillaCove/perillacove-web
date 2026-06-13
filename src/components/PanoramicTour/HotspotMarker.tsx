import {
  PT_HOTSPOT_AMBER_RGB,
  PT_HOTSPOT_DOT_BACKGROUND,
  PT_HOTSPOT_ORANGE_RGB,
} from "./uiClasses";

interface MarkerHotspot {
  id: string;
  speciesName: string;
  shortLabel: string;
  x: number;
  y: number;
}

interface HotspotMarkerProps {
  hotspot: MarkerHotspot;
  isActive: boolean;
  isDimmed: boolean;
  forceGlow?: boolean;
  onSelect: (hotspotId: string) => void;
}

export default function HotspotMarker({
  hotspot,
  isActive,
  isDimmed,
  forceGlow = false,
  onSelect,
}: HotspotMarkerProps) {
  const dotShadow = forceGlow
    ? `0 0 0 1px rgba(${PT_HOTSPOT_AMBER_RGB},0.98),0 0 0 11px rgba(${PT_HOTSPOT_AMBER_RGB},0.24),0 0 26px rgba(${PT_HOTSPOT_ORANGE_RGB},0.82)`
    : isActive
      ? `0 0 0 1px rgba(${PT_HOTSPOT_AMBER_RGB},0.98),0 0 0 10px rgba(${PT_HOTSPOT_AMBER_RGB},0.24),0 0 24px rgba(${PT_HOTSPOT_ORANGE_RGB},0.78)`
      : `0 0 0 1px rgba(${PT_HOTSPOT_AMBER_RGB},0.9),0 0 0 8px rgba(${PT_HOTSPOT_AMBER_RGB},0.14),0 0 20px rgba(${PT_HOTSPOT_ORANGE_RGB},0.58)`;

  return (
    <button
      type="button"
      className={`group absolute inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 border-0 bg-transparent p-0 text-emerald-50 transition-opacity duration-200 ${isDimmed ? "opacity-[0.35]" : ""}`}
      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
      onPointerDown={(event) => {
        event.stopPropagation();
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(hotspot.id);
      }}
      aria-label={`${hotspot.speciesName} hotspot`}
      title={hotspot.shortLabel}
    >
      <span
        className="h-4 w-4 animate-pulse rounded-full motion-reduce:animate-none"
        style={{
          background: PT_HOTSPOT_DOT_BACKGROUND,
          boxShadow: dotShadow,
        }}
        aria-hidden="true"
      />
      <span
        className={`hidden whitespace-nowrap rounded-full border border-emerald-200/40 bg-[rgba(1,7,4,0.68)] px-[0.45rem] py-[0.18rem] text-[0.68rem] uppercase tracking-[0.04em] transition duration-150 md:inline ${
          isActive
            ? "translate-y-0 opacity-100"
            : "translate-y-px opacity-0 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
        }`}
      >
        {hotspot.shortLabel}
      </span>
    </button>
  );
}
