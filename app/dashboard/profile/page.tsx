"use client";

import React, { useState, useEffect } from "react";
import { User, Mail, Building, CheckCircle2, Pencil, X, Save, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Initial state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    schoolName: "",
    schoolEmail: "",
  });

  // State for form inputs when editing
  const [editData, setEditData] = useState({ ...formData });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          setError("Sesi berakhir. Silakan login kembali.");
          return;
        }

        setUserId(user.id);

        const { data: profile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError && profileError.code !== "PGRST116") {
          throw profileError;
        }

        if (profile) {
          const fetchedData = {
            firstName: profile.first_name || "",
            lastName: profile.last_name || "",
            schoolName: profile.school_name || "",
            schoolEmail: profile.email || user.email || "",
          };
          setFormData(fetchedData);
          setEditData(fetchedData);
        } else {
          // If no profile yet, use auth data
          const fetchedData = {
            firstName: "",
            lastName: "",
            schoolName: "",
            schoolEmail: user.email || "",
          };
          setFormData(fetchedData);
          setEditData(fetchedData);
        }
      } catch (err: any) {
        console.error("Error fetching profile:", err);
        setError("Gagal mengambil data profil.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [supabase]);

  const handleEditClick = () => {
    setEditData({ ...formData });
    setIsEditing(true);
    setShowSuccess(false);
    setError(null);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSaveClick = async () => {
    if (!userId) return;

    try {
      setSaving(true);
      setError(null);

      const { error: updateError } = await supabase.from("users").upsert({
        id: userId,
        first_name: editData.firstName,
        last_name: editData.lastName,
        school_name: editData.schoolName,
        email: formData.schoolEmail, 
        updated_at: new Date().toISOString(),
      });

      if (updateError) throw updateError;

      setFormData({ ...editData });
      setIsEditing(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error saving profile:", err);
      setError("Gagal menyimpan perubahan. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Memuat data profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Profil Admin & Sekolah</h1>
        <p className="text-slate-500 mt-2">
          Kelola informasi personal admin dan data identitas sekolah.
        </p>
      </div>

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-medium">Data berhasil disimpan.</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-green-600 to-emerald-500"></div>
        
        <div className="px-6 md:px-10 pb-10 relative">
          <div className="relative flex justify-between items-end -mt-12 mb-8">
            <div className="w-24 h-24 bg-white rounded-full p-1 border-4 border-white shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <User className="w-10 h-10" />
              </div>
            </div>
          </div>
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">
                  Informasi Admin
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">
                      Nama Depan
                    </label>
                    {isEditing ? (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="firstName"
                          value={editData.firstName}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors outline-none"
                          placeholder="Masukkan nama depan"
                        />
                      </div>
                    ) : (
                      <p className="text-slate-800 font-medium">{formData.firstName || "-"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">
                      Nama Belakang
                    </label>
                    {isEditing ? (
                      <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="lastName"
                          value={editData.lastName}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors outline-none"
                          placeholder="Masukkan nama belakang"
                        />
                      </div>
                    ) : (
                      <p className="text-slate-800 font-medium">{formData.lastName || "-"}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800 border-b border-slate-100 pb-2">
                  Informasi Sekolah
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">
                      Nama Sekolah
                    </label>
                    {isEditing ? (
                      <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Building className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="text"
                          name="schoolName"
                          value={editData.schoolName}
                          onChange={handleChange}
                          className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm transition-colors outline-none"
                          placeholder="Masukkan nama sekolah"
                        />
                      </div>
                    ) : (
                      <p className="text-slate-800 font-medium">{formData.schoolName || "-"}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-500 mb-1">
                      Email Sekolah / Akun
                    </label>
                    {isEditing ? (
                      <div className="relative">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Mail className="h-4 w-4 text-slate-400" />
                        </div>
                        <input
                          type="email"
                          name="schoolEmail"
                          value={editData.schoolEmail}
                          disabled
                          className="block w-full pl-10 pr-3 py-2 border border-slate-200 bg-slate-50 text-slate-500 rounded-lg sm:text-sm cursor-not-allowed"
                          placeholder="Masukkan email sekolah"
                        />
                      </div>
                    ) : (
                      <p className="text-slate-800 font-medium">{formData.schoolEmail || "-"}</p>
                    )}
                    {isEditing && (
                      <p className="mt-1 text-[11px] text-slate-400 italic">Email tidak dapat diubah karena terhubung dengan akun utama.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-100 mt-8">
              {!isEditing ? (
                <button
                  onClick={handleEditClick}
                  className="flex items-center space-x-2 px-5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit Profil</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancelClick}
                    disabled={saving}
                    className="flex items-center space-x-2 px-5 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>Batal</span>
                  </button>
                  <button
                    onClick={handleSaveClick}
                    disabled={saving}
                    className="flex items-center space-x-2 px-5 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 shadow-sm transition-colors disabled:opacity-70"
                  >
                    {saving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>{saving ? "Menyimpan..." : "Simpan Perubahan"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
