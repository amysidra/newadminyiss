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
  UNPAID: "#f97316",
  PENDING: "#eab308",
  PAID: "#1a7a4a",
  SETTLED: "#15803d",
  FAILED: "#ef4444",
  EXPIRED: "#94a3b8",
  CANCELLED: "#64748b",
};

const STATUS_LABELS: Record<string, string> = {
  UNPAID: "Belum Bayar",
  PENDING: "Menunggu",
  PAID: "Dibayar",
  SETTLED: "Lunas",
  FAILED: "Gagal",
  EXPIRED: "Kadaluarsa",
  CANCELLED: "Dibatalkan",
};

interface InvoiceStatusData {
  status: string;
  count: number;
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: { name: string; value: number }[] }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2 shadow-lg text-sm">
      <p className="font-semibold text-slate-700 dark:text-slate-200">
        {STATUS_LABELS[name] ?? name}
      </p>
      <p className="text-slate-500 dark:text-slate-400">{value} tagihan</p>
    </div>
  );
}

export default function InvoiceStatusChart({ data }: { data: InvoiceStatusData[] }) {
  if (!data.length) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center justify-center h-[320px]">
        <p className="text-slate-400 dark:text-slate-500 text-sm">Belum ada data tagihan</p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: d.status,
    value: d.count,
    label: STATUS_LABELS[d.status] ?? d.status,
  }));

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
        Status Tagihan Saat Ini
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">Distribusi semua tagihan</p>
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
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {STATUS_LABELS[value] ?? value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
