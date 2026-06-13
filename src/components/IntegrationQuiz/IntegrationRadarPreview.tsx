import { useEffect, useMemo, useState } from "react";
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { DOMAIN_LABELS, DOMAIN_ORDER, type DomainId } from "./types";
import { getRadarPalette } from "./radarPalette";

interface IntegrationRadarPreviewProps {
  layer1Scores: Record<DomainId, number>;
  layer2Scores: Record<DomainId, number>;
  isDarkMode: boolean;
}

const PREVIEW_CYCLE_MS = 1500;
const PREVIEW_JITTER = 1.5;
const MIN_SCORE = 0;
const MAX_SCORE = 10;

function clampScore(value: number): number {
  return Math.max(MIN_SCORE, Math.min(MAX_SCORE, value));
}

function nextPreviewScore(current: number, base: number): number {
  const drift = (base - current) * 0.28;
  const jitter = (Math.random() * 2 - 1) * PREVIEW_JITTER;
  return clampScore(current + drift + jitter);
}

export default function IntegrationRadarPreview({
  layer1Scores,
  layer2Scores,
  isDarkMode,
}: IntegrationRadarPreviewProps) {
  const [animatedLayer1Scores, setAnimatedLayer1Scores] =
    useState(layer1Scores);
  const [animatedLayer2Scores, setAnimatedLayer2Scores] =
    useState(layer2Scores);

  useEffect(() => {
    setAnimatedLayer1Scores(layer1Scores);
    setAnimatedLayer2Scores(layer2Scores);
  }, [layer1Scores, layer2Scores]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setAnimatedLayer1Scores((prev) => {
        const next: Record<DomainId, number> = { ...prev };
        DOMAIN_ORDER.forEach((domain, index) => {
          next[domain] =
            index === 0
              ? layer1Scores[domain]
              : nextPreviewScore(prev[domain], layer1Scores[domain]);
        });
        return next;
      });

      setAnimatedLayer2Scores((prev) => {
        const next: Record<DomainId, number> = { ...prev };
        DOMAIN_ORDER.forEach((domain, index) => {
          next[domain] =
            index === 0
              ? layer2Scores[domain]
              : nextPreviewScore(prev[domain], layer2Scores[domain]);
        });
        return next;
      });
    }, PREVIEW_CYCLE_MS);

    return () => window.clearInterval(intervalId);
  }, [layer1Scores, layer2Scores]);

  const data = useMemo(
    () =>
      DOMAIN_ORDER.map((domain) => ({
        domain: DOMAIN_LABELS[domain],
        internalCoherence: animatedLayer1Scores[domain],
        crossDomainFlow: animatedLayer2Scores[domain],
      })),
    [animatedLayer1Scores, animatedLayer2Scores],
  );

  const radarPalette = getRadarPalette(isDarkMode);

  return (
    <div
      className="h-[280px] w-full sm:h-[360px] lg:h-[420px]"
      aria-label="Integration sample radar chart"
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
            dataKey="crossDomainFlow"
            stroke={radarPalette.crossDomainStroke}
            fill={radarPalette.crossDomainFill}
            strokeWidth={2.1}
            fillOpacity={1}
            isAnimationActive
            animationDuration={1400}
            animationEasing="ease-in-out"
          />
          <Radar
            dataKey="internalCoherence"
            stroke={radarPalette.internalStroke}
            fill={radarPalette.internalFill}
            strokeWidth={2}
            fillOpacity={1}
            isAnimationActive
            animationDuration={1400}
            animationEasing="ease-in-out"
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
