"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function TermsOfService() {
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Ketentuan Layanan</h1>
          <p className="text-slate-500 dark:text-slate-400">
            Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        <div className="prose dark:prose-invert max-w-none space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">1. Penerimaan Ketentuan</h2>
            <p>
              Dengan mengakses dan menggunakan Portal Pendidikan Yayasan Islam Sahabat Sunnah (YISS), Anda menyetujui untuk terikat oleh Ketentuan Layanan ini. Jika Anda tidak menyetujui bagian mana pun dari ketentuan ini, Anda tidak diperkenankan menggunakan layanan kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">2. Akun Pengguna</h2>
            <p>
              Untuk menggunakan portal, Anda harus masuk melalui akun Google yang telah didaftarkan dalam sistem kami. Anda bertanggung jawab untuk menjaga kerahasiaan akun Anda dan setiap aktivitas yang terjadi di bawah akun Anda.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">3. Penggunaan yang Diperbolehkan</h2>
            <p>
              Anda setuju untuk menggunakan portal hanya untuk tujuan yang sah dan sesuai dengan fungsi portal, yaitu:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Melihat data pendidikan dan profil murid (bagi wali murid).</li>
              <li>Mengakses informasi tagihan dan melakukan pembayaran administrasi.</li>
              <li>Mengelola data pendidikan dan administrasi (bagi staff/admin).</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">4. Hak Kekayaan Intelektual</h2>
            <p>
              Semua konten yang tersedia di portal, termasuk namun tidak terbatas pada teks, grafik, logo, dan perangkat lunak, adalah milik Yayasan Islam Sahabat Sunnah atau penyedia kontennya dan dilindungi oleh undang-undang hak cipta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">5. Pembatasan Tanggung Jawab</h2>
            <p>
              YISS berusaha untuk menyediakan layanan yang stabil dan akurat, namun kami tidak menjamin bahwa portal akan selalu tersedia tanpa gangguan. Kami tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan atau ketidakmampuan menggunakan portal ini.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">6. Perubahan Ketentuan</h2>
            <p>
              Kami dapat memperbarui Ketentuan Layanan ini dari waktu ke waktu. Perubahan akan berlaku segera setelah dipublikasikan di halaman ini. Penggunaan berkelanjutan Anda atas portal setelah perubahan tersebut merupakan penerimaan Anda terhadap ketentuan baru.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">7. Penghentian Layanan</h2>
            <p>
              Kami berhak untuk menangguhkan atau menghentikan akses Anda ke portal sewaktu-waktu jika ditemukan pelanggaran terhadap ketentuan ini atau jika diperlukan demi keamanan sistem.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-3">8. Hukum yang Berlaku</h2>
            <p>
              Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan hukum Republik Indonesia.
            </p>
          </section>
        </div>

        <footer className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Yayasan Islam Sahabat Sunnah. Semua hak dilindungi undang-undang.
        </footer>
      </div>
    </div>
  );
}
