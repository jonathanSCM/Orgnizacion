import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logHistory } from "@/lib/history";
import { parseBody, createTaskSchema } from "@/lib/validation";
import { resolveActor } from "@/lib/apiAuth";
import { notifyIfOther } from "@/lib/notify";
import { notifyDiscord, resolveDiscordMention, DISCORD_COLOR } from "@/lib/discord";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId } = await params;
  const parsed = parseBody(createTaskSchema, await req.json());
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { name: true, assigneeId: true },
  });
  if (!project) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const task = await prisma.task.create({
    data: {
      projectId,
      title: body.title,
      description: body.description || "",
      type: body.type || "CAMBIO_PENDIENTE",
      priority: body.priority || "MEDIA",
      assigneeId: body.assigneeId || null,
      moduleId: body.moduleId || null,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    },
    include: { assignee: { select: { id: true, name: true } }, module: true },
  });

  await logHistory({
    projectId,
    taskId: task.id,
    field: "tarea_creada",
    newValue: task.title,
    changedById: actor.id,
  });

  await notifyIfOther(task.assigneeId, actor.id, {
    type: "task_assigned",
    message: `${actor.name} te asignó la tarea "${task.title}" en ${project.name}`,
    link: `/projects/${projectId}?task=${task.id}`,
  });

  const mentionUserId = await resolveDiscordMention(task.assigneeId);
  await notifyDiscord(projectId, {
    title: `🆕 Tarea creada en ${project.name}`,
    description: `**${actor.name}** creó la tarea «${task.title}»${
      task.assignee ? ` — asignada a ${task.assignee.name}` : ""
    }`,
    color: DISCORD_COLOR.created,
    mentionUserId,
  });

  return NextResponse.json(task, { status: 201 });
}
