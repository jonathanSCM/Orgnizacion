"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectDetail, StatusOption, UserRef } from "./types";
import GithubInfoCard from "./GithubInfoCard";
import DiscordWebhookSection from "./DiscordWebhookSection";
import { useConfirm } from "@/components/ConfirmDialog";

export default function OverviewTab({
  project,
  statuses,
}: {
  project: ProjectDetail;
  statuses: StatusOption[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const [description, setDescription] = useState(project.description);
  const [repoUrl, setRepoUrl] = useState(project.repoUrl ?? "");
  const [deployUrl, setDeployUrl] = useState(project.deployUrl ?? "");
  const [language, setLanguage] = useState(project.language ?? "");
  const [statusId, setStatusId] = useState(project.statusId);
  const [assigneeId, setAssigneeId] = useState(project.assigneeId ?? "");
  const [members, setMembers] = useState<UserRef[]>([]);
  const [stack, setStack] = useState<string[]>(() => {
    try {
      return JSON.parse(project.stack);
    } catch {
      return [];
    }
  });
  const [stackInput, setStackInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((res) => res.json())
      .then(setMembers)
      .catch(() => {});
  }, []);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description,
        repoUrl: repoUrl || null,
        deployUrl: deployUrl || null,
        language: language || null,
        stack,
        statusId,
        assigneeId: assigneeId || null,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setError("Error al guardar");
      return;
    }
    router.refresh();
  }

  async function deleteProject() {
    if (!(await confirm(`¿Borrar el proyecto "${project.name}"? Esta acción no se puede deshacer.`))) return;
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (res.ok) router.push("/dashboard");
  }

  function addStackItem() {
    const value = stackInput.trim();
    if (!value) return;
    setStack((prev) => [...prev, value]);
    setStackInput("");
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Estado</label>
          <select value={statusId} onChange={(e) => setStatusId(e.target.value)} className="field">
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Encargado</label>
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} className="field">
            <option value="">Sin encargado</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="field"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
          Link de despliegue (donde está corriendo el proyecto)
        </label>
        <input
          value={deployUrl}
          onChange={(e) => setDeployUrl(e.target.value)}
          placeholder="https://app.miempresa.com"
          className="field"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Repositorio de GitHub</label>
        <input
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          placeholder="https://github.com/usuario/repo"
          className="field"
        />
        {project.repoUrl && (
          <div className="pt-2">
            <GithubInfoCard projectId={project.id} repoUrl={project.repoUrl} />
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Lenguaje principal</label>
        <input
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          placeholder="Ej: TypeScript"
          className="field"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Stack / tecnologías</label>
        <div className="flex flex-wrap gap-2">
          {stack.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="tag border border-line-strong bg-paper text-ink-soft"
            >
              {item}
              <button onClick={() => setStack((prev) => prev.filter((_, idx) => idx !== i))} className="ml-1.5">
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 pt-1">
          <input
            value={stackInput}
            onChange={(e) => setStackInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addStackItem();
              }
            }}
            placeholder="Ej: Next.js"
            className="field flex-1"
          />
          <button onClick={addStackItem} type="button" className="btn-ghost">
            Añadir
          </button>
        </div>
      </div>

      {error && <p className="text-sm font-medium text-rust">{error}</p>}

      <div className="flex items-center justify-between border-t border-line pt-5">
        <button onClick={save} disabled={saving} className="btn-primary">
          {saving ? "Guardando..." : "Guardar cambios"}
        </button>
        <button onClick={deleteProject} className="text-sm text-ink-faint hover:text-rust">
          Borrar proyecto
        </button>
      </div>

      <div className="border-t border-line pt-5">
        <DiscordWebhookSection projectId={project.id} initialWebhookUrl={project.discordWebhookUrl} />
      </div>

      <p className="text-xs text-ink-faint">
        Creado por {project.owner.name} ({project.owner.email})
      </p>
    </div>
  );
}
