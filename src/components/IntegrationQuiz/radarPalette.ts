export interface RadarPalette {
  axisColor: string;
  gridColor: string;
  crossDomainStroke: string;
  crossDomainFill: string;
  internalStroke: string;
  internalFill: string;
}

export function getRadarPalette(isDarkMode: boolean): RadarPalette {
  if (isDarkMode) {
    return {
      axisColor: "rgba(191, 201, 216, 0.95)",
      gridColor: "rgba(129, 140, 156, 0.32)",
      crossDomainStroke: "#7fb4cc",
      crossDomainFill: "rgba(127, 180, 204, 0.22)",
      internalStroke: "#c6ad8a",
      internalFill: "rgba(198, 173, 138, 0.22)",
    };
  }

  return {
    axisColor: "#334155",
    gridColor: "rgba(51, 65, 85, 0.24)",
    crossDomainStroke: "#0369a1",
    crossDomainFill: "rgba(14, 116, 144, 0.2)",
    internalStroke: "#b45309",
    internalFill: "rgba(217, 119, 6, 0.22)",
  };
}
