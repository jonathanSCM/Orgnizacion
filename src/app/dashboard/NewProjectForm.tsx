"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function NewProjectForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get("new") === "1") {
      setOpen(true);
      router.replace("/dashboard");
    }
  }, [searchParams, router]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, repoUrl: repoUrl || undefined }),
    });

    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Error al crear el proyecto");
      return;
    }

    const project = await res.json();
    router.push(`/projects/${project.id}`);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        + Nuevo proyecto
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="surface-card max-w-lg space-y-3 p-5">
      <input
        required
        placeholder="Nombre del proyecto"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="field"
      />
      <textarea
        placeholder="Descripción breve (opcional, la IA la puede completar después)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="field"
        rows={2}
      />
      <input
        placeholder="URL del repositorio de GitHub (opcional)"
        value={repoUrl}
        onChange={(e) => setRepoUrl(e.target.value)}
        className="field"
      />

      {error && <p className="text-sm font-medium text-rust">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Creando..." : "Crear proyecto"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-ghost">
          Cancelar
        </button>
      </div>
    </form>
  );
}
