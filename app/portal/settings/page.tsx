"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { UserCircle, Mail, Lock, Pencil, X, Save, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { usePortal } from "@/lib/context/PortalContext";

export default function PortalSettingsPage() {
  const supabase = React.useMemo(() => createClient(), []);
  const { profile } = usePortal();

  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({ firstName: "", lastName: "", email: "", password: "" });
  const [editData, setEditData] = useState({ ...formData });

  useEffect(() => {
    if (!profile) return;

    async function fetchProfile() {
      try {
        setLoading(true);
        const { data, error: dbError } = await supabase
          .from("users")
          .select("first_name, last_name, email")
          .eq("id", profile!.id)
          .single();

        if (dbError) throw dbError;

        const loaded = {
          firstName: data.first_name ?? "",
          lastName:  data.last_name  ?? "",
          email:     data.email      ?? profile!.email ?? "",
          password:  "",
        };
        setFormData(loaded);
        setEditData(loaded);

        const { data: { user } } = await supabase.auth.getUser();
        const meta = user?.user_metadata;
        setAvatarUrl(meta?.avatar_url ?? meta?.picture ?? null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [profile]);

  const handleSaveClick = async () => {
    if (!profile) return;
    try {
      setSaving(true);
      setError(null);

      const { error: dbError } = await supabase
        .from("users")
        .update({
          first_name: editData.firstName.trim() || null,
          last_name:  editData.lastName.trim()  || null,
          email:      editData.email.trim()      || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profile.id);

      if (dbError) throw dbError;

      const authUpdates: { email?: string; password?: string } = {};
      if (editData.email !== formData.email) authUpdates.email    = editData.email;
      if (editData.password)                 authUpdates.password = editData.password;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser(authUpdates);
        if (authError) throw authError;
      }

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
    setEditData(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-[#1a7a4a] animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Memuat profil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto pb-12 font-poppins">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Pengaturan Profil</h1>
        <p className="text-slate-500 mt-2">Kelola informasi pribadi dan keamanan akun Anda.</p>
      </div>

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center text-green-700">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-semibold text-sm text-[#1a7a4a]">Berhasil! Profil Anda telah diperbarui.</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center text-red-700">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-semibold text-sm">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-[#1a7a4a] via-[#22c55e] to-[#4ade80]" />

        <div className="px-6 md:px-12 pb-12 relative">
          <div className="flex justify-between items-end -mt-16 mb-12">
            <div className="w-32 h-32 bg-white rounded-3xl p-1.5 border border-slate-100 shadow-xl overflow-hidden">
              <div className="w-full h-full bg-slate-50 rounded-[1.25rem] flex items-center justify-center overflow-hidden">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="Foto profil"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover rounded-[1.25rem]"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <UserCircle className="w-20 h-20 text-slate-300" />
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-10">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1a7a4a] uppercase tracking-wider ml-1">Nama Depan</label>
              {isEditing ? (
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" name="firstName" value={editData.firstName} onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all text-slate-700 font-medium"
                    placeholder="Nama depan" />
                </div>
              ) : (
                <div className="px-5 py-4 bg-slate-50 rounded-2xl">
                  <span className="text-slate-700 font-semibold">{formData.firstName || "Belum diisi"}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#1a7a4a] uppercase tracking-wider ml-1">Nama Belakang</label>
              {isEditing ? (
                <div className="relative group">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="text" name="lastName" value={editData.lastName} onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all text-slate-700 font-medium"
                    placeholder="Nama belakang" />
                </div>
              ) : (
                <div className="px-5 py-4 bg-slate-50 rounded-2xl">
                  <span className="text-slate-700 font-semibold">{formData.lastName || "-"}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-[#1a7a4a] uppercase tracking-wider ml-1">Email</label>
              {isEditing ? (
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="email" name="email" value={editData.email} onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all text-slate-700 font-medium"
                    placeholder="nama@email.com" />
                </div>
              ) : (
                <div className="px-5 py-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 font-semibold">{formData.email}</span>
                </div>
              )}
            </div>

            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-bold text-[#1a7a4a] uppercase tracking-wider ml-1">Password</label>
              {isEditing ? (
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input type="password" name="password" value={editData.password} onChange={handleChange}
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50/50 border border-slate-200 rounded-2xl outline-none focus:bg-white focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all text-slate-700 font-medium"
                    placeholder="Biarkan kosong jika tidak ingin mengubah" />
                </div>
              ) : (
                <div className="px-5 py-4 bg-slate-50 rounded-2xl flex items-center gap-3">
                  <Lock className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-700 font-semibold tracking-widest text-xs">••••••••••••</span>
                </div>
              )}
              <p className="text-[10px] text-slate-400 ml-1 italic font-medium">
                Password disimpan dengan enkripsi tingkat tinggi demi keamanan akun Anda.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-16 pt-10 border-t border-slate-100">
            {!isEditing ? (
              <button
                onClick={() => { setEditData({ ...formData, password: "" }); setIsEditing(true); setShowSuccess(false); setError(null); }}
                className="flex items-center gap-2.5 px-8 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-700 hover:bg-slate-50 hover:border-slate-200 hover:text-slate-900 transition-all shadow-sm active:scale-95"
              >
                <Pencil className="w-4 h-4" />
                Edit Profil
              </button>
            ) : (
              <>
                <button onClick={() => { setIsEditing(false); setError(null); }} disabled={saving}
                  className="flex items-center gap-2.5 px-8 py-3.5 bg-white border-2 border-slate-100 rounded-2xl text-sm font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all disabled:opacity-50">
                  <X className="w-4 h-4" />
                  Batal
                </button>
                <button onClick={handleSaveClick} disabled={saving}
                  className="flex items-center gap-2.5 px-10 py-3.5 bg-[#1a7a4a] rounded-2xl text-sm font-bold text-white hover:bg-[#15603b] shadow-lg shadow-green-900/10 transition-all disabled:opacity-70 active:scale-95">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
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
