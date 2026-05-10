"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Dot,
} from "recharts";

interface NewStudentsData {
  month: string;
  label: string;
  count: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200">{label}</p>
      <p className="text-[#1a7a4a] dark:text-green-400">{payload[0].value} murid baru</p>
    </div>
  );
}

export default function NewStudentsChart({ data }: { data: NewStudentsData[] }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
        Murid Baru per Bulan
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        Tren pendaftaran 12 bulan terakhir
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
            width={32}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#e2e8f0" }} />
          <Line
            type="monotone"
            dataKey="count"
            stroke="#1a7a4a"
            strokeWidth={2.5}
            dot={<Dot r={4} fill="#1a7a4a" stroke="#fff" strokeWidth={2} />}
            activeDot={{ r: 6, fill: "#1a7a4a", stroke: "#fff", strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
