"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Search,
  Filter,
  MoreVertical,
  Plus,
  User,
  Calendar,
  ChevronRight,
  ExternalLink,
  Loader2,
  AlertCircle,
  X,
  XCircle,
  FileUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toTitleCase } from "@/lib/format";

interface Guardian {
  id: string;
  users: {
    first_name: string;
    last_name: string;
  };
}

interface Student {
  id: string;
  nisn: string;
  fullname: string;
  grade: string;
  unit: "TK" | "SD" | "SMP" | "SMA" | "LPI";
  status: "Aktif" | "Lulus" | "Keluar";
  gender: "Laki-laki" | "Perempuan";
  avatar?: string;
  guardian_id?: string;
}

const inputClass = "w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all";

export default function StudentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("All");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [guardianSearch, setGuardianSearch] = useState("");
  const [isGuardianDropdownOpen, setIsGuardianDropdownOpen] = useState(false);
  const guardianDropdownRef = useRef<HTMLDivElement>(null);
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    status: "Aktif",
    unit: "SMA",
    gender: "Laki-laki",
    nisn: "",
    fullname: "",
    grade: "",
    guardian_id: "",
  });

  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        setUserId(user.id);

        const [studentsRes, guardiansRes] = await Promise.all([
          supabase
            .from("students")
            .select("*")
            .order("fullname", { ascending: true }),
          supabase
            .from("guardians")
            .select("id, users!user_id ( first_name, last_name )")
            .order("created_at", { ascending: true }),
        ]);

        if (studentsRes.error) throw studentsRes.error;
        if (guardiansRes.error) throw guardiansRes.error;

        setStudents(studentsRes.data || []);
        setGuardians((guardiansRes.data || []) as unknown as Guardian[]);
      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Gagal memuat data.");
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, []);

  const filteredGuardians = guardians.filter((g) =>
    `${g.users?.first_name ?? ""} ${g.users?.last_name ?? ""}`.trim().toLowerCase().includes(guardianSearch.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (guardianDropdownRef.current && !guardianDropdownRef.current.contains(event.target as Node)) {
        setIsGuardianDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);

      const { data, error } = await supabase
        .from("students")
        .insert([{
          nisn: newStudent.nisn,
          fullname: newStudent.fullname,
          grade: newStudent.grade,
          unit: newStudent.unit,
          status: newStudent.status,
          gender: newStudent.gender,
          guardian_id: newStudent.guardian_id || null,
          user_id: userId,
        }])
        .select();

      if (error) throw error;

      if (data) {
        setStudents((prev) =>
          [...prev, data[0]].sort((a, b) => a.fullname.localeCompare(b.fullname))
        );
      }

      setIsAddModalOpen(false);
      setGuardianSearch("");
      setNewStudent({
        status: "Aktif",
        unit: "SMA",
        gender: "Laki-laki",
        nisn: "",
        fullname: "",
        grade: "",
        guardian_id: "",
      });
    } catch (err: any) {
      console.error("Error adding student:", err);
      alert("Gagal menambahkan murid: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.fullname.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.nisn && s.nisn.includes(searchQuery)) ||
        (s.grade && s.grade.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesUnit = selectedUnit === "All" || s.unit === selectedUnit;
      return matchesSearch && matchesUnit;
    });
  }, [searchQuery, selectedUnit, students]);

  const stats = useMemo(() => ({
    total: students.length,
    tk:  students.filter((s) => s.unit === "TK").length,
    sd:  students.filter((s) => s.unit === "SD").length,
    smp: students.filter((s) => s.unit === "SMP").length,
    sma: students.filter((s) => s.unit === "SMA").length,
    lpi: students.filter((s) => s.unit === "LPI").length,
  }), [students]);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Database Murid</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm md:text-base">
            Kelola data induk siswa serta status akademik mereka secara terpusat.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/bulk/import"
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-800 border-2 border-[#1a7a4a] dark:border-green-700 text-[#1a7a4a] dark:text-green-400 rounded-xl font-bold hover:bg-green-50 dark:hover:bg-green-950/30 transition-all active:scale-95 whitespace-nowrap"
          >
            <FileUp className="w-5 h-5" />
            Impor Massal
          </Link>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-5 py-3 bg-[#1a7a4a] text-white rounded-xl font-bold hover:bg-[#15603b] transition-all shadow-lg shadow-green-600/10 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Tambah Murid
          </button>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {[
          { label: "Total Murid", value: stats.total, icon: GraduationCap, colorClass: "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 group-hover:bg-green-600 group-hover:text-white" },
          { label: "Jenjang TK",  value: stats.tk,    icon: Heart,         colorClass: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white" },
          { label: "Jenjang SD",  value: stats.sd,    icon: Building,      colorClass: "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white" },
          { label: "Jenjang SMP", value: stats.smp,   icon: ShieldCheck,   colorClass: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white" },
          { label: "Jenjang SMA", value: stats.sma,   icon: BookOpen,      colorClass: "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white" },
          { label: "Jenjang LPI", value: stats.lpi,   icon: GraduationCap, colorClass: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white" },
        ].map(({ label, value, icon: Icon, colorClass }) => (
          <div key={label} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md group">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center mb-3 transition-colors ${colorClass}`}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 md:p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5 transition-colors group-focus-within:text-green-500" />
            <input
              type="text"
              placeholder="Cari nama, NISN, atau kelas..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
            {["All", "TK", "SD", "SMP", "SMA", "LPI"].map((unit) => (
              <button
                key={unit}
                onClick={() => setSelectedUnit(unit)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                  selectedUnit === unit
                    ? "bg-[#1a7a4a] text-white border-[#1a7a4a] shadow-sm shadow-green-600/10"
                    : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {unit === "All" ? "Semua Jenjang" : unit}
              </button>
            ))}
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block"></div>
            <button className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              <Filter className="w-4 h-4" />
              Filter Lanjut
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700">
            <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Memuat data murid...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-red-50 dark:bg-red-950/20 rounded-3xl border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400">
            <AlertCircle className="w-16 h-16 mb-4" />
            <h3 className="text-xl font-bold">Terjadi Kesalahan</h3>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 px-6 py-2.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Murid tidak ditemukan</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-xs text-center px-4">
              Kami tidak dapat menemukan data murid dengan kata kunci atau filter tersebut.
            </p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedUnit("All"); }}
              className="mt-6 text-green-600 dark:text-green-400 font-bold hover:underline"
            >
              Reset semua filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:border-green-300 dark:hover:border-green-700 hover:shadow-xl group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className="relative">
                      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all group-hover:scale-105 ${
                        student.gender === "Laki-laki" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      }`}>
                        {toTitleCase(student.fullname).charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-lg border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm ${
                        student.unit === "TK"  ? "bg-rose-400" :
                        student.unit === "SD"  ? "bg-amber-400" :
                        student.unit === "SMP" ? "bg-blue-500" : "bg-indigo-600"
                      }`}>
                        <span className="text-[10px] font-black text-white">{student.unit}</span>
                      </div>
                    </div>
                    <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                      {toTitleCase(student.fullname)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                        NISN: {student.nisn || "-"}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        student.status === "Aktif"  ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400" :
                        student.status === "Lulus"  ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" :
                        "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}>
                        {student.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        <Calendar className="w-3 h-3" />
                        Kelas / Grade
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{student.grade || "-"}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                        <User className="w-3 h-3" />
                        Jenis Kelamin
                      </div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                        {student.gender === "Laki-laki" ? "L" : student.gender === "Perempuan" ? "P" : "-"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between group-hover:bg-green-50/30 dark:group-hover:bg-green-950/20 transition-colors">
                  <button className="text-xs font-bold text-[#1a7a4a] dark:text-green-400 flex items-center gap-1.5 hover:underline decoration-2 underline-offset-4">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Profil Lengkap
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#1a7a4a] dark:group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-800 dark:text-white">Tambah Murid Baru</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto w-full">
              <form id="add-student-form" onSubmit={handleAddStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">NISN</label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan NISN"
                      className={inputClass}
                      value={newStudent.nisn}
                      onChange={(e) => setNewStudent({ ...newStudent, nisn: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      placeholder="Masukkan nama lengkap"
                      className={inputClass}
                      value={newStudent.fullname}
                      onChange={(e) => setNewStudent({ ...newStudent, fullname: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5 relative" ref={guardianDropdownRef}>
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Wali Murid / Orang Tua</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Ketik nama untuk mencari..."
                        autoComplete="off"
                        className={inputClass + " pr-10"}
                        value={guardianSearch}
                        onChange={(e) => {
                          setGuardianSearch(e.target.value);
                          setIsGuardianDropdownOpen(true);
                          if (newStudent.guardian_id) setNewStudent({ ...newStudent, guardian_id: "" });
                        }}
                        onFocus={() => setIsGuardianDropdownOpen(true)}
                      />
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                        {guardianSearch ? (
                          <button
                            type="button"
                            onClick={() => {
                              setGuardianSearch("");
                              setNewStudent({ ...newStudent, guardian_id: "" });
                              setIsGuardianDropdownOpen(true);
                            }}
                            className="hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                          >
                            <XCircle className="w-5 h-5" />
                          </button>
                        ) : (
                          <Search className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    {isGuardianDropdownOpen && (
                      <div className="absolute z-20 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                        <ul className="py-1">
                          <li
                            onClick={() => {
                              setGuardianSearch("");
                              setNewStudent({ ...newStudent, guardian_id: "" });
                              setIsGuardianDropdownOpen(false);
                            }}
                            className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-slate-400 dark:text-slate-500 italic text-sm transition-colors"
                          >
                            -- Tidak ada --
                          </li>
                          {filteredGuardians.length > 0 ? filteredGuardians.map((g) => {
                            const name = `${g.users?.first_name ?? ""} ${g.users?.last_name ?? ""}`.trim();
                            return (
                              <li
                                key={g.id}
                                onClick={() => {
                                  setGuardianSearch(name);
                                  setNewStudent({ ...newStudent, guardian_id: g.id });
                                  setIsGuardianDropdownOpen(false);
                                }}
                                className="px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-between"
                              >
                                <span className="font-medium">{name}</span>
                                {newStudent.guardian_id === g.id && (
                                  <span className="text-green-600 dark:text-green-400 text-sm font-semibold">Dipilih</span>
                                )}
                              </li>
                            );
                          }) : (
                            <li className="px-4 py-3 text-slate-400 dark:text-slate-500 text-center text-sm">
                              Wali murid tidak ditemukan
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Kelas</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: 10A"
                      className={inputClass}
                      value={newStudent.grade}
                      onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Jenjang Pendidikan</label>
                    <select
                      className={inputClass}
                      value={newStudent.unit}
                      onChange={(e) => setNewStudent({ ...newStudent, unit: e.target.value as any })}
                    >
                      <option value="TK">TK</option>
                      <option value="SD">SD</option>
                      <option value="SMP">SMP</option>
                      <option value="SMA">SMA</option>
                      <option value="LPI">LPI</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Jenis Kelamin</label>
                    <select
                      className={inputClass}
                      value={newStudent.gender}
                      onChange={(e) => setNewStudent({ ...newStudent, gender: e.target.value as any })}
                    >
                      <option value="Laki-laki">Laki-laki</option>
                      <option value="Perempuan">Perempuan</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Status</label>
                    <select
                      className={inputClass}
                      value={newStudent.status}
                      onChange={(e) => setNewStudent({ ...newStudent, status: e.target.value as any })}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Lulus">Lulus</option>
                      <option value="Keluar">Keluar</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-end gap-3 mt-auto">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-5 py-2.5 rounded-xl font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Batal
              </button>
              <button
                type="submit"
                form="add-student-form"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-[#1a7a4a] text-white rounded-xl font-bold hover:bg-[#15603b] transition-all shadow-lg shadow-green-600/10 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
                  </>
                ) : (
                  "Simpan Data"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
