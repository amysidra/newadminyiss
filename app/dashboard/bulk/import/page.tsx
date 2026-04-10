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
import GoogleDrivePicker from "@/components/bulk/GoogleDrivePicker";

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
  const [file, setFile] = useState<File | null>(null);
  const [isCheckingContext, setIsCheckingContext] = useState(true);
  const [data, setData] = useState<ValidationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Success
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const stats = useMemo(() => {
    let errCount = 0;
    let newGCount = 0;
    let linkGCount = 0;

    data.forEach(item => {
      if (item.status === "error") errCount++;
      if (item.exists_guardian) {
        linkGCount++;
      } else if (item.nama_wali) {
        newGCount++;
      }
    });

    return {
      total: data.length,
      newGuardians: newGCount,
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
        if (!user) return;

        const { data: profile } = await supabase
          .from("users")
          .select("school_id")
          .eq("id", user.id)
          .single();
        
        if (profile?.school_id) {
          setSchoolId(profile.school_id);
          setUserId(user.id);
        }
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
      ["NISN", "Nama Murid", "Unit (TK/SD/SMP/SMA)", "Kelas", "Jenis Kelamin (Laki-laki/Perempuan)", "Nama Wali", "Hubungan Wali (Ayah/Ibu/Wali)", "No HP/WA Wali", "Email Wali"],
      ["1234567890", "Ahmad Syarif", "SD", "1A", "Laki-laki", "Budi Santoso", "Ayah", "08123456789", "budi@email.com"]
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
        const bstr = evt.target?.result as string;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        // Skip header
        const rows = rawData.slice(1).filter(r => r.length > 0);
        
        const mappedData: ValidationResult[] = rows.map((r) => ({
          nisn: String(r[0] || ""),
          nama_murid: String(r[1] || ""),
          unit: String(r[2] || "SD"),
          kelas: String(r[3] || ""),
          jenis_kelamin: String(r[4] || "Laki-laki"),
          nama_wali: String(r[5] || ""),
          hubungan_wali: String(r[6] || "Ayah"),
          kontak_wali: String(r[7] || ""),
          email_wali: String(r[8] || ""),
          status: "ready"
        }));

        // Validate
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
    reader.readAsBinaryString(uploadedFile);
  };

  const validateData = async (items: ValidationResult[]) => {
    if (!schoolId) return items;

    // Fetch existing guardians to match by phone
    const { data: existingGuardians } = await supabase
      .from("guardians")
      .select("id, phone, fullname")
      .eq("school_id", schoolId);

    const guardianPhones = new Set(existingGuardians?.map(g => g.phone) || []);
    
    const results = items.map(item => {
      let status: "ready" | "error" | "warning" = "ready";
      let message = "";
      let exists_guardian = false;

      if (!item.nama_murid) {
        status = "error";
        message = "Nama murid wajib diisi";
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
    if (!schoolId || !userId) return;
    setLoading(true);

    try {
      // 1. Process Guardians first (unique by phone)
      const uniqueGuardians = Array.from(new Set(data.filter(d => !d.exists_guardian && d.kontak_wali).map(d => d.kontak_wali)))
        .map(phone => {
          const firstOccurence = data.find(d => d.kontak_wali === phone);
          return {
            fullname: firstOccurence?.nama_wali,
            phone: phone,
            email: firstOccurence?.email_wali,
            relationship: firstOccurence?.hubungan_wali as any,
            school_id: schoolId,
            user_id: userId
          };
        });

      if (uniqueGuardians.length > 0) {
        const { error: gError } = await supabase.from("guardians").insert(uniqueGuardians);
        if (gError) throw gError;
      }

      // 2. Fetch all guardians again to get correct IDs
      const { data: allGuardians } = await supabase
        .from("guardians")
        .select("id, phone")
        .eq("school_id", schoolId);
      
      const guardianMap = new Map(allGuardians?.map(g => [g.phone, g.id]));

      // 3. Process Students
      const studentInserts = data.filter(d => d.status !== "error").map(d => ({
        nisn: d.nisn,
        fullname: d.nama_murid,
        unit: d.unit as any,
        grade: d.kelas,
        gender: d.jenis_kelamin as any,
        status: "Aktif",
        guardian_id: d.kontak_wali ? guardianMap.get(d.kontak_wali) : null,
        school_id: schoolId,
        user_id: userId
      }));

      const { error: sError } = await supabase.from("students").insert(studentInserts);
      if (sError) throw sError;

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
      {/* Header */}
      <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Link href="/dashboard/students" className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500">
                <ChevronLeft className="w-5 h-5" />
             </Link>
             <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Impor Database Massal</h1>
          </div>
          <p className="text-slate-500">Unggah file Excel untuk mendaftarkan murid dan wali sekaligus secara cerdas.</p>
        </div>
      </header>

      {step === 1 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center text-[#1a7a4a] mb-6">
                <Download className="w-8 h-8" />
             </div>
             <h2 className="text-xl font-bold text-slate-800 mb-2">Unduh Template</h2>
             <p className="text-slate-500 mb-8 max-w-sm">Gunakan template resmi kami agar format data Anda sesuai dengan standar sistem.</p>
             <div className="flex flex-col sm:flex-row gap-4">
                <button 
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-[#1a7a4a] text-[#1a7a4a] rounded-xl font-bold hover:bg-green-50 transition-all active:scale-95"
                >
                    <Download className="w-5 h-5" />
                    Download Template
                </button>
                <div className={`${(isCheckingContext || !schoolId) ? 'opacity-50 pointer-events-none' : ''}`}>
                    <GoogleDrivePicker 
                        onFileSelect={processFile} 
                        isLoading={loading} 
                    />
                </div>
             </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border-2 border-dashed border-slate-300 shadow-sm flex flex-col items-center justify-center text-center">
             <div className="h-16 w-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 mb-6">
                <FileUp className="w-8 h-8" />
             </div>
             <h2 className="text-xl font-bold text-slate-800 mb-2">Upload File Excel</h2>
             <p className="text-slate-500 mb-8 max-w-sm">Pastikan data Anda sudah sesuai dengan template yang diunduh.</p>
             
             <label className={`cursor-pointer group ${(isCheckingContext || !schoolId) ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20 active:scale-95 flex items-center gap-2">
                   {loading || isCheckingContext ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileUp className="w-5 h-5" />}
                   {isCheckingContext ? "Checking System..." : !schoolId ? "Access Denied" : "Pilih Berkas Excel"}
                </div>
                <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={loading || isCheckingContext || !schoolId} />
             </label>
             {!isCheckingContext && !schoolId && (
               <p className="text-rose-500 text-xs mt-3 font-medium flex items-center gap-1 justify-center">
                 <AlertCircle className="w-3 h-3" />
                 Anda tidak memiliki akses ke sekolah manapun.
               </p>
             )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
           {/* Stats Summary */}
           <div className="p-8 border-b border-slate-100 bg-slate-50/50 grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Data</p>
                 <p className="text-2xl font-bold text-slate-800">{stats.total} Murid</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-blue-600">Terhubung Wali</p>
                 <p className="text-2xl font-bold text-blue-600">{stats.linkedGuardians} <span className="text-xs font-medium text-slate-400">Existing</span></p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-[#1a7a4a]">Wali Baru</p>
                 <p className="text-2xl font-bold text-[#1a7a4a]">+{stats.newGuardians}</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-rose-600">Masalah Data</p>
                 <p className="text-2xl font-bold text-rose-600">{stats.errors}</p>
              </div>
           </div>

           {/* Table Preview */}
           <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                 <thead>
                    <tr className="bg-slate-50">
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Siswa</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Kelas</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Wali Murid</th>
                       <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">Hubungan</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {data.map((row, idx) => (
                       <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4">
                             {row.status === "ready" ? (
                                <div className="flex items-center gap-1.5 text-[#1a7a4a] font-bold text-xs">
                                   <CheckCircle2 className="w-4 h-4" /> Ready
                                </div>
                             ) : row.status === "error" ? (
                                <div className="flex items-center gap-1.5 text-rose-600 font-bold text-xs" title={row.message}>
                                   <AlertCircle className="w-4 h-4" /> Error
                                </div>
                             ) : (
                                <div className="flex items-center gap-1.5 text-amber-600 font-bold text-xs">
                                   <AlertCircle className="w-4 h-4" /> Check
                                </div>
                             )}
                          </td>
                          <td className="px-6 py-4">
                             <p className="font-bold text-slate-800 text-sm uppercase">{row.nama_murid || "N/A"}</p>
                             <p className="text-[10px] text-slate-400">NISN: {row.nisn || "-"}</p>
                          </td>
                          <td className="px-6 py-4">
                             <p className="text-sm font-medium text-slate-600">{row.unit} - {row.kelas}</p>
                          </td>
                          <td className="px-6 py-4">
                             <p className="font-bold text-slate-800 text-sm uppercase">{row.nama_wali || "-"}</p>
                             <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400">{row.kontak_wali || "-"}</span>
                                {row.exists_guardian && (
                                   <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase">Existing</span>
                                )}
                             </div>
                          </td>
                          <td className="px-6 py-4">
                             <span className="text-xs text-slate-500 font-medium">{row.hubungan_wali}</span>
                          </td>
                       </tr>
                    ))}
                 </tbody>
              </table>
           </div>

           {/* Footer Action */}
           <div className="p-8 bg-slate-50 flex items-center justify-between border-t border-slate-200">
              <button 
                 onClick={() => setStep(1)}
                 className="flex items-center gap-2 text-slate-500 font-bold hover:text-slate-800 transition-colors"
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
        <div className="bg-white p-12 rounded-3xl border border-slate-200 shadow-xl flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-500">
           <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center text-[#1a7a4a] mb-8 animate-bounce">
              <CheckCircle2 className="w-12 h-12" />
           </div>
           <h2 className="text-3xl font-black text-slate-800 mb-4 uppercase">Impor Berhasil!</h2>
           <p className="text-slate-500 mb-10 max-w-md text-lg">
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
                 onClick={() => setStep(1)}
                 className="px-8 py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl font-bold hover:bg-slate-50 transition-all"
              >
                 Impor File Lagi
              </button>
           </div>
        </div>
      )}
    </div>
  );
}
