"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { toTitleCase } from "@/lib/format";
import {
  Search,
  Loader2,
  AlertCircle,
  Check,
  X,
  ChevronLeft,
  Tag,
} from "lucide-react";

interface SppCategory {
  id: string;
  name: string;
  amount: number;
}

interface Student {
  id: string;
  fullname: string;
  unit: string;
  status: string;
  spp_category_id: string | null;
}

type SaveStatus = "saving" | "saved" | "error";

const unitColors: Record<string, string> = {
  TK: "bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400",
  SD: "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
  SMP: "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400",
  SMA: "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400",
  LPI: "bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400",
};

export default function AssignSppPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [categories, setCategories] = useState<SppCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("All");
  const [saveState, setSaveState] = useState<Record<string, SaveStatus>>({});
  const supabase = createClient();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [studentsRes, categoriesRes] = await Promise.all([
          supabase
            .from("students")
            .select("id, fullname, unit, status, spp_category_id")
            .order("fullname", { ascending: true }),
          supabase
            .from("spp_categories")
            .select("id, name, amount")
            .order("amount", { ascending: true }),
        ]);

        if (studentsRes.error) throw studentsRes.error;
        if (categoriesRes.error) throw categoriesRes.error;

        setStudents(studentsRes.data || []);
        setCategories(categoriesRes.data || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function handleCategoryChange(studentId: string, categoryId: string) {
    setSaveState((prev) => ({ ...prev, [studentId]: "saving" }));

    setStudents((prev) =>
      prev.map((s) =>
        s.id === studentId
          ? { ...s, spp_category_id: categoryId || null }
          : s
      )
    );

    try {
      const { error } = await supabase
        .from("students")
        .update({ spp_category_id: categoryId || null })
        .eq("id", studentId);

      if (error) throw error;

      setSaveState((prev) => ({ ...prev, [studentId]: "saved" }));
      setTimeout(() => {
        setSaveState((prev) => {
          const next = { ...prev };
          delete next[studentId];
          return next;
        });
      }, 2000);
    } catch (err: any) {
      setSaveState((prev) => ({ ...prev, [studentId]: "error" }));
    }
  }

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = s.fullname
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesUnit = selectedUnit === "All" || s.unit === selectedUnit;
      return matchesSearch && matchesUnit;
    });
  }, [students, searchQuery, selectedUnit]);

  const assignedCount = students.filter((s) => s.spp_category_id).length;

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <header className="mb-8">
        <Link
          href="/dashboard/spp-categories"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-[#1a7a4a] dark:hover:text-green-400 transition-colors mb-4"
        >
          <ChevronLeft className="w-4 h-4" />
          Kembali ke Kategori SPP
        </Link>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">
              Atur Kategori Murid
            </h1>
            <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm md:text-base">
              Tetapkan kategori SPP untuk setiap murid. Perubahan tersimpan
              otomatis.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm whitespace-nowrap">
            <Tag className="w-4 h-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
              {assignedCount}
              <span className="font-normal text-slate-400 dark:text-slate-500">
                /{students.length} murid
              </span>
            </span>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              sudah ada kategori
            </span>
          </div>
        </div>
      </header>

      {categories.length === 0 && !loading && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            Belum ada kategori SPP.{" "}
            <Link
              href="/dashboard/spp-categories"
              className="font-bold underline"
            >
              Buat kategori dulu
            </Link>{" "}
            sebelum mengatur murid.
          </span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5 transition-colors group-focus-within:text-green-500" />
            <input
              type="text"
              placeholder="Cari nama murid..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 lg:pb-0">
            {["All", "TK", "SD", "SMP", "SMA", "LPI"].map((unit) => (
              <button
                key={unit}
                onClick={() => setSelectedUnit(unit)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                  selectedUnit === unit
                    ? "bg-[#1a7a4a] text-white border-[#1a7a4a]"
                    : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {unit === "All" ? "Semua" : unit}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700">
          <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Memuat data murid...
          </p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400">
          <AlertCircle className="w-16 h-16 mb-4" />
          <p>{error}</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
          <p className="font-bold text-slate-700 dark:text-slate-300">
            Murid tidak ditemukan
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedUnit("All");
            }}
            className="mt-3 text-sm text-green-600 dark:text-green-400 font-bold hover:underline"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Nama Lengkap
                </th>
                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider w-24">
                  Jenjang
                </th>
                <th className="text-left px-6 py-4 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Kategori SPP
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map((student) => {
                const state = saveState[student.id];
                return (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-800 dark:text-white">
                          {toTitleCase(student.fullname)}
                        </span>
                        {student.status !== "Aktif" && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                            {student.status}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                          unitColors[student.unit] ??
                          "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                        }`}
                      >
                        {student.unit}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-2">
                        <select
                          value={student.spp_category_id ?? ""}
                          onChange={(e) =>
                            handleCategoryChange(student.id, e.target.value)
                          }
                          disabled={state === "saving"}
                          className="w-full max-w-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <option value="">— Belum ada —</option>
                          {categories.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {cat.name} — Rp{" "}
                              {cat.amount.toLocaleString("id-ID")}
                            </option>
                          ))}
                        </select>

                        <div className="w-6 flex items-center justify-center flex-shrink-0">
                          {state === "saving" && (
                            <Loader2 className="w-4 h-4 text-slate-400 animate-spin" />
                          )}
                          {state === "saved" && (
                            <Check className="w-4 h-4 text-green-500" />
                          )}
                          {state === "error" && (
                            <X className="w-4 h-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
            Menampilkan {filteredStudents.length} murid
          </div>
        </div>
      )}
    </div>
  );
}
