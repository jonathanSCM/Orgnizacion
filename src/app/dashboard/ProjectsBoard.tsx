"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { timeAgo } from "@/lib/time";
import type { DashboardProject, DashboardStatus } from "./types";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ProjectCard({ project, index }: { project: DashboardProject; index: number }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: project.id });

  const style = transform
    ? { transform: `translate(${transform.x}px, ${transform.y}px)`, zIndex: 10 }
    : { animationDelay: `${Math.min(index, 8) * 45}ms` };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`animate-rise border border-line bg-card p-3.5 text-sm transition-[box-shadow,transform] ${
        isDragging ? "shadow-[4px_4px_0_var(--line-strong)]" : "shadow-[2px_2px_0_var(--line)]"
      }`}
    >
      <div className="mb-2.5 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: project.status.color }} />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-faint">
          {project.status.name}
        </span>
      </div>

      <div {...listeners} {...attributes} className="cursor-grab">
        <Link
          href={`/projects/${project.id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-display text-[15px] font-semibold text-ink hover:text-rust"
        >
          {project.name}
        </Link>
        {project.description && (
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-ink-soft">{project.description}</p>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between">
        {project.assignee ? (
          <span className="flex items-center gap-1.5">
            <span
              title={project.assignee.name}
              className="flex h-5 w-5 items-center justify-center rounded-full border border-line-strong bg-paper text-[10px] font-semibold text-ink-soft"
            >
              {initials(project.assignee.name)}
            </span>
            <span className="text-[11px] text-ink-soft">{project.assignee.name}</span>
          </span>
        ) : (
          <span className="text-[11px] italic text-ink-faint">Sin encargado</span>
        )}
        <span className="text-[10px] text-ink-faint">{timeAgo(project.statusChangedAt)}</span>
      </div>

      {(project.repoUrl || project.deployUrl) && (
        <div className="mt-2.5 flex gap-3 border-t border-line pt-2.5 text-[11px]">
          {project.deployUrl && (
            <a
              href={project.deployUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="font-semibold text-moss hover:underline"
            >
              ↗ Despliegue
            </a>
          )}
          {project.repoUrl && (
            <a
              href={project.repoUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="text-ink-soft hover:text-ink"
            >
              Repo
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function Column({ status, projects }: { status: DashboardStatus; projects: DashboardProject[] }) {
  const { setNodeRef, isOver } = useDroppable({ id: status.id });

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[280px] flex-1 border-t-2 p-3 transition-colors ${
        isOver ? "bg-rust/5" : "bg-paper/40"
      }`}
      style={{ borderTopColor: status.color }}
    >
      <div className="mb-3 flex items-center gap-2 px-0.5">
        <h3 className="font-display text-sm font-semibold text-ink">{status.name}</h3>
        <span className="text-[11px] text-ink-faint">{projects.length}</span>
      </div>
      <div className="space-y-2.5">
        {projects.map((project, index) => (
          <ProjectCard key={project.id} project={project} index={index} />
        ))}
        {projects.length === 0 && (
          <div className="border border-dashed border-line-strong p-4 text-center text-[11px] text-ink-faint">
            Sin proyectos
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProjectsBoard({
  projects,
  statuses,
}: {
  projects: DashboardProject[];
  statuses: DashboardStatus[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(projects);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const newStatusId = over.id as string;
    const project = items.find((p) => p.id === active.id);
    if (!project || project.statusId === newStatusId) return;

    const newStatus = statuses.find((s) => s.id === newStatusId)!;
    setItems((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? { ...p, statusId: newStatusId, status: newStatus, statusChangedAt: new Date().toISOString() }
          : p
      )
    );

    await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ statusId: newStatusId }),
    });
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <p className="border border-dashed border-line-strong p-8 text-center text-sm text-ink-soft">
        Todavía no hay proyectos. Crea el primero arriba.
      </p>
    );
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statuses.map((status) => (
          <Column key={status.id} status={status} projects={items.filter((p) => p.statusId === status.id)} />
        ))}
      </div>
    </DndContext>
  );
}
