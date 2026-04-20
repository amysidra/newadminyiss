"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect } from 'react';
import { Users, Loader2, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function BulkInvoicesPage() {
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        unit: '',
        due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });

    const [studentCount, setStudentCount] = useState<number>(0);
    const supabase = createClient();

    const [status, setStatus] = useState<{
        loading: boolean;
        error: string | null;
        success: string | null;
    }>({ loading: false, error: null, success: null });

    const formatAmount = (value: string) => {
        const number = value.replace(/\D/g, '');
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, amount: formatAmount(e.target.value) }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        const fetchStudentCount = async () => {
            let query = supabase
                .from('students')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'Aktif');

            if (formData.unit) {
                query = query.eq('unit', formData.unit);
            }

            const { count } = await query;
            setStudentCount(count || 0);
        };

        fetchStudentCount();
    }, [formData.unit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ loading: true, error: null, success: null });

        try {
            const cleanAmount = formData.amount.replace(/\./g, '');

            let studentQuery = supabase
                .from('students')
                .select('id')
                .eq('status', 'Aktif');

            if (formData.unit) {
                studentQuery = studentQuery.eq('unit', formData.unit);
            }

            const { data: students, error: studentError } = await studentQuery;

            if (studentError) throw studentError;
            if (!students || students.length === 0) {
                throw new Error('Tidak ada siswa aktif yang ditemukan untuk kriteria ini.');
            }

            const invoices = students.map(student => ({
                student_id: student.id,
                amount: Number(cleanAmount),
                description: formData.description,
                due_date: formData.due_date,
                status: 'UNPAID',
                created_at: new Date().toISOString()
            }));

            const { error: insertError } = await supabase.from('invoices').insert(invoices);

            if (insertError) throw insertError;

            setStatus({
                loading: false,
                error: null,
                success: `Berhasil membuat ${students.length} tagihan untuk ${formData.unit ? 'unit ' + formData.unit : 'semua unit'}!`
            });

            setFormData(prev => ({ ...prev, amount: '', description: '' }));

            setTimeout(() => {
                setStatus(prev => ({ ...prev, success: null }));
            }, 5000);
        } catch (err: any) {
            console.error("Error creating bulk invoices:", err);
            setStatus({ loading: false, error: err.message || 'Gagal membuat tagihan massal', success: null });
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-50 rounded-lg text-[#1a7a4a]">
                        <Users className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Buat Tagihan Massal</h1>
                </div>
                <p className="text-slate-500">Buat tagihan identik untuk SEMUA siswa aktif sekaligus.</p>
            </header>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                {status.success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">{status.success}</span>
                    </div>
                )}

                {status.error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{status.error}</span>
                    </div>
                )}

                <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <h3 className="text-sm font-semibold text-amber-800 mb-1">Perhatian</h3>
                    <p className="text-sm text-amber-700">
                        Tindakan ini akan membuat tagihan baru untuk <strong>{studentCount} siswa aktif</strong> {formData.unit ? `jenjang ${formData.unit}` : 'di semua jenjang'}.
                        Harap periksa kembali nominal dan keterangan sebelum melanjutkan.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="unit" className="block text-sm font-medium text-slate-700">
                                Jenjang (Level)
                            </label>
                            <select
                                id="unit"
                                name="unit"
                                value={formData.unit}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all duration-200 outline-none hover:border-green-300"
                            >
                                <option value="">Semua Jenjang</option>
                                <option value="TK">TK</option>
                                <option value="SD">SD</option>
                                <option value="SMP">SMP</option>
                                <option value="SMA">SMA</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="due_date" className="block text-sm font-medium text-slate-700">
                                Tenggat Waktu (Due Date)
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                                <input
                                    type="date"
                                    id="due_date"
                                    name="due_date"
                                    value={formData.due_date}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all duration-200 outline-none hover:border-green-300"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="amount" className="block text-sm font-medium text-slate-700">
                                Nominal
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium">Rp</span>
                                <input
                                    type="text"
                                    id="amount"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleAmountChange}
                                    required
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all duration-200 outline-none hover:border-green-300 placeholder-slate-400"
                                    placeholder="Misal: 175.000"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                                Keterangan
                            </label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 text-slate-900 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 transition-all duration-200 outline-none hover:border-green-300 placeholder-slate-400"
                                placeholder="Misal: SPP Januari 2025"
                            />
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={status.loading}
                            className="w-full bg-[#1a7a4a] hover:bg-[#15603b] text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {status.loading ? (
                                <>
                                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                                    Membuat Tagihan Massal...
                                </>
                            ) : (
                                formData.unit
                                    ? `Buat Tagihan untuk ${studentCount} Siswa ${formData.unit}`
                                    : `Buat Tagihan untuk ${studentCount} Semua Siswa`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
