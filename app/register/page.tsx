"use client";

import Image from "next/image";
import { useTheme } from "@/lib/context/ThemeContext";

export default function RegisterPage() {
  const { theme } = useTheme();

  return (
    <div className="register-root">
      <div className="container">
        <div className="brand">
          <Image
            src={theme === "dark" ? "/LogoYissDark.png" : "/LogoYiss.png"}
            alt="Logo YISS"
            width={140}
            height={56}
            style={{ width: "240px", height: "auto", objectFit: "contain" }}
            priority
          />
        </div>

        <div className="content">
          <div className="icon-wrapper">
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="info-icon"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" y1="8" x2="19" y2="14" />
              <line x1="22" y1="11" x2="16" y2="11" />
            </svg>
          </div>
          
          <h1 className="title">Pendaftaran Akun</h1>
          <p className="description">
            Halaman ini nantinya berisi informasi pendaftaran <br />
            untuk calon siswa dan civitas YISS Semarang.
          </p>
          
          <div className="actions">
            <a href="/" className="back-link">
               Sudah punya akun? Masuk di sini
            </a>
          </div>
        </div>

        <footer className="footer">
          © {new Date().getFullYear()} Yayasan Islam — All rights reserved.
        </footer>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        .register-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f4f6f8;
          font-family: 'Poppins', system-ui, sans-serif;
          padding: 2rem;
        }

        .container {
          width: 100%;
          max-width: 500px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2.5rem;
          text-align: center;
        }

        .brand {
          display: flex;
          justify-content: center;
        }

        .content {
          background: #ffffff;
          padding: 3rem 2rem;
          border-radius: 20px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.05);
          width: 100%;
          border: 1px solid #f0f0f0;
        }

        .icon-wrapper {
          width: 80px;
          height: 80px;
          background: rgba(26, 122, 74, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
        }

        .info-icon {
          color: #1a7a4a;
        }

        .title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111;
          margin-bottom: 0.75rem;
        }

        .description {
          font-size: 1rem;
          color: #6b7280;
          line-height: 1.6;
          margin-bottom: 2rem;
        }

        .back-link {
          display: inline-block;
          color: #1a7a4a;
          font-weight: 600;
          text-decoration: none;
          font-size: 0.9rem;
          transition: transform 0.2s;
        }

        .back-link:hover {
          text-decoration: underline;
          transform: translateY(-1px);
        }

        .footer {
          font-size: 0.78rem;
          color: #a3acb5;
        }

        /* Dark Mode */
        @media (prefers-color-scheme: dark) {
          .register-root { background: #0f172a; }
          .content { background: #1e293b; border-color: #334155; }
          .title { color: #f8fafc; }
          .description { color: #94a3b8; }
          .footer { color: #475569; }
        }

        :where(.dark) .register-root { background: #0f172a; }
        :where(.dark) .content { background: #1e293b; border-color: #334155; }
        :where(.dark) .title { color: #f8fafc; }
        :where(.dark) .description { color: #94a3b8; }
        :where(.dark) .footer { color: #475569; }
      `}</style>
    </div>
  );
}
