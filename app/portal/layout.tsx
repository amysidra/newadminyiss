"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  GraduationCap,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { PortalProvider } from "@/lib/context/PortalContext";
import { PortalUserDropdown } from "@/components/portal/UserDropdown";

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  function getLinkClass(path: string) {
    const active = pathname === path;
    return active
      ? "flex items-center px-3 py-2 text-sm font-semibold rounded-lg bg-green-50 text-[#1a7a4a]"
      : "flex items-center px-3 py-2 text-sm font-medium rounded-lg text-slate-600 hover:bg-green-50 hover:text-[#1a7a4a] transition-colors";
  }

  return (
    <PortalProvider>
      <div className="flex h-screen bg-[#f4f6f8] font-poppins">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 flex-shrink-0">
            <Link href="/portal" className="flex items-center gap-2">
              <img src="/LogoYiss.png" alt="Logo YISS" className="h-14 w-auto object-contain" />
            </Link>
            <button
              className="md:hidden p-1.5 -mr-2 rounded-md hover:bg-slate-100 text-slate-500"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 px-4 py-6 space-y-8">
            <div>
              <h3 className="px-3 text-[10px] font-bold tracking-[0.1em] text-[#1a7a4a]/60 uppercase mb-3">
                PORTAL WALI MURID
              </h3>
              <div className="space-y-1">
                <Link href="/portal" className={getLinkClass("/portal")}>
                  <LayoutDashboard className="w-4 h-4 mr-3" />
                  Dashboard
                </Link>
                <Link href="/portal/settings" className={getLinkClass("/portal/settings")}>
                  <Settings className="w-4 h-4 mr-3" />
                  Pengaturan
                </Link>
              </div>
            </div>

            <div>
              <h3 className="px-3 text-[10px] font-bold tracking-[0.1em] text-[#1a7a4a]/60 uppercase mb-3">
                SPP
              </h3>
              <div className="space-y-1">
                <Link href="/portal/invoices" className={getLinkClass("/portal/invoices")}>
                  <Receipt className="w-4 h-4 mr-3" />
                  Tagihan
                </Link>
              </div>
            </div>

            <div>
              <h3 className="px-3 text-[10px] font-bold tracking-[0.1em] text-[#1a7a4a]/60 uppercase mb-3">
                DATA
              </h3>
              <div className="space-y-1">
                <Link href="/portal/students" className={getLinkClass("/portal/students")}>
                  <GraduationCap className="w-4 h-4 mr-3" />
                  Murid Saya
                </Link>
              </div>
            </div>
          </nav>
        </aside>

        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <header className="h-16 flex items-center justify-between md:justify-end px-4 md:px-8 bg-white border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center md:hidden">
              <button
                className="p-2 -ml-2 rounded-md hover:bg-slate-100 text-slate-600"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-6 h-6" />
              </button>
              <span className="font-bold text-lg text-slate-800 ml-2">Portal Wali Murid</span>
            </div>
            <PortalUserDropdown />
          </header>

          <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
        </div>
      </div>
    </PortalProvider>
  );
}
