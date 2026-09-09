"use client";

import { useEffect, useState } from "react";
import type { GithubInfo } from "@/lib/github";

export default function GithubInfoCard({ projectId, repoUrl }: { projectId: string; repoUrl: string }) {
  const [info, setInfo] = useState<GithubInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/projects/${projectId}/github-info`)
      .then(async (res) => {
        if (cancelled) return;
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || "No se pudo cargar la info de GitHub");
          return;
        }
        setInfo(await res.json());
      })
      .catch(() => !cancelled && setError("No se pudo cargar la info de GitHub"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [projectId, repoUrl]);

  if (loading) {
    return <p className="text-xs text-ink-faint">Consultando GitHub...</p>;
  }

  if (error) {
    return <p className="text-xs text-ink-faint">{error}</p>;
  }

  if (!info) return null;

  return (
    <div className="border border-line bg-paper p-3 text-sm">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-ink">{info.fullName}</p>
        <span className="text-xs text-ink-soft">★ {info.stars}</span>
      </div>
      {info.description && <p className="mt-1 text-xs text-ink-soft">{info.description}</p>}
      <div className="mt-2 flex flex-wrap gap-3 text-xs text-ink-faint">
        {info.language && <span>Lenguaje: {info.language}</span>}
        <span>Rama: {info.defaultBranch}</span>
      </div>
      {info.lastCommit && (
        <p className="mt-2 text-xs text-ink-soft">
          Último commit: &quot;{info.lastCommit.message}&quot;
          {info.lastCommit.author ? ` — ${info.lastCommit.author}` : ""}
          {info.lastCommit.date ? ` (${new Date(info.lastCommit.date).toLocaleDateString()})` : ""}
        </p>
      )}
    </div>
  );
}
