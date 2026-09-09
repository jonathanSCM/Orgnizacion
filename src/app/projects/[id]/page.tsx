import { notFound } from "next/navigation";
import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { timeAgo } from "@/lib/time";
import Navbar from "@/components/Navbar";
import ProjectTabs from "./ProjectTabs";
import CopyProjectAiInfo from "./CopyProjectAiInfo";
import { HISTORY_PAGE_SIZE } from "./types";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireSession();
  const { id } = await params;

  const [project, statuses] = await Promise.all([
    prisma.project.findUnique({
      where: { id },
      include: {
        status: true,
        owner: { select: { name: true, email: true } },
        assignee: { select: { id: true, name: true } },
        tasks: {
          include: { assignee: { select: { id: true, name: true } }, module: true },
          orderBy: { createdAt: "asc" },
        },
        modules: { orderBy: { order: "asc" } },
        documents: { orderBy: { uploadedAt: "desc" } },
        historyEntries: {
          include: { changedBy: { select: { name: true } }, task: { select: { title: true } } },
          orderBy: { changedAt: "desc" },
          take: HISTORY_PAGE_SIZE + 1,
        },
      },
    }),
    prisma.statusOption.findMany({ orderBy: { order: "asc" } }),
  ]);

  if (!project) notFound();

  const historyHasMore = project.historyEntries.length > HISTORY_PAGE_SIZE;
  project.historyEntries = project.historyEntries.slice(0, HISTORY_PAGE_SIZE);

  return (
    <div>
      <Navbar userName={session.user.name ?? session.user.email ?? ""} />
      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-7 flex items-start justify-between border-b border-line pb-6">
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">{project.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
              {project.deployUrl && (
                <a
                  href={project.deployUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-moss hover:underline"
                >
                  ↗ Ver despliegue
                </a>
              )}
              {project.repoUrl && (
                <a href={project.repoUrl} target="_blank" rel="noreferrer" className="text-ink-soft hover:text-ink">
                  {project.repoUrl}
                </a>
              )}
            </div>
            <div className="mt-2">
              <CopyProjectAiInfo projectId={project.id} projectName={project.name} />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span
              className="tag text-card"
              style={{ backgroundColor: project.status.color }}
            >
              {project.status.name}
            </span>
            <span className="text-xs text-ink-faint">
              en este estado desde {timeAgo(project.statusChangedAt)}
            </span>
            <span className="text-xs text-ink-faint">
              Encargado: {project.assignee ? project.assignee.name : "sin asignar"}
            </span>
          </div>
        </div>

        <ProjectTabs project={project} statuses={statuses} historyHasMore={historyHasMore} />
      </main>
    </div>
  );
}
