"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, Suspense } from "react";
import { Heart, CheckCircle2, Loader2, ArrowLeft } from "lucide-react";

const AMOUNTS = [10000, 25000, 50000, 100000, 200000, 500000];

function SedekahContent() {
  const params = useSearchParams();
  const router = useRouter();

  const orderId = params.get("order_id") ?? "";
  const transactionStatus = params.get("transaction_status") ?? "";

  const isSedekahDone = orderId.startsWith("SEDEKAH-") &&
    ["settlement", "capture", "success"].includes(transactionStatus);

  const isSppDone = orderId.startsWith("INV-");

  const [selectedAmount, setSelectedAmount] = useState(10000);
  const [customAmount, setCustomAmount] = useState("");
  const [useCustom, setUseCustom] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSedekah = async () => {
    const amount = useCustom ? Number(customAmount.replace(/\D/g, "")) : selectedAmount;
    if (!amount || amount < 10000) { alert("Nominal minimal Rp 10.000"); return; }
    try {
      setLoading(true);
      const res = await fetch("/api/payment/midtrans/sedekah", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      alert("Gagal: " + err.message);
      setLoading(false);
    }
  };

  if (isSedekahDone) {
    return (
      <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-10 flex flex-col items-center text-center">
          <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#1a7a4a]" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Jazakallah Khairan!</h1>
          <p className="text-slate-500 text-sm leading-relaxed mb-8">
            Sedekah Anda telah diterima. Semoga menjadi amal jariyah yang terus mengalir.
          </p>
          <button
            onClick={() => router.push("/portal/invoices")}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#1a7a4a] hover:bg-[#15603b] text-white font-semibold text-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f4f6f8] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center text-center mb-8">
          <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-[#1a7a4a] fill-current" />
          </div>
          {isSppDone ? (
            <>
              <h1 className="text-2xl font-bold text-slate-800">Alhamdulillah!</h1>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                Pembayaran SPP berhasil. Yuk lengkapi dengan sedekah — kebaikan kecil bisa berdampak besar.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-slate-800">Yuk Bersedekah</h1>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed">
                Pilih nominal sedekah Anda. Setiap rupiah adalah kebaikan yang dicatat.
              </p>
            </>
          )}
        </div>

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Pilih nominal sedekah
        </p>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => { setSelectedAmount(amt); setUseCustom(false); }}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                !useCustom && selectedAmount === amt
                  ? "border-[#1a7a4a] bg-green-50 text-[#1a7a4a]"
                  : "border-slate-200 text-slate-600 hover:border-green-300"
              }`}
            >
              {(amt / 1000).toLocaleString("id-ID")}rb
            </button>
          ))}
        </div>

        <div
          onClick={() => setUseCustom(true)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-text transition-all mb-6 ${
            useCustom ? "border-[#1a7a4a] bg-green-50" : "border-slate-200"
          }`}
        >
          <span className="text-sm text-slate-500 whitespace-nowrap">Rp</span>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Nominal lainnya..."
            className="flex-1 bg-transparent text-sm text-slate-800 outline-none placeholder-slate-300"
            value={customAmount}
            onFocus={() => setUseCustom(true)}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              setCustomAmount(raw ? Number(raw).toLocaleString("id-ID") : "");
            }}
          />
        </div>

        <div className="flex flex-col gap-2">
          <button
            onClick={handleSedekah}
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-[#1a7a4a] hover:bg-[#15603b] text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-green-900/20 disabled:opacity-50"
          >
            {loading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
              : <><Heart className="w-4 h-4 fill-current" /> Sedekah Sekarang</>
            }
          </button>
          <button
            onClick={() => router.push("/portal/invoices")}
            className="w-full py-3 rounded-xl text-slate-500 text-sm font-medium hover:text-slate-700 transition-colors"
          >
            Lewati
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SedekahPage() {
  return (
    <Suspense>
      <SedekahContent />
    </Suspense>
  );
}
