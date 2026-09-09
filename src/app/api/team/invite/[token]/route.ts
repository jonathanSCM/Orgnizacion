import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invitación inválida o expirada" }, { status: 404 });
  }

  return NextResponse.json({ name: invitation.name, email: invitation.email, role: invitation.role });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { token } = await params;
  await prisma.invitation.deleteMany({ where: { token } });
  return NextResponse.json({ ok: true });
}
