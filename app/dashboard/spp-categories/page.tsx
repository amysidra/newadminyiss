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
  Tag,
} from "lucide-react";

interface SppCategory {
  id: string;
  name: string;
  amount: number;
  description: string | null;
  created_at: string;
  student_count: number;
}

const inputClass =
  "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all";

function formatRupiah(value: string) {
  const num = value.replace(/\D/g, "");
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseAmount(formatted: string) {
  return parseInt(formatted.replace(/\./g, ""), 10) || 0;
}

export default function SppCategoriesPage() {
  const [categories, setCategories] = useState<SppCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SppCategory | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", amount: "", description: "" });
  const supabase = createClient();

  async function fetchCategories() {
    const { data, error } = await supabase
      .from("spp_categories")
      .select("*, students:students(id)")
      .order("amount", { ascending: true });

    if (error) throw error;

    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      amount: c.amount,
      description: c.description,
      created_at: c.created_at,
      student_count: c.students?.length ?? 0,
    }));
  }

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setCategories(await fetchCategories());
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function openAdd() {
    setEditTarget(null);
    setForm({ name: "", amount: "", description: "" });
    setIsModalOpen(true);
  }

  function openEdit(cat: SppCategory) {
    setEditTarget(cat);
    setForm({
      name: cat.name,
      amount: formatRupiah(String(cat.amount)),
      description: cat.description ?? "",
    });
    setIsModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const payload = {
        name: form.name.trim(),
        amount: parseAmount(form.amount),
        description: form.description.trim() || null,
      };

      if (editTarget) {
        const { error } = await supabase
          .from("spp_categories")
          .update(payload)
          .eq("id", editTarget.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("spp_categories")
          .insert([payload]);
        if (error) throw error;
      }

      setIsModalOpen(false);
      setCategories(await fetchCategories());
    } catch (err: any) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from("spp_categories")
        .delete()
        .eq("id", id);
      if (error) throw error;
      setDeleteConfirm(null);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert("Gagal menghapus: " + err.message);
    }
  }

  const deletingCat = categories.find((c) => c.id === deleteConfirm);

  return (
    <div className="max-w-4xl mx-auto pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
            Kategori SPP
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Kelola kategori SPP dan nominal iuran per kategori.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-5 py-3 bg-[#1a7a4a] text-white rounded-xl font-bold hover:bg-[#15603b] transition-all shadow-lg shadow-green-600/10 active:scale-95 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          Tambah Kategori
        </button>
      </header>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700">
          <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Memuat kategori SPP...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400">
          <AlertCircle className="w-16 h-16 mb-4" />
          <p>{error}</p>
        </div>
      ) : categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-4">
            <Tag className="w-8 h-8 text-slate-300 dark:text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            Belum ada kategori
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-center px-4">
            Buat kategori SPP untuk mulai menetapkan iuran per murid.
          </p>
          <button
            onClick={openAdd}
            className="mt-6 px-6 py-2.5 bg-[#1a7a4a] text-white rounded-xl font-bold hover:bg-[#15603b] transition-all"
          >
            Tambah Kategori Pertama
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Kategori
                </th>
                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Nominal SPP
                </th>
                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider hidden md:table-cell">
                  Keterangan
                </th>
                <th className="text-center px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Murid
                </th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center flex-shrink-0">
                        <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-white">
                        {cat.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      Rp {cat.amount.toLocaleString("id-ID")}
                    </span>
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell text-slate-500 dark:text-slate-400">
                    {cat.description || (
                      <span className="italic text-slate-300 dark:text-slate-600">
                        —
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-flex items-center justify-center h-7 min-w-7 px-2 rounded-full text-xs font-bold ${
                        cat.student_count > 0
                          ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {cat.student_count}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(cat)}
                        className="p-2 text-slate-400 hover:text-[#1a7a4a] dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-950/40 rounded-lg transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (cat.student_count > 0) {
                            alert(
                              `Kategori "${cat.name}" masih digunakan oleh ${cat.student_count} murid. Ubah kategori murid terlebih dahulu.`
                            );
                            return;
                          }
                          setDeleteConfirm(cat.id);
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl flex flex-col border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">
                {editTarget ? "Edit Kategori SPP" : "Tambah Kategori SPP"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form id="spp-cat-form" onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nama Kategori <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: A, Reguler, Beasiswa"
                  className={inputClass}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nominal SPP <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium text-sm pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="text"
                    required
                    inputMode="numeric"
                    placeholder="150.000"
                    className={inputClass + " pl-10"}
                    value={form.amount}
                    onChange={(e) =>
                      setForm({ ...form, amount: formatRupiah(e.target.value) })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Keterangan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Untuk murid reguler"
                  className={inputClass}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
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
                form="spp-cat-form"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#1a7a4a] text-white rounded-xl font-bold hover:bg-[#15603b] transition-all shadow-lg shadow-green-600/10 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  "Simpan"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 dark:border-slate-700 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-950/40 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                Hapus Kategori?
              </h3>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
              Kategori{" "}
              <span className="font-bold text-slate-700 dark:text-slate-200">
                {deletingCat?.name}
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
    </div>
  );
}
