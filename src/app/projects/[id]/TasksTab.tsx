"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Module, ProjectDetail, Task, UserRef } from "./types";
import { TaskRow, TYPE_OPTIONS, PRIORITY_OPTIONS, NO_MODULE } from "./TaskRow";
import TaskListView from "./TaskListView";
import TaskCalendarView from "./TaskCalendarView";
import { useConfirm } from "@/components/ConfirmDialog";

const VIEWS = ["Agrupado", "Lista", "Calendario"] as const;
type View = (typeof VIEWS)[number];
const NO_ASSIGNEE = "__no_assignee__";

function ModulesManager({
  projectId,
  modules,
  onCreated,
  onDeleted,
}: {
  projectId: string;
  modules: Module[];
  onCreated: (m: Module) => void;
  onDeleted: (id: string) => void;
}) {
  const confirm = useConfirm();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#56684a");

  async function addModule(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const res = await fetch(`/api/projects/${projectId}/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (res.ok) {
      const created = await res.json();
      onCreated(created);
      setName("");
    }
  }

  async function removeModule(id: string) {
    if (!(await confirm("¿Borrar este módulo? Las tareas que tenga quedarán sin módulo."))) return;
    const res = await fetch(`/api/projects/${projectId}/modules/${id}`, { method: "DELETE" });
    if (res.ok) onDeleted(id);
  }

  return (
    <div className="mb-5 border border-line bg-paper p-3.5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-semibold uppercase tracking-wide text-ink-soft hover:text-ink"
      >
        Módulos {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {modules.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {modules.map((m) => (
                <li key={m.id} className="tag border border-line-strong bg-card">
                  <span className="mr-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: m.color }} />
                  <span className="text-ink-soft">{m.name}</span>
                  <button onClick={() => removeModule(m.id)} className="ml-2 text-ink-faint hover:text-rust">
                    ×
                  </button>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={addModule} className="flex items-center gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del módulo (ej. Coexistence)"
              className="field !w-auto flex-1"
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-11 border border-line-strong bg-card"
            />
            <button type="submit" className="btn-ghost !py-1.5 !text-xs">
              Añadir módulo
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function splitDone(tasks: Task[]) {
  const pending = tasks.filter((t) => t.type !== "CAMBIO_REALIZADO");
  const done = tasks.filter((t) => t.type === "CAMBIO_REALIZADO");
  return { pending, done };
}

function TaskGroupList({
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
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
}) {
  const { pending, done } = splitDone(tasks);
  return (
    <>
      <ul className="space-y-2.5">
        {pending.map((task) => (
          <TaskRow
            key={task.id}
            task={task}
            projectId={projectId}
            members={members}
            modules={modules}
            selected={selectedIds.has(task.id)}
            onToggleSelect={onToggleSelect}
          />
        ))}
      </ul>
      {done.length > 0 && (
        <div className="mt-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Completadas ({done.length})
          </h4>
          <ul className="space-y-2.5">
            {done.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                projectId={projectId}
                members={members}
                modules={modules}
                selected={selectedIds.has(task.id)}
                onToggleSelect={onToggleSelect}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default function TasksTab({ project }: { project: ProjectDetail }) {
  const router = useRouter();
  const [tasks, setTasks] = useState(project.tasks);
  const [modules, setModules] = useState(project.modules);
  const [members, setMembers] = useState<UserRef[]>([]);
  const [title, setTitle] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [moduleId, setModuleId] = useState("");
  const [priority, setPriority] = useState<Task["priority"]>("MEDIA");
  const [dueDate, setDueDate] = useState("");
  const [showDateField, setShowDateField] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<View>("Agrupado");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const confirm = useConfirm();

  useEffect(() => {
    setTasks(project.tasks);
    setModules(project.modules);
  }, [project.tasks, project.modules]);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setMembers)
      .catch(() => {});
  }, []);

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const res = await fetch(`/api/projects/${project.id}/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        assigneeId: assigneeId || undefined,
        moduleId: moduleId || undefined,
        priority,
        dueDate: dueDate || undefined,
      }),
    });
    if (res.ok) {
      const task = await res.json();
      setTasks((prev) => [...prev, task]);
      setTitle("");
      setAssigneeId("");
      setModuleId("");
      setPriority("MEDIA");
      setDueDate("");
      setShowDateField(false);
      setShowForm(false);
      router.refresh();
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function bulkPatch(data: Record<string, unknown>) {
    await Promise.all(
      [...selectedIds].map((id) =>
        fetch(`/api/projects/${project.id}/tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        })
      )
    );
    router.refresh();
  }

  async function bulkDelete() {
    if (!(await confirm(`¿Borrar las ${selectedIds.size} tareas seleccionadas?`))) return;
    await Promise.all(
      [...selectedIds].map((id) => fetch(`/api/projects/${project.id}/tasks/${id}`, { method: "DELETE" }))
    );
    setSelectedIds(new Set());
    router.refresh();
  }

  const groups = useMemo(() => {
    const byModule = new Map<string, Task[]>();
    const noModule: Task[] = [];
    for (const task of tasks) {
      if (task.moduleId) {
        const list = byModule.get(task.moduleId) ?? [];
        list.push(task);
        byModule.set(task.moduleId, list);
      } else {
        noModule.push(task);
      }
    }
    const result = modules
      .map((m) => ({ module: m, tasks: byModule.get(m.id) ?? [] }))
      .filter((g) => g.tasks.length > 0 || modules.length > 0);
    return { withModule: result, noModule };
  }, [tasks, modules]);

  return (
    <div>
      <ModulesManager
        projectId={project.id}
        modules={modules}
        onCreated={(m) => setModules((prev) => [...prev, m])}
        onDeleted={(id) => {
          setModules((prev) => prev.filter((m) => m.id !== id));
          setTasks((prev) => prev.map((t) => (t.moduleId === id ? { ...t, moduleId: null, module: null } : t)));
        }}
      />

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        {showForm ? (
          <form onSubmit={addTask} className="flex flex-wrap gap-2">
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="¿Qué hay que hacer?"
              className="field w-64"
            />
            {showDateField ? (
              <input
                autoFocus
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="field !w-auto"
                title="Fecha límite"
              />
            ) : (
              <button
                type="button"
                onClick={() => setShowDateField(true)}
                className="text-xs text-ink-faint hover:text-ink"
              >
                + Fecha límite
              </button>
            )}
            {modules.length > 0 && (
              <select value={moduleId} onChange={(e) => setModuleId(e.target.value)} className="field !w-auto">
                <option value="">Sin módulo</option>
                {modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="field !w-auto">
              <option value="">Sin encargado</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Task["priority"])}
              className="field !w-auto"
            >
              {PRIORITY_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button type="submit" className="btn-primary">
              Añadir
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-ghost">
              Cancelar
            </button>
          </form>
        ) : (
          <button onClick={() => setShowForm(true)} className="btn-ghost">
            + Nuevo cambio / tarea
          </button>
        )}

        <div className="flex gap-1 border border-line-strong">
          {VIEWS.map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-2.5 py-1 text-xs font-medium ${
                view === v ? "bg-ink text-card" : "text-ink-soft hover:bg-paper"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {selectedIds.size > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3 border border-line-strong bg-paper px-3.5 py-2.5">
          <span className="text-xs font-semibold text-ink">{selectedIds.size} seleccionada(s)</span>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) bulkPatch({ type: e.target.value });
              e.target.value = "";
            }}
            className="field !w-auto py-1 text-xs"
          >
            <option value="">Cambiar tipo...</option>
            {TYPE_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) bulkPatch({ priority: e.target.value });
              e.target.value = "";
            }}
            className="field !w-auto py-1 text-xs"
          >
            <option value="">Cambiar prioridad...</option>
            {PRIORITY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {modules.length > 0 && (
            <select
              defaultValue=""
              onChange={(e) => {
                if (!e.target.value) return;
                bulkPatch({ moduleId: e.target.value === NO_MODULE ? null : e.target.value });
                e.target.value = "";
              }}
              className="field !w-auto py-1 text-xs"
            >
              <option value="">Cambiar módulo...</option>
              <option value={NO_MODULE}>Sin módulo</option>
              {modules.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          )}
          <select
            defaultValue=""
            onChange={(e) => {
              if (!e.target.value) return;
              bulkPatch({ assigneeId: e.target.value === NO_ASSIGNEE ? null : e.target.value });
              e.target.value = "";
            }}
            className="field !w-auto py-1 text-xs"
          >
            <option value="">Cambiar encargado...</option>
            <option value={NO_ASSIGNEE}>Sin encargado</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <button onClick={bulkDelete} className="text-xs text-ink-faint hover:text-rust">
            Borrar seleccionadas
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="ml-auto text-xs text-ink-faint hover:text-ink">
            Cancelar selección
          </button>
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="border border-dashed border-line-strong p-6 text-center text-sm text-ink-soft">
          Todavía no hay tareas registradas en este proyecto.
        </p>
      ) : view === "Lista" ? (
        <TaskListView
          tasks={tasks}
          projectId={project.id}
          members={members}
          modules={modules}
          selectedIds={selectedIds}
          onToggleSelect={toggleSelect}
        />
      ) : view === "Calendario" ? (
        <TaskCalendarView tasks={tasks} projectId={project.id} members={members} modules={modules} />
      ) : (
        <div className="space-y-6">
          {groups.withModule.map(({ module, tasks: moduleTasks }) => (
            <div key={module.id}>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: module.color }} />
                <h3 className="font-display text-sm font-semibold text-ink">{module.name}</h3>
                <span className="text-xs text-ink-faint">{moduleTasks.length}</span>
              </div>
              {moduleTasks.length > 0 ? (
                <TaskGroupList
                  tasks={moduleTasks}
                  projectId={project.id}
                  members={members}
                  modules={modules}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelect}
                />
              ) : (
                <p className="text-xs text-ink-faint">Sin tareas todavía.</p>
              )}
            </div>
          ))}

          {(groups.noModule.length > 0 || modules.length === 0) && (
            <div>
              {modules.length > 0 && (
                <h3 className="mb-2 font-display text-sm font-semibold text-ink-soft">Sin módulo</h3>
              )}
              <TaskGroupList
                tasks={groups.noModule}
                projectId={project.id}
                members={members}
                modules={modules}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelect}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
