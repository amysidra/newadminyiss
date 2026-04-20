"use client";

import React from "react";
import { Hammer, ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose?: () => void;
}

export function MaintenanceModal({ isOpen, onClose }: MaintenanceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" 
        onClick={onClose}
      />
      
      {/* Modal Card */}
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-slate-200">
        {/* Top Decorative Pattern */}
        <div className="h-32 bg-[#1a7a4a] relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-20 h-20 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
          </div>
          
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30 shadow-inner group transition-transform duration-500 hover:rotate-6">
              <Construction className="w-8 h-8 text-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 text-center">
          <h3 className="text-2xl font-bold text-slate-800 mb-3 font-poppins">
            Fitur Sedang Disiapkan
          </h3>
          <p className="text-slate-500 leading-relaxed mb-8">
            Halaman ini belum bisa digunakan, saya akan segera merilis aplikasi ini.
          </p>

          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-[#1a7a4a] text-white rounded-xl font-bold hover:bg-[#15603b] transition-all shadow-lg shadow-green-600/20 active:scale-95 group"
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Kembali ke Dashboard
            </Link>
            
            {onClose && (
              <button
                onClick={onClose}
                className="w-full py-2 text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors"
              >
                Tetap di halaman ini
              </button>
            )}
          </div>
        </div>
        
        {/* Subtle Footer */}
        <div className="px-8 py-4 bg-slate-50 border-t border-slate-100 flex justify-center items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Under Development</span>
        </div>
      </div>
    </div>
  );
}
