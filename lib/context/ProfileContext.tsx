"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface UserProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: "admin" | "walimurid" | "guru" | "tendik";
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  walimurid: "Wali Murid",
  guru: "Guru",
  tendik: "Tenaga Kependidikan",
};

const ADMIN_ROLES = ["admin"] as const;

interface ProfileContextValue {
  profile: UserProfile | null;
  roleLabel: string;
  isAdmin: boolean;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  roleLabel: "",
  isAdmin: false,
});

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/");
        return;
      }

      let { data } = await supabase
        .from("users")
        .select("id, first_name, last_name, email, role")
        .eq("id", user.id)
        .maybeSingle();

      // Profil belum ada (race condition sesaat setelah trigger auth) — buat sekarang
      if (!data) {
        const { data: created } = await supabase
          .from("users")
          .upsert({ id: user.id, email: user.email ?? null, role: "admin" })
          .select("id, first_name, last_name, email, role")
          .single();

        data = created;
      }

      if (!data) {
        // Masih gagal — kemungkinan skema DB belum diperbarui
        router.replace("/");
        return;
      }

      if (!ADMIN_ROLES.includes(data.role as any)) {
        router.replace("/unauthorized");
        return;
      }

      setProfile(data as UserProfile);
      setLoading(false);
    }

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f4f6f8]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-[#1a7a4a] border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm font-medium">Memuat profil...</p>
        </div>
      </div>
    );
  }

  const roleLabel = profile ? (ROLE_LABELS[profile.role] ?? profile.role) : "";
  const isAdmin = profile?.role === "admin";

  return (
    <ProfileContext.Provider value={{ profile, roleLabel, isAdmin }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
