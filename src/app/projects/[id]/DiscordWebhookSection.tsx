"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DiscordWebhookSection({
  projectId,
  initialWebhookUrl,
}: {
  projectId: string;
  initialWebhookUrl: string | null;
}) {
  const router = useRouter();
  const [url, setUrl] = useState(initialWebhookUrl ?? "");
  const [reveal, setReveal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  async function save() {
    setSaving(true);
    setMessage(null);
    const res = await fetch(`/api/projects/${projectId}/discord-webhook`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordWebhookUrl: url || null }),
    });
    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage({ text: body.error || "No se pudo guardar", error: true });
      return;
    }
    setMessage({ text: "Guardado." });
    router.refresh();
  }

  async function sendTest() {
    setTesting(true);
    setMessage(null);
    const res = await fetch(`/api/projects/${projectId}/discord-webhook/test`, { method: "POST" });
    setTesting(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setMessage({ text: body.error || "No se pudo enviar el mensaje de prueba", error: true });
      return;
    }
    setMessage({ text: "Mensaje de prueba enviado — revisá el canal de Discord." });
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
        Integraciones — Webhook de Discord
      </label>
      <p className="text-xs text-ink-faint">
        Avisos de actividad del proyecto (tareas creadas/completadas, comentarios, cambios de estado) se mandan a
        este canal. Dejalo vacío para desactivarlo.
      </p>
      <div className="flex gap-2">
        <input
          type={reveal ? "text" : "password"}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          className="field flex-1"
        />
        <button type="button" onClick={() => setReveal((v) => !v)} className="btn-ghost !px-3">
          {reveal ? "Ocultar" : "Mostrar"}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button onClick={save} disabled={saving} className="btn-ghost !text-xs">
          {saving ? "Guardando..." : "Guardar webhook"}
        </button>
        <button onClick={sendTest} disabled={testing || !initialWebhookUrl} className="btn-ghost !text-xs">
          {testing ? "Enviando..." : "Enviar mensaje de prueba"}
        </button>
      </div>
      {message && (
        <p className={`text-xs ${message.error ? "font-medium text-rust" : "text-moss"}`}>{message.text}</p>
      )}
    </div>
  );
}
