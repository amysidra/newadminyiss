export default function DashboardPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Poppins', system-ui, sans-serif",
        background: "#f4f6f8",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "3rem 4rem",
          textAlign: "center",
          boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: "1.75rem", fontWeight: 700, color: "#111", marginBottom: "0.5rem" }}>
          Dashboard
        </h1>
        <p style={{ color: "#6b7280", fontSize: "0.95rem" }}>
          Selamat datang di panel admin YISS.
        </p>
        <a
          href="/"
          style={{
            display: "inline-block",
            marginTop: "1.5rem",
            padding: "0.6rem 1.5rem",
            borderRadius: "8px",
            background: "#1a7a4a",
            color: "#fff",
            fontWeight: 600,
            fontSize: "0.875rem",
            textDecoration: "none",
          }}
        >
          ← Kembali ke Login
        </a>
      </div>
    </div>
  );
}
