"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

type Project = { id: string; name: string; status: { name: string; color: string } };

type Item =
  | { kind: "command"; id: string; label: string; hint?: string; run: () => void }
  | { kind: "project"; id: string; label: string; hint: string; color: string; run: () => void };

export default function CommandPalette() {
  const { status } = useSession();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        close();
      }
    }
    function handleOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("open-command-palette", handleOpenEvent);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("open-command-palette", handleOpenEvent);
    };
  }, [status, close]);

  useEffect(() => {
    if (open) {
      fetch("/api/projects")
        .then((res) => res.json())
        .then(setProjects)
        .catch(() => {});
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  if (status !== "authenticated") return null;

  const commands: Item[] = [
    { kind: "command", id: "dashboard", label: "Ir a Proyectos", run: () => router.push("/dashboard") },
    { kind: "command", id: "statuses", label: "Ir a Estados", run: () => router.push("/settings/statuses") },
    { kind: "command", id: "team", label: "Ir a Equipo", run: () => router.push("/settings/team") },
    { kind: "command", id: "new", label: "Nuevo proyecto", run: () => router.push("/dashboard?new=1") },
  ];

  const projectItems: Item[] = projects.map((p) => ({
    kind: "project",
    id: p.id,
    label: p.name,
    hint: p.status.name,
    color: p.status.color,
    run: () => router.push(`/projects/${p.id}`),
  }));

  const q = query.trim().toLowerCase();
  const filtered = [...commands, ...projectItems].filter((item) =>
    q ? item.label.toLowerCase().includes(q) : true
  );

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[activeIndex];
      if (item) {
        item.run();
        close();
      }
    }
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 pt-[15vh]"
          onClick={close}
        >
          <div
            className="w-full max-w-lg border border-line bg-card shadow-[4px_4px_0_var(--line-strong)]"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setActiveIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Buscar proyectos o comandos..."
              className="w-full border-b border-line bg-transparent px-4 py-3 text-sm text-ink outline-none placeholder:text-ink-faint"
            />
            <ul className="max-h-80 overflow-y-auto py-1">
              {filtered.length === 0 && (
                <li className="px-4 py-3 text-sm text-ink-faint">Sin resultados.</li>
              )}
              {filtered.map((item, i) => (
                <li key={`${item.kind}-${item.id}`}>
                  <button
                    onMouseEnter={() => setActiveIndex(i)}
                    onClick={() => {
                      item.run();
                      close();
                    }}
                    className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${
                      i === activeIndex ? "bg-rust/10 text-ink" : "text-ink-soft"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {item.kind === "project" && (
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                      )}
                      {item.label}
                    </span>
                    {item.kind === "project" && <span className="text-xs text-ink-faint">{item.hint}</span>}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t border-line px-4 py-2 text-[11px] text-ink-faint">
              <span>↑↓ navegar · ↵ ir · esc cerrar</span>
              <span>⌘K</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
