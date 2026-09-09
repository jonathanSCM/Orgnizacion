"use client";

import { useState } from "react";
import type { HistoryEntry } from "./types";
import { timeAgo } from "@/lib/time";

const FIELD_LABEL: Record<string, string> = {
  name: "Nombre",
  description: "Descripción",
  repoUrl: "Repositorio",
  deployUrl: "Link de despliegue",
  language: "Lenguaje",
  stack: "Stack",
  estado_proyecto: "Estado del proyecto",
  encargado: "Encargado del proyecto",
  tipo_tarea: "Tipo de tarea",
  encargado_tarea: "Encargado de tarea",
  modulo_tarea: "Módulo de tarea",
  modulo_creado: "Módulo creado",
  modulo_borrado: "Módulo borrado",
  tarea_creada: "Tarea creada",
  documento_subido: "Documento subido",
  documento_borrado: "Documento borrado",
  pregunta_ia: "Pregunta a la IA",
  fecha_limite_tarea: "Fecha límite de tarea",
  ia_aplico_extraccion: "IA aplicó info del documento",
  tareas_generadas_por_ia: "Tareas generadas por IA",
};

export default function HistoryTab({
  projectId,
  entries,
  initialHasMore,
}: {
  projectId: string;
  entries: HistoryEntry[];
  initialHasMore: boolean;
}) {
  const [items, setItems] = useState(entries);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);

  async function loadMore() {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/history?skip=${items.length}&take=20`);
    const page: HistoryEntry[] = await res.json();
    setLoading(false);
    setHasMore(page.length === 20);
    setItems((prev) => [...prev, ...page]);
  }

  if (items.length === 0) {
    return (
      <p className="border border-dashed border-line-strong p-6 text-center text-sm text-ink-soft">
        Todavía no hay historial en este proyecto.
      </p>
    );
  }

  return (
    <div>
      <ul className="space-y-4 border-l-2 border-line pl-5">
        {items.map((entry) => (
          <li key={entry.id} className="relative text-sm">
            <span className="absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-card bg-rust" />
            <p className="text-ink">
              <span className="font-semibold">{FIELD_LABEL[entry.field] ?? entry.field}</span>
              {entry.task?.title && <span className="text-ink-soft"> · {entry.task.title}</span>}
              {entry.oldValue && entry.newValue && (
                <span className="text-ink-soft">
                  {" "}
                  — de &quot;{entry.oldValue}&quot; a &quot;{entry.newValue}&quot;
                </span>
              )}
              {!entry.oldValue && entry.newValue && (
                <span className="text-ink-soft"> — {entry.newValue}</span>
              )}
              {entry.oldValue && !entry.newValue && (
                <span className="text-ink-soft"> — se quitó &quot;{entry.oldValue}&quot;</span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-ink-faint">
              {entry.changedBy?.name ?? "Sistema"} · {new Date(entry.changedAt).toLocaleString()} ·{" "}
              {timeAgo(entry.changedAt)}
            </p>
          </li>
        ))}
      </ul>
      {hasMore && (
        <div className="mt-4 flex justify-center">
          <button onClick={loadMore} disabled={loading} className="btn-ghost">
            {loading ? "Cargando..." : "Cargar más"}
          </button>
        </div>
      )}
    </div>
  );
}
