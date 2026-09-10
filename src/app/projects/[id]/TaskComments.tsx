"use client";

import { useEffect, useState } from "react";
import { timeAgo } from "@/lib/time";

type Comment = {
  id: string;
  body: string;
  createdAt: string;
  author: { id: string; name: string };
};

export default function TaskComments({ projectId, taskId }: { projectId: string; taskId: string }) {
  const [comments, setComments] = useState<Comment[] | null>(null);
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/tasks/${taskId}/comments`)
      .then((res) => res.json())
      .then(setComments)
      .catch(() => setComments([]));
  }, [projectId, taskId]);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim()) return;
    setSending(true);
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    setSending(false);
    if (res.ok) {
      const created = await res.json();
      setComments((prev) => [...(prev ?? []), created]);
      setBody("");
    }
  }

  return (
    <div className="mt-3 space-y-3 border-t border-line pt-3">
      {comments === null ? (
        <p className="text-xs text-ink-faint">Cargando comentarios...</p>
      ) : comments.length === 0 ? (
        <p className="text-xs text-ink-faint">Todavía no hay comentarios.</p>
      ) : (
        <ul className="space-y-2.5">
          {comments.map((c) => (
            <li key={c.id} className="text-xs">
              <p className="text-ink">{c.body}</p>
              <p className="mt-0.5 text-[11px] text-ink-faint">
                {c.author.name} · {timeAgo(c.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={send} className="flex items-center gap-2">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Escribí un comentario..."
          className="field flex-1 py-1 text-xs"
        />
        <button type="submit" disabled={sending || !body.trim()} className="btn-ghost !py-1 !text-xs">
          {sending ? "..." : "Comentar"}
        </button>
      </form>
    </div>
  );
}
