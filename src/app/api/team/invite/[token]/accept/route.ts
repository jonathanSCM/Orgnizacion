import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { parseBody, acceptInviteSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const parsed = parseBody(acceptInviteSchema, await req.json());
  if ("error" in parsed) return parsed.error;
  const { password } = parsed.data;

  const invitation = await prisma.invitation.findUnique({ where: { token } });
  if (!invitation || invitation.acceptedAt || invitation.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invitación inválida o expirada" }, { status: 404 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
  if (existingUser) {
    return NextResponse.json({ error: "Ya existe un usuario con ese email" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.$transaction([
    prisma.user.create({
      data: {
        name: invitation.name,
        email: invitation.email,
        passwordHash,
        role: invitation.role,
      },
    }),
    prisma.invitation.update({ where: { id: invitation.id }, data: { acceptedAt: new Date() } }),
  ]);

  return NextResponse.json({ ok: true });
}
