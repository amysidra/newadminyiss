"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, FormEvent, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";

function LoginPageInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();

  if (searchParams.get("error") === "auth_failed") {
    // show error once on mount — set via state to keep reactivity
  }

  const supabase = createClient();

  async function handleGoogleLogin() {
    setError("");
    setIsGoogleLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
      if (data.url) window.location.href = data.url;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login Google gagal.");
      setIsGoogleLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      window.location.href = "/dashboard";
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login gagal. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="login-root">
      {/* ── Left panel ── */}
      <div className="left-panel">
        <div className="brand">
          <Image
            src="/LogoYiss.png"
            alt="Logo YISS"
            width={140}
            height={56}
            style={{ width: "300px", height: "auto", objectFit: "contain" }}
            priority
          />
        </div>

        <div className="left-content">
          <h1 className="hero-heading">
            Kelola Dengan <br />
            <span className="hero-accent">Lebih Mudah.</span>
          </h1>
          <p className="hero-desc">
            Portal Pendidikan Yayasan Islam Sahabat Sunnah — satu tempat untuk mengelola
            semua.
          </p>
        </div>

        <footer className="left-footer">
          © {new Date().getFullYear()} Yayasan Islam — All rights reserved.
        </footer>
      </div>

      {/* ── Right panel ── */}
      <div className="right-panel">
        <div className="form-card">
          <div className="form-header">
            <h2 className="form-title">Ahlan Wa Sahlan</h2>
            <p className="form-subtitle">Sign in to your account</p>
          </div>

          {/* Google SSO */}
          <button
            type="button"
            className="sso-btn"
            id="btn-google-sso"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <span className="spinner" style={{ borderColor: "rgba(0,0,0,0.2)", borderTopColor: "#374151" }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
            )}
            {isGoogleLoading ? "Mengarahkan..." : "Continue with Google"}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <form onSubmit={handleSubmit} className="login-form" id="login-form">
            <div className="field-group">
              <label htmlFor="email" className="field-label">Email</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nama@email.com"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="field-group">
              <div className="password-row">
                <label htmlFor="password" className="field-label">Password</label>
                <a href="/forgot-password" className="forgot-link" tabIndex={-1}>
                  Forgot password?
                </a>
              </div>
              <div className="input-wrapper">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="field-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-pw"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Toggle password visibility"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="error-msg" role="alert">{error}</p>
            )}

            <button
              type="submit"
              id="btn-signin"
              className="signin-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="spinner" aria-label="Loading" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="signup-hint">
            Don&apos;t have an account?{" "}
            <a href="/register" className="signup-link">Sign up</a>
          </p>
        </div>
      </div>

      <style>{`
        /* ── Google Fonts: Poppins ── */
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap');

        /* ── Reset & root ── */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        .login-root {
          display: flex;
          min-height: 100vh;
          font-family: 'Poppins', system-ui, sans-serif;
        }

        /* ══ LEFT PANEL ══ */
        .left-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 2rem 3rem;
          background: #ffffff;
          border-right: 1px solid #f0f0f0;
        }

        .brand {
          display: flex;
          align-items: center;
        }

        .left-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-bottom: 3rem;
        }
        .hero-heading {
          font-size: clamp(1.8rem, 3vw, 2.5rem);
          font-weight: 700;
          line-height: 1.2;
          color: #111;
          margin-bottom: 1rem;
        }
        .hero-accent {
          color: #1a7a4a;
        }
        .hero-desc {
          font-size: 0.95rem;
          line-height: 1.7;
          color: #6b7280;
          max-width: 380px;
        }

        .left-footer {
          font-size: 0.78rem;
          color: #a3acb5;
        }

        /* ══ RIGHT PANEL ══ */
        .right-panel {
          width: 520px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f4f6f8;
          padding: 2rem;
        }

        .form-card {
          width: 100%;
          max-width: 400px;
        }

        .form-header {
          margin-bottom: 1.75rem;
          text-align: center;
        }
        .form-title {
          font-size: 1.5rem;
          font-weight: 700;
          color: #111;
          margin-bottom: 0.25rem;
        }
        .form-subtitle {
          font-size: 0.875rem;
          color: #6b7280;
        }

        /* Google SSO */
        .sso-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.6rem;
          padding: 0.65rem 1rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          background: #fff;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          cursor: pointer;
          transition: background 0.15s, box-shadow 0.15s;
        }
        .sso-btn:hover {
          background: #f9fafb;
          box-shadow: 0 1px 4px rgba(0,0,0,.08);
        }

        /* Divider */
        .divider {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 1.25rem 0;
          color: #9ca3af;
          font-size: 0.8rem;
        }
        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: #e5e7eb;
        }

        /* Form fields */
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .field-group {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .field-label {
          font-size: 0.82rem;
          font-weight: 600;
          color: #374151;
        }
        .password-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .forgot-link {
          font-size: 0.78rem;
          color: #6b7280;
          text-decoration: none;
        }
        .forgot-link:hover { text-decoration: underline; }

        .input-wrapper {
          position: relative;
        }
        .field-input {
          width: 100%;
          padding: 0.6rem 0.85rem;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 0.875rem;
          color: #111;
          background: #fff;
          outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .field-input:focus {
          border-color: #1a7a4a;
          box-shadow: 0 0 0 3px rgba(26,122,74,0.1);
        }
        .input-wrapper .field-input {
          padding-right: 2.5rem;
        }
        .toggle-pw {
          position: absolute;
          right: 0.7rem;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          padding: 0;
          display: flex;
          align-items: center;
        }
        .toggle-pw:hover { color: #374151; }

        /* Error */
        .error-msg {
          font-size: 0.82rem;
          color: #dc2626;
          background: #fef2f2;
          border: 1px solid #fecaca;
          border-radius: 6px;
          padding: 0.5rem 0.75rem;
        }

        /* Sign In button */
        .signin-btn {
          width: 100%;
          padding: 0.7rem 1rem;
          border: none;
          border-radius: 8px;
          background: #1a7a4a;
          color: #fff;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: 0.25rem;
        }
        .signin-btn:hover:not(:disabled) { background: #15603b; }
        .signin-btn:active:not(:disabled) { transform: scale(0.99); }
        .signin-btn:disabled { opacity: 0.65; cursor: not-allowed; }

        /* Spinner */
        .spinner {
          width: 18px;
          height: 18px;
          border: 2.5px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Sign up hint */
        .signup-hint {
          text-align: center;
          margin-top: 1.25rem;
          font-size: 0.83rem;
          color: #6b7280;
        }
        .signup-link {
          color: #1a7a4a;
          font-weight: 600;
          text-decoration: none;
        }
        .signup-link:hover { text-decoration: underline; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .login-root { flex-direction: column; }
          .left-panel {
            padding: 1.5rem 1.5rem 1.25rem;
            border-right: none;
            border-bottom: 1px solid #f0f0f0;
          }
          .left-content { padding-bottom: 0; }
          .left-footer { display: none; }
          .right-panel {
            width: 100%;
            padding: 2rem 1.25rem 3rem;
            background: #f4f6f8;
          }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}
