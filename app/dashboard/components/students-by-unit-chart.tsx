"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts";

const UNIT_COLORS: Record<string, string> = {
  TK: "#60a5fa",
  SD: "#34d399",
  SMP: "#f59e0b",
  SMA: "#f97316",
  LPI: "#a78bfa",
};

interface UnitData {
  unit: string;
  count: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200">{label}</p>
      <p className="text-slate-500 dark:text-slate-400">{payload[0].value} murid aktif</p>
    </div>
  );
}

export default function StudentsByUnitChart({ data }: { data: UnitData[] }) {
  const unitOrder = ["TK", "SD", "SMP", "SMA", "LPI"];
  const sorted = [...data].sort(
    (a, b) => unitOrder.indexOf(a.unit) - unitOrder.indexOf(b.unit)
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
        Murid per Unit Pendidikan
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Murid aktif per jenjang</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={sorted} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
          <XAxis
            dataKey="unit"
            tick={{ fontSize: 12, fill: "#94a3b8" }}
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={52}>
            {sorted.map((entry) => (
              <Cell
                key={entry.unit}
                fill={UNIT_COLORS[entry.unit] ?? "#94a3b8"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
