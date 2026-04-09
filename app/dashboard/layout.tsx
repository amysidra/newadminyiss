"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  User,
  UserCircle,
  Settings,
  Receipt,
  Files,
  List,
  Users,
  GraduationCap,
  Building,
  CreditCard,
  HelpCircle,
  Menu,
  X,
  FileUp,
} from "lucide-react";
import { UserDropdown } from "@/components/admin/UserDropdown";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  function getLinkClass(path: string) {
    return pathname === path
      ? "flex items-center px-3 py-2 text-sm font-medium rounded-md bg-green-50 text-green-700"
      : "flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-600 hover:bg-green-50 hover:text-green-700";
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Mobile sidebar backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto transform transition-transform duration-200 ease-in-out md:static md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-100 flex-shrink-0">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-lg text-slate-800"
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#15803d"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>YISS Admin</span>
          </Link>
          <button
            className="md:hidden p-1.5 -mr-2 rounded-md hover:bg-slate-100 text-slate-500"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-8">
          <div>
            <h3 className="px-3 text-xs font-bold tracking-wider text-green-600/70 uppercase mb-3">
              DASHBOARD
            </h3>
            <div className="space-y-1">
              <Link href="/dashboard" className={getLinkClass("/dashboard")}>
                <User className="w-4 h-4 mr-3" />
                Dashboard
              </Link>
              <Link href="/dashboard/profile" className={getLinkClass("/dashboard/profile")}>
                <UserCircle className="w-4 h-4 mr-3" />
                Profile
              </Link>
              <Link href="/dashboard/settings" className={getLinkClass("/dashboard/settings")}>
                <Settings className="w-4 h-4 mr-3" />
                Settings
              </Link>
            </div>
          </div>

          <div>
            <h3 className="px-3 text-xs font-bold tracking-wider text-green-600/70 uppercase mb-3">
              SPP
            </h3>
            <div className="space-y-1">
              <Link href="/dashboard/create" className={getLinkClass("/dashboard/create")}>
                <Receipt className="w-4 h-4 mr-3" />
                Single Invoice
              </Link>
              <Link href="/dashboard/bulk" className={getLinkClass("/dashboard/bulk")}>
                <Files className="w-4 h-4 mr-3" />
                Banyak Invoice
              </Link>
              <Link href="/dashboard/list" className={getLinkClass("/dashboard/list")}>
                <List className="w-4 h-4 mr-3" />
                Daftar Invoice
              </Link>
            </div>
          </div>

          <div>
            <h3 className="px-3 text-xs font-bold tracking-wider text-green-600/70 uppercase mb-3">
              DATABASE
            </h3>
            <div className="space-y-1">
              <Link href="/dashboard/guardians" className={getLinkClass("/dashboard/guardians")}>
                <Users className="w-4 h-4 mr-3" />
                Wali Murid
              </Link>
              <Link href="/dashboard/students" className={getLinkClass("/dashboard/students")}>
                <GraduationCap className="w-4 h-4 mr-3" />
                Murid
              </Link>
              <Link
                href="/dashboard/bulk/import"
                className={getLinkClass("/dashboard/bulk/import")}
              >
                <FileUp className="w-4 h-4 mr-3" />
                Impor Massal
              </Link>
              <Link href="/dashboard/civitas" className={getLinkClass("/dashboard/civitas")}>
                <Building className="w-4 h-4 mr-3" />
                Civitas
              </Link>
            </div>
          </div>

          <div>
            <h3 className="px-3 text-xs font-bold tracking-wider text-green-600/70 uppercase mb-3">
              ACCOUNT
            </h3>
            <div className="space-y-1">
              <Link href="/dashboard/billing" className={getLinkClass("/dashboard/billing")}>
                <CreditCard className="w-4 h-4 mr-3" />
                Billing
              </Link>
              <Link href="/dashboard/support" className={getLinkClass("/dashboard/support")}>
                <HelpCircle className="w-4 h-4 mr-3" />
                Support
              </Link>
            </div>
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 flex items-center justify-between md:justify-end px-4 md:px-8 bg-white border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center md:hidden">
            <button
              className="p-2 -ml-2 rounded-md hover:bg-slate-100 text-slate-600"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-bold text-lg text-slate-800 ml-2">YISS Admin</span>
          </div>

          <UserDropdown />
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
