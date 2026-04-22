"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function UnauthorizedPage() {
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f6f8] dark:bg-slate-950 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 p-10 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-red-50 dark:bg-red-950/40 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Akses Ditolak</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8">
          Anda tidak memiliki izin untuk mengakses halaman ini.
          Halaman dashboard hanya dapat diakses oleh <strong className="text-slate-700 dark:text-slate-300">Administrator</strong>.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleLogout}
            className="w-full py-3 bg-[#1a7a4a] text-white font-bold rounded-xl hover:bg-[#15603b] transition-all"
          >
            Logout & Kembali ke Login
          </button>
          <button
            onClick={() => router.back()}
            className="w-full py-3 text-slate-600 dark:text-slate-400 font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            Kembali
          </button>
        </div>
      </div>
    </div>
  );
}
