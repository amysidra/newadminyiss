"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { formatRupiah, formatRupiahShort } from "@/lib/format";

interface MonthlyData {
  month: string;
  label: string;
  total: number;
  paid: number;
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; fill: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl px-3 py-2.5 shadow-lg text-sm space-y-1">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-2">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.fill }} />
          <span className="text-slate-500 dark:text-slate-400 text-xs">
            {p.name === "total" ? "Total Tagihan" : "Terbayar"}:{" "}
          </span>
          <span className="font-medium text-slate-700 dark:text-slate-200 text-xs">
            {formatRupiah(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function InvoiceComparisonChart({ data }: { data: MonthlyData[] }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
        Tagihan vs Terbayar per Bulan
      </h3>
      <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
        Perbandingan total tagihan dengan pembayaran yang masuk
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
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
            tickFormatter={formatRupiahShort}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f8fafc" }} />
          <Legend
            formatter={(value) => (
              <span className="text-xs text-slate-600 dark:text-slate-300">
                {value === "total" ? "Total Tagihan" : "Terbayar"}
              </span>
            )}
          />
          <Bar dataKey="total" fill="#cbd5e1" radius={[4, 4, 0, 0]} maxBarSize={36} />
          <Bar dataKey="paid" fill="#1a7a4a" radius={[4, 4, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
