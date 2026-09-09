"use client";

import { useState } from "react";

export default function CopyProjectAiInfo({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = `Proyecto: ${projectName}\nID: ${projectId}\nURL base: ${window.location.origin}\n\nUsá tu token de acceso IA personal (lo generás en Configuración → Token IA, "Copiar prompt de acceso IA") para trabajar sobre este proyecto en ${window.location.origin}/api/projects/${projectId}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button onClick={copy} className="text-xs text-ink-faint hover:text-ink" title="Copiar ID y datos de este proyecto para tu asistente de IA">
      {copied ? "Copiado" : "Copiar acceso IA"}
    </button>
  );
}
