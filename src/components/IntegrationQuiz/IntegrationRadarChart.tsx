import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { DOMAIN_LABELS, DOMAIN_ORDER, type DomainId } from "./types";
import { getRadarPalette } from "./radarPalette";

interface IntegrationRadarChartProps {
  layer1Scores: Record<DomainId, number>;
  layer2Scores: Record<DomainId, number>;
  isDarkMode: boolean;
  className?: string;
}

export default function IntegrationRadarChart({
  layer1Scores,
  layer2Scores,
  isDarkMode,
  className,
}: IntegrationRadarChartProps) {
  const data = DOMAIN_ORDER.map((domain) => ({
    domain: DOMAIN_LABELS[domain],
    internalCoherence: layer1Scores[domain],
    crossDomainFlow: layer2Scores[domain],
  }));

  const radarPalette = getRadarPalette(isDarkMode);

  return (
    <div
      className={className ?? "h-[340px] w-full sm:h-[420px]"}
      aria-label="Integration quiz radar chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart
          data={data}
          margin={{ top: 18, right: 18, bottom: 14, left: 18 }}
        >
          <PolarGrid stroke={radarPalette.gridColor} />
          <PolarAngleAxis
            dataKey="domain"
            tick={{ fill: radarPalette.axisColor, fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 10]}
            tick={{ fill: radarPalette.axisColor, fontSize: 10 }}
            tickCount={6}
          />

          <Radar
            name="Cross-Domain"
            dataKey="crossDomainFlow"
            stroke={radarPalette.crossDomainStroke}
            fill={radarPalette.crossDomainFill}
            strokeWidth={2.1}
            fillOpacity={1}
            isAnimationActive={false}
          />
          <Radar
            name="Internal"
            dataKey="internalCoherence"
            stroke={radarPalette.internalStroke}
            fill={radarPalette.internalFill}
            strokeWidth={2}
            fillOpacity={1}
            isAnimationActive={false}
          />
          <Legend
            wrapperStyle={{
              fontSize: "12px",
              color: radarPalette.axisColor,
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
