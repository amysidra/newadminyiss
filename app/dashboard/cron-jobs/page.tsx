"use client";

import React, { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Plus,
  Loader2,
  AlertCircle,
  X,
  Pencil,
  Trash2,
  Play,
  CalendarClock,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  Clock,
} from "lucide-react";

interface CronJob {
  id: string;
  name: string;
  description: string | null;
  job_type: string;
  schedule_day: number;
  invoice_description_template: string;
  due_date_offset_days: number;
  is_active: boolean;
  last_run_at: string | null;
  last_run_status: string | null;
  last_run_count: number | null;
  last_run_message: string | null;
  created_at: string;
}

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all";

const INDONESIAN_MONTHS = [
  "Januari","Februari","Maret","April","Mei","Juni",
  "Juli","Agustus","September","Oktober","November","Desember",
];

function formatWIB(isoString: string) {
  return new Date(isoString).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getNextRunDate(scheduleDay: number) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  let next = new Date(year, month, scheduleDay);
  if (day >= scheduleDay) {
    next = new Date(year, month + 1, scheduleDay);
  }
  return next.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function isRunThisMonth(lastRunAt: string | null) {
  if (!lastRunAt) return false;
  const last = new Date(lastRunAt);
  const now = new Date();
  return last.getFullYear() === now.getFullYear() && last.getMonth() === now.getMonth();
}

function previewDescription(template: string) {
  const now = new Date();
  return template
    .replace(/{MONTH}/gi, INDONESIAN_MONTHS[now.getMonth()])
    .replace(/{YEAR}/gi, now.getFullYear().toString());
}

const emptyForm = {
  name: "",
  description: "",
  schedule_day: "1",
  invoice_description_template: "SPP Bulan {MONTH} {YEAR}",
  due_date_offset_days: "14",
  is_active: true,
};

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<CronJob | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CronJob | null>(null);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [runConfirmJob, setRunConfirmJob] = useState<CronJob | null>(null);
  const [runResult, setRunResult] = useState<{ count: number; message: string; jobId: string } | null>(null);
  const [form, setForm] = useState(emptyForm);
  const supabase = createClient();

  async function fetchJobs() {
    const { data, error } = await supabase
      .from("cron_jobs")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data ?? [];
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setJobs(await fetchJobs());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openAdd() {
    setEditTarget(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEdit(job: CronJob) {
    setEditTarget(job);
    setForm({
      name: job.name,
      description: job.description ?? "",
      schedule_day: String(job.schedule_day),
      invoice_description_template: job.invoice_description_template,
      due_date_offset_days: String(job.due_date_offset_days),
      is_active: job.is_active,
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        schedule_day: parseInt(form.schedule_day),
        invoice_description_template: form.invoice_description_template.trim(),
        due_date_offset_days: parseInt(form.due_date_offset_days),
        is_active: form.is_active,
      };

      if (editTarget) {
        const { error } = await supabase
          .from("cron_jobs")
          .update(payload)
          .eq("id", editTarget.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cron_jobs").insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setJobs(await fetchJobs());
    } catch (err: any) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(job: CronJob) {
    try {
      const { error } = await supabase
        .from("cron_jobs")
        .delete()
        .eq("id", job.id);
      if (error) throw error;
      setDeleteConfirm(null);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  }

  async function handleToggleActive(job: CronJob) {
    const { error } = await supabase
      .from("cron_jobs")
      .update({ is_active: !job.is_active })
      .eq("id", job.id);
    if (error) { alert(error.message); return; }
    setJobs((prev) =>
      prev.map((j) => (j.id === job.id ? { ...j, is_active: !j.is_active } : j))
    );
  }

  function handleRunClick(job: CronJob) {
    if (isRunThisMonth(job.last_run_at)) {
      setRunConfirmJob(job);
    } else {
      executeRun(job.id);
    }
  }

  async function executeRun(jobId: string) {
    setRunConfirmJob(null);
    setRunningJobId(jobId);
    try {
      const res = await fetch("/api/admin/cron/run-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message ?? "Gagal menjalankan job");

      setRunResult({ count: data.count, message: data.message, jobId });
      if (data.job) {
        setJobs((prev) =>
          prev.map((j) => (j.id === jobId ? data.job : j))
        );
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setRunningJobId(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
            Jadwal Tagihan
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Jadwalkan pembuatan invoice SPP otomatis setiap bulan.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-3 bg-[#1a7a4a] text-white rounded-xl font-bold hover:bg-[#15603b] transition-all shadow-lg shadow-green-600/10 active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Tambah Jadwal
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700">
          <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Memuat Jadwal...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400">
          <AlertCircle className="w-16 h-16 mb-4" />
          <p>{error}</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
            <CalendarClock className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            Belum ada Jadwal
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-center px-4 max-w-xs">
            Buat jadwal untuk generate invoice SPP otomatis setiap bulan.
          </p>
          <button
            onClick={openAdd}
            className="mt-6 px-6 py-2.5 bg-[#1a7a4a] text-white rounded-xl font-bold hover:bg-[#15603b] transition-all"
          >
            Buat Jadwal Pertama
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => {
            const isRunning = runningJobId === job.id;
            const runThisMonth = isRunThisMonth(job.last_run_at);
            const justRan = runResult?.jobId === job.id;

            return (
              <div
                key={job.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                          {job.name}
                        </h3>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            job.is_active
                              ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {job.is_active ? "Aktif" : "Nonaktif"}
                        </span>
                      </div>
                      {job.description && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                          {job.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleToggleActive(job)}
                        className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title={job.is_active ? "Nonaktifkan" : "Aktifkan"}
                      >
                        {job.is_active
                          ? <ToggleRight className="w-5 h-5 text-green-500" />
                          : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => openEdit(job)}
                        className="p-2 text-slate-400 hover:text-[#1a7a4a] dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(job)}
                        className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        Jadwal
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                        Setiap tanggal {job.schedule_day}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                        Berikutnya: {getNextRunDate(job.schedule_day)}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        Template Invoice
                      </p>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">
                        {job.invoice_description_template}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                        Contoh: {previewDescription(job.invoice_description_template)}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-3.5 border border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        Terakhir Dijalankan
                      </p>
                      {job.last_run_at ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            {job.last_run_status === "success" ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                            )}
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {job.last_run_count ?? 0} invoice
                            </p>
                          </div>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {formatWIB(job.last_run_at)}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-slate-400 dark:text-slate-500 italic">
                          Belum pernah
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {runThisMonth && (
                      <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                        <Clock className="w-3.5 h-3.5" />
                        Sudah dijalankan bulan ini
                      </div>
                    )}
                    {justRan && !isRunning && (
                      <div className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {runResult?.message}
                      </div>
                    )}
                    {!runThisMonth && !justRan && <div />}

                    <button
                      onClick={() => handleRunClick(job)}
                      disabled={isRunning}
                      className="ml-auto flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-green-50 dark:hover:bg-green-950/40 text-slate-600 dark:text-slate-300 hover:text-[#1a7a4a] dark:hover:text-green-400 rounded-xl font-bold text-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed border border-slate-200 dark:border-slate-700"
                    >
                      {isRunning ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Menjalankan...</>
                      ) : (
                        <><Play className="w-4 h-4" /> Jalankan Sekarang</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editTarget ? "Edit Jadwal" : "Tambah Jadwal"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="cron-job-form" onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nama Jadwal <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Invoice SPP Bulanan"
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Deskripsi singkat job ini"
                  className={inputClass}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Tanggal per Bulan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    max={28}
                    className={inputClass}
                    value={form.schedule_day}
                    onChange={(e) => setForm({ ...form, schedule_day: e.target.value })}
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Maks. 28 (aman untuk semua bulan)
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Jatuh Tempo (hari) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    className={inputClass}
                    value={form.due_date_offset_days}
                    onChange={(e) => setForm({ ...form, due_date_offset_days: e.target.value })}
                  />
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Hari setelah invoice dibuat
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Template Deskripsi Invoice <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  className={inputClass}
                  value={form.invoice_description_template}
                  onChange={(e) =>
                    setForm({ ...form, invoice_description_template: e.target.value })
                  }
                />
                <p className="text-[11px] text-slate-400 dark:text-slate-500">
                  Gunakan <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{"{MONTH}"}</code> dan{" "}
                  <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{"{YEAR}"}</code>.{" "}
                  Contoh saat ini:{" "}
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {previewDescription(form.invoice_description_template)}
                  </span>
                </p>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                    Status Aktif
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Jadwal hanya berjalan jika diaktifkan
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, is_active: !form.is_active })}
                  className="flex-shrink-0"
                >
                  {form.is_active
                    ? <ToggleRight className="w-8 h-8 text-green-500" />
                    : <ToggleLeft className="w-8 h-8 text-slate-400" />}
                </button>
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                form="cron-job-form"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#1a7a4a] text-white rounded-xl font-bold hover:bg-[#15603b] transition-all shadow-lg shadow-green-600/10 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Hapus Job?</h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Job{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {deleteConfirm.name}
              </span>{" "}
              akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Run Again Confirm (already run this month) */}
      {runConfirmJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Job Sudah Dijalankan
              </h3>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-sm mb-2">
              Job ini sudah dieksekusi bulan ini pada:
            </p>
            <p className="text-sm font-bold text-slate-800 dark:text-white mb-1">
              {formatWIB(runConfirmJob.last_run_at!)}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              Hasil:{" "}
              <span className="font-semibold">
                {runConfirmJob.last_run_count ?? 0} invoice dibuat
              </span>
              . Jika dijalankan lagi, invoice baru akan dibuat untuk semua murid
              aktif dan dapat menyebabkan tagihan duplikat.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRunConfirmJob(null)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              >
                Batal
              </button>
              <button
                onClick={() => executeRun(runConfirmJob.id)}
                className="px-5 py-2.5 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all"
              >
                Ya, Tetap Jalankan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
