"use client";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
export default function FocusChart({ data }: { data: { day: string; hours: number }[] }) {
  return (
    <div className="h-48">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 0, left: -24, bottom: 0 }}>
          <XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "rgb(113 131 153)", fontSize: 12 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "rgb(113 131 153)", fontSize: 12 }} allowDecimals />
          <Tooltip cursor={{ fill: "rgb(198 225 250 / .35)" }} formatter={(v: number) => [`${v} h`, "Focus"]} contentStyle={{ borderRadius: 12, border: "1px solid rgb(198 225 250)" }} />
          <Bar dataKey="hours" fill="#8CBCEB" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
