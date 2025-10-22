// app/login/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supaBrowser } from "../../lib/supabase-browser";

export default function LoginPage() {
  const supa = supaBrowser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    // se já estiver logado, manda pro portal
    supa.auth.getSession().then(({ data }) => {
      if (data.session) window.location.replace("/portal");
    });
  }, []);

  async function signUp() {
    setBusy(true); setMsg("");
    const { error } = await supa.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/portal` },
    });
    setBusy(false);
    if (error) return setMsg(error.message);
    setMsg("Conta criada! Confirme o e-mail para continuar.");
  }

  async function signIn() {
    setBusy(true); setMsg("");
    const { error } = await supa.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) return setMsg(error.message);
    window.location.replace("/portal");
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", display: "grid", gap: 16 }}>
      <h2 style={{ textAlign: "center", marginTop: 0 }}>Entrar</h2>

      <label style={{ display: "grid", gap: 6 }}>
        <span>E-mail</span>
        <input
          placeholder="voce@empresa.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }}
        />
      </label>

      <label style={{ display: "grid", gap: 6 }}>
        <span>Senha</span>
        <input
          placeholder="••••••••"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ padding: 10, border: "1px solid #d1d5db", borderRadius: 8 }}
        />
      </label>

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={signIn} disabled={busy} style={{ padding: "10px 12px", flex: 1 }}>
          Entrar
        </button>
        <button onClick={signUp} disabled={busy} style={{ padding: "10px 12px", flex: 1 }}>
          Criar conta
        </button>
      </div>

      {msg && (
        <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", color: "#7c2d12", padding: 10, borderRadius: 8 }}>
          {msg}
        </div>
      )}
    </main>
  );
}
