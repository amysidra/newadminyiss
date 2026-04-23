import { createClient } from "@/lib/supabase/server";
import PortalLayoutClient from "./portal-layout-client";
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      title: "Portal Wali Murid — YISS",
    };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const roleLabel = profile?.role === "walimurid" ? "Wali Murid" : "";
  const displayTitle = roleLabel ? `Portal ${roleLabel} — YISS` : "Portal — YISS";

  return {
    title: displayTitle,
  };
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalLayoutClient>{children}</PortalLayoutClient>;
}
