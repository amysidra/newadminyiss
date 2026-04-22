"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useState, FormEvent, Suspense } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/context/ThemeContext";
import "./login.css";

function LoginPageInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const { theme } = useTheme();

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
            src={theme === "dark" ? "/LogoYissDark.png" : "/LogoYiss.png"}
            alt="Logo YISS"
            width={140}
            height={56}
            style={{ width: "300px", height: "auto", objectFit: "contain" }}
            priority
          />
        </div>

        <div className="left-content">
          <h1 className="hero-heading">
            Portal Digital <br />
            <span className="hero-accent">YISS Semarang</span>
          </h1>
          <p className="hero-desc">
            Portal Pendidikan Yayasan Islam Sahabat Sunnah — satu tempat untuk
            mengelola semua.
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
          </div>
          <p className="form-subtitle">Sign in to your account</p>

          {/* Google SSO */}
          <button
            type="button"
            className="sso-btn"
            id="btn-google-sso"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <span
                className="spinner"
                style={{
                  borderColor: "rgba(0,0,0,0.2)",
                  borderTopColor: "#374151",
                }}
              />
            ) : (
              <svg
                width="18"
                height="18"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.36-8.16 2.36-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
                <path fill="none" d="M0 0h48v48H0z" />
              </svg>
            )}
            {isGoogleLoading ? "Mengarahkan..." : "Continue with Google"}
          </button>

          <div className="divider">
            <span>or</span>
          </div>

          <form onSubmit={handleSubmit} className="login-form" id="login-form">
            <div className="field-group">
              <label htmlFor="email" className="field-label">
                Email
              </label>
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
                <label htmlFor="password" className="field-label">
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="forgot-link"
                  tabIndex={-1}
                >
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
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg
                      width="16"
                      height="16"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p className="error-msg" role="alert">
                {error}
              </p>
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
            <a href="/register" className="signup-link">
              Sign up
            </a>
          </p>

          <div className="legal-links">
            <a href="/privacy" className="legal-link">
              Privacy Policy
            </a>
            <span className="legal-dot">•</span>
            <a href="/terms" className="legal-link">
              Terms of Service
            </a>
            <span className="legal-dot">•</span>
            <a href="/about" className="legal-link">
              About
            </a>
          </div>
        </div>

        <div className="mobile-desc-wrapper">
          <p className="hero-desc">
            Portal Pendidikan Yayasan Islam Sahabat Sunnah — satu tempat untuk
            mengelola semua.
          </p>
        </div>

        <div className="mobile-logo-wrapper">
          <Image
            src={theme === "dark" ? "/LogoYissDark.png" : "/LogoYiss.png"}
            alt="Logo YISS"
            width={140}
            height={56}
            style={{ width: "200px", height: "auto", objectFit: "contain" }}
          />
        </div>
      </div>

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
