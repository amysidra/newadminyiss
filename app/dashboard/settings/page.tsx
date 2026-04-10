"use client";

import React, { useState, useEffect } from "react";
import { UserCircle, Mail, Lock, Pencil, X, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "", 
  });

  const [editData, setEditData] = useState({ ...formData });

  useEffect(() => {
    async function fetchUser() {
      try {
        setLoading(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Gagal mengambil data pengguna.");

        const fullName = user.user_metadata?.full_name || "";
        const nameParts = fullName.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const data = {
          firstName,
          lastName,
          email: user.email || "",
          password: "", 
        };

        setFormData(data);
        setEditData(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [supabase]);

  const handleEditClick = () => {
    setEditData({ ...formData, password: "" });
    setIsEditing(true);
    setShowSuccess(false);
    setError(null);
  };

  const handleCancelClick = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSaveClick = async () => {
    try {
      setSaving(true);
      setError(null);

      const fullName = `${editData.firstName} ${editData.lastName}`.trim();
      
      const { error: updateError } = await supabase.auth.updateUser({
        email: editData.email !== formData.email ? editData.email : undefined,
        password: editData.password ? editData.password : undefined,
        data: { full_name: fullName }
      });

      if (updateError) throw updateError;

      setFormData({ ...editData, password: "" });
      setIsEditing(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan perubahan.");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[#1a7a4a] animate-spin mb-4" />
        <p className="text-slate-600 font-medium font-poppins">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 font-poppins">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Pengaturan Profil</h1>
        <p className="text-slate-500 mt-2">
          Kelola informasi pribadi dan keamanan akun Anda.
        </p>
      </div>

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center text-green-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-semibold text-sm text-[#1a7a4a]">Berhasil! Profil Anda telah diperbarui.</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center text-red-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-semibold text-sm">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden transition-all duration-300">
        <div className="h-32 bg-gradient-to-r from-[#1a7a4a] via-[#22c55e] to-[#4ade80]"></div>
        
        <div className="px-6 md:px-12 pb-12 relative">
          <div className="flex justify-between items-end -mt-16 mb-12">
            <div className="relative group">
              <div className="w-32 h-32 bg-white rounded-3xl p-1.5 border border-slate-100 shadow-xl overflow-hidden transition-transform duration-300 group-hover:scale-105">
                <div className="w-full h-full bg-slate-50 rounded-[1.25rem] flex items-center justify-center text-slate-300">
                  <UserCircle className="w-20 h-20 text-slate-300" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
            {/* Nama Depan */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1a7a4a] uppercase tracking-wider ml-1">Nama Depan</label>
              {isEditing ? (
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1a7a4a] transition-colors" />
                  <input
                    type="text"
                    name="firstName"
                    value={editData.firstName}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all text-slate-700 font-medium"
                    placeholder="Masukkan nama depan"
                  />
                </div>
              ) : (
                <div className="px-5 py-4 bg-slate-50 rounded-2xl border border-transparent flex items-center gap-3">
                  <span className="text-slate-700 font-semibold">{formData.firstName || "Belum diisi"}</span>
                </div>
              )}
            </div>

            {/* Nama Belakang */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1a7a4a] uppercase tracking-wider ml-1">Nama Belakang</label>
              {isEditing ? (
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1a7a4a] transition-colors" />
                  <input
                    type="text"
                    name="lastName"
                    value={editData.lastName}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all text-slate-700 font-medium"
                    placeholder="Masukkan nama belakang"
                  />
                </div>
              ) : (
                <div className="px-5 py-4 bg-slate-50 rounded-2xl border border-transparent flex items-center gap-3">
                  <span className="text-slate-700 font-semibold">{formData.lastName || "-"}</span>
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-[#1a7a4a] uppercase tracking-wider ml-1">Email</label>
              {isEditing ? (
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1a7a4a] transition-colors" />
                  <input
                    type="email"
                    name="email"
                    value={editData.email}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all text-slate-700 font-medium"
                    placeholder="nama@email.com"
                  />
                </div>
              ) : (
                <div className="px-5 py-4 bg-slate-50 rounded-2xl border border-transparent flex items-center gap-3 w-full">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 font-semibold">{formData.email}</span>
                </div>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-[#1a7a4a] uppercase tracking-wider ml-1">Password</label>
              {isEditing ? (
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#1a7a4a] transition-colors" />
                  <input
                    type="password"
                    name="password"
                    value={editData.password}
                    onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all text-slate-700 font-medium"
                    placeholder="Biarkan kosong jika tidak ingin mengubah"
                  />
                </div>
              ) : (
                <div className="px-5 py-4 bg-slate-50 rounded-2xl border border-transparent flex items-center gap-3 w-full">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 font-semibold tracking-widest text-xs">••••••••••••</span>
                </div>
              )}
              <p className="text-[10px] text-slate-400 ml-1 italic font-medium">Password disimpan dengan enkripsi tingkat tinggi demi keamanan akun Anda.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-16 pt-10 border-t border-slate-100">
            {!isEditing ? (
              <button
                onClick={handleEditClick}
                className="flex items-center gap-2.5 px-8 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-200 hover:text-slate-900 transition-all shadow-sm active:scale-95"
              >
                <Pencil className="w-4 h-4" />
                Edit Profil
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancelClick}
                  disabled={saving}
                  className="flex items-center gap-2.5 px-8 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Batal
                </button>
                <button
                  onClick={handleSaveClick}
                  disabled={saving}
                  className="flex items-center gap-2.5 px-10 py-3.5 bg-[#1a7a4a] rounded-2xl text-sm font-bold text-white hover:bg-[#15603b] shadow-lg shadow-green-900/10 transition-all disabled:opacity-70 active:scale-95"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving ? "Menyimpan..." : "Simpan Perubahan"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
