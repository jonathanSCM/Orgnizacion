"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProjectDetail, ProjectDocument } from "./types";
import type { ProjectExtraction, MeetingExtraction } from "@/lib/gemini";
import AskProject from "./AskProject";
import { useConfirm } from "@/components/ConfirmDialog";

function DocumentCard({ doc, projectId }: { doc: ProjectDocument; projectId: string }) {
  const router = useRouter();
  const confirm = useConfirm();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extraction = doc.aiExtractedJson ? JSON.parse(doc.aiExtractedJson) : null;

  async function applyFields() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/documents/${doc.id}/apply-fields`, {
      method: "POST",
    });
    setBusy(false);
    if (!res.ok) {
      setError("No se pudo aplicar la información al proyecto");
      return;
    }
    router.refresh();
  }

  async function applyTasks() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/documents/${doc.id}/apply-tasks`, {
      method: "POST",
    });
    setBusy(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "No se pudieron crear las tareas");
      return;
    }
    router.refresh();
  }

  async function remove() {
    if (!(await confirm(`¿Borrar el documento "${doc.filename}"?`))) return;
    setBusy(true);
    await fetch(`/api/projects/${projectId}/documents/${doc.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="surface-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{doc.filename}</p>
          <p className="text-xs text-ink-faint">
            {doc.docType === "ACTA_REUNION" ? "Acta / transcripción de reunión" : "Resumen de proyecto"} ·{" "}
            {new Date(doc.uploadedAt).toLocaleString()}
          </p>
        </div>
        <button onClick={remove} disabled={busy} className="text-xs text-ink-faint hover:text-rust">
          Borrar
        </button>
      </div>

      {!doc.aiExtractedJson && (
        <p className="mt-2 text-xs font-medium text-rust">
          {doc.aiError ?? "Sin análisis de IA (configura GEMINI_API_KEY en .env.local para habilitarlo)."}
        </p>
      )}

      {extraction && doc.docType === "RESUMEN_PROYECTO" && (
        <ProjectExtractionPreview
          extraction={extraction}
          onApplyFields={applyFields}
          onApplyTasks={applyTasks}
          busy={busy}
          tasksApplied={doc.tasksApplied}
        />
      )}

      {extraction && doc.docType === "ACTA_REUNION" && (
        <MeetingExtractionPreview
          extraction={extraction}
          onApply={applyTasks}
          busy={busy}
          applied={doc.tasksApplied}
        />
      )}

      {error && <p className="mt-2 text-sm font-medium text-rust">{error}</p>}
    </div>
  );
}

function ProjectExtractionPreview({
  extraction,
  onApplyFields,
  onApplyTasks,
  busy,
  tasksApplied,
}: {
  extraction: ProjectExtraction;
  onApplyFields: () => void;
  onApplyTasks: () => void;
  busy: boolean;
  tasksApplied: boolean;
}) {
  const hasTasks = (extraction.suggestedTasks?.length ?? 0) > 0;

  return (
    <div className="mt-3 space-y-2 border border-line bg-paper p-3 text-sm">
      <p className="text-ink">{extraction.summary}</p>
      {extraction.language && <p className="text-xs text-ink-soft">Lenguaje: {extraction.language}</p>}
      {extraction.stack?.length > 0 && (
        <p className="text-xs text-ink-soft">Stack: {extraction.stack.join(", ")}</p>
      )}
      {extraction.suggestedStatus && (
        <p className="text-xs text-ink-soft">Estado sugerido: {extraction.suggestedStatus}</p>
      )}
      {extraction.repoUrl && <p className="text-xs text-ink-soft">Repo: {extraction.repoUrl}</p>}
      {extraction.deployUrl && <p className="text-xs text-ink-soft">Despliegue: {extraction.deployUrl}</p>}
      {extraction.keyFeatures?.length > 0 && (
        <ul className="list-inside list-disc space-y-0.5 text-xs text-ink-soft">
          {extraction.keyFeatures.map((f, i) => (
            <li key={i}>{f}</li>
          ))}
        </ul>
      )}
      {hasTasks && (
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">
            Pendientes detectados en el documento
          </p>
          <ul className="list-inside list-disc space-y-1 text-xs text-ink-soft">
            {extraction.suggestedTasks.map((t, i) => (
              <li key={i}>
                <span className="font-semibold text-ink">{t.title}</span>
                {t.description ? ` — ${t.description}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-2 pt-1">
        <button onClick={onApplyFields} disabled={busy} className="btn-primary !py-1.5 !text-xs">
          {busy ? "Aplicando..." : "Aplicar info al proyecto"}
        </button>
        {hasTasks && (
          <button onClick={onApplyTasks} disabled={busy || tasksApplied} className="btn-ghost !py-1.5 !text-xs">
            {tasksApplied ? "Tareas ya creadas" : "Crear pendientes en Tareas"}
          </button>
        )}
      </div>
    </div>
  );
}

function MeetingExtractionPreview({
  extraction,
  onApply,
  busy,
  applied,
}: {
  extraction: MeetingExtraction;
  onApply: () => void;
  busy: boolean;
  applied: boolean;
}) {
  return (
    <div className="mt-3 space-y-2 border border-line bg-paper p-3 text-sm">
      <p className="text-ink">{extraction.summary}</p>
      <ul className="list-inside list-disc space-y-1 text-xs text-ink-soft">
        {extraction.suggestedTasks?.map((t, i) => (
          <li key={i}>
            <span className="font-semibold text-ink">{t.title}</span>
            {t.description ? ` — ${t.description}` : ""}
          </li>
        ))}
      </ul>
      <button onClick={onApply} disabled={busy || applied} className="btn-primary mt-1 !py-1.5 !text-xs">
        {applied ? "Tareas ya creadas" : busy ? "Creando tareas..." : "Crear tareas en el tablero"}
      </button>
    </div>
  );
}

export default function DocumentsTab({ project }: { project: ProjectDetail }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<"RESUMEN_PROYECTO" | "ACTA_REUNION">("RESUMEN_PROYECTO");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError(null);
    setNotice(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("docType", docType);

    const res = await fetch(`/api/projects/${project.id}/documents`, {
      method: "POST",
      body: formData,
    });

    setUploading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Error al subir el documento");
      return;
    }

    const body = await res.json();
    if (body.aiError) setNotice(body.aiError);
    setFile(null);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <AskProject project={project} />

      <form onSubmit={handleUpload} className="surface-card space-y-3 p-4">
        <div className="flex gap-5 text-sm">
          <label className="flex items-center gap-2 text-ink-soft">
            <input
              type="radio"
              checked={docType === "RESUMEN_PROYECTO"}
              onChange={() => setDocType("RESUMEN_PROYECTO")}
              className="accent-rust"
            />
            Resumen / spec del proyecto
          </label>
          <label className="flex items-center gap-2 text-ink-soft">
            <input
              type="radio"
              checked={docType === "ACTA_REUNION"}
              onChange={() => setDocType("ACTA_REUNION")}
              className="accent-rust"
            />
            Acta / transcripción de reunión
          </label>
        </div>

        <input
          type="file"
          accept=".pdf,.md,.txt"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="block w-full text-sm text-ink-soft file:mr-3 file:border file:border-line-strong file:bg-paper file:px-3 file:py-1.5 file:text-ink"
        />

        <button type="submit" disabled={!file || uploading} className="btn-primary">
          {uploading ? "Analizando con IA..." : "Subir y analizar"}
        </button>

        {notice && <p className="text-sm font-medium text-moss">{notice}</p>}
        {error && <p className="text-sm font-medium text-rust">{error}</p>}
      </form>

      <div className="space-y-4">
        {project.documents.map((doc) => (
          <DocumentCard key={doc.id} doc={doc} projectId={project.id} />
        ))}
        {project.documents.length === 0 && (
          <p className="border border-dashed border-line-strong p-6 text-center text-sm text-ink-soft">
            Todavía no se subieron documentos.
          </p>
        )}
      </div>
    </div>
  );
}
