"use client";

import React, { useEffect, useState, useMemo } from "react";
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
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
  walimurid_profile?: {
    fullname: string;
    phone: string;
  };
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
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [paymentSettings, setPaymentSettings] = useState<{
    clientKey: string;
    mode: "sandbox" | "production";
  } | null>(null);

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [invoiceToMark, setInvoiceToMark] = useState<Invoice | null>(null);

  // Load Midtrans Snap JS dynamically based on school's settings
  useEffect(() => {
    if (!paymentSettings?.clientKey) return;

    const scriptId = "midtrans-script";
    const existingScript = document.getElementById(scriptId);
    if (existingScript) {
        if (existingScript.getAttribute("data-client-key") === paymentSettings.clientKey) {
            return;
        }
        existingScript.remove();
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = paymentSettings.mode === "production"
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute("data-client-key", paymentSettings.clientKey);
    document.body.appendChild(script);
  }, [paymentSettings]);

  const fetchInvoices = async (sId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("invoices")
        .select(`
          *,
          students (*)
        `)
        .eq("school_id", sId)
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
          walimurid_profile: inv.students.walimurid_profile
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
    const init = async () => {
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) return;

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("school_id")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;
        
        let currentSchoolId = profile?.school_id;

        if (!currentSchoolId) {
          const { error: updateError } = await supabase
            .from("users")
            .update({ school_id: user.id })
            .eq("id", user.id);
          
          if (updateError) throw updateError;
          currentSchoolId = user.id;
        }

        if (currentSchoolId) {
          setSchoolId(currentSchoolId);
          fetchInvoices(currentSchoolId);

          const { data: paySettings } = await supabase
            .from("payment_settings")
            .select("midtrans_client_key, midtrans_mode")
            .eq("school_id", currentSchoolId)
            .single();
          
          if (paySettings?.midtrans_client_key) {
            setPaymentSettings({
              clientKey: paySettings.midtrans_client_key,
              mode: paySettings.midtrans_mode as "sandbox" | "production" || "sandbox"
            });
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Init error:", err);
        setLoading(false);
      }
    };

    init();
  }, [supabase]);

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

      const { token } = data;

      if (window.snap) {
        window.snap.pay(token, {
          onSuccess: (result: any) => {
            console.log("Payment Success:", result);
            setActiveTab("succeed");
            if (schoolId) {
              setTimeout(() => fetchInvoices(schoolId), 1500);
            }
          },
          onPending: (result: any) => {
            console.log("Payment Pending:", result);
            setActiveTab("pending");
            if (schoolId) fetchInvoices(schoolId);
          },
          onError: (result: any) => {
            console.error("Payment Error:", result);
          },
          onClose: () => {
            console.log("Customer closed the popup without finishing the payment");
          }
        });
      } else {
        throw new Error("Midtrans script not loaded yet. Please refresh.");
      }

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
        .update({ 
          status: "PAID",
          payment_method: "cash" 
        })
        .eq("id", invoiceToMark.id);

      if (error) throw error;

      if (schoolId) await fetchInvoices(schoolId);
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
        inv.student.fullname.toLowerCase().includes(q) ||
        inv.student.walimurid_profile?.fullname.toLowerCase().includes(q)
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
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Daftar Invoice</h1>
        <p className="mt-2 text-slate-500">Kelola dan pantau status pembayaran seluruh tagihan sekolah.</p>
      </header>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
          <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Belum Dibayar</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">Rp {stats.unpaid.toLocaleString("id-ID")}</p>
          </div>
          <div className="ml-auto text-amber-500 opacity-20">
            <TrendingUp className="w-12 h-12" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
          <div className="h-14 w-14 rounded-2xl bg-green-50 flex items-center justify-center text-[#1a7a4a]">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Terbayar</p>
            <p className="text-2xl font-bold text-[#1a7a4a] mt-1">Rp {stats.paid.toLocaleString("id-ID")}</p>
          </div>
          <div className="ml-auto text-[#1a7a4a] opacity-20">
             <Banknote className="w-12 h-12" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-50 rounded-xl w-fit overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-white text-[#1a7a4a] shadow-sm"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-1.5 py-0.5 rounded-md text-[10px] ${
                  activeTab === tab.id ? "bg-green-100 text-[#1a7a4a]" : "bg-slate-200 text-slate-600"
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative group w-full md:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 transition-colors group-focus-within:text-[#1a7a4a]" />
            <input
              type="text"
              placeholder="Cari invoice atau nama..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-4">
        {filteredInvoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
               <Filter className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">Tidak ada data ditemukan</h3>
            <p className="text-slate-500 mt-1 text-center max-w-xs">
              Coba gunakan filter lain atau ubah pencarian Anda.
            </p>
          </div>
        ) : (
          filteredInvoices.map((inv) => (
            <div 
              key={inv.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-all hover:border-green-300 hover:shadow-lg group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-2xl flex-shrink-0 ${
                  inv.status === "PAID" ? "bg-green-50 text-[#1a7a4a]" :
                  inv.status === "PENDING" ? "bg-amber-50 text-amber-600" :
                  inv.status === "UNPAID" ? "bg-blue-50 text-blue-600" :
                  "bg-rose-50 text-rose-600"
                }`}>
                  <Receipt className="w-6 h-6" />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-slate-800 group-hover:text-[#1a7a4a] transition-colors truncate">{inv.description}</h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      inv.status === "PAID" ? "bg-green-100 text-[#1a7a4a]" :
                      inv.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                      inv.status === "UNPAID" ? "bg-blue-100 text-blue-700" :
                      "bg-rose-100 text-rose-700"
                    }`}>
                      {inv.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-500 truncate">
                      <GraduationCap className="w-3.5 h-3.5" />
                      <span className="font-semibold text-slate-700 truncate">{inv.student.fullname}</span>
                      <span className="text-slate-300">|</span>
                      <span>{inv.student.grade} {inv.student.unit}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Due: <span className="font-medium">{new Date(inv.due_date).toLocaleDateString("id-ID", { day: 'numeric', month: 'short', year: 'numeric' })}</span></span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:items-end justify-between gap-4">
                <div className="text-right">
                   <p className="text-2xl font-black text-slate-900 leading-none">Rp {inv.amount.toLocaleString("id-ID")}</p>
                </div>
                
                {inv.status !== "PAID" && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handlePayOnline(inv.id)}
                      disabled={loadingId === inv.id}
                      className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-black transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      Bayar Online
                      <ChevronRight className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => initiateMarkAsPaidCash(inv)}
                      disabled={loadingId === inv.id}
                      className="px-4 py-2 rounded-xl border border-[#1a7a4a] text-[#1a7a4a] text-xs font-bold hover:bg-green-50 transition-all flex items-center gap-2 disabled:opacity-50"
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

      {/* Cash Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setShowConfirmModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 pb-4 text-center">
              <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Konfirmasi Pembayaran Cash</h3>
              <p className="text-slate-500 mt-2">
                Anda akan menandai tagihan <span className="font-bold text-slate-700">"{invoiceToMark?.description}"</span> untuk siswa <span className="font-bold text-slate-700">{invoiceToMark?.student.fullname}</span> sebagai LUNAS.
              </p>
            </div>
            
            <div className="px-8 pb-8 space-y-3">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <span className="text-sm text-slate-500">Nominal Lunas</span>
                <span className="text-lg font-bold text-green-700">Rp {invoiceToMark?.amount.toLocaleString("id-ID")}</span>
              </div>
              
              <div className="flex items-center gap-3 mt-6">
                <button 
                  onClick={() => setShowConfirmModal(false)}
                  className="flex-1 py-3.5 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all"
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
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
