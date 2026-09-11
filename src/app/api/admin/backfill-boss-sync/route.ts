import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { syncToBoss } from "@/lib/bossSync";

// Se corre una sola vez a mano después de conectar el Panel del Jefe por
// primera vez, para que vea los proyectos/tareas/estados que ya existían
// antes de que la sincronización empezara a andar. De ahí en más, los
// hooks en cada ruta se encargan de mantenerlo al día solos.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.role !== "LEAD") {
    return NextResponse.json({ error: "Solo un líder puede correr el backfill" }, { status: 403 });
  }

  if (!process.env.BOSS_PANEL_URL || !process.env.BOSS_PANEL_SYNC_TOKEN) {
    return NextResponse.json(
      { error: "BOSS_PANEL_URL / BOSS_PANEL_SYNC_TOKEN no están configurados" },
      { status: 400 }
    );
  }

  const statuses = await prisma.statusOption.findMany({ orderBy: { order: "asc" } });
  for (const status of statuses) {
    await syncToBoss("status", "upsert", status);
  }

  const projects = await prisma.project.findMany({ include: { assignee: { select: { name: true } } } });
  for (const project of projects) {
    await syncToBoss("project", "upsert", {
      id: project.id,
      name: project.name,
      description: project.description,
      repoUrl: project.repoUrl,
      deployUrl: project.deployUrl,
      statusId: project.statusId,
      assigneeName: project.assignee?.name ?? null,
    });
  }

  const tasks = await prisma.task.findMany({ include: { assignee: { select: { name: true } }, module: true } });
  for (const task of tasks) {
    await syncToBoss("task", "upsert", {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      type: task.type,
      priority: task.priority,
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      assigneeName: task.assignee?.name ?? null,
      moduleName: task.module?.name ?? null,
    });
  }

  return NextResponse.json({
    ok: true,
    synced: { statuses: statuses.length, projects: projects.length, tasks: tasks.length },
  });
}
