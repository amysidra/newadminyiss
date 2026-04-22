"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Search, XCircle } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

interface Student {
    id: string;
    fullname: string;
}

export default function CreateInvoicePage() {
    const supabase = createClient();
    const [formData, setFormData] = useState({
        student_id: '',
        amount: '',
        description: ''
    });

    const [students, setStudents] = useState<Student[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [status, setStatus] = useState<{
        loading: boolean;
        error: string | null;
        success: string | null;
    }>({ loading: false, error: null, success: null });

    useEffect(() => {
        const fetchStudents = async () => {
            setIsLoadingStudents(true);
            try {
                const { data, error } = await supabase
                    .from('students')
                    .select('id, fullname')
                    .order('fullname', { ascending: true });

                if (error) throw error;
                setStudents(data || []);
            } catch (error: any) {
                setStatus(prev => ({ ...prev, error: 'Gagal memuat data: ' + error.message }));
            } finally {
                setIsLoadingStudents(false);
            }
        };

        fetchStudents();
    }, [supabase]);

    const filteredStudents = students.filter(student =>
        student.fullname.toLowerCase().includes(searchQuery.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleStudentSelect = (student: Student) => {
        setFormData(prev => ({ ...prev, student_id: student.id }));
        setSearchQuery(student.fullname);
        setIsDropdownOpen(false);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
        setIsDropdownOpen(true);
        if (formData.student_id) {
            setFormData(prev => ({ ...prev, student_id: '' }));
        }
    };

    const formatAmount = (value: string) => {
        const number = value.replace(/\D/g, '');
        return number.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, amount: formatAmount(e.target.value) }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.student_id) {
            setStatus({ loading: false, error: 'Silakan pilih siswa yang valid dari daftar', success: null });
            return;
        }

        setStatus({ loading: true, error: null, success: null });

        try {
            const cleanAmount = formData.amount.replace(/\./g, '');

            const { error } = await supabase.from('invoices').insert({
                student_id: formData.student_id,
                amount: Number(cleanAmount),
                description: formData.description,
                status: 'UNPAID',
                created_at: new Date().toISOString()
            });

            if (error) throw error;

            setStatus({ loading: false, error: null, success: 'Tagihan berhasil dibuat!' });
            setFormData({ student_id: '', amount: '', description: '' });
            setSearchQuery('');

            setTimeout(() => {
                setStatus(prev => ({ ...prev, success: null }));
            }, 3000);
        } catch (err: any) {
            setStatus({ loading: false, error: err.message || 'Gagal membuat tagihan', success: null });
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">Buat Tagihan</h1>
                <p className="mt-2 text-slate-500 dark:text-slate-400">Masukkan detail di bawah ini untuk membuat tagihan baru.</p>
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2 relative" ref={dropdownRef}>
                            <label htmlFor="student_search" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                Nama Siswa
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    id="student_search"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    onFocus={() => setIsDropdownOpen(true)}
                                    className="w-full pl-4 pr-10 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all duration-200 outline-none hover:border-green-300 placeholder-slate-400 dark:placeholder-slate-500"
                                    placeholder="Ketik nama untuk mencari..."
                                    autoComplete="off"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                                    {isLoadingStudents ? (
                                        <div className="animate-spin h-5 w-5 border-2 border-green-500 border-t-transparent rounded-full" />
                                    ) : searchQuery ? (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSearchQuery('');
                                                setFormData(prev => ({ ...prev, student_id: '' }));
                                                setIsDropdownOpen(true);
                                            }}
                                            className="hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
                                        >
                                            <XCircle className="w-5 h-5" />
                                        </button>
                                    ) : (
                                        <Search className="w-5 h-5" />
                                    )}
                                </div>
                            </div>

                            <input type="hidden" name="student_id" value={formData.student_id} required />

                            {isDropdownOpen && (
                                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                                    {filteredStudents.length > 0 ? (
                                        <ul className="py-1">
                                            {filteredStudents.map((student) => (
                                                <li
                                                    key={student.id}
                                                    onClick={() => handleStudentSelect(student)}
                                                    className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200 transition-colors duration-150 flex items-center justify-between group"
                                                >
                                                    <span className="font-medium">{student.fullname}</span>
                                                    {formData.student_id === student.id && (
                                                        <span className="text-green-600 dark:text-green-400 text-sm font-semibold">Dipilih</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="px-4 py-3 text-slate-500 dark:text-slate-400 text-center text-sm">
                                            {isLoadingStudents ? 'Memuat...' : 'Siswa tidak ditemukan'}
                                        </div>
                                    )}
                                </div>
                            )}
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
                                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all duration-200 outline-none hover:border-green-300 placeholder-slate-400 dark:placeholder-slate-500"
                                    placeholder="Misal: 175.000"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="description" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                            Keterangan
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            required
                            rows={4}
                            className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-slate-100 focus:border-[#1a7a4a] focus:ring-4 focus:ring-green-500/10 transition-all duration-200 outline-none hover:border-green-300 resize-none placeholder-slate-400 dark:placeholder-slate-500"
                            placeholder="Misal: SPP Bulan Desember"
                        />
                    </div>

                    <div className="pt-4">
                        <button
                            type="submit"
                            disabled={status.loading || !formData.student_id}
                            className="w-full bg-[#1a7a4a] hover:bg-[#15603b] text-white font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {status.loading ? (
                                <>
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Membuat Tagihan...
                                </>
                            ) : (
                                'Buat Tagihan'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
