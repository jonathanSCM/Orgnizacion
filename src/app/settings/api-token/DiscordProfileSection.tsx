"use client";

import { useEffect, useState } from "react";

export default function DiscordProfileSection() {
  const [discordUserId, setDiscordUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/users/me")
      .then((res) => res.json())
      .then((data) => setDiscordUserId(data.discordUserId ?? ""))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch("/api/users/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordUserId: discordUserId || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage({ text: body.error || "No se pudo guardar", error: true });
      return;
    }
    setMessage({ text: "Guardado." });
  }

  return (
    <div className="mt-10 border-t border-line pt-8">
      <h2 className="mb-1 font-display text-xl font-semibold tracking-tight text-ink">Tu Discord</h2>
      <p className="mb-4 text-sm text-ink-soft">
        Si cargás tu ID, los avisos de Discord de los proyectos donde sos encargado (o tenés una tarea asignada) te
        van a etiquetar con @ en vez de mandarse como mensaje general del canal.
      </p>
      <p className="mb-3 text-xs text-ink-faint">
        Para conseguirlo: activá el "Modo desarrollador" en Discord (Ajustes → Avanzado), después clic derecho sobre
        tu nombre en cualquier lado → "Copiar ID de usuario".
      </p>
      {loading ? (
        <p className="text-sm text-ink-soft">Cargando...</p>
      ) : (
        <div className="flex max-w-md gap-2">
          <input
            value={discordUserId}
            onChange={(e) => setDiscordUserId(e.target.value)}
            placeholder="Ej: 123456789012345678"
            className="field flex-1"
          />
          <button onClick={save} disabled={saving} className="btn-ghost">
            {saving ? "Guardando..." : "Guardar"}
          </button>
        </div>
      )}
      {message && <p className={`mt-2 text-xs ${message.error ? "font-medium text-rust" : "text-moss"}`}>{message.text}</p>}
    </div>
  );
}
