// app/portal/page.tsx
"use client";

import { useEffect, useState } from "react";
import { supaBrowser } from "../../lib/supabase-browser";

type UserInfo = { id: string; email?: string | null } | null;

export default function PortalPage() {
  const supa = supaBrowser();

  const [user, setUser] = useState<UserInfo>(null);
  const [orgId, setOrgId] = useState<string>("");
  const [systemId, setSystemId] = useState<string>("");
  const [assessmentId, setAssessmentId] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [log, setLog] = useState("");

  const logAppend = (msg: string) =>
    setLog((prev) => `${new Date().toLocaleTimeString()}  ${msg}\n${prev}`);

  // === Proteção client-side: sem sessão => volta pro /login
  useEffect(() => {
    supa.auth.getSession().then(({ data }) => {
      if (!data.session) {
        window.location.replace("/login");
      } else {
        setUser({ id: data.session.user.id, email: data.session.user.email });
      }
    });
  }, []);

  // headers com bearer
  async function buildAuthHeaders() {
    const h = new Headers();
    h.set("Content-Type", "application/json");
    const { data } = await supa.auth.getSession();
    const token = data.session?.access_token;
    if (token) h.set("Authorization", `Bearer ${token}`);
    return h;
  }

  async function signOut() {
    await supa.auth.signOut();
    window.location.replace("/login");
  }

  async function createOrg() {
    const res = await fetch("/api/orgs", {
      method: "POST",
      headers: await buildAuthHeaders(),
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
      headers: await buildAuthHeaders(),
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
      headers: await buildAuthHeaders(),
      body: JSON.stringify({ orgId, systemId, framework: "NIST AI RMF 1.0" }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "erro ao criar assessment");
    setAssessmentId(json.assessment.id);
    logAppend(`Assessment criado: ${json.assessment.id}`);
  }

  async function uploadEvidence() {
    if (!file) return alert("Selecione um arquivo");
    const questionId = 1;

    const res = await fetch("/api/evidence/sign", {
      method: "POST",
      headers: await buildAuthHeaders(),
      body: JSON.stringify({
        assessmentId,
        questionId,
        filename: file.name,
        mime: file.type || "application/octet-stream",
      }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json.error || "erro ao assinar upload");

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0 }}>Portal</h2>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span style={{ color: "#6b7280" }}>{user?.email}</span>
          <button onClick={signOut} style={{ padding: "8px 12px" }}>Sair</button>
        </div>
      </div>

      <section style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <h3>1) Organização</h3>
        <button onClick={createOrg} disabled={!user} style={{ padding: "8px 12px" }}>
          Criar Organização
        </button>
        <p style={{ marginTop: 8 }}>orgId: {orgId || "-"}</p>
      </section>

      <section style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <h3>2) Sistema</h3>
        <button onClick={createSystem} disabled={!orgId} style={{ padding: "8px 12px" }}>
          Criar Sistema
        </button>
        <p style={{ marginTop: 8 }}>systemId: {systemId || "-"}</p>
      </section>

      <section style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <h3>3) Assessment</h3>
        <button onClick={createAssessment} disabled={!systemId} style={{ padding: "8px 12px" }}>
          Criar Assessment
        </button>
        <p style={{ marginTop: 8 }}>assessmentId: {assessmentId || "-"}</p>
      </section>

      <section style={{ padding: 12, border: "1px solid #e5e7eb", borderRadius: 8 }}>
        <h3>4) Upload de Evidência</h3>
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button onClick={uploadEvidence} disabled={!assessmentId || !file} style={{ marginLeft: 8, padding: "8px 12px" }}>
          Enviar evidência
        </button>
      </section>

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
