import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createCommentSchema } from "@/lib/validation";
import { resolveActor } from "@/lib/apiAuth";
import { notifyIfOther } from "@/lib/notify";

export async function GET(req: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { taskId } = await params;
  const comments = await prisma.comment.findMany({
    where: { taskId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId, taskId } = await params;
  const parsed = parseBody(createCommentSchema, await req.json());
  if ("error" in parsed) return parsed.error;

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { title: true, assigneeId: true, project: { select: { name: true } } },
  });
  if (!task) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const comment = await prisma.comment.create({
    data: { taskId, authorId: actor.id, body: parsed.data.body },
    include: { author: { select: { id: true, name: true } } },
  });

  await notifyIfOther(task.assigneeId, actor.id, {
    type: "task_comment",
    message: `${actor.name} comentó en "${task.title}" (${task.project.name})`,
    link: `/projects/${projectId}?task=${taskId}`,
  });

  return NextResponse.json(comment, { status: 201 });
}
