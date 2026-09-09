import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import NewProjectForm from "./NewProjectForm";
import ProjectsOverview from "./ProjectsOverview";
import { PROJECTS_PAGE_SIZE } from "./types";

export default async function DashboardPage() {
  const session = await requireSession();

  const [projectsPlusOne, statuses] = await Promise.all([
    prisma.project.findMany({
      include: {
        status: true,
        assignee: { select: { id: true, name: true } },
        _count: { select: { tasks: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: PROJECTS_PAGE_SIZE + 1,
    }),
    prisma.statusOption.findMany({ orderBy: { order: "asc" } }),
  ]);

  const hasMore = projectsPlusOne.length > PROJECTS_PAGE_SIZE;
  const projects = projectsPlusOne.slice(0, PROJECTS_PAGE_SIZE);

  return (
    <div>
      <Navbar userName={session.user.name ?? session.user.email ?? ""} />

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">Proyectos</h1>
        </div>
        <p className="mb-7 text-sm text-ink-soft">
          Arrastra un proyecto entre columnas para actualizar su estado.
        </p>

        <NewProjectForm />

        <div className="mt-9">
          <ProjectsOverview projects={projects} statuses={statuses} initialHasMore={hasMore} />
        </div>
      </main>
    </div>
  );
}
