"use client";

import { useMemo, useState } from "react";
import type { Module, Task, UserRef } from "./types";
import { TASK_TYPE_LABEL } from "./types";
import { TaskRow } from "./TaskRow";

type SortField = "title" | "priority" | "type" | "module" | "assignee" | "dueDate";

const COLUMNS: { field: SortField; label: string }[] = [
  { field: "title", label: "Título" },
  { field: "priority", label: "Prioridad" },
  { field: "type", label: "Tipo" },
  { field: "module", label: "Módulo" },
  { field: "assignee", label: "Encargado" },
  { field: "dueDate", label: "Fecha límite" },
];

const PRIORITY_ORDER: Record<Task["priority"], number> = { URGENTE: 0, ALTA: 1, MEDIA: 2, BAJA: 3 };

function sortValue(task: Task, field: SortField): string {
  switch (field) {
    case "title":
      return task.title.toLowerCase();
    case "priority":
      return String(PRIORITY_ORDER[task.priority]);
    case "type":
      return TASK_TYPE_LABEL[task.type];
    case "module":
      return task.module?.name ?? "￿"; // sin módulo al final
    case "assignee":
      return task.assignee?.name ?? "￿";
    case "dueDate":
      return task.dueDate ? new Date(task.dueDate).toISOString() : "￿";
  }
}

export default function TaskListView({
  tasks,
  projectId,
  members,
  modules,
  selectedIds,
  onToggleSelect,
}: {
  tasks: Task[];
  projectId: string;
  members: UserRef[];
  modules: Module[];
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}) {
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const sorted = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const av = sortValue(a, sortField);
      const bv = sortValue(b, sortField);
      return av < bv ? -1 * sortDir : av > bv ? 1 * sortDir : 0;
    });
  }, [tasks, sortField, sortDir]);

  function toggleSort(field: SortField) {
    if (field === sortField) {
      setSortDir((d) => (d === 1 ? -1 : 1));
    } else {
      setSortField(field);
      setSortDir(1);
    }
  }

  return (
    <div>
      <div className="mb-2 flex gap-4 px-3.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {COLUMNS.map((col) => (
          <button
            key={col.field}
            onClick={() => toggleSort(col.field)}
            className={`hover:text-ink ${sortField === col.field ? "text-ink" : ""}`}
          >
            {col.label} {sortField === col.field ? (sortDir === 1 ? "↑" : "↓") : ""}
          </button>
        ))}
      </div>
      <ul className="space-y-2.5">
        {sorted.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            projectId={projectId}
            members={members}
            modules={modules}
            selected={selectedIds?.has(task.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </ul>
    </div>
  );
}
