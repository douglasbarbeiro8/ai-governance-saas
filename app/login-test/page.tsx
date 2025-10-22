// app/login-test/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supaBrowser } from "@/lib/supabase-browser";

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
    setLog((prev) => `${new Date().toLocaleTimeString()} ${msg}\n${prev}`);

  useEffect(() => {
    supa.auth.getUser().then(({ data }) => {
      if (data.user) setUser({ id: data.user.id, email: data.user.email });
    });
    const { data: sub } = supa.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signUp() {
    const { error } = await supa.auth.signUp({ email, password });
    if (error) return alert(error.message);
    alert("Conta criada! Se pediu confirmação por e-mail, confirme e depois faça login.");
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

  // ---- Chamadas às APIs do seu backend ----
  async function createOrg() {
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Minha Empresa", sector: "Serviços", country: "BR" }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "erro");
    setOrgId(json.org.id);
    logAppend(`Org criada: ${json.org.id}`);
  }

  async function createSystem() {
    // endpoint simples para criar "systems" — vamos adicionar no Passo D
    const res = await fetch("/api/systems", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId, name: "Meu Sistema de IA", riskLevel: "alto" }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "erro");
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
    if (!res.ok) return alert(json.error || "erro");
    setAssessmentId(json.assessment.id);
    logAppend(`Assessment criado: ${json.assessment.id}`);
  }

  async function uploadEvidence() {
    if (!file) return alert("Selecione um arquivo");
    const questionId = 1; // só para teste; depois a UI vai passar o ID correto

    // 1) pede URL assinada ao backend
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

    // 2) usa o client público do Supabase para subir com token
    const { error } = await supa.storage
      .from("evidence")
      .uploadToSignedUrl(json.storagePath, json.token, file, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) return alert(error.message);
    logAppend(`Evidência enviada: ${json.storagePath}`);
  }

  return (
    <main style={{ display: "grid", gap: 16 }}>
      <h2>Login & Teste de APIs</h2>

      <section style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3>1) Autenticação</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <input placeholder="senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <button onClick={signUp}>Criar conta</button>
          <button onClick={signIn}>Login</button>
          <button onClick={signOut}>Logout</button>
        </div>
        <p>Usuário: {user ? `${user.email} (${user.id})` : "deslogado"}</p>
      </section>

      <section style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3>2) Criar Organização & Sistema & Assessment</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={createOrg} disabled={!user}>Criar Organização</button>
          <button onClick={createSystem} disabled={!orgId}>Criar Sistema</button>
          <button onClick={createAssessment} disabled={!systemId}>Criar Assessment</button>
        </div>
        <p>orgId: {orgId || "-"}</p>
        <p>systemId: {systemId || "-"}</p>
        <p>assessmentId: {assessmentId || "-"}</p>
      </section>

      <section style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3>3) Upload de Evidência</h3>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button onClick={uploadEvidence} disabled={!assessmentId || !file}>Enviar evidência</button>
      </section>

      <section style={{ padding: 12, border: "1px solid #ddd", borderRadius: 8, whiteSpace: "pre-wrap", fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas" }}>
        <h3>Log</h3>
        <code>{log || "(vazio)"}</code>
      </section>
    </main>
  );
}
