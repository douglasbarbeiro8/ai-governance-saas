// app/layout.tsx
import Image from "next/image";

export const metadata = {
  title: "AI Governance SaaS",
  description: "NIST AI RMF assessment portal",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#f5f6f8", // cinza bem claro
          color: "#111827", // texto escuro
          fontFamily:
            'system-ui, -apple-system, "Segoe UI", Roboto, Ubuntu, Cantarell, "Noto Sans", sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: 960,
            margin: "40px auto",
            padding: 24,
            backgroundColor: "#ffffff",
            borderRadius: 16,
            boxShadow:
              "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)",
          }}
        >
          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginBottom: 24,
              flexDirection: "column",
            }}
          >
            {/* LOGO */}
            <Image
              src="/apeiron.png"
              alt="Ápeiron Governança"
              width={160}
              height={160}
              priority
            />
            <h1 style={{ margin: 0, fontSize: 32, letterSpacing: 0.2 }}>
              AI Governance SaaS
            </h1>
            <p style={{ marginTop: 4, color: "#4b5563" }}>Ápeiron Governança</p>
          </header>

          {children}
        </div>
      </body>
    </html>
  );
}
