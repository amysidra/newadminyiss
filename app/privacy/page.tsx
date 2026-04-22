"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-poppins text-slate-900 dark:text-slate-100 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-[#1a7a4a] hover:underline mb-8"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Kembali ke Login
        </Link>

        <header className="mb-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Kebijakan Privasi</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        <div className="prose dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">1. Pendahuluan</h2>
            <p>
              Selamat datang di Portal Pendidikan Yayasan Islam Sahabat Sunnah (YISS). Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda saat Anda menggunakan portal kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">2. Informasi yang Kami Kumpulkan</h2>
            <p>
              Saat Anda masuk menggunakan Google OAuth, kami mengumpulkan informasi terbatas berikut:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Nama Lengkap (untuk identifikasi profil)</li>
              <li>Alamat Email (sebagai kredensial masuk dan komunikasi resmi)</li>
              <li>Foto Profil (opsional, disediakan oleh akun Google Anda)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">3. Penggunaan Informasi</h2>
            <p>Informasi yang kami kumpulkan hanya digunakan untuk:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Memungkinkan Anda masuk ke Portal Pendidikan YISS dengan aman.</li>
              <li>Memberikan akses yang dipersonalisasi sesuai dengan peran Anda (Wali Murid atau Staff).</li>
              <li>Mengirimkan notifikasi penting terkait administrasi sekolah atau tagihan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">4. Keamanan Data</h2>
            <p>
              Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi data pribadi Anda dari akses yang tidak sah, perubahan, pengungkapan, atau penghancuran. Kami menggunakan enkripsi dan otentikasi yang aman melalui layanan pihak ketiga terpercaya seperti Supabase dan Google.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">5. Berbagi Informasi dengan Pihak Ketiga</h2>
            <p>
              Kami tidak menjual, menyewakan, atau memberikan data pribadi Anda kepada pihak ketiga di luar ekosistem operasional Yayasan Islam Sahabat Sunnah, kecuali jika diwajibkan oleh hukum.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">6. Hak Anda</h2>
            <p>
              Anda memiliki hak untuk mengakses, memperbarui, atau meminta penghapusan informasi pribadi Anda. Jika Anda ingin melakukan hal tersebut, silakan hubungi tim administrasi kami melalui kontak resmi Yayasan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">7. Kontak Kami</h2>
            <p>
              Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan hubungi kami di:
            </p>
            <div className="mt-4 p-4 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="font-bold">Yayasan Islam Sahabat Sunnah (YISS)</p>
              <p>Email: admin@yissofficial.com</p>
              <p>Website: yissofficial.com</p>
            </div>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Yayasan Islam Sahabat Sunnah. Semua hak dilindungi undang-undang.
        </footer>
      </div>
    </div>
  );
}
