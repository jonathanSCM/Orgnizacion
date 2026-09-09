import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logHistory } from "@/lib/history";
import { parseBody, createTaskSchema } from "@/lib/validation";
import { resolveActor } from "@/lib/apiAuth";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId } = await params;
  const parsed = parseBody(createTaskSchema, await req.json());
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const task = await prisma.task.create({
    data: {
      projectId,
      title: body.title,
      description: body.description || "",
      type: body.type || "CAMBIO_PENDIENTE",
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

  return NextResponse.json(task, { status: 201 });
}
