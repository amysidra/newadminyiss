"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface PortalProfile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role: string;
  guardianId: string | null;
}

interface PortalContextValue {
  profile: PortalProfile | null;
}

const PortalContext = createContext<PortalContextValue>({ profile: null });

export function PortalProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PortalProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/");
          return;
        }

        const { data } = await supabase
          .from("users")
          .select("id, first_name, last_name, email, role")
          .eq("id", user.id)
          .maybeSingle();

        if (!data) {
          router.replace("/?error=no_profile");
          return;
        }

        if (data.role !== "walimurid") {
          router.replace("/dashboard");
          return;
        }

        // Gunakan API route (service role) agar self-heal jika user_id masih UUID lama
        const res = await fetch("/api/portal/guardian")
        const { guardianId } = res.ok ? await res.json() : { guardianId: null }

        setProfile({ ...data, guardianId: guardianId ?? null });
        setLoading(false);
      } catch (err) {
        console.error("PortalContext error:", err);
        router.replace("/");
      }
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

  return (
    <PortalContext.Provider value={{ profile }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  return useContext(PortalContext);
}
