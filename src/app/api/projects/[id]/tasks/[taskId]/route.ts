import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logHistory } from "@/lib/history";
import { parseBody, updateTaskSchema } from "@/lib/validation";
import { resolveActor } from "@/lib/apiAuth";
import { notifyIfOther } from "@/lib/notify";

const TASK_TYPE_LABEL: Record<string, string> = {
  CAMBIO_NECESARIO: "Cambio necesario",
  CAMBIO_A_REALIZAR: "Cambio a realizar",
  CAMBIO_REALIZADO: "Cambio realizado",
  CAMBIO_PENDIENTE: "Cambio pendiente",
};

const TASK_PRIORITY_LABEL: Record<string, string> = {
  URGENTE: "Urgente",
  ALTA: "Alta",
  MEDIA: "Media",
  BAJA: "Baja",
};

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId, taskId } = await params;
  const parsed = parseBody(updateTaskSchema, await req.json());
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const current = await prisma.task.findUnique({
    where: { id: taskId },
    include: { assignee: true, module: true, project: { select: { name: true } } },
  });
  if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const data: Record<string, unknown> = {};
  const raw = body as Record<string, unknown>;
  for (const field of ["title", "description", "type", "priority"]) {
    if (field in raw) data[field] = raw[field];
  }
  if ("assigneeId" in body) data.assigneeId = body.assigneeId || null;
  if ("moduleId" in body) data.moduleId = body.moduleId || null;
  if ("dueDate" in body) data.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: { assignee: { select: { id: true, name: true } }, module: true },
  });

  if (body.type && body.type !== current.type) {
    await logHistory({
      projectId,
      taskId,
      field: "tipo_tarea",
      oldValue: TASK_TYPE_LABEL[current.type] ?? current.type,
      newValue: TASK_TYPE_LABEL[updated.type] ?? updated.type,
      changedById: actor.id,
    });
  }

  if (body.priority && body.priority !== current.priority) {
    await logHistory({
      projectId,
      taskId,
      field: "prioridad_tarea",
      oldValue: TASK_PRIORITY_LABEL[current.priority] ?? current.priority,
      newValue: TASK_PRIORITY_LABEL[updated.priority] ?? updated.priority,
      changedById: actor.id,
    });
  }

  if ("assigneeId" in body && body.assigneeId !== current.assigneeId) {
    await logHistory({
      projectId,
      taskId,
      field: "encargado_tarea",
      oldValue: current.assignee?.name ?? null,
      newValue: updated.assignee?.name ?? null,
      changedById: actor.id,
    });
    await notifyIfOther(updated.assigneeId, actor.id, {
      type: "task_assigned",
      message: `${actor.name} te asignó la tarea "${updated.title}" en ${current.project.name}`,
      link: `/projects/${projectId}?task=${taskId}`,
    });
  }

  if ("moduleId" in body && body.moduleId !== current.moduleId) {
    await logHistory({
      projectId,
      taskId,
      field: "modulo_tarea",
      oldValue: current.module?.name ?? null,
      newValue: updated.module?.name ?? null,
      changedById: actor.id,
    });
  }

  const currentDue = current.dueDate?.toISOString().slice(0, 10) ?? null;
  const updatedDue = updated.dueDate?.toISOString().slice(0, 10) ?? null;
  if ("dueDate" in body && currentDue !== updatedDue) {
    await logHistory({
      projectId,
      taskId,
      field: "fecha_limite_tarea",
      oldValue: currentDue,
      newValue: updatedDue,
      changedById: actor.id,
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { taskId } = await params;
  await prisma.task.delete({ where: { id: taskId } });
  return NextResponse.json({ ok: true });
}
