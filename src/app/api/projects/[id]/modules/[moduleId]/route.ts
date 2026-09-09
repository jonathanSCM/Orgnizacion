import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logHistory } from "@/lib/history";
import { parseBody, updateModuleSchema } from "@/lib/validation";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { moduleId } = await params;
  const parsed = parseBody(updateModuleSchema, await req.json());
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const module_ = await prisma.module.update({
    where: { id: moduleId },
    data: {
      name: body.name,
      color: body.color,
      order: body.order,
    },
  });

  return NextResponse.json(module_);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; moduleId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId, moduleId } = await params;

  const module_ = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module_) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.module.delete({ where: { id: moduleId } });

  await logHistory({
    projectId,
    field: "modulo_borrado",
    oldValue: module_.name,
    changedById: session.user.id,
  });

  return NextResponse.json({ ok: true });
}
