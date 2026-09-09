"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { timeAgo } from "@/lib/time";
import type { ProjectDetail } from "./types";

export default function WeeklySummary({ project }: { project: ProjectDetail }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/projects/${project.id}/weekly-summary`, { method: "POST" });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "No se pudo generar el resumen");
      return;
    }
    router.refresh();
  }

  return (
    <div className="surface-card mb-6 p-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Resumen de la semana</p>
          {project.lastWeeklySummary ? (
            <>
              <p className="mt-1.5 text-sm leading-relaxed text-ink">{project.lastWeeklySummary}</p>
              {project.lastWeeklySummaryAt && (
                <p className="mt-1.5 text-xs text-ink-faint">
                  Generado {timeAgo(project.lastWeeklySummaryAt)}
                </p>
              )}
            </>
          ) : (
            <p className="mt-1.5 text-sm text-ink-faint">
              Todavía no se generó un resumen de esta semana.
            </p>
          )}
        </div>
        <button onClick={generate} disabled={loading} className="btn-ghost shrink-0 !text-xs">
          {loading ? "Generando..." : "Generar resumen"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm font-medium text-rust">{error}</p>}
    </div>
  );
}
