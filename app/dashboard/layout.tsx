import { createClient } from "@/lib/supabase/server";
import DashboardLayoutClient from "./dashboard-layout-client";
import { Metadata } from "next";

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  walimurid: "Wali Murid",
  guru: "Guru",
  tendik: "Tenaga Kependidikan",
};

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      title: "Dashboard — YISS",
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const roleLabel = profile ? (ROLE_LABELS[profile.role] ?? profile.role) : "";
  const displayTitle = roleLabel ? `Dashboard ${roleLabel} — YISS` : "Dashboard — YISS";

  return {
    title: displayTitle,
  };
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
