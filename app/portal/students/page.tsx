"use client";

import React, { useEffect, useState } from "react";
import { GraduationCap, Loader2, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePortal } from "@/lib/context/PortalContext";

interface Student {
  id: string;
  fullname: string;
  unit: string;
  grade: string;
  nisn: string | null;
  status: string;
}

const UNIT_COLORS: Record<string, string> = {
  TK:  "bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-400",
  SD:  "bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  SMP: "bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400",
  SMA: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
};

export default function PortalStudentsPage() {
  const { profile } = usePortal();
  const guardianId = profile?.guardianId ?? null;
  const supabase = React.useMemo(() => createClient(), []);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!guardianId) { setLoading(false); return; }

    supabase
      .from("students")
      .select("id, fullname, unit, grade, nisn, status, guardian_id")
      .then(({ data, error }) => {
        if (!error) {
          const mine = (data ?? []).filter((s: any) => s.guardian_id === guardianId);
          setStudents(mine);
        }
        setLoading(false);
      });
  }, [guardianId]);

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-50 dark:bg-green-950/40 rounded-lg text-[#1a7a4a] dark:text-green-400">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Murid Saya</h1>
        </div>
        <p className="text-slate-500 dark:text-slate-400">Daftar putra/putri yang berada di bawah perwalian Anda.</p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-[#1a7a4a] animate-spin" />
        </div>
      ) : !profile?.guardianId ? (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-2xl p-6 text-amber-800 dark:text-amber-400">
          <p className="font-semibold">Akun belum terhubung ke data wali murid.</p>
          <p className="text-sm mt-1">Hubungi administrator untuk mengaitkan akun ini.</p>
        </div>
      ) : students.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
          <div className="h-16 w-16 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 dark:text-slate-600 mb-4">
            <GraduationCap className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Belum ada murid terdaftar</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">Hubungi administrator untuk mendaftarkan murid.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {students.map(student => (
            <div
              key={student.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6 flex items-start gap-4 hover:border-green-300 dark:hover:border-green-700 hover:shadow-md transition-all"
            >
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#1a7a4a] to-green-400 flex items-center justify-center flex-shrink-0">
                <User className="w-7 h-7 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="font-bold text-slate-800 dark:text-white truncate">{student.fullname}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    student.status === "Aktif" ? "bg-green-100 text-[#1a7a4a] dark:bg-green-950/40 dark:text-green-400" : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}>
                    {student.status}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${UNIT_COLORS[student.unit] ?? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"}`}>
                    {student.unit}
                  </span>
                  <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Kelas {student.grade}</span>
                  {student.nisn && (
                    <span className="text-xs text-slate-400 dark:text-slate-500">NISN: {student.nisn}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
