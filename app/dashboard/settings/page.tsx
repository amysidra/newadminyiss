"use client";

import React, { useState, useEffect } from "react";
import { Key, Shield, CheckCircle2, Pencil, X, Save, CreditCard, Loader2, AlertCircle, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SettingsPage() {
  const supabase = createClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [schoolId, setSchoolId] = useState<string | null>(null);
  
  // State for original data from DB
  const [formData, setFormData] = useState({
    activeGateway: "midtrans" as "midtrans" | "xendit",
    midtransClientKey: "",
    midtransServerKey: "",
    midtransMode: "sandbox" as "sandbox" | "production",
    xenditPublicKey: "",
    xenditSecretKey: "",
  });

  // State for form inputs when editing
  const [editData, setEditData] = useState({ ...formData });

  // Fetch settings from Supabase on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Silakan login kembali.");

        let { data: profile, error: profileError } = await supabase
          .from("users")
          .select("school_id")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        let currentSchoolId = profile?.school_id;

        if (!currentSchoolId) {
          const { error: updateError } = await supabase
            .from("users")
            .update({ school_id: user.id })
            .eq("id", user.id);
          
          if (updateError) throw updateError;
          currentSchoolId = user.id;
        }

        setSchoolId(currentSchoolId);

        const { data, error: fetchError } = await supabase
          .from("payment_settings")
          .select("*")
          .eq("school_id", currentSchoolId)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          throw fetchError;
        }

        if (data) {
          const mappedData = {
            activeGateway: data.active_gateway as "midtrans" | "xendit",
            midtransClientKey: data.midtrans_client_key || "",
            midtransServerKey: data.midtrans_server_key || "",
            midtransMode: (data.midtrans_mode as "sandbox" | "production") || "sandbox",
            xenditPublicKey: data.xendit_public_key || "",
            xenditSecretKey: data.xendit_secret_key || "",
          };
          setFormData(mappedData);
          setEditData(mappedData);
        }
      } catch (err: any) {
        console.error("Error fetching settings:", err);
        setError("Gagal mengambil data pengaturan: " + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
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
    if (!schoolId) return;

    try {
      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase.from("payment_settings").upsert({
        school_id: schoolId,
        active_gateway: editData.activeGateway,
        midtrans_client_key: editData.midtransClientKey,
        midtrans_server_key: editData.midtransServerKey,
        midtrans_mode: editData.midtransMode,
        xendit_public_key: editData.xenditPublicKey,
        xendit_secret_key: editData.xenditSecretKey,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      });

      if (updateError) throw updateError;

      setFormData({ ...editData });
      setIsEditing(false);
      setShowSuccess(true);

      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (err: any) {
      console.error("Error saving settings:", err);
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

  const handleGatewayChange = (gateway: "midtrans" | "xendit") => {
    if (!isEditing) return;
    setEditData((prev) => ({
      ...prev,
      activeGateway: gateway,
    }));
  };

  const handleMidtransModeChange = (mode: "sandbox" | "production") => {
    if (!isEditing) return;
    setEditData((prev) => ({
      ...prev,
      midtransMode: mode,
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-green-600 animate-spin mb-4" />
        <p className="text-slate-600 font-medium">Memuat pengaturan...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800">Pengaturan Pembayaran</h1>
        <p className="text-slate-500 mt-2">
          Pilih dan konfigurasikan payment gateway untuk transaksi sekolah.
        </p>
      </div>

      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center text-green-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <CheckCircle2 className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-medium">Konfigurasi berhasil disimpan.</span>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-700 animate-in fade-in slide-in-from-top-4 duration-300">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-emerald-600 to-green-500"></div>
        
        <div className="px-6 md:px-10 pb-10 relative">
          <div className="relative flex justify-between items-end -mt-12 mb-8">
            <div className="w-24 h-24 bg-white rounded-full p-1 border-4 border-white shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                <CreditCard className="w-10 h-10" />
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Payment Gateway Aktif
              </label>
              <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => handleGatewayChange("midtrans")}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    (isEditing ? editData.activeGateway : formData.activeGateway) === "midtrans"
                      ? "bg-white text-green-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  } ${!isEditing && "cursor-default"}`}
                >
                  Midtrans
                </button>
                <button
                  type="button"
                  disabled={!isEditing}
                  onClick={() => handleGatewayChange("xendit")}
                  className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
                    (isEditing ? editData.activeGateway : formData.activeGateway) === "xendit"
                      ? "bg-white text-green-700 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  } ${!isEditing && "cursor-default"}`}
                >
                  Xendit
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400 italic">
                Gateway terpilih akan digunakan untuk memproses seluruh pembayaran SPP.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-8 pt-4 border-t border-slate-100">
              {(isEditing ? editData.activeGateway : formData.activeGateway) === "midtrans" ? (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-slate-800">
                    <div className="p-2 bg-green-50 rounded-lg">
                       <Globe className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold">Kredensial Midtrans</h3>
                  </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-500">Mode Lingkungan (Environment)</label>
                      <div className="flex p-0.5 bg-slate-100 rounded-lg w-fit">
                        <button
                          type="button"
                          disabled={!isEditing}
                          onClick={() => handleMidtransModeChange("sandbox")}
                          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                            (isEditing ? editData.midtransMode : formData.midtransMode) === "sandbox"
                              ? "bg-white text-green-700 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Sandbox
                        </button>
                        <button
                          type="button"
                          disabled={!isEditing}
                          onClick={() => handleMidtransModeChange("production")}
                          className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                            (isEditing ? editData.midtransMode : formData.midtransMode) === "production"
                              ? "bg-white text-emerald-700 shadow-sm"
                              : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          Production
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-500">Client Key</label>
                      {isEditing ? (
                        <div className="relative">
                          <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            name="midtransClientKey"
                            value={editData.midtransClientKey}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm outline-none"
                            placeholder="SB-Mid-client-..."
                          />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                           <Key className="h-4 w-4 text-slate-400" />
                           <p className="text-slate-800 font-mono text-sm truncate">{formData.midtransClientKey || "-"}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-500">Server Key</label>
                      {isEditing ? (
                        <div className="relative">
                          <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            name="midtransServerKey"
                            value={editData.midtransServerKey}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm outline-none"
                            placeholder="SB-Mid-server-..."
                          />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                           <Shield className="h-4 w-4 text-slate-400" />
                           <p className="text-slate-800 font-mono text-sm">
                             {formData.midtransServerKey ? "•".repeat(20) : "-"}
                           </p>
                        </div>
                      )}
                    </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-2 text-slate-800">
                    <div className="p-2 bg-green-50 rounded-lg">
                       <Globe className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold">Kredensial Xendit</h3>
                  </div>

                  <div className="space-y-4 max-w-2xl">
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-500">Public Key</label>
                      {isEditing ? (
                        <div className="relative">
                          <Key className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            name="xenditPublicKey"
                            value={editData.xenditPublicKey}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm outline-none"
                            placeholder="xnd_public_key_..."
                          />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                           <Key className="h-4 w-4 text-slate-400" />
                           <p className="text-slate-800 font-mono text-sm truncate">{formData.xenditPublicKey || "-"}</p>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-slate-500">Secret Key</label>
                      {isEditing ? (
                        <div className="relative">
                          <Shield className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                          <input
                            type="text"
                            name="xenditSecretKey"
                            value={editData.xenditSecretKey}
                            onChange={handleChange}
                            className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-green-500 focus:border-green-500 sm:text-sm outline-none"
                            placeholder="xnd_development_..."
                          />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 p-2 bg-slate-50 rounded-lg border border-slate-100">
                           <Shield className="h-4 w-4 text-slate-400" />
                           <p className="text-slate-800 font-mono text-sm">
                             {formData.xenditSecretKey ? "•".repeat(20) : "-"}
                           </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-8 border-t border-slate-100">
              {!isEditing ? (
                <button
                  onClick={handleEditClick}
                  className="flex items-center space-x-2 px-6 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-sm active:scale-95"
                >
                  <Pencil className="w-4 h-4" />
                  <span>Edit Pengaturan</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancelClick}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-all disabled:opacity-50"
                  >
                    <X className="w-4 h-4" />
                    <span>Batal</span>
                  </button>
                  <button
                    onClick={handleSaveClick}
                    disabled={saving}
                    className="flex items-center space-x-2 px-6 py-2.5 border border-transparent rounded-xl text-sm font-semibold text-white bg-green-600 hover:bg-green-700 shadow-sm transition-all disabled:opacity-70 active:scale-95"
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
