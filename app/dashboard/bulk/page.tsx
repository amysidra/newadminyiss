"use client";

export const dynamic = "force-dynamic";

import React, { useState, useEffect, useMemo } from 'react';
import { Users, Loader2, Calendar } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Student {
    id: string;
    fullname: string;
    unit: string;
    grade: string;
}

const UNITS = ['TK', 'SD', 'SMP', 'SMA', 'LPI'];

export default function BulkInvoicesPage() {
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]
    });

    const [students, setStudents] = useState<Student[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [activeTab, setActiveTab] = useState<string>('');
    const [loadingStudents, setLoadingStudents] = useState(true);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const supabase = React.useMemo(() => createClient(), []);

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        const fetchStudents = async () => {
            setLoadingStudents(true);
            const { data, error } = await supabase
                .from('students')
                .select('id, fullname, unit, grade')
                .eq('status', 'Aktif')
                .order('unit')
                .order('fullname');

            if (!error && data) {
                setStudents(data);
                setSelectedIds(new Set(data.map(s => s.id)));
            } else {
                setStatus(prev => ({ ...prev, error: 'Gagal memuat daftar murid.' }));
            }
            setLoadingStudents(false);
        };

        fetchStudents();
    }, []);

    const filteredStudents = useMemo(
        () => activeTab ? students.filter(s => s.unit === activeTab) : students,
        [students, activeTab]
    );

    const selectedCountByUnit = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const unit of UNITS) {
            counts[unit] = students.filter(s => s.unit === unit && selectedIds.has(s.id)).length;
        }
        return counts;
    }, [students, selectedIds]);

    const allFilteredSelected = filteredStudents.length > 0 && filteredStudents.every(s => selectedIds.has(s.id));

    const toggleSelectAll = () => {
        const ids = new Set(selectedIds);
        if (allFilteredSelected) {
            filteredStudents.forEach(s => ids.delete(s.id));
        } else {
            filteredStudents.forEach(s => ids.add(s.id));
        }
        setSelectedIds(ids);
    };

    const toggleStudent = (id: string) => {
        const ids = new Set(selectedIds);
        if (ids.has(id)) {
            ids.delete(id);
        } else {
            ids.add(id);
        }
        setSelectedIds(ids);
    };

    const selectedUnits = useMemo(() => {
        return UNITS.filter(u => selectedCountByUnit[u] > 0);
    }, [selectedCountByUnit]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (isSubmitted) return;

        if (selectedIds.size === 0) {
            setStatus({ loading: false, error: 'Pilih minimal 1 murid untuk dibuatkan tagihan.', success: null });
            return;
        }

        const cleanAmount = formData.amount.replace(/\./g, '');

        if (!cleanAmount || Number(cleanAmount) <= 0) {
            setStatus({ loading: false, error: 'Nominal harus lebih dari Rp 0', success: null });
            return;
        }

        setStatus({ loading: true, error: null, success: null });
        setIsSubmitted(true);

        try {
            const invoices = [...selectedIds].map(id => ({
                student_id: id,
                amount: Number(cleanAmount),
                description: formData.description,
                due_date: formData.due_date,
                status: 'UNPAID',
                created_at: new Date().toISOString()
            }));

            const { error: insertError } = await supabase.from('invoices').insert(invoices);

            if (insertError) throw insertError;

            const unitLabel = selectedUnits.length > 0 ? selectedUnits.join(', ') : 'semua jenjang';
            setStatus({
                loading: false,
                error: null,
                success: `Berhasil membuat ${invoices.length} tagihan untuk ${unitLabel}!`
            });

            setFormData(prev => ({ ...prev, amount: '', description: '' }));
            setIsSubmitted(false);

            setTimeout(() => {
                setStatus(prev => ({ ...prev, success: null }));
            }, 5000);
        } catch (err: any) {
            console.error("Error creating bulk invoices:", err);
            setStatus({ loading: false, error: err.message || 'Gagal membuat tagihan massal', success: null });
            setIsSubmitted(false);
        }
    };

    const inputClass = "w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all duration-200 outline-none hover:border-green-300 placeholder-slate-400 dark:placeholder-slate-500";

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-50 dark:bg-green-950/40 rounded-lg text-[#1a7a4a] dark:text-green-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Buat Tagihan Massal</h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400">Pilih murid yang akan dibuatkan tagihan, lalu isi detail tagihan.</p>
            </header>

            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
                {status.success && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="font-medium">{status.success}</span>
                    </div>
                )}

                {status.error && (
                    <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
                        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">{status.error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Detail Tagihan */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label htmlFor="due_date" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Tenggat Waktu
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 w-5 h-5" />
                                <input
                                    type="date"
                                    id="due_date"
                                    name="due_date"
                                    value={formData.due_date}
                                    onChange={handleChange}
                                    required
                                    className={`${inputClass} pl-12`}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="amount" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Nominal
                            </label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 font-medium">Rp</span>
                                <input
                                    type="text"
                                    id="amount"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleAmountChange}
                                    required
                                    className={`${inputClass} pl-12`}
                                    placeholder="Misal: 175.000"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Keterangan
                            </label>
                            <input
                                type="text"
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                required
                                className={inputClass}
                                placeholder="Misal: SPP Januari 2025"
                            />
                        </div>
                    </div>

                    {/* Pilih Murid */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Pilih Murid</h2>
                            {!loadingStudents && (
                                <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {selectedIds.size} dari {students.length} murid dipilih
                                </span>
                            )}
                        </div>

                        {/* Tab Filter Jenjang */}
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setActiveTab('')}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                                    activeTab === ''
                                        ? 'bg-[#1a7a4a] text-white'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                }`}
                            >
                                Semua
                            </button>
                            {UNITS.map(unit => (
                                <button
                                    key={unit}
                                    type="button"
                                    onClick={() => setActiveTab(unit)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                        activeTab === unit
                                            ? 'bg-[#1a7a4a] text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {unit}
                                    {selectedCountByUnit[unit] > 0 && (
                                        <span className={`text-xs rounded-full px-1.5 py-0.5 font-semibold ${
                                            activeTab === unit
                                                ? 'bg-white/20 text-white'
                                                : 'bg-[#1a7a4a]/10 text-[#1a7a4a] dark:text-green-400'
                                        }`}>
                                            {selectedCountByUnit[unit]}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Daftar Murid */}
                        <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                            {loadingStudents ? (
                                <div className="flex items-center justify-center py-10 gap-2 text-slate-400 dark:text-slate-500">
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span className="text-sm">Memuat daftar murid...</span>
                                </div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                                    Tidak ada murid aktif di jenjang {activeTab}.
                                </div>
                            ) : (
                                <>
                                    {/* Header: Pilih Semua */}
                                    <div
                                        className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                        onClick={toggleSelectAll}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={allFilteredSelected}
                                            onChange={toggleSelectAll}
                                            onClick={e => e.stopPropagation()}
                                            className="w-4 h-4 rounded accent-[#1a7a4a] cursor-pointer"
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                            {allFilteredSelected ? 'Hapus Semua' : 'Pilih Semua'}
                                            {activeTab ? ` (${activeTab})` : ''}
                                        </span>
                                        <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
                                            {filteredStudents.length} murid
                                        </span>
                                    </div>

                                    {/* List murid */}
                                    <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                        {filteredStudents.map(student => (
                                            <div
                                                key={student.id}
                                                className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                                                onClick={() => toggleStudent(student.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(student.id)}
                                                    onChange={() => toggleStudent(student.id)}
                                                    onClick={e => e.stopPropagation()}
                                                    className="w-4 h-4 rounded accent-[#1a7a4a] cursor-pointer flex-shrink-0"
                                                />
                                                <span className="text-sm text-slate-800 dark:text-slate-200 flex-1 truncate">
                                                    {student.fullname}
                                                </span>
                                                <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0">
                                                    {student.grade && `Kelas ${student.grade} · `}{student.unit}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Ringkasan seleksi */}
                        {!loadingStudents && selectedIds.size > 0 && (
                            <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl">
                                <p className="text-sm text-amber-700 dark:text-amber-500">
                                    Akan dibuatkan tagihan untuk <strong>{selectedIds.size} murid</strong>
                                    {selectedUnits.length > 0 && ` dari jenjang ${selectedUnits.join(', ')}`}.
                                    Harap periksa kembali nominal dan keterangan sebelum melanjutkan.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={status.loading || loadingStudents || selectedIds.size === 0}
                            className="w-full bg-[#1a7a4a] hover:bg-[#15603b] text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {status.loading ? (
                                <>
                                    <Loader2 className="animate-spin h-5 w-5 text-white" />
                                    Membuat Tagihan Massal...
                                </>
                            ) : (
                                selectedIds.size === 0
                                    ? 'Pilih minimal 1 murid'
                                    : `Buat ${selectedIds.size} Tagihan`
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
