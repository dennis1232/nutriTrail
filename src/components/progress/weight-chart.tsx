"use client";

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type WeightChartProps = {
  entries: { date: string; weightKg: number }[];
};

export function WeightChart({ entries }: WeightChartProps) {
  if (entries.length < 2) {
    return (
      <p className="text-sm text-zinc-500">
        Log at least two weight entries to see a trend chart.
      </p>
    );
  }

  return (
    <div className="h-48 w-full" role="img" aria-label="Weight over time chart">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={entries}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
          <Tooltip />
          <Line type="monotone" dataKey="weightKg" stroke="currentColor" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
