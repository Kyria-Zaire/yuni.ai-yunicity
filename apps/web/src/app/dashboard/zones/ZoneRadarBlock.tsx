"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

type Dim = Record<string, { score: number; weight: number }>;

export default function ZoneRadarBlock({
  dimensions,
  zone,
}: {
  dimensions: Dim;
  zone: string;
}) {
  const data = Object.entries(dimensions).map(([name, v]) => ({
    dim: name,
    score: v.score,
    full: 100,
  }));

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid />
          <PolarAngleAxis dataKey="dim" tick={{ fontSize: 11 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
          <Radar
            name={zone}
            dataKey="score"
            stroke="#C1440E"
            fill="#C1440E"
            fillOpacity={0.35}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
