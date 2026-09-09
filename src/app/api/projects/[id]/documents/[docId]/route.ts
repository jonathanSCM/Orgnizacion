import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logHistory } from "@/lib/history";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId, docId } = await params;

  const document = await prisma.document.findUnique({ where: { id: docId } });
  if (!document) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  await prisma.document.delete({ where: { id: docId } });

  await logHistory({
    projectId,
    field: "documento_borrado",
    oldValue: document.filename,
    changedById: session.user.id,
  });

  return NextResponse.json({ ok: true });
}
