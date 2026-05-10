"use client";

import { Users, Receipt, CheckCircle2, AlertCircle } from "lucide-react";
import { formatRupiah } from "@/lib/format";

interface KpiCardsProps {
  activeStudents: number;
  thisMonthTotal: number;
  thisMonthPaid: number;
  unpaidCount: number;
}

export default function KpiCards({
  activeStudents,
  thisMonthTotal,
  thisMonthPaid,
  unpaidCount,
}: KpiCardsProps) {
  const cards = [
    {
      title: "Murid Aktif",
      value: activeStudents.toLocaleString("id-ID"),
      suffix: "murid",
      icon: Users,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-50 dark:bg-blue-950/40",
      valueColor: "text-blue-700 dark:text-blue-300",
    },
    {
      title: "Tagihan Bulan Ini",
      value: formatRupiah(thisMonthTotal),
      suffix: "",
      icon: Receipt,
      iconColor: "text-orange-600 dark:text-orange-400",
      iconBg: "bg-orange-50 dark:bg-orange-950/40",
      valueColor: "text-orange-700 dark:text-orange-300",
    },
    {
      title: "Terbayar Bulan Ini",
      value: formatRupiah(thisMonthPaid),
      suffix: "",
      icon: CheckCircle2,
      iconColor: "text-[#1a7a4a] dark:text-green-400",
      iconBg: "bg-green-50 dark:bg-green-950/40",
      valueColor: "text-[#1a7a4a] dark:text-green-400",
    },
    {
      title: "Belum Dibayar",
      value: unpaidCount.toLocaleString("id-ID"),
      suffix: "tagihan",
      icon: AlertCircle,
      iconColor: "text-red-600 dark:text-red-400",
      iconBg: "bg-red-50 dark:bg-red-950/40",
      valueColor: "text-red-700 dark:text-red-300",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700"
          >
            <div className={`inline-flex p-2.5 rounded-xl ${card.iconBg} mb-3`}>
              <Icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
              {card.title}
            </p>
            <p className={`text-lg font-bold leading-tight ${card.valueColor}`}>
              {card.value}
            </p>
            {card.suffix && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {card.suffix}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
