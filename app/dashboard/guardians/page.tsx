"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  Users,
  Search,
  Phone,
  Mail,
  GraduationCap,
  Filter,
  MoreVertical,
  ChevronRight,
  ExternalLink,
  Plus,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Student {
  fullname: string;
  grade: string;
  unit: string;
}

interface Guardian {
  id: string;
  phone: string;
  email: string;
  relationship: "Ayah" | "Ibu" | "Wali";
  students: Student[];
  users: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

function fullName(g: Guardian) {
  return `${g.users?.first_name ?? ""} ${g.users?.last_name ?? ""}`.trim();
}

export default function GuardiansPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newGuardian, setNewGuardian] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    relationship: "Ayah" as "Ayah" | "Ibu" | "Wali",
  });

  const supabase = createClient();

  const fetchGuardians = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from("guardians")
        .select(`
          id, phone, email, relationship,
          users!user_id ( first_name, last_name, email ),
          students ( fullname, grade, unit )
        `)
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;
      setGuardians((data as any) || []);
    } catch (err: any) {
      setError(err.message || "Gagal memuat data wali murid.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardians();
  }, []);

  const handleSaveGuardian = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuardian.first_name.trim()) return;

    try {
      setIsSaving(true);

      // 1. Buat profil user baru untuk wali murid
      const { data: userData, error: userError } = await supabase
        .from("users")
        .insert({
          first_name: newGuardian.first_name.trim(),
          last_name: newGuardian.last_name.trim(),
          email: newGuardian.email.trim() || null,
          phone: newGuardian.phone.trim() || null,
        })
        .select("id")
        .single();

      if (userError) throw userError;

      // 2. Buat record guardian yang menunjuk ke user tersebut
      const { error: guardianError } = await supabase
        .from("guardians")
        .insert({
          user_id: userData.id,
          phone: newGuardian.phone.trim() || null,
          email: newGuardian.email.trim() || null,
          relationship: newGuardian.relationship,
        });

      if (guardianError) throw guardianError;

      setNewGuardian({ first_name: "", last_name: "", phone: "", email: "", relationship: "Ayah" });
      setShowAddModal(false);
      await fetchGuardians();
    } catch (err: any) {
      alert("Gagal menambah wali murid: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredGuardians = useMemo(() => {
    if (!searchQuery) return guardians;
    const q = searchQuery.toLowerCase();
    return guardians.filter(
      (g) =>
        fullName(g).toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.phone?.includes(q) ||
        g.students?.some((s) => s.fullname.toLowerCase().includes(q))
    );
  }, [searchQuery, guardians]);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Database Wali Murid</h1>
          <p className="mt-2 text-slate-500">
            Kelola informasi kontak dan keterhubungan wali murid dengan siswa.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#1a7a4a] text-white rounded-xl font-bold hover:bg-[#15603b] transition-all shadow-lg shadow-green-600/10 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Tambah Wali Murid
        </button>
      </header>

      {/* Modal Tambah Wali Murid */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => !isSaving && setShowAddModal(false)}
          />
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-8 pb-4">
              <h2 className="text-2xl font-bold text-slate-800">Tambah Wali Murid Baru</h2>
              <p className="text-slate-500 text-sm mt-1">
                Data akan disimpan ke tabel users dan guardians secara otomatis.
              </p>
            </div>

            <form onSubmit={handleSaveGuardian} className="p-8 pt-4 space-y-5">

              {/* Nama Depan & Nama Belakang */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                    Nama Depan <span className="text-red-400">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="Contoh: Ahmad"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                    value={newGuardian.first_name}
                    onChange={(e) => setNewGuardian({ ...newGuardian, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                    Nama Belakang
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Santoso"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                    value={newGuardian.last_name}
                    onChange={(e) => setNewGuardian({ ...newGuardian, last_name: e.target.value })}
                  />
                </div>
              </div>

              {/* Hubungan */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                  Hubungan dengan Siswa
                </label>
                <select
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all bg-white"
                  value={newGuardian.relationship}
                  onChange={(e) => setNewGuardian({ ...newGuardian, relationship: e.target.value as any })}
                >
                  <option value="Ayah">Ayah</option>
                  <option value="Ibu">Ibu</option>
                  <option value="Wali">Wali / Lainnya</option>
                </select>
              </div>

              {/* No HP & Email */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                    WhatsApp / HP
                  </label>
                  <input
                    type="tel"
                    placeholder="0812..."
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                    value={newGuardian.phone}
                    onChange={(e) => setNewGuardian({ ...newGuardian, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="nama@email.com"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all"
                    value={newGuardian.email}
                    onChange={(e) => setNewGuardian({ ...newGuardian, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSaving}
                  className="flex-1 py-3.5 rounded-2xl text-slate-600 font-bold hover:bg-slate-50 transition-all disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] py-3.5 rounded-2xl bg-[#1a7a4a] text-white font-bold shadow-lg shadow-green-600/10 hover:bg-[#15603b] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Wali Murid"
                  )}
                </button>
              </div>
            </form>

            {!isSaving && (
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
          <div className="h-14 w-14 rounded-2xl bg-green-50 flex items-center justify-center text-green-600">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Wali Murid</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{guardians.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
          <div className="h-14 w-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Siswa Terhubung</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">
              {guardians.reduce((acc, curr) => acc + (curr.students?.length || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 md:p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 transition-colors group-focus-within:text-green-500" />
            <input
              type="text"
              placeholder="Cari nama wali, email, atau nama siswa..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-all">
            <Filter className="w-4 h-4" />
            Filter
          </button>
        </div>
      </div>

      {/* Guardian List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200">
            <Loader2 className="w-8 h-8 text-[#1a7a4a] animate-spin mb-4" />
            <p className="text-slate-500">Memuat data wali murid...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 bg-red-50 rounded-2xl border border-red-200 text-red-700">
            <AlertCircle className="w-12 h-12 mb-4" />
            <h3 className="text-lg font-bold">Terjadi Kesalahan</h3>
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-all"
            >
              Coba Lagi
            </button>
          </div>
        ) : filteredGuardians.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
            <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-4">
              <Search className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800">
              Tidak ada wali murid ditemukan
            </h3>
            <p className="text-slate-500 mt-1">
              Coba sesuaikan pencarian Anda atau tambah wali murid baru.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredGuardians.map((guardian) => (
              <div
                key={guardian.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col gap-6 transition-all hover:border-green-300 hover:shadow-lg group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-lg group-hover:bg-green-50 group-hover:text-green-600 transition-colors">
                      {(guardian.users?.first_name ?? "?").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-800 group-hover:text-green-700 transition-colors text-sm sm:text-base">
                          {fullName(guardian)}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          guardian.relationship === "Ayah" ? "bg-blue-100 text-blue-700" :
                          guardian.relationship === "Ibu" ? "bg-rose-100 text-rose-700" :
                          "bg-amber-100 text-amber-700"
                        }`}>
                          {guardian.relationship}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                        {guardian.phone && (
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500">
                            <Phone className="w-3 h-3" />
                            {guardian.phone}
                          </div>
                        )}
                        {guardian.email && (
                          <div className="flex items-center gap-1 text-[10px] sm:text-xs text-slate-500">
                            <Mail className="w-3 h-3" />
                            {guardian.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Siswa Terhubung
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {guardian.students && guardian.students.length > 0 ? (
                      guardian.students.map((student, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100"
                        >
                          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-green-600 border border-slate-100">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 leading-none truncate">
                              {student.fullname}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-1 uppercase font-medium">
                              {student.grade} {student.unit}
                            </p>
                          </div>
                          <ChevronRight className="w-3 h-3 ml-auto text-slate-300 group-hover:text-green-400 transition-colors flex-shrink-0" />
                        </div>
                      ))
                    ) : (
                      <p className="text-[11px] text-slate-400 italic col-span-full">
                        Belum ada siswa terhubung
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <button className="text-xs font-bold text-[#1a7a4a] flex items-center gap-1.5 hover:underline">
                    <ExternalLink className="w-3.5 h-3.5" />
                    Detail Lengkap
                  </button>
                  <span className="text-[10px] text-slate-400 font-medium">
                    ID: {guardian.id.substring(0, 8).toUpperCase()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
