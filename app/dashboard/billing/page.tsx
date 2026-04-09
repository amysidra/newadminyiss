"use client";

import React from 'react';
import { CreditCard, Construction } from 'lucide-react';

export default function BillingPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600 mb-6 shadow-xl shadow-amber-600/10 animate-bounce">
                <Construction className="w-10 h-10" />
            </div>
            
            <div className="flex items-center gap-2 mb-2 text-slate-400 font-bold uppercase tracking-widest text-xs">
                <CreditCard className="w-4 h-4" />
                <span>Billing System</span>
            </div>
            
            <h1 className="text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">
                Maaf, belum selesai dibuat
            </h1>
            
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed">
                Kami sedang membangun sistem pembayaran yang aman dan transparan untuk sekolah Anda. 
                Fitur ini akan segera hadir dalam waktu dekat.
            </p>
            
            <div className="mt-10 flex gap-3">
                <div className="h-1.5 w-12 bg-green-600 rounded-full animate-pulse"></div>
                <div className="h-1.5 w-4 bg-slate-200 rounded-full"></div>
                <div className="h-1.5 w-4 bg-slate-200 rounded-full"></div>
            </div>
        </div>
    );
}
