"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, BookOpen, Users, FileText, ShieldCheck, Smartphone } from "lucide-react";

const features = [
  {
    icon: <Users className="w-6 h-6" />,
    title: "Manajemen Civitas",
    desc: "Kelola data siswa, wali murid, guru, dan tenaga kependidikan dalam satu sistem terpadu.",
  },
  {
    icon: <FileText className="w-6 h-6" />,
    title: "Tagihan & Invoicing",
    desc: "Generate dan kirim tagihan SPP serta biaya lainnya langsung ke wali murid secara digital.",
  },
  {
    icon: <BookOpen className="w-6 h-6" />,
    title: "Portal Wali Murid",
    desc: "Wali murid dapat memantau tagihan, riwayat pembayaran, dan informasi anak dengan mudah.",
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: "Aman & Terpercaya",
    desc: "Autentikasi via Google OAuth dan enkripsi data melalui Supabase menjamin keamanan informasi.",
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Responsif",
    desc: "Tampilan yang optimal di semua perangkat — desktop, tablet, maupun smartphone.",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-poppins text-slate-900 dark:text-slate-100">
      {/* Header */}
      <div className="max-w-4xl mx-auto px-6 md:px-12 py-8">
        <Link
          href="/"
          className="inline-flex items-center text-sm font-medium text-[#1a7a4a] hover:underline mb-10"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Kembali ke Login
        </Link>

        {/* Hero */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <Image
              src="/LogoYiss.png"
              alt="Logo YISS"
              width={160}
              height={64}
              className="dark:hidden"
              style={{ width: "160px", height: "auto", objectFit: "contain" }}
              priority
            />
            <Image
              src="/LogoYissDark.png"
              alt="Logo YISS"
              width={160}
              height={64}
              className="hidden dark:block"
              style={{ width: "160px", height: "auto", objectFit: "contain" }}
              priority
            />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Portal Digital{" "}
            <span className="text-[#1a7a4a]">YISS Semarang</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Sistem informasi manajemen pendidikan Yayasan Islam Sahabat Sunnah —
            satu platform untuk mengelola seluruh kebutuhan administrasi sekolah.
          </p>
        </div>

        {/* Tentang Aplikasi */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-4">Tentang Aplikasi</h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-slate-700 dark:text-slate-300 leading-relaxed space-y-4">
            <p>
              <strong>Portal Digital YISS</strong> adalah sistem informasi manajemen yang
              dirancang khusus untuk mendukung operasional Yayasan Islam Sahabat Sunnah (YISS)
              Semarang. Aplikasi ini menjadi jembatan digital antara pihak yayasan, staf
              administrasi, dan wali murid.
            </p>
            <p>
              Dengan portal ini, admin dan staf dapat mengelola data siswa, membuat tagihan,
              mengimpor data secara massal, serta memantau seluruh civitas akademika dalam satu
              dashboard yang terintegrasi. Sementara itu, wali murid mendapatkan akses ke portal
              khusus untuk melihat informasi anak dan status pembayaran secara real-time.
            </p>
            <p>
              Aplikasi ini dibangun di atas teknologi modern seperti{" "}
              <strong>Next.js</strong>, <strong>Supabase</strong>, dan{" "}
              <strong>Tailwind CSS</strong> — memastikan performa, keamanan, dan kemudahan
              penggunaan di semua perangkat.
            </p>
          </div>
        </section>

        {/* Fitur Unggulan */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-6">Fitur Unggulan</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 flex gap-4"
              >
                <div className="shrink-0 w-11 h-11 rounded-xl bg-[#1a7a4a]/10 text-[#1a7a4a] flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {f.title}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Kontak */}
        <section className="mb-14">
          <h2 className="text-2xl font-bold mb-4">Kontak & Informasi</h2>
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 text-slate-700 dark:text-slate-300 space-y-2">
            <p className="font-bold text-slate-900 dark:text-white text-lg">
              Yayasan Islam Sahabat Sunnah (YISS)
            </p>
            <p>Semarang, Jawa Tengah, Indonesia</p>
            <p>
              Email:{" "}
              <a
                href="mailto:admin@yissofficial.com"
                className="text-[#1a7a4a] hover:underline"
              >
                admin@yissofficial.com
              </a>
            </p>
            <p>
              Website:{" "}
              <a
                href="https://yissofficial.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#1a7a4a] hover:underline"
              >
                yissofficial.com
              </a>
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500 space-y-3">
          <div className="flex justify-center gap-6">
            <Link href="/privacy" className="hover:text-[#1a7a4a] transition-colors">
              Kebijakan Privasi
            </Link>
            <Link href="/terms" className="hover:text-[#1a7a4a] transition-colors">
              Syarat Layanan
            </Link>
          </div>
          <p>© {new Date().getFullYear()} Yayasan Islam Sahabat Sunnah. Semua hak dilindungi undang-undang.</p>
        </footer>
      </div>
    </div>
  );
}
