import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logHistory } from "@/lib/history";
import { parseBody, createTaskSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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
    changedById: session.user.id,
  });

  return NextResponse.json(task, { status: 201 });
}
