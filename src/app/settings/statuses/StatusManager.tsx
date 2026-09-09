"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useConfirm } from "@/components/ConfirmDialog";

type StatusOption = { id: string; name: string; color: string; order: number };

export default function StatusManager({ initialStatuses }: { initialStatuses: StatusOption[] }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [statuses, setStatuses] = useState(initialStatuses);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#b8461c");
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <ul className="space-y-2">
        {statuses.map((status) => (
          <li
            key={status.id}
            className="flex items-center justify-between border border-line bg-card px-3.5 py-2.5"
          >
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: status.color }} />
              <span className="text-sm text-ink">{status.name}</span>
            </div>
            <button
              onClick={() => removeStatus(status.id, status.name)}
              className="text-xs text-ink-faint hover:text-rust"
            >
              Borrar
            </button>
          </li>
        ))}
      </ul>

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
