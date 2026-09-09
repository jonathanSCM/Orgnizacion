"use client";

import { useState } from "react";
import type { ProjectDetail } from "./types";

export default function AskProject({ project }: { project: ProjectDetail }) {
  const [question, setQuestion] = useState("");
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasDocuments = project.documents.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;
    setLoading(true);
    setError(null);
    setAnswer(null);

    const res = await fetch(`/api/projects/${project.id}/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "No se pudo obtener respuesta");
      return;
    }

    const body = await res.json();
    setAsked(question);
    setAnswer(body.answer);
    setQuestion("");
  }

  if (!hasDocuments) {
    return null;
  }

  return (
    <div className="surface-card mb-6 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Preguntale al proyecto</p>
      <p className="mt-1 text-xs text-ink-faint">
        La IA responde usando el texto de los documentos ya subidos a este proyecto.
      </p>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="¿En qué dominio está desplegado? ¿Qué falta por hacer?"
          className="field flex-1"
        />
        <button type="submit" disabled={loading} className="btn-primary shrink-0">
          {loading ? "Pensando..." : "Preguntar"}
        </button>
      </form>

      {error && <p className="mt-2 text-sm font-medium text-rust">{error}</p>}

      {answer && (
        <div className="mt-3 border border-line bg-paper p-3 text-sm">
          <p className="font-semibold text-ink">{asked}</p>
          <p className="mt-1.5 leading-relaxed text-ink-soft">{answer}</p>
        </div>
      )}
    </div>
  );
}
