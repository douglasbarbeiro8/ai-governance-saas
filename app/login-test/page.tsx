// app/login-test/page.tsx
"use client";

import { useEffect, useState } from "react";
// import absoluto pode variar; para garantir, uso relativo:
import { supaBrowser } from "../../lib/supabase-browser";

type UserInfo = { id: string; email?: string | null } | null;

export default function LoginTest() {
  const supa = supaBrowser();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<UserInfo>(null);

  const [orgId, setOrgId] = useState<string>("");
  const [systemId, setSystemId] = useState<string>("");
  const [assessmentId, setAssessmentId] = useState<string>("");

  const [file, setFile] = useState<File | null>(null);
  const [log, setLog] = useState<string>("");

  const logAppend = (msg: string) =>
    setLog((prev) => `${new Date().toLocaleTimeString()}  ${msg}\n${prev}`);

  // mantém estado de sessão
  useEffect(() => {
    supa.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email });
    });
    const { data: sub } = supa.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // --------- Auth ----------
  async function signUp() {
    const { error } = await supa.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert("Conta criada! Se a confirmação por e-mail estiver ativa, confirme e depois faça login.");
  }

  async function signIn() {
    const { error } = await supa.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    logAppend("Login ok.");
  }

  async function signOut() {
    await supa.auth.signOut();
    setUser(null);
    logAppend("Logout ok.");
  }

  // --------- chamadas às APIs ----------
  async function createOrg() {
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Minha Empresa", sector: "Serviços", country: "BR" }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "erro ao criar org");
    setOrgId(json.org.id);
    logAppend(`Org criada: ${json.org.id}`);
  }

  async function createSystem() {
    const res = await fetch("/api/systems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, name: "Meu Sistema de IA", riskLevel: "alto" }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "erro ao criar system");
    setSystemId(json.system.id);
    logAppend(`System criado: ${json.system.id}`);
  }

  async function createAssessment() {
    const res = await fetch("/api/assessments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, systemId, framework: "NIST AI RMF 1.0" }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "erro ao criar assessment");
    setAssessmentId(json.assessment.id);
    logAppend(`Assessment criado: ${json.assessment.id}`);
  }

  async function uploadEvidence() {
    if (!file) return alert("Selecione um arquivo");
    const questionId = 1; // só para teste

    // 1) pede a URL assinada ao backend
    const res = await fetch("/api/evidence/sign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assessmentId,
        questionId,
        filename: file.name,
        mime: file.type || "application/octet-stream",
      }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "erro ao assinar upload");

    // 2) usa o client público para enviar com token
    const { error } = await supa.storage
      .from("evidence")
      .uploadToSignedUrl(json.storagePath, json.token, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) return alert(error.message);
    logAppend(`Evidência enviada: ${json.storagePath}`);
  }

  // --------- UI ---------
  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h2 style={{ marginTop: 0 }}>Login & Teste de APIs</h2>

      {/* Auth */}
      <section style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 8, background: "#fafafa" }}>
        <h3>1) Autenticação</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <input
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }}
          />
          <input
            placeholder="senha"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: 8, border: "1px solid #d1d5db", borderRadius: 6 }}
          />
          <button onClick={signUp} style={{ padding: "8px 12px" }}>Criar conta</button>
          <button onClick={signIn} style={{ padding: "8px 12px" }}>Login</button>
          <button onClick={signOut} style={{ padding: "8px 12px" }}>Logout</button>
        </div>
        <p style={{ marginTop: 8 }}>Usuário: {user ? `${user.email} (${user.id})` : "deslogado"}</p>
      </section>

      {/* Entidades */}
      <section style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <h3>2) Criar Organização & Sistema & Assessment</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={createOrg} disabled={!user} style={{ padding: "8px 12px" }}>Criar Organização</button>
          <button onClick={createSystem} disabled={!orgId} style={{ padding: "8px 12px" }}>Criar Sistema</button>
          <button onClick={createAssessment} disabled={!systemId} style={{ padding: "8px 12px" }}>Criar Assessment</button>
        </div>
        <p style={{ marginTop: 8 }}>orgId: {orgId || "-"}</p>
        <p>systemId: {systemId || "-"}</p>
        <p>assessmentId: {assessmentId || "-"}</p>
      </section>

      {/* Upload */}
      <section style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <h3>3) Upload de Evidência</h3>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button onClick={uploadEvidence} disabled={!assessmentId || !file} style={{ marginLeft: 8, padding: "8px 12px" }}>
          Enviar evidência
        </button>
      </section>

      {/* Log */}
      <section
        style={{
          padding: 12,
          border: "1px solid #e5e7eb",
          borderRadius: 8,
          background: "#0b1220",
          color: "#e5e7eb",
          whiteSpace: "pre-wrap",
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Log</h3>
        <code>{log || "(vazio)"}</code>
      </section>
    </main>
  );
}

