"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Module, Task, UserRef } from "./types";
import { TASK_TYPE_LABEL, TASK_TYPE_COLOR } from "./types";
import { useConfirm } from "@/components/ConfirmDialog";

export const TYPE_OPTIONS = Object.entries(TASK_TYPE_LABEL) as [Task["type"], string][];
export const NO_MODULE = "__none__";

function toDateInputValue(value: string | Date | null): string {
  if (!value) return "";
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toISOString().slice(0, 10);
}

function formatDueDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

export function TaskRow({
  task,
  projectId,
  members,
  modules,
}: {
  task: Task;
  projectId: string;
  members: UserRef[];
  modules: Module[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [editingDate, setEditingDate] = useState(false);

  const isDone = task.type === "CAMBIO_REALIZADO";
  const typeColor = TASK_TYPE_COLOR[task.type];
  const selectedModule = modules.find((m) => m.id === task.moduleId) ?? null;

  async function patch(body: Record<string, unknown>) {
    setBusy(true);
    await fetch(`/api/projects/${projectId}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    router.refresh();
  }

  async function remove() {
    if (!(await confirm(`¿Borrar la tarea "${task.title}"?`))) return;
    await fetch(`/api/projects/${projectId}/tasks/${task.id}`, { method: "DELETE" });
    router.refresh();
  }

  const showDateInput = editingDate || !!task.dueDate;

  return (
    <li
      className={`flex items-start justify-between gap-4 border border-line border-l-4 bg-card p-3.5 shadow-[2px_2px_0_var(--line)] transition-opacity ${
        isDone ? "opacity-60" : ""
      }`}
      style={{ borderLeftColor: typeColor }}
    >
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium text-ink ${isDone ? "line-through" : ""}`}>{task.title}</p>
        {task.description && <p className="mt-1 text-xs text-ink-soft">{task.description}</p>}
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        {showDateInput ? (
          <input
            type="date"
            autoFocus={editingDate && !task.dueDate}
            value={toDateInputValue(task.dueDate)}
            disabled={busy}
            onChange={(e) => patch({ dueDate: e.target.value || null })}
            onBlur={() => setEditingDate(false)}
            className="field !w-auto py-1 text-xs"
            title="Fecha límite"
          />
        ) : (
          <button
            onClick={() => setEditingDate(true)}
            className="text-xs text-ink-faint hover:text-ink"
            title="Agregar fecha límite"
          >
            + Fecha
          </button>
        )}
        {task.dueDate && !editingDate && (
          <span className="text-[11px] text-ink-faint">{formatDueDate(task.dueDate)}</span>
        )}

        <select
          value={task.type}
          disabled={busy}
          onChange={(e) => patch({ type: e.target.value })}
          className="border !w-auto bg-card px-2 py-1 text-xs font-semibold"
          style={{ color: typeColor, borderColor: typeColor }}
        >
          {TYPE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5">
          {selectedModule && (
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: selectedModule.color }} />
          )}
          <select
            value={task.moduleId ?? NO_MODULE}
            disabled={busy}
            onChange={(e) => patch({ moduleId: e.target.value === NO_MODULE ? null : e.target.value })}
            className="field !w-auto py-1 text-xs"
          >
            <option value={NO_MODULE}>Sin módulo</option>
            {modules.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>

        <select
          value={task.assigneeId ?? ""}
          disabled={busy}
          onChange={(e) => patch({ assigneeId: e.target.value || null })}
          className={`field !w-auto py-1 text-xs ${task.assigneeId ? "font-semibold text-ink" : ""}`}
        >
          <option value="">Sin encargado</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>

        <button onClick={remove} className="text-xs text-ink-faint hover:text-rust">
          Borrar
        </button>
      </div>
    </li>
  );
}
