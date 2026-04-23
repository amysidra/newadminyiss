import { LayoutDashboard, MousePointer2 } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="h-[calc(100vh-160px)] flex flex-col items-center justify-center animate-in fade-in duration-700">
      <div className="relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-[#1a7a4a] to-green-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative bg-white dark:bg-slate-900 p-8 rounded-full shadow-xl">
          <LayoutDashboard className="w-16 h-16 text-[#1a7a4a] opacity-80" />
        </div>
      </div>

      <h1 className="mt-10 text-3xl font-bold text-slate-800 dark:text-white tracking-tight text-center">
        Selamat Datang di Dashboard
      </h1>

      <p className="mt-4 text-slate-500 dark:text-slate-400 text-lg text-center max-w-md leading-relaxed px-6">
        Halaman ini akan segera diperbarui dengan <span className="text-[#1a7a4a] dark:text-green-400 font-semibold">grafik interaktif</span> dan ringkasan data penting lainnya.
      </p>

      <div className="mt-12 flex items-center gap-3 px-6 py-4 bg-green-50 dark:bg-green-950/40 rounded-2xl border border-green-100 dark:border-green-900 shadow-sm animate-bounce">
        <MousePointer2 className="w-5 h-5 text-[#1a7a4a] dark:text-green-400" />
        <span className="text-sm font-semibold text-[#1a7a4a] dark:text-green-400">
          Silahkan pilih menu lain di sisi kiri untuk mulai mengelola data
        </span>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
        <div className="w-6 h-2 rounded-full bg-[#1a7a4a]/40"></div>
        <div className="w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700"></div>
      </div>
    </div>
  );
}
