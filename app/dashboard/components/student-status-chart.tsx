"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const STATUS_COLORS: Record<string, string> = {
  Aktif: "#1a7a4a",
  Lulus: "#3b82f6",
  Keluar: "#ef4444",
};

interface StudentStatusData {
  status: string;
  count: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200">{payload[0].name}</p>
      <p className="text-slate-500 dark:text-slate-400">{payload[0].value} murid</p>
    </div>
  );
}

export default function StudentStatusChart({ data }: { data: StudentStatusData[] }) {
  if (!data.length) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center h-[320px]">
        <p className="text-slate-400 dark:text-slate-500 text-sm">Belum ada data murid</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({ name: d.status, value: d.count }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
        Status Murid
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Aktif, lulus, atau keluar</p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={95}
            paddingAngle={3}
          >
            {chartData.map((entry) => (
              <Cell
                key={entry.name}
                fill={STATUS_COLORS[entry.name] ?? "#94a3b8"}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
