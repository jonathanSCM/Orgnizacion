"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Task } from "../projects/[id]/types";
import { TASK_TYPE_LABEL, TASK_TYPE_COLOR } from "../projects/[id]/types";

type MyTask = Task & {
  project: { id: string; name: string; status: { name: string; color: string } };
};

const TYPE_OPTIONS = Object.entries(TASK_TYPE_LABEL) as [Task["type"], string][];

function formatDueDate(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return d.toLocaleDateString("es-AR", { day: "numeric", month: "short" });
}

function MyTaskRow({ task }: { task: MyTask }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const isDone = task.type === "CAMBIO_REALIZADO";
  const typeColor = TASK_TYPE_COLOR[task.type];

  async function changeType(type: string) {
    setBusy(true);
    await fetch(`/api/projects/${task.projectId}/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <li
      className={`flex items-start justify-between gap-4 border border-line border-l-4 bg-card p-3.5 shadow-[2px_2px_0_var(--line)] transition-opacity ${
        isDone ? "opacity-60" : ""
      }`}
      style={{ borderLeftColor: typeColor }}
    >
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium text-ink ${isDone ? "line-through" : ""}`}>{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-ink-faint">
          {task.module && (
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: task.module.color }} />
              {task.module.name}
            </span>
          )}
          {task.dueDate && <span>vence {formatDueDate(task.dueDate)}</span>}
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
        <select
          value={task.type}
          disabled={busy}
          onChange={(e) => changeType(e.target.value)}
          className="border !w-auto bg-card px-2 py-1 text-xs font-semibold"
          style={{ color: typeColor, borderColor: typeColor }}
        >
          {TYPE_OPTIONS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <Link href={`/projects/${task.projectId}`} className="text-xs text-ink-faint hover:text-ink">
          Ver proyecto →
        </Link>
      </div>
    </li>
  );
}

export default function MyTasksView({ tasks }: { tasks: MyTask[] }) {
  const groups = useMemo(() => {
    const byProject = new Map<string, { project: MyTask["project"]; tasks: MyTask[] }>();
    for (const task of tasks) {
      const entry = byProject.get(task.projectId) ?? { project: task.project, tasks: [] };
      entry.tasks.push(task);
      byProject.set(task.projectId, entry);
    }
    return Array.from(byProject.values());
  }, [tasks]);

  if (tasks.length === 0) {
    return (
      <p className="border border-dashed border-line-strong p-6 text-center text-sm text-ink-soft">
        No tenés tareas asignadas en ningún proyecto.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {groups.map(({ project, tasks: projectTasks }) => (
        <div key={project.id}>
          <div className="mb-2 flex items-center gap-2">
            <h3 className="font-display text-sm font-semibold text-ink">
              <Link href={`/projects/${project.id}`} className="hover:underline">
                {project.name}
              </Link>
            </h3>
            <span className="tag text-card" style={{ backgroundColor: project.status.color }}>
              {project.status.name}
            </span>
            <span className="text-xs text-ink-faint">{projectTasks.length}</span>
          </div>
          <ul className="space-y-2.5">
            {projectTasks.map((task) => (
              <MyTaskRow key={task.id} task={task} />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
