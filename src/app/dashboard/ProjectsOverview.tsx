"use client";

import { useMemo, useState } from "react";
import ProjectsBoard from "./ProjectsBoard";
import type { DashboardProject, DashboardStatus } from "./types";
import { PROJECTS_PAGE_SIZE } from "./types";

export default function ProjectsOverview({
  projects,
  statuses,
  initialHasMore,
}: {
  projects: DashboardProject[];
  statuses: DashboardStatus[];
  initialHasMore: boolean;
}) {
  const [query, setQuery] = useState("");
  const [allProjects, setAllProjects] = useState(projects);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loadingMore, setLoadingMore] = useState(false);

  const filtered = useMemo(() => {
    if (!query.trim()) return allProjects;
    return allProjects.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  }, [allProjects, query]);

  async function loadMore() {
    setLoadingMore(true);
    const res = await fetch(`/api/projects?skip=${allProjects.length}&take=${PROJECTS_PAGE_SIZE + 1}`);
    const page: DashboardProject[] = await res.json();
    setLoadingMore(false);
    setHasMore(page.length > PROJECTS_PAGE_SIZE);
    setAllProjects((prev) => [...prev, ...page.slice(0, PROJECTS_PAGE_SIZE)]);
  }

  return (
    <div>
      {allProjects.length > 0 && (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar proyecto por nombre... (entre los ya cargados)"
          className="field mb-7 max-w-xs"
        />
      )}
      <ProjectsBoard key={query} projects={filtered} statuses={statuses} />
      {hasMore && !query && (
        <div className="mt-4 flex justify-center">
          <button onClick={loadMore} disabled={loadingMore} className="btn-ghost">
            {loadingMore ? "Cargando..." : "Cargar más proyectos"}
          </button>
        </div>
      )}
    </div>
  );
}
