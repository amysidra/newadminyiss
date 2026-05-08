"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Receipt, Clock, CheckCircle2, Filter, Search,
  CreditCard, GraduationCap, ChevronRight, Loader2,
  TrendingUp, Banknote,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePortal } from "@/lib/context/PortalContext";
import { toTitleCase } from "@/lib/format";

interface Student { id: string; fullname: string; unit: string; grade: string }
interface Invoice {
  id: string;
  description: string;
  amount: number;
  status: string;
  due_date: string;
  created_at: string;
  student: Student;
}

type TabType = "all" | "unpaid" | "pending" | "succeed" | "failed";

export default function PortalInvoicesPage() {
  const { profile } = usePortal();
  const supabase = React.useMemo(() => createClient(), []);

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("unpaid");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchInvoices = async () => {
    if (!profile?.guardianId) { setLoading(false); return; }

    try {
      setLoading(true);
      const { data: students } = await supabase
        .from("students")
        .select("id")
        .eq("guardian_id", profile.guardianId);

      const studentIds = (students ?? []).map((s: any) => s.id);
      if (studentIds.length === 0) { setInvoices([]); return; }

      const { data, error } = await supabase
        .from("invoices")
        .select("*, students(*)")
        .in("student_id", studentIds)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setInvoices((data ?? []).map((inv: any) => ({
        id: inv.id,
        description: inv.description,
        amount: inv.amount,
        status: inv.status,
        due_date: inv.due_date,
        created_at: inv.created_at,
        student: {
          id: inv.students.id,
          fullname: inv.students.fullname,
          unit: inv.students.unit,
          grade: inv.students.grade,
        },
      })));
    } catch (err: any) {
      console.error("Gagal memuat tagihan:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, [profile?.guardianId]);

  const handlePayOnline = async (invoiceId: string) => {
    try {
      setLoadingId(invoiceId);
      const res = await fetch("/api/payment/midtrans/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Gagal mendapatkan token");
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      alert("Kesalahan: " + err.message);
      setLoadingId(null);
    }
  };

  const filteredInvoices = useMemo(() => {
    let list = invoices;
    if (activeTab !== "all") {
      list = list.filter(inv => {
        const s = inv.status.toUpperCase();
        if (activeTab === "unpaid") return s === "UNPAID";
        if (activeTab === "pending") return s === "PENDING";
        if (activeTab === "succeed") return ["PAID", "SETTLED"].includes(s);
        if (activeTab === "failed") return ["FAILED", "EXPIRED", "CANCELLED"].includes(s);
        return false;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(inv =>
        inv.description.toLowerCase().includes(q) ||
        inv.student.fullname.toLowerCase().includes(q)
      );
    }
    return list;
  }, [invoices, activeTab, searchQuery]);

  const stats = useMemo(() => ({
    unpaid: invoices.filter(i => ["UNPAID","PENDING"].includes(i.status)).reduce((s,i) => s + Number(i.amount), 0),
    paid:   invoices.filter(i => ["PAID","SETTLED"].includes(i.status)).reduce((s,i) => s + Number(i.amount), 0),
  }), [invoices]);

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "unpaid",  label: "Belum Bayar", count: invoices.filter(i => i.status === "UNPAID").length },
    { id: "pending", label: "Menunggu",    count: invoices.filter(i => i.status === "PENDING").length },
    { id: "succeed", label: "Lunas",       count: invoices.filter(i => ["PAID","SETTLED"].includes(i.status)).length },
    { id: "failed",  label: "Gagal",       count: invoices.filter(i => ["FAILED","EXPIRED","CANCELLED"].includes(i.status)).length },
    { id: "all",     label: "Semua",       count: invoices.length },
  ];

  const statusStyle = (status: string) => {
    const s = status.toUpperCase();
    if (["PAID","SETTLED"].includes(s)) return { card: "bg-green-50 text-[#1a7a4a] dark:bg-green-950/40 dark:text-green-400", badge: "bg-green-100 text-[#1a7a4a] dark:bg-green-950/40 dark:text-green-400" };
    if (s === "PENDING") return { card: "bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400", badge: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400" };
    if (s === "UNPAID")  return { card: "bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400",   badge: "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400" };
    return { card: "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400", badge: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400" };
  };

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Tagihan SPP</h1>
        <p className="mt-1 text-slate-500 dark:text-slate-400">Pantau dan bayar tagihan putra/putri Anda.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Belum Dibayar</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Rp {stats.unpaid.toLocaleString("id-ID")}</p>
          </div>
          <div className="ml-auto text-amber-500 opacity-20"><TrendingUp className="w-12 h-12" /></div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-5">
          <div className="h-14 w-14 rounded-2xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center text-[#1a7a4a] dark:text-green-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Terbayar</p>
            <p className="text-2xl font-bold text-[#1a7a4a] dark:text-green-400 mt-1">Rp {stats.paid.toLocaleString("id-ID")}</p>
          </div>
          <div className="ml-auto text-[#1a7a4a] opacity-20"><Banknote className="w-12 h-12" /></div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-6">
        <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl w-fit overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white dark:bg-slate-700 text-[#1a7a4a] dark:text-green-400 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${
                  activeTab === tab.id
                    ? "bg-green-100 dark:bg-green-950/40 text-[#1a7a4a] dark:text-green-400"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative group w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari tagihan..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all text-sm placeholder-slate-400 dark:placeholder-slate-500"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Loader2 className="w-8 h-8 text-[#1a7a4a] animate-spin mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Memuat tagihan...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
              <Filter className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Tidak ada tagihan</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Semua bersih — tidak ada tagihan untuk filter ini.</p>
          </div>
        ) : (
          filteredInvoices.map(inv => {
            const style = statusStyle(inv.status);
            const isPaid = ["PAID","SETTLED"].includes(inv.status.toUpperCase());
            return (
              <div
                key={inv.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg group"
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-2xl flex-shrink-0 ${style.card}`}>
                    <Receipt className="w-6 h-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-[#1a7a4a] dark:group-hover:text-green-400 transition-colors truncate">
                        {inv.description}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${style.badge}`}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <GraduationCap className="w-3.5 h-3.5" />
                        <span className="font-semibold text-slate-700 dark:text-slate-200">{toTitleCase(inv.student.fullname)}</span>
                        <span className="text-slate-300 dark:text-slate-600">|</span>
                        <span>{inv.student.grade} {inv.student.unit}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Jatuh tempo: <span className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(inv.due_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                        </span></span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:items-end gap-3">
                  <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                    Rp {inv.amount.toLocaleString("id-ID")}
                  </p>
                  {!isPaid && (
                    <button
                      onClick={() => handlePayOnline(inv.id)}
                      disabled={loadingId === inv.id}
                      className="px-5 py-2.5 rounded-xl bg-[#1a7a4a] hover:bg-[#15603b] text-white text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-50 shadow-md shadow-green-900/10"
                    >
                      {loadingId === inv.id
                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
                        : <><CreditCard className="w-4 h-4" /> Bayar Online <ChevronRight className="w-3 h-3" /></>
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
