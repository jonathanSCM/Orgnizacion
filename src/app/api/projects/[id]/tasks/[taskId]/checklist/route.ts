import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, createChecklistItemSchema } from "@/lib/validation";
import { resolveActor } from "@/lib/apiAuth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { taskId } = await params;
  const items = await prisma.checklistItem.findMany({
    where: { taskId },
    orderBy: { order: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string; taskId: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { taskId } = await params;
  const parsed = parseBody(createChecklistItemSchema, await req.json());
  if ("error" in parsed) return parsed.error;

  const task = await prisma.task.findUnique({ where: { id: taskId }, select: { id: true } });
  if (!task) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const maxOrder = await prisma.checklistItem.aggregate({ where: { taskId }, _max: { order: true } });

  const item = await prisma.checklistItem.create({
    data: {
      taskId,
      text: parsed.data.text,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
