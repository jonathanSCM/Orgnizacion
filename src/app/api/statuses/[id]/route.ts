import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, updateStatusSchema } from "@/lib/validation";
import { syncToBoss } from "@/lib/bossSync";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const parsed = parseBody(updateStatusSchema, await req.json());
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const status = await prisma.statusOption.update({
    where: { id },
    data: {
      name: body.name,
      color: body.color,
      order: body.order,
    },
  });

  await syncToBoss("status", "upsert", status);

  return NextResponse.json(status);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;

  const projectCount = await prisma.project.count({ where: { statusId: id } });

  if (projectCount > 0) {
    return NextResponse.json(
      { error: "No se puede borrar un estado en uso por proyectos" },
      { status: 400 }
    );
  }

  await prisma.statusOption.delete({ where: { id } });
  await syncToBoss("status", "delete", { id });
  return NextResponse.json({ ok: true });
}
