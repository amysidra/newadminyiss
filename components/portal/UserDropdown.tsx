"use client";

import React, { useState, useEffect, useRef } from "react";
import { Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePortal } from "@/lib/context/PortalContext";

export function PortalUserDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [authUser, setAuthUser] = useState<any>(null);
  const [imageError, setImageError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supabase = createClient();
  const router = useRouter();
  const { profile } = usePortal();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setAuthUser(user));

    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const displayName =
    profile?.first_name
      ? `${profile.first_name}${profile.last_name ? " " + profile.last_name : ""}`
      : authUser?.user_metadata?.full_name ?? authUser?.email?.split("@")[0] ?? "Wali Murid";

  const displayEmail = profile?.email ?? authUser?.email ?? "";
  const avatarUrl = authUser?.user_metadata?.avatar_url ?? authUser?.user_metadata?.picture;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200 group"
      >
        <div className="bg-slate-200 dark:bg-slate-700 w-9 h-9 rounded-full flex justify-center items-center overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-600 shadow-sm group-hover:border-green-200 transition-colors">
          {avatarUrl && !imageError ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
            />
          ) : (
            <svg className="w-6 h-6 text-slate-500 dark:text-slate-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          )}
        </div>
        <div className="hidden md:flex flex-col items-start text-left mr-1">
          <span className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-none">{displayName}</span>
          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md mt-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
            Wali Murid
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">{displayEmail}</p>
            <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md mt-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
              Wali Murid
            </span>
          </div>

          <div className="p-2">
            <Link
              href="/portal/settings"
              className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-green-50 dark:hover:bg-slate-800 hover:text-[#1a7a4a] dark:hover:text-green-400 transition-all group/item"
              onClick={() => setIsOpen(false)}
            >
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 group-hover/item:bg-green-100 dark:group-hover/item:bg-green-950 transition-colors">
                <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400 group-hover/item:text-[#1a7a4a] dark:group-hover/item:text-green-400" />
              </div>
              Pengaturan
            </Link>

            <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-all group/logout"
            >
              <div className="p-1.5 rounded-lg bg-red-50/50 dark:bg-red-950/20 group-hover/logout:bg-red-100 dark:group-hover/logout:bg-red-950/40 transition-colors">
                <LogOut className="w-4 h-4" />
              </div>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
