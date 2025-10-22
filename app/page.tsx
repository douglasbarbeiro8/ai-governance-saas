// app/page.tsx
export default function Page() {
  return (
    <main style={{ display: "grid", gap: 12 }}>
      <h2 style={{ marginTop: 0 }}>Bem-vindo 👋</h2>
      <p>Starter do portal SaaS NIST AI RMF.</p>
      <ul>
        <li>APIs em <code>/app/api</code></li>
        <li>Configure as envs na Vercel</li>
        <li>Rota de teste: <code>/login-test</code></li>
      </ul>
    </main>
  );
}
