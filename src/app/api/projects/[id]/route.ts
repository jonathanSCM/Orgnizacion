import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logHistory } from "@/lib/history";
import { resolveActor } from "@/lib/apiAuth";
import { notifyIfOther } from "@/lib/notify";
import { notifyDiscord, resolveDiscordMention, DISCORD_COLOR } from "@/lib/discord";
import { syncToBoss } from "@/lib/bossSync";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      status: true,
      owner: { select: { name: true, email: true } },
      assignee: { select: { id: true, name: true, email: true } },
      tasks: {
        include: { assignee: { select: { id: true, name: true } }, module: true },
        orderBy: { createdAt: "asc" },
      },
      modules: { orderBy: { order: "asc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
      historyEntries: {
        include: { changedBy: { select: { name: true } }, task: { select: { title: true } } },
        orderBy: { changedAt: "desc" },
      },
    },
  });

  if (!project) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  return NextResponse.json(project);
}

const SIMPLE_TRACKED_FIELDS = ["name", "description", "repoUrl", "deployUrl", "language", "stack"] as const;

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const current = await prisma.project.findUnique({ where: { id }, include: { status: true, assignee: true } });
  if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const data: Record<string, unknown> = {};
  for (const field of SIMPLE_TRACKED_FIELDS) {
    if (field in body) data[field] = body[field];
  }
  if (Array.isArray(body.stack)) data.stack = JSON.stringify(body.stack);

  let newStatus: { id: string; name: string } | null = null;
  if (body.statusId && body.statusId !== current.statusId) {
    newStatus = await prisma.statusOption.findUnique({ where: { id: body.statusId } });
    if (!newStatus) return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    data.statusId = body.statusId;
    data.statusChangedAt = new Date();
  }

  let newAssigneeName: string | null | undefined;
  if ("assigneeId" in body) {
    data.assigneeId = body.assigneeId || null;
    if (body.assigneeId) {
      const assignee = await prisma.user.findUnique({ where: { id: body.assigneeId } });
      newAssigneeName = assignee?.name ?? null;
    } else {
      newAssigneeName = null;
    }
  }

  const updated = await prisma.project.update({ where: { id }, data, include: { status: true, assignee: true } });

  await syncToBoss("project", "upsert", {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    repoUrl: updated.repoUrl,
    deployUrl: updated.deployUrl,
    statusId: updated.statusId,
    assigneeName: updated.assignee?.name ?? null,
  });

  for (const field of SIMPLE_TRACKED_FIELDS) {
    if (field in body) {
      const oldValue = String((current as Record<string, unknown>)[field] ?? "");
      const newValue = String((updated as Record<string, unknown>)[field] ?? "");
      if (oldValue !== newValue) {
        await logHistory({ projectId: id, field, oldValue, newValue, changedById: actor.id });
      }
    }
  }

  if (newStatus) {
    await logHistory({
      projectId: id,
      field: "estado_proyecto",
      oldValue: current.status.name,
      newValue: newStatus.name,
      changedById: actor.id,
    });

    const mentionUserId = await resolveDiscordMention(current.assigneeId);
    await notifyDiscord(id, {
      title: `📌 ${updated.name}`,
      description: `El proyecto pasó de «${current.status.name}» a «${newStatus.name}»`,
      color: DISCORD_COLOR.status,
      mentionUserId,
    });
  }

  if (newAssigneeName !== undefined) {
    await logHistory({
      projectId: id,
      field: "encargado",
      oldValue: current.assignee?.name ?? null,
      newValue: newAssigneeName,
      changedById: actor.id,
    });
    await notifyIfOther(updated.assigneeId, actor.id, {
      type: "project_assigned",
      message: `${actor.name} te asignó como encargado del proyecto "${updated.name}"`,
      link: `/projects/${id}`,
    });

    if (updated.assigneeId) {
      const mentionUserId = await resolveDiscordMention(updated.assigneeId);
      await notifyDiscord(id, {
        title: `👤 ${updated.name}`,
        description: `**${actor.name}** asignó el proyecto a ${updated.assignee?.name ?? "alguien"}`,
        color: DISCORD_COLOR.assigned,
        mentionUserId,
      });
    }
  }

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  await prisma.project.delete({ where: { id } });
  await syncToBoss("project", "delete", { id });
  return NextResponse.json({ ok: true });
}
