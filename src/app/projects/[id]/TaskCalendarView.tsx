"use client";

import { useMemo, useState } from "react";
import type { Module, Task, UserRef } from "./types";
import { TASK_TYPE_COLOR } from "./types";
import { TaskRow } from "./TaskRow";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildMonthGrid(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  // lunes = 0 ... domingo = 6
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(year, month, 1 - startOffset);
  return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + i));
}

export default function TaskCalendarView({
  tasks,
  projectId,
  members,
  modules,
}: {
  tasks: Task[];
  projectId: string;
  members: UserRef[];
  modules: Module[];
}) {
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const grid = useMemo(() => buildMonthGrid(year, month), [year, month]);

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of tasks) {
      if (!task.dueDate) continue;
      const key = dateKey(new Date(task.dueDate));
      const list = map.get(key) ?? [];
      list.push(task);
      map.set(key, list);
    }
    return map;
  }, [tasks]);

  const noDueDate = tasks.filter((t) => !t.dueDate);
  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;
  const todayKey = dateKey(new Date());

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-base font-semibold text-ink">
          {MONTH_NAMES[month]} {year}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="btn-ghost !px-2.5 !py-1 !text-xs"
          >
            ←
          </button>
          <button onClick={() => setCursor(new Date())} className="btn-ghost !px-2.5 !py-1 !text-xs">
            Hoy
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="btn-ghost !px-2.5 !py-1 !text-xs"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px border border-line bg-line">
        {WEEKDAYS.map((d) => (
          <div key={d} className="bg-paper px-2 py-1.5 text-center text-[11px] font-semibold text-ink-faint">
            {d}
          </div>
        ))}
        {grid.map((day) => {
          const key = dateKey(day);
          const dayTasks = byDay.get(key) ?? [];
          const inMonth = day.getMonth() === month;
          return (
            <div
              key={key}
              className={`min-h-[80px] bg-card p-1.5 ${inMonth ? "" : "opacity-40"} ${
                key === todayKey ? "ring-1 ring-inset ring-rust" : ""
              }`}
            >
              <p className="mb-1 text-[11px] text-ink-faint">{day.getDate()}</p>
              <div className="space-y-1">
                {dayTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id === selectedTaskId ? null : task.id)}
                    className="flex w-full items-center gap-1 truncate text-left text-[11px] text-ink-soft hover:text-ink"
                  >
                    <span
                      className="h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: TASK_TYPE_COLOR[task.type] }}
                    />
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">Tarea seleccionada</p>
          <ul className="space-y-2.5">
            <TaskRow task={selectedTask} projectId={projectId} members={members} modules={modules} />
          </ul>
        </div>
      )}

      {noDueDate.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 font-display text-sm font-semibold text-ink-soft">Sin fecha límite</h3>
          <ul className="space-y-2.5">
            {noDueDate.map((task) => (
              <TaskRow key={task.id} task={task} projectId={projectId} members={members} modules={modules} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
