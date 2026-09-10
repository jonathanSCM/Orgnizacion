import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { parseBody, updateChecklistItemSchema } from "@/lib/validation";
import { resolveActor } from "@/lib/apiAuth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; taskId: string; itemId: string }> }
) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { itemId } = await params;
  const parsed = parseBody(updateChecklistItemSchema, await req.json());
  if ("error" in parsed) return parsed.error;

  const item = await prisma.checklistItem.update({
    where: { id: itemId },
    data: parsed.data,
  });

  return NextResponse.json(item);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string; taskId: string; itemId: string }> }
) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { itemId } = await params;
  await prisma.checklistItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
