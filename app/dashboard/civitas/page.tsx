"use client";

import React, { useState, useMemo } from "react";
import {
  Building,
  Search,
  Filter,
  MoreVertical,
  Plus,
  User,
  Briefcase,
  IdCard,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Users,
  BookOpen,
  Mail,
  Phone,
  GraduationCap,
  Hammer
} from "lucide-react";
import { MaintenanceModal } from "@/components/admin/MaintenanceModal";

interface Civitas {
  id: number;
  name: string;
  role: "Guru" | "Karyawan" | "TU" | "Lainnya";
  unit: "TK" | "SD" | "SMP" | "SMA" | "Operasional";
  status: "Tetap" | "Kontrak" | "Honor";
  gender: "Laki-laki" | "Perempuan";
  phone: string;
  email: string;
  nik: string;
}

const DUMMY_CIVITAS: Civitas[] = [
  {
    id: 1,
    name: "Drs. H. Ahmad Fauzi",
    role: "Guru",
    unit: "SMA",
    status: "Tetap",
    gender: "Laki-laki",
    phone: "081234567890",
    email: "ahmad.fauzi@sekolah.id",
    nik: "197503122000031001"
  },
  {
    id: 2,
    name: "Siti Aminah, S.Pd.",
    role: "Guru",
    unit: "SMP",
    status: "Tetap",
    gender: "Perempuan",
    phone: "081234567891",
    email: "siti.aminah@sekolah.id",
    nik: "198205152005012002"
  },
  {
    id: 3,
    name: "Budi Santoso",
    role: "TU",
    unit: "Operasional",
    status: "Kontrak",
    gender: "Laki-laki",
    phone: "081234567892",
    email: "budi.santoso@sekolah.id",
    nik: "3273012345670001"
  },
  {
    id: 4,
    name: "Rina Wijaya, M.Pd.",
    role: "Guru",
    unit: "SD",
    status: "Tetap",
    gender: "Perempuan",
    phone: "081234567893",
    email: "rina.wijaya@sekolah.id",
    nik: "198801102010122003"
  },
  {
    id: 5,
    name: "Eko Prasetyo",
    role: "Karyawan",
    unit: "Operasional",
    status: "Honor",
    gender: "Laki-laki",
    phone: "081234567894",
    email: "eko.prasetyo@sekolah.id",
    nik: "3273012345670002"
  },
  {
    id: 6,
    name: "Dewi Sartika, S.T.",
    role: "Guru",
    unit: "SMA",
    status: "Kontrak",
    gender: "Perempuan",
    phone: "081234567895",
    email: "dewi.sartika@sekolah.id",
    nik: "199208202018082004"
  },
  {
    id: 7,
    name: "Anisa Rahmawati, S.Pd.",
    role: "Guru",
    unit: "TK",
    status: "Tetap",
    gender: "Perempuan",
    phone: "081234567896",
    email: "anisa.rahma@sekolah.id",
    nik: "199504052020012005"
  }
];

export default function CivitasPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("All");
  const [isMaintenanceOpen, setIsMaintenanceOpen] = useState(true);

  const filteredCivitas = useMemo(() => {
    return DUMMY_CIVITAS.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.nik.includes(searchQuery) ||
        c.role.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesUnit = selectedUnit === "All" || c.unit === selectedUnit;

      return matchesSearch && matchesUnit;
    });
  }, [searchQuery, selectedUnit]);

  const stats = useMemo(() => {
    return {
      total: DUMMY_CIVITAS.length,
      guru: DUMMY_CIVITAS.filter(c => c.role === "Guru").length,
      karyawan: DUMMY_CIVITAS.filter(c => c.role !== "Guru").length,
      tetap: DUMMY_CIVITAS.filter(c => c.status === "Tetap").length,
    };
  }, []);

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Database Civitas</h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-sm md:text-base">Kelola data guru, staf administrasi, dan karyawan sekolah secara efisien.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-3 bg-[#1a7a4a] text-white rounded-xl font-bold hover:bg-[#15603b] transition-all shadow-lg shadow-green-600/10 active:scale-95 whitespace-nowrap">
          <Plus className="w-5 h-5" />
          Tambah Civitas
        </button>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md group">
          <div className="h-10 w-10 rounded-xl bg-green-50 dark:bg-green-950/40 flex items-center justify-center text-green-600 dark:text-green-400 mb-3 group-hover:bg-green-600 group-hover:text-white transition-colors">
            <Users className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total Civitas</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.total}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md group">
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-3 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <GraduationCap className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Guru</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.guru}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md group">
          <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3 group-hover:bg-amber-600 group-hover:text-white transition-colors">
            <Briefcase className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Karyawan/Staf</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.karyawan}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm transition-all hover:shadow-md group">
          <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-3 group-hover:bg-rose-600 group-hover:text-white transition-colors">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Pegawai Tetap</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{stats.tetap}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 md:p-6 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative group flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5 transition-colors group-focus-within:text-green-500" />
            <input
              type="text"
              placeholder="Cari nama, NIK, atau jabatan..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 outline-none focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
            {["All", "TK", "SD", "SMP", "SMA", "Operasional"].map((unit) => (
              <button
                key={unit}
                onClick={() => setSelectedUnit(unit)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap border ${
                  selectedUnit === unit
                    ? "bg-[#1a7a4a] text-white border-[#1a7a4a] shadow-sm shadow-green-600/10"
                    : "bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700"
                }`}
              >
                {unit === "All" ? "Semua Unit" : unit}
              </button>
            ))}
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-700 mx-2 hidden md:block"></div>
            <button className="flex items-center justify-center gap-2 px-5 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-600 dark:text-slate-400 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredCivitas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
            <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
               <Search className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white">Civitas tidak ditemukan</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-1 max-w-xs text-center px-4">Kami tidak dapat menemukan data civitas dengan kata kunci atau filter tersebut.</p>
            <button
              onClick={() => {setSearchQuery(""); setSelectedUnit("All");}}
              className="mt-6 text-[#1a7a4a] dark:text-green-400 font-bold hover:underline"
            >
              Reset semua filter
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCivitas.map((civitas) => (
              <div
                key={civitas.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden transition-all hover:border-green-300 dark:hover:border-green-700 hover:shadow-xl group"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div className="relative">
                      <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-2xl font-bold transition-all group-hover:scale-105 ${
                        civitas.gender === "Laki-laki" ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400" : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400"
                      }`}>
                        {civitas.name.split(' ').pop()?.charAt(0) || civitas.name.charAt(0)}
                      </div>
                      <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-lg border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm ${
                        civitas.role === "Guru" ? "bg-blue-500" : "bg-amber-500"
                      }`}>
                         {civitas.role === "Guru" ? (
                           <BookOpen className="w-3 h-3 text-white" />
                         ) : (
                           <Hammer className="w-3 h-3 text-white" />
                         )}
                      </div>
                    </div>
                    <button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                      {civitas.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-slate-400 dark:text-slate-500">{civitas.role} • {civitas.unit}</span>
                      <span className="h-1 w-1 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        civitas.status === "Tetap"   ? "bg-green-100 dark:bg-green-950/40 text-green-700 dark:text-green-400" :
                        civitas.status === "Kontrak" ? "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400" :
                        "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      }`}>
                        {civitas.status}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <IdCard className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>{civitas.nik}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span className="truncate">{civitas.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-400">
                      <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>{civitas.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between group-hover:bg-green-50/30 dark:group-hover:bg-green-950/20 transition-colors">
                   <button className="text-xs font-bold text-[#1a7a4a] dark:text-green-400 flex items-center gap-1.5 hover:underline decoration-2 underline-offset-4">
                      <ExternalLink className="w-3.5 h-3.5" />
                      Detail Profil
                   </button>
                   <ChevronRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-[#1a7a4a] dark:group-hover:text-green-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <MaintenanceModal
        isOpen={isMaintenanceOpen}
        onClose={() => setIsMaintenanceOpen(false)}
      />
    </div>
  );
}
