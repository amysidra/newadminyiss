"use client";

import React, { useEffect, useState } from "react";
import { CheckCircle2, Clock, Receipt, GraduationCap, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePortal } from "@/lib/context/PortalContext";
import Link from "next/link";

interface Stats {
  unpaidCount: number;
  unpaidTotal: number;
  paidTotal: number;
  studentCount: number;
}

export default function PortalDashboardPage() {
  const { profile } = usePortal();
  const supabase = React.useMemo(() => createClient(), []);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.guardianId) {
      setLoading(false);
      return;
    }

    async function fetchStats() {
      try {
        const { data: students } = await supabase
          .from("students")
          .select("id")
          .eq("guardian_id", profile!.guardianId);

        const studentIds = (students ?? []).map((s: any) => s.id);

        if (studentIds.length === 0) {
          setStats({ unpaidCount: 0, unpaidTotal: 0, paidTotal: 0, studentCount: 0 });
          return;
        }

        const { data: invoices } = await supabase
          .from("invoices")
          .select("amount, status")
          .in("student_id", studentIds);

        const list = invoices ?? [];
        const unpaidCount = list.filter(i => ["UNPAID", "PENDING"].includes(i.status)).length;
        const unpaidTotal = list
          .filter(i => ["UNPAID", "PENDING"].includes(i.status))
          .reduce((s, i) => s + Number(i.amount), 0);
        const paidTotal = list
          .filter(i => ["PAID", "SETTLED"].includes(i.status))
          .reduce((s, i) => s + Number(i.amount), 0);

        setStats({ unpaidCount, unpaidTotal, paidTotal, studentCount: studentIds.length });
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, [profile?.guardianId]);

  const displayName = profile?.first_name
    ? `${profile.first_name}${profile.last_name ? " " + profile.last_name : ""}`
    : "Wali Murid";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">
          Selamat Datang, {displayName}
        </h1>
        <p className="text-slate-500 mt-1">Pantau tagihan dan informasi putra/putri Anda.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#1a7a4a] animate-spin" />
        </div>
      ) : !profile?.guardianId ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-800">
          <p className="font-semibold">Akun Anda belum terhubung ke data wali murid.</p>
          <p className="text-sm mt-1">Silakan hubungi administrator sekolah untuk mengaitkan akun ini.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Tagihan Belum Bayar</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {stats?.unpaidCount ?? 0}
                </p>
                <p className="text-xs text-amber-600 font-semibold mt-0.5">
                  Rp {(stats?.unpaidTotal ?? 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center text-[#1a7a4a] flex-shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Total Terbayar</p>
                <p className="text-xl font-bold text-[#1a7a4a] mt-0.5">
                  Rp {(stats?.paidTotal ?? 0).toLocaleString("id-ID")}
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Jumlah Murid</p>
                <p className="text-2xl font-bold text-slate-900 mt-0.5">
                  {stats?.studentCount ?? 0}
                </p>
              </div>
            </div>
          </div>

          {(stats?.unpaidCount ?? 0) > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Receipt className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-800">
                    Ada {stats!.unpaidCount} tagihan yang belum dibayar
                  </p>
                  <p className="text-sm text-amber-700 mt-0.5">
                    Total: Rp {stats!.unpaidTotal.toLocaleString("id-ID")}
                  </p>
                </div>
              </div>
              <Link
                href="/portal/invoices"
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm font-bold rounded-xl transition-all flex-shrink-0"
              >
                Bayar Sekarang
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}
