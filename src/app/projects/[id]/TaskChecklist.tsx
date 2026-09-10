"use client";

import { useEffect, useState } from "react";
import type { ChecklistItem } from "./types";

export default function TaskChecklist({ projectId, taskId }: { projectId: string; taskId: string }) {
  const [items, setItems] = useState<ChecklistItem[] | null>(null);
  const [text, setText] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/tasks/${taskId}/checklist`)
      .then((res) => res.json())
      .then(setItems)
      .catch(() => setItems([]));
  }, [projectId, taskId]);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setAdding(true);
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/checklist`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    setAdding(false);
    if (res.ok) {
      const created = await res.json();
      setItems((prev) => [...(prev ?? []), created]);
      setText("");
    }
  }

  async function toggle(item: ChecklistItem) {
    setItems((prev) => prev!.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i)));
    await fetch(`/api/projects/${projectId}/tasks/${taskId}/checklist/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ done: !item.done }),
    });
  }

  async function remove(id: string) {
    setItems((prev) => prev!.filter((i) => i.id !== id));
    await fetch(`/api/projects/${projectId}/tasks/${taskId}/checklist/${id}`, { method: "DELETE" });
  }

  const done = items?.filter((i) => i.done).length ?? 0;

  return (
    <div className="mt-3 space-y-2.5 border-t border-line pt-3">
      {items === null ? (
        <p className="text-xs text-ink-faint">Cargando checklist...</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-ink-faint">Todavía no hay ítems.</p>
      ) : (
        <>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            {done}/{items.length} completados
          </p>
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li key={item.id} className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={item.done}
                  onChange={() => toggle(item)}
                  className="h-3.5 w-3.5 shrink-0 accent-rust"
                />
                <span className={`flex-1 text-ink ${item.done ? "text-ink-faint line-through" : ""}`}>
                  {item.text}
                </span>
                <button onClick={() => remove(item.id)} className="text-ink-faint hover:text-rust">
                  ×
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
      <form onSubmit={add} className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Agregar ítem..."
          className="field flex-1 py-1 text-xs"
        />
        <button type="submit" disabled={adding || !text.trim()} className="btn-ghost !py-1 !text-xs">
          {adding ? "..." : "Añadir"}
        </button>
      </form>
    </div>
  );
}
