"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export type TrendPoint = { label: string; value: number };

export default function LineTrend({
  data,
  yLabel,
}: {
  data: TrendPoint[];
  yLabel?: string;
}) {
  return (
    <div className="pb-3">
      <div className="h-60">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 18 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                borderRadius: 12,
                borderColor: "#e5e7eb",
                boxShadow: "0 10px 35px rgba(0,0,0,0.08)",
              }}
            />
            <Line
              type="monotone"
              dataKey="value"
              strokeWidth={3}
              stroke="#111827"
              dot={{ strokeWidth: 2, r: 4, stroke: "#111827", fill: "#fff" }}
              activeDot={{ r: 5, fill: "#111827" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {yLabel ? <div className="mt-2 text-xs text-gray-500">{yLabel}</div> : null}
    </div>
  );
}
