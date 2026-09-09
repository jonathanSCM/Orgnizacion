"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useConfirm } from "@/components/ConfirmDialog";

type StatusOption = { id: string; name: string; color: string; order: number };

function SortableStatusRow({
  status,
  onRemove,
  onSave,
}: {
  status: StatusOption;
  onRemove: (id: string, name: string) => void;
  onSave: (id: string, name: string, color: string) => Promise<void>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: status.id,
  });
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(status.name);
  const [color, setColor] = useState(status.color);
  const [saving, setSaving] = useState(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  async function save() {
    setSaving(true);
    await onSave(status.id, name, color);
    setSaving(false);
    setEditing(false);
  }

  function cancel() {
    setName(status.name);
    setColor(status.color);
    setEditing(false);
  }

  if (editing) {
    return (
      <li ref={setNodeRef} style={style} className="flex items-center gap-2 border border-line bg-card px-3.5 py-2.5">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field !w-auto flex-1 py-1"
          autoFocus
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-8 w-10 border border-line-strong bg-card"
        />
        <button onClick={save} disabled={saving || !name.trim()} className="btn-primary !py-1 !text-xs">
          {saving ? "Guardando..." : "Guardar"}
        </button>
        <button onClick={cancel} className="btn-ghost !py-1 !text-xs">
          Cancelar
        </button>
      </li>
    );
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between border border-line bg-card px-3.5 py-2.5 ${
        isDragging ? "shadow-[3px_3px_0_var(--line-strong)]" : ""
      }`}
    >
      <div className="flex items-center gap-2.5">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none text-ink-faint hover:text-ink active:cursor-grabbing"
          title="Arrastrá para reordenar"
        >
          ⠿
        </button>
        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: status.color }} />
        <span className="text-sm text-ink">{status.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <button onClick={() => setEditing(true)} className="text-xs text-ink-faint hover:text-ink">
          Editar
        </button>
        <button onClick={() => onRemove(status.id, status.name)} className="text-xs text-ink-faint hover:text-rust">
          Borrar
        </button>
      </div>
    </li>
  );
}

export default function StatusManager({ initialStatuses }: { initialStatuses: StatusOption[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [statuses, setStatuses] = useState(initialStatuses);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#b8461c");
  const [error, setError] = useState<string | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function addStatus(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/statuses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, color }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Error al crear el estado");
      return;
    }
    const created = await res.json();
    setStatuses((prev) => [...prev, created]);
    setName("");
    router.refresh();
  }

  async function saveStatus(id: string, newName: string, newColor: string) {
    const res = await fetch(`/api/statuses/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, color: newColor }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "No se pudo guardar el estado");
      return;
    }
    const updated = await res.json();
    setStatuses((prev) => prev.map((s) => (s.id === id ? updated : s)));
    router.refresh();
  }

  async function removeStatus(id: string, name: string) {
    if (!(await confirm(`¿Borrar el estado "${name}"?`))) return;
    const res = await fetch(`/api/statuses/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "No se pudo borrar");
      return;
    }
    setStatuses((prev) => prev.filter((s) => s.id !== id));
    router.refresh();
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = statuses.findIndex((s) => s.id === active.id);
    const newIndex = statuses.findIndex((s) => s.id === over.id);
    const reordered = arrayMove(statuses, oldIndex, newIndex);
    setStatuses(reordered);

    await Promise.all(
      reordered.map((status, index) =>
        fetch(`/api/statuses/${status.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ order: index }),
        })
      )
    );
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={statuses.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-2">
            {statuses.map((status) => (
              <SortableStatusRow key={status.id} status={status} onRemove={removeStatus} onSave={saveStatus} />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <form onSubmit={addStatus} className="flex items-center gap-2">
        <input
          required
          placeholder="Nombre del estado"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field flex-1"
        />
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-10 w-12 border border-line-strong bg-card"
        />
        <button type="submit" className="btn-primary">
          Añadir
        </button>
      </form>

      {error && <p className="text-sm font-medium text-rust">{error}</p>}
    </div>
  );
}
