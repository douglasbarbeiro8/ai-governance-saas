// app/login-test/page.tsx
"use client";
import { useEffect, useState } from "react";

export default function Page() {
  const [now, setNow] = useState("");
  useEffect(() => setNow(new Date().toLocaleString()), []);
  return (
    <main style={{ padding: 24 }}>
      <h2>Login & Teste de APIs</h2>
      <p>Rota de teste carregada em: {now}</p>
      <p>Se você está vendo isso, a rota /login-test existe ✅</p>
    </main>
  );
}
