"use client";

import { useEffect, useState } from "react";
import { useConfirm } from "@/components/ConfirmDialog";
import { buildAiAccessPrompt } from "@/lib/aiPrompt";

type TokenMeta = { id: string; token: string; createdAt: string; lastUsedAt: string | null } | null;

export default function ApiTokenManager({ userName }: { userName: string }) {
  const confirm = useConfirm();
  const [token, setToken] = useState<TokenMeta>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState<"token" | "prompt" | null>(null);

  useEffect(() => {
    fetch("/api/tokens")
      .then((res) => res.json())
      .then((data) => setToken(data.token))
      .finally(() => setLoading(false));
  }, []);

  async function generate() {
    if (token && !(await confirm("Ya tenés un token activo. Generar uno nuevo va a invalidar el anterior — ¿seguimos?")))
      return;
    setBusy(true);
    const res = await fetch("/api/tokens", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    setToken(data.token);
  }

  async function revoke() {
    if (!(await confirm("¿Revocar tu token de API? Cualquier integración que lo use dejará de funcionar."))) return;
    setBusy(true);
    await fetch("/api/tokens", { method: "DELETE" });
    setBusy(false);
    setToken(null);
  }

  async function copy(text: string, what: "token" | "prompt") {
    await navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return <p className="text-sm text-ink-soft">Cargando...</p>;

  return (
    <div className="space-y-6">
      {!token && (
        <div className="border border-dashed border-line-strong p-6 text-center">
          <p className="mb-4 text-sm text-ink-soft">Todavía no generaste un token de acceso.</p>
          <button onClick={generate} disabled={busy} className="btn-primary">
            {busy ? "Generando..." : "Generar token"}
          </button>
        </div>
      )}

      {token && (
        <div className="space-y-4 border border-line bg-card p-5">
          <div>
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft">Tu token</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto whitespace-nowrap border border-line-strong bg-paper px-3 py-2 text-xs text-ink">
                {token.token}
              </code>
              <button onClick={() => copy(token.token, "token")} className="btn-ghost !text-xs">
                {copied === "token" ? "Copiado" : "Copiar"}
              </button>
            </div>
            <p className="mt-1.5 text-xs text-ink-faint">
              Creado {new Date(token.createdAt).toLocaleString()} ·{" "}
              {token.lastUsedAt ? `usado por última vez ${new Date(token.lastUsedAt).toLocaleString()}` : "todavía sin usar"}
            </p>
          </div>

          <div className="border-t border-line pt-4">
            <p className="mb-2 text-sm text-ink-soft">
              Copiá el prompt completo con las instrucciones, listo para pegarle a tu asistente de IA:
            </p>
            <button
              onClick={() => copy(buildAiAccessPrompt(window.location.origin, token.token, userName), "prompt")}
              className="btn-primary !text-xs"
            >
              {copied === "prompt" ? "Prompt copiado" : "Copiar prompt de acceso IA"}
            </button>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-line pt-4">
            <button onClick={generate} disabled={busy} className="btn-ghost !text-xs">
              Regenerar
            </button>
            <button onClick={revoke} disabled={busy} className="text-xs text-ink-faint hover:text-rust">
              Revocar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
