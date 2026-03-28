"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const PALETTE = ["#1B4D3E", "#64748B", "#C1440E", "#D4A574", "#334155", "#0f766e"];

export default function ZoneLinesBlock({
  baseScore,
  dimensionKeys,
}: {
  baseScore: number;
  dimensionKeys: string[];
}) {
  const keys = dimensionKeys.length
    ? dimensionKeys
    : ["social", "eco", "mobilite", "culture", "numerique"];

  const days = Array.from({ length: 30 }).map((_, i) => {
    const row: Record<string, number | string> = { day: `J${i + 1}` };
    keys.forEach((d, idx) => {
      row[d] = Math.min(
        100,
        Math.max(
          0,
          baseScore * 0.85 +
            Math.sin((i + idx) / 3) * 8 +
            (d.length % 5),
        ),
      );
    });
    return row;
  });

  return (
    <div style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={days}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 9 }} interval={4} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Legend />
          {keys.map((d, i) => (
            <Line
              key={d}
              type="monotone"
              dataKey={d}
              stroke={PALETTE[i % PALETTE.length]}
              dot={false}
              strokeWidth={1.5}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
