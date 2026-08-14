"use client";

import { useState } from "react";

export default function SimulationPersistenceSmokeTest() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function save() {
    setStatus("saving");
    setMessage("");
    const response = await fetch("/api/simulations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Smoke test — persistência",
        input: { source: "sc-save-test", createdAt: new Date().toISOString() },
        result: { total: 0 },
      }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error || `HTTP ${response.status}`);
      return;
    }
    setStatus("saved");
    setMessage(`Simulação salva: ${data.id}`);
  }

  return (
    <main style={{ maxWidth: 760, margin: "60px auto", padding: 24, fontFamily: "system-ui" }}>
      <h1>Teste de persistência</h1>
      <p>Smoke test isolado para validar autenticação e gravação em <code>simulations</code>.</p>
      <button onClick={save} disabled={status === "saving"} style={{ padding: "12px 18px", cursor: "pointer" }}>
        {status === "saving" ? "Salvando…" : "Salvar simulação de teste"}
      </button>
      {message && <p style={{ marginTop: 20 }}>{message}</p>}
      {status === "saved" && <p>✅ Persistência confirmada.</p>}
    </main>
  );
}
