"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  FileUp,
  Download,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Trash2,
  Database
} from "lucide-react";
import Link from "next/link";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/client";

interface RowData {
  nisn: string;
  nama_murid: string;
  unit: string;
  kelas: string;
  jenis_kelamin: string;
  nama_wali: string;
  hubungan_wali: string;
  kontak_wali: string;
  email_wali: string;
}

interface ValidationResult extends RowData {
  status: "ready" | "error" | "warning";
  message?: string;
  exists_guardian?: boolean;
}

export default function BulkImportPage() {
  const [, setFile] = useState<File | null>(null);
  const [isCheckingContext, setIsCheckingContext] = useState(true);
  const [data, setData] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  const stats = useMemo(() => {
    let errCount = 0;
    let newGCount = 0;
    let linkGCount = 0;

    const uniqueNewPhones = new Set<string>();

    data.forEach(item => {
      if (item.status === "error") errCount++;
      if (item.exists_guardian) {
        linkGCount++;
      } else if (item.nama_wali) {
        newGCount++;
        if (item.kontak_wali) uniqueNewPhones.add(item.kontak_wali);
      }
    });

    return {
      total: data.length,
      newGuardians: newGCount,
      uniqueNewGuardians: uniqueNewPhones.size,
      linkedGuardians: linkGCount,
      errors: errCount
    };
  }, [data]);

  const supabase = createClient();

  useEffect(() => {
    const fetchContext = async () => {
      try {
        setIsCheckingContext(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);
      } catch (err) {
        console.error("Error fetching context:", err);
      } finally {
        setIsCheckingContext(false);
      }
    };
    fetchContext();
  }, [supabase]);

  const downloadTemplate = () => {
    const headers = [
      ["NISN", "Nama Murid", "Unit (TK/SD/SMP/SMA/LPI)", "Kelas", "Jenis Kelamin (Laki-laki/Perempuan)", "Nama Wali", "Hubungan Wali (Ayah/Ibu/Wali)", "No HP/WA Wali", "Email Wali"],
      ["3101234561", "Ahmad Fauzi",          "LPI", "REG 1", "Laki-laki",  "Hendra Kusuma",      "Ayah", "6281234560001", "hendra1@email.com"],
      ["3101234562", "Muhammad Rizki",        "LPI", "REG 1", "Laki-laki",  "Samsul Arifin",      "Ayah", "6281234560002", "samsul2@email.com"],
      ["3101234563", "Nur Hidayah",           "LPI", "REG 2", "Perempuan",  "Wati Rahayu",        "Ibu",  "6281234560003", "wati3@email.com"],
      ["3101234564", "Siti Aminah",           "LPI", "REG 2", "Perempuan",  "Dewi Lestari",       "Ibu",  "6281234560004", "dewi4@email.com"],
      ["3101234565", "Fajar Ramadhan",        "LPI", "REG 2", "Laki-laki",  "Agus Salim",         "Ayah", "6281234560005", "agus5@email.com"],
      ["3101234566", "Bagas Prasetyo",        "LPI", "REG 2", "Laki-laki",  "Bambang Eko",        "Ayah", "6281234560006", "bambang6@email.com"],
      ["3101234567", "Rizky Maulana",         "LPI", "REG 2", "Laki-laki",  "Dedi Supriyadi",     "Ayah", "6281234560007", "dedi7@email.com"],
      ["3101234568", "Dinda Permata",         "LPI", "REG 2", "Perempuan",  "Yuli Astuti",        "Ibu",  "6281234560008", "yuli8@email.com"],
      ["3101234569", "Khoirul Anam",          "LPI", "REG 3", "Laki-laki",  "Imam Wahyudi",       "Ayah", "6281234560009", "imam9@email.com"],
      ["3101234570", "Dzulqornain",           "LPI", "REG 3", "Laki-laki",  "Fauzi Rahman",       "Ayah", "6281234560010", "fauzi10@email.com"],
      ["3101234571", "Kenito Alifian",        "LPI", "REG 3", "Laki-laki",  "Sumadi Zaidan",      "Ayah", "6281234560011", "sumadi11@email.com"],
      ["3101234572", "Muhammad Daffa",        "LPI", "REG 3", "Laki-laki",  "Eko Prasetyo",       "Ayah", "6281234560012", "eko12@email.com"],
      ["3101234573", "Ribut Siswanto",        "LPI", "REG 3", "Laki-laki",  "Sugeng Riyadi",      "Ayah", "6281234560013", "sugeng13@email.com"],
      ["3101234574", "Zaid Faezya",           "LPI", "REG 3", "Laki-laki",  "Hakim Santoso",      "Ayah", "6281234560014", "hakim14@email.com"],
      ["3101234575", "Ilyas Al Farroos",      "LPI", "REG 4", "Laki-laki",  "Ridwan Effendi",     "Ayah", "6281234560015", "ridwan15@email.com"],
      ["3101234576", "Fadhil Fayadh",         "LPI", "REG 4", "Laki-laki",  "Taufik Hidayat",     "Ayah", "6281234560016", "taufik16@email.com"],
      ["3101234577", "Zaidan Yafi Alifudin",  "LPI", "REG 4", "Laki-laki",  "Arifin Nugroho",     "Ayah", "6281234560017", "arifin17@email.com"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template Impor");
    XLSX.writeFile(wb, "Template_Data_Siswa.xlsx");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;
    processFile(uploadedFile);
  };

  const processFile = (uploadedFile: File) => {
    setFile(uploadedFile);
    setLoading(true);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result as ArrayBuffer;
        const wb = XLSX.read(bstr, { type: "array" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        const rows = rawData.slice(1).filter(r => r.length > 0);

        const VALID_UNITS = ["TK", "SD", "SMP", "SMA", "LPI"];
        const VALID_RELATIONSHIPS = ["Ayah", "Ibu", "Wali"];

        const normalizeUnit = (val: any): string =>
          VALID_UNITS.find(u => u === String(val || "").trim().toUpperCase()) ?? String(val || "").trim();

        const normalizeGender = (val: any): string => {
          const v = String(val || "").trim().toLowerCase();
          if (v.startsWith("l")) return "Laki-laki";
          if (v.startsWith("p")) return "Perempuan";
          return String(val || "").trim();
        };

        const RELATIONSHIP_ALIASES: Record<string, string> = {
          ayah: "Ayah", bapak: "Ayah", papa: "Ayah", abi: "Ayah", abah: "Ayah",
          ibu: "Ibu", mama: "Ibu", ummi: "Ibu", bunda: "Ibu",
          wali: "Wali", paman: "Wali", bibi: "Wali", kakek: "Wali", nenek: "Wali",
        };
        const normalizeRelationship = (val: any): string => {
          const key = String(val || "").trim().toLowerCase();
          return RELATIONSHIP_ALIASES[key]
            ?? VALID_RELATIONSHIPS.find(r => r.toLowerCase() === key)
            ?? "Wali";
        };

        const mappedData: ValidationResult[] = rows.map((r) => ({
          nisn: String(r[0] || "").trim(),
          nama_murid: String(r[1] || "").trim(),
          unit: normalizeUnit(r[2]),
          kelas: String(r[3] || "").trim(),
          jenis_kelamin: normalizeGender(r[4]),
          nama_wali: String(r[5] || "").trim(),
          hubungan_wali: normalizeRelationship(r[6]),
          kontak_wali: String(r[7] || "").trim(),
          email_wali: String(r[8] || "").trim(),
          status: "ready"
        }));

        const validated = await validateData(mappedData);
        setData(validated);
        setStep(2);
      } catch (err) {
        console.error("Error parsing Excel:", err);
        alert("Gagal membaca file Excel. Pastikan format sesuai template.");
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(uploadedFile);
  };

  const validateData = async (items: ValidationResult[]) => {
    const { data: existingGuardians } = await supabase
      .from("guardians")
      .select("id, phone");

    const guardianPhones = new Set(existingGuardians?.map(g => g.phone) || []);

    const results = items.map(item => {
      let status: "ready" | "error" | "warning" = "ready";
      let message = "";
      let exists_guardian = false;

      const VALID_UNITS = ["TK", "SD", "SMP", "SMA", "LPI"];
      const VALID_GENDERS = ["Laki-laki", "Perempuan"];

      if (!item.nama_murid) {
        status = "error";
        message = "Nama murid wajib diisi";
      } else if (!VALID_UNITS.includes(item.unit)) {
        status = "error";
        message = `Unit tidak valid: "${item.unit}". Harus TK/SD/SMP/SMA`;
      } else if (!VALID_GENDERS.includes(item.jenis_kelamin)) {
        status = "error";
        message = `Jenis kelamin tidak valid: "${item.jenis_kelamin}"`;
      } else if (!item.nisn) {
        status = "warning";
        message = "NISN kosong (Direkomendasikan isi)";
      }

      if (item.kontak_wali && guardianPhones.has(item.kontak_wali)) {
        exists_guardian = true;
      }

      return { ...item, status, message, exists_guardian };
    });

    return results;
  };

  const startImport = async () => {
    if (!userId) return;
    setLoading(true);

    try {
      const uniqueNewGuardians = Array.from(
        new Map(
          data
            .filter(d => !d.exists_guardian && d.kontak_wali)
            .map(d => [d.kontak_wali, d])
        ).values()
      );

      const guardianMap = new Map<string, string>();
      const guardianErrors: string[] = [];

      for (const guardian of uniqueNewGuardians) {
        try {
          const { data: userData, error: userError } = await supabase
            .from("users")
            .insert({
              first_name: guardian.nama_wali || null,
              last_name: null,
              phone: guardian.kontak_wali || null,
              email: guardian.email_wali || null,
            })
            .select("id")
            .single();

          if (userError) throw userError;

          const { data: guardianData, error: gError } = await supabase
            .from("guardians")
            .insert({
              user_id: userData.id,
              phone: guardian.kontak_wali || null,
              email: guardian.email_wali || null,
              relationship: guardian.hubungan_wali as any,
            })
            .select("id")
            .single();

          if (gError) throw gError;
          guardianMap.set(guardian.kontak_wali, guardianData.id);
        } catch (err: any) {
          console.error(`Gagal insert wali (${guardian.nama_wali}):`, err);
          guardianErrors.push(`${guardian.nama_wali} (${guardian.kontak_wali}): ${err.message}`);
        }
      }

      const { data: allGuardians } = await supabase
        .from("guardians")
        .select("id, phone");

      allGuardians?.forEach(g => {
        if (g.phone && !guardianMap.has(g.phone)) {
          guardianMap.set(g.phone, g.id);
        }
      });

      const VALID_UNITS = ["TK", "SD", "SMP", "SMA", "LPI"];
      const VALID_GENDERS = ["Laki-laki", "Perempuan"];

      const studentInserts = data.filter(d => d.status !== "error").map(d => ({
        nisn: d.nisn || null,
        fullname: d.nama_murid,
        unit: VALID_UNITS.includes(d.unit) ? d.unit : null,
        grade: d.kelas || null,
        gender: VALID_GENDERS.includes(d.jenis_kelamin) ? d.jenis_kelamin : null,
        status: "Aktif",
        guardian_id: d.kontak_wali ? (guardianMap.get(d.kontak_wali) ?? null) : null,
        user_id: userId,
      }));

      const { error: sError } = await supabase.from("students").insert(studentInserts);
      if (sError) throw sError;

      if (guardianErrors.length > 0) {
        alert(`Impor selesai, namun ${guardianErrors.length} wali gagal disimpan:\n\n${guardianErrors.join("\n")}\n\nData murid tetap berhasil diimpor.`);
      }

      setStep(3);
    } catch (err: any) {
      console.error("Import error:", err);
      alert("Terjadi kesalahan saat impor: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-20">
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Link href="/dashboard/students" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500 dark:text-slate-400">
                <ChevronLeft className="w-5 h-5" />
             </Link>
             <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Impor Database Massal</h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400">Unggah file Excel untuk mendaftarkan murid dan wali sekaligus secara cerdas.</p>
        </div>
      </header>

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="h-16 w-16 bg-green-50 dark:bg-green-950/40 rounded-2xl flex items-center justify-center text-[#1a7a4a] dark:text-green-400 mb-6">
                <Download className="w-8 h-8" />
             </div>
             <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Unduh Template</h2>
             <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Gunakan template resmi kami agar format data Anda sesuai dengan standar sistem.</p>
             <button
                 onClick={downloadTemplate}
                 className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-[#1a7a4a] dark:border-green-700 text-[#1a7a4a] dark:text-green-400 rounded-xl font-bold hover:bg-green-50 dark:hover:bg-green-950/30 transition-all active:scale-95"
             >
                 <Download className="w-5 h-5" />
                 Download Template
             </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-600 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="h-16 w-16 bg-blue-50 dark:bg-blue-950/40 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6">
                <FileUp className="w-8 h-8" />
             </div>
             <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Upload File Excel</h2>
             <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm">Pastikan data Anda sudah sesuai dengan template yang diunduh.</p>

             <label className={`cursor-pointer group ${(isCheckingContext || !userId) ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2">
                   {loading || isCheckingContext ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                   {isCheckingContext ? "Checking System..." : !userId ? "Access Denied" : "Pilih Berkas Excel"}
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={loading || isCheckingContext || !userId} />
             </label>
             {!isCheckingContext && !userId && (
               <p className="text-rose-500 dark:text-rose-400 text-xs mt-3 font-medium flex items-center gap-1 justify-center">
                 <AlertCircle className="w-3 h-3" />
                 Anda tidak memiliki akses. Silakan login kembali.
               </p>
             )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in duration-500">
           <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                 <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Total Data</p>
                 <p className="text-2xl font-bold text-slate-800 dark:text-white">{stats.total} Murid</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                 <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 text-blue-600 dark:text-blue-400">Terhubung Wali</p>
                 <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.linkedGuardians} <span className="text-xs font-medium text-slate-400 dark:text-slate-500">Existing</span></p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                 <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 text-[#1a7a4a] dark:text-green-400">Wali Baru Unik</p>
                 <p className="text-2xl font-bold text-[#1a7a4a] dark:text-green-400">+{stats.uniqueNewGuardians}</p>
                 <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{stats.newGuardians} baris data</p>
              </div>
              <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                 <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 text-rose-600 dark:text-rose-400">Masalah Data</p>
                 <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.errors}</p>
              </div>
           </div>

           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50">
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Siswa</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Kelas</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Wali Murid</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Hubungan</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {data.map((row, idx) => (
                       <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4">
                             {row.status === "ready" ? (
                                <div className="flex items-center gap-1.5 text-[#1a7a4a] dark:text-green-400 font-bold text-xs">
                                   <CheckCircle2 className="w-4 h-4" /> Ready
                                </div>
                             ) : row.status === "error" ? (
                                <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-bold text-xs" title={row.message}>
                                   <AlertCircle className="w-4 h-4" /> Error
                                </div>
                             ) : (
                                <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                   <AlertCircle className="w-4 h-4" /> Check
                                </div>
                             )}
                          </td>
                          <td className="px-6 py-4">
                             <p className="font-bold text-slate-800 dark:text-white text-sm uppercase">{row.nama_murid || "N/A"}</p>
                             <p className="text-[10px] text-slate-400 dark:text-slate-500">NISN: {row.nisn || "-"}</p>
                          </td>
                          <td className="px-6 py-4">
                             <p className="text-sm font-medium text-slate-600 dark:text-slate-400">{row.unit} - {row.kelas}</p>
                          </td>
                          <td className="px-6 py-4">
                             <p className="font-bold text-slate-800 dark:text-white text-sm uppercase">{row.nama_wali || "-"}</p>
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">{row.kontak_wali || "-"}</span>
                                {row.exists_guardian && (
                                   <span className="text-[9px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-black uppercase">Existing</span>
                                )}
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{row.hubungan_wali}</span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-200 dark:border-slate-700">
              <button
                 onClick={() => setStep(1)}
                 className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold hover:text-slate-800 dark:hover:text-white transition-colors"
                 disabled={loading}
              >
                 <Trash2 className="w-5 h-5" />
                 Batalkan & Cari Berkas Lain
              </button>
              <button
                 onClick={startImport}
                 disabled={loading || stats.errors > 0 || stats.total === 0}
                 className="px-10 py-4 bg-[#1a7a4a] text-white rounded-2xl font-bold hover:bg-[#15603b] transition-all shadow-xl shadow-green-600/20 active:scale-95 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Sedang Memproses...</>
                 ) : (
                    <><Database className="w-5 h-5" /> Mulai Impor Sekarang</>
                 )}
              </button>
           </div>
        </div>
      )}

      {step === 3 && (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
           <div className="h-24 w-24 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center text-[#1a7a4a] dark:text-green-400 mb-8 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
           </div>
           <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-4 uppercase">Impor Berhasil!</h2>
           <p className="text-slate-500 dark:text-slate-400 mb-10 max-w-md text-lg">
              Selamat! Data {stats.total} murid dan wali telah berhasil ditambahkan ke dalam database sekolah Anda.
           </p>
           <div className="flex flex-col sm:flex-row gap-4">
              <Link
                 href="/dashboard/students"
                 className="px-8 py-3.5 bg-[#1a7a4a] text-white rounded-2xl font-bold hover:bg-[#15603b] transition-all shadow-lg shadow-green-600/20 active:scale-95 flex items-center gap-2"
              >
                 <Users className="w-5 h-5" /> Lihat Database Murid
              </Link>
              <button
                 onClick={() => { setStep(1); setData([]); setFile(null); }}
                 className="px-8 py-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
              >
                 Impor File Lagi
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
