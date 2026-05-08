"use client";

import { useEffect, useState, useMemo } from "react";
import {
  Search,
  CheckCircle2,
  Clock,
  Filter,
  CreditCard,
  Receipt,
  GraduationCap,
  ChevronRight,
  TrendingUp,
  Banknote,
  X,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toTitleCase } from "@/lib/format";

declare global {
  interface Window {
    snap: any;
  }
}

interface Student {
  id: string;
  fullname: string;
  unit: string;
  grade: string;
}

interface Invoice {
  id: string;
  description: string;
  amount: number;
  status: string;
  created_at: string;
  due_date: string;
  student: Student;
}

type TabType = "all" | "unpaid" | "pending" | "succeed" | "failed";


export default function InvoicesListPage() {
  const supabase = createClient();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("unpaid");
  const [searchQuery, setSearchQuery] = useState("");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [invoiceToMark, setInvoiceToMark] = useState<Invoice | null>(null);


  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select(`*, students (*)`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mappedInvoices: Invoice[] = (data || []).map((inv: any) => ({
        id: inv.id,
        description: inv.description,
        amount: inv.amount,
        status: inv.status,
        created_at: inv.created_at,
        due_date: inv.due_date,
        student: {
          id: inv.students.id,
          fullname: inv.students.fullname,
          unit: inv.students.unit,
          grade: inv.students.grade,
        }
      }));

      setInvoices(mappedInvoices);
    } catch (err: any) {
      console.error("Error fetching invoices:", err);
      alert("Gagal memuat data invoice: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePayOnline = async (invoiceId: string) => {
    try {
      setLoadingId(invoiceId);

      const response = await fetch("/api/payment/midtrans/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal mendapatkan token pembayaran");
      }

      window.location.href = data.redirectUrl;
    } catch (err: any) {
      console.error("Error making online payment:", err);
      alert("Kesalahan: " + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const initiateMarkAsPaidCash = (invoice: Invoice) => {
    setInvoiceToMark(invoice);
    setShowConfirmModal(true);
  };

  const handleConfirmMarkAsPaidCash = async () => {
    if (!invoiceToMark) return;

    setLoadingId(invoiceToMark.id);
    setShowConfirmModal(false);

    try {
      const { error } = await supabase
        .from("invoices")
        .update({ status: "PAID", payment_method: "cash" })
        .eq("id", invoiceToMark.id);

      if (error) throw error;

      await fetchInvoices();
      setInvoiceToMark(null);
    } catch (err: any) {
      console.error("Error updating invoice:", err);
      alert("Gagal memperbarui status invoice: " + err.message);
    } finally {
      setLoadingId(null);
    }
  };

  const filteredInvoices = useMemo(() => {
    let filtered = invoices;

    if (activeTab !== "all") {
      filtered = filtered.filter((inv) => {
        const status = inv.status.toUpperCase();
        if (activeTab === "unpaid") return status === "UNPAID";
        if (activeTab === "pending") return status === "PENDING";
        if (activeTab === "succeed") return ["PAID", "SETTLED"].includes(status);
        if (activeTab === "failed") return ["FAILED", "EXPIRED", "CANCELLED"].includes(status);
        return false;
      });
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((inv) =>
        inv.description.toLowerCase().includes(q) ||
        inv.student.fullname.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [invoices, activeTab, searchQuery]);

  const stats = useMemo(() => {
    const unpaid = invoices
      .filter(i => i.status === "UNPAID" || i.status === "PENDING")
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    const paid = invoices
      .filter(i => ["PAID", "SETTLED"].includes(i.status))
      .reduce((acc, curr) => acc + Number(curr.amount), 0);
    return { unpaid, paid };
  }, [invoices]);

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "unpaid", label: "Belum Bayar", count: invoices.filter(i => i.status === "UNPAID").length },
    { id: "pending", label: "Menunggu", count: invoices.filter(i => i.status === "PENDING").length },
    { id: "succeed", label: "Berhasil", count: invoices.filter(i => ["PAID", "SETTLED"].includes(i.status)).length },
    { id: "failed", label: "Gagal", count: invoices.filter(i => ["FAILED", "EXPIRED", "CANCELLED"].includes(i.status)).length },
    { id: "all", label: "Semua", count: invoices.length },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Daftar Invoice</h1>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Kelola dan pantau status pembayaran seluruh tagihan sekolah.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Belum Dibayar</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Rp {stats.unpaid.toLocaleString("id-ID")}</p>
          </div>
          <div className="ml-auto text-amber-500 opacity-20">
            <TrendingUp className="w-12 h-12" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
          <div className="h-14 w-14 rounded-2xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center text-[#1a7a4a] dark:text-green-400">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Terbayar</p>
            <p className="text-2xl font-bold text-[#1a7a4a] dark:text-green-400 mt-1">Rp {stats.paid.toLocaleString("id-ID")}</p>
          </div>
          <div className="ml-auto text-[#1a7a4a] opacity-20">
            <Banknote className="w-12 h-12" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden mb-8">
        <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-800 rounded-xl w-full md:w-fit overflow-x-auto scrollbar-none">
            {tabs.map((tab) => (
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
                    ? "bg-green-100 dark:bg-green-950/60 text-[#1a7a4a] dark:text-green-400"
                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative group w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-4 h-4 transition-colors group-focus-within:text-[#1a7a4a]" />
            <input
              type="text"
              placeholder="Cari invoice atau nama..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
            <Loader2 className="w-8 h-8 text-[#1a7a4a] animate-spin mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Memuat data invoice...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
              <Filter className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Tidak ada data ditemukan</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-center max-w-xs">
              Coba gunakan filter lain atau ubah pencarian Anda.
            </p>
          </div>
        ) : (
          filteredInvoices.map((inv) => (
            <div
              key={inv.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-green-300 dark:hover:border-green-700 hover:shadow-lg group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl flex-shrink-0 ${
                  inv.status === "PAID"    ? "bg-green-50 dark:bg-green-950/40 text-[#1a7a4a] dark:text-green-400" :
                  inv.status === "PENDING" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400" :
                  inv.status === "UNPAID"  ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" :
                  "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                }`}>
                  <Receipt className="w-6 h-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-slate-800 dark:text-white group-hover:text-[#1a7a4a] dark:group-hover:text-green-400 transition-colors truncate">{inv.description}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      inv.status === "PAID"    ? "bg-green-100 dark:bg-green-950/60 text-[#1a7a4a] dark:text-green-400" :
                      inv.status === "PENDING" ? "bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400" :
                      inv.status === "UNPAID"  ? "bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400" :
                      "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                    }`}>
                      {inv.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 truncate">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span className="font-semibold text-slate-700 dark:text-slate-300 truncate">{toTitleCase(inv.student.fullname)}</span>
                      <span className="text-slate-300 dark:text-slate-600">|</span>
                      <span>{inv.student.grade} {inv.student.unit}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Due: <span className="font-medium text-slate-600 dark:text-slate-300">{new Date(inv.due_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end justify-between gap-4">
                <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">Rp {inv.amount.toLocaleString("id-ID")}</p>

                {inv.status !== "PAID" && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePayOnline(inv.id)}
                      disabled={loadingId === inv.id}
                      className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold hover:bg-black dark:hover:bg-slate-600 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      Bayar Online
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => initiateMarkAsPaidCash(inv)}
                      disabled={loadingId === inv.id}
                      className="px-4 py-2 rounded-xl border border-[#1a7a4a] dark:border-green-700 text-[#1a7a4a] dark:text-green-400 text-xs font-bold hover:bg-green-50 dark:hover:bg-green-950/40 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      Bayar Cash
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-700">
            <div className="p-8 pb-4 text-center">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 dark:text-white">Konfirmasi Pembayaran Cash</h3>
              <p className="text-slate-500 dark:text-slate-400 mt-2">
                Anda akan menandai tagihan <span className="font-bold text-slate-700 dark:text-slate-300">"{invoiceToMark?.description}"</span> untuk siswa <span className="font-bold text-slate-700 dark:text-slate-300">{invoiceToMark?.student.fullname ? toTitleCase(invoiceToMark.student.fullname) : ""}</span> sebagai LUNAS.
              </p>
            </div>

            <div className="px-8 pb-8 space-y-3">
              <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="text-sm text-slate-500 dark:text-slate-400">Nominal Lunas</span>
                <span className="text-lg font-bold text-green-700 dark:text-green-400">Rp {invoiceToMark?.amount.toLocaleString("id-ID")}</span>
              </div>

              <div className="flex items-center gap-3 mt-6">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3.5 rounded-2xl text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={handleConfirmMarkAsPaidCash}
                  className="flex-[2] py-3.5 rounded-2xl bg-[#1a7a4a] text-white font-bold shadow-lg shadow-green-600/20 hover:bg-[#15603b] active:scale-95 transition-all"
                >
                  Konfirmasi Lunas
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowConfirmModal(false)}
              className="absolute top-4 right-4 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
