"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function VolumeChart({
  data,
}: {
  data: { date: string; borrowed: number; returned: number }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="borrowed" fill="#0f172a" radius={[3, 3, 0, 0]} />
        <Bar dataKey="returned" fill="#94a3b8" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DurationChart({ data }: { data: { date: string; avgSeconds: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} unit="s" />
        <Tooltip />
        <Line type="monotone" dataKey="avgSeconds" stroke="#0f172a" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
