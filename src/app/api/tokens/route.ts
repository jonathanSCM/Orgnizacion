import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateApiToken } from "@/lib/apiToken";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const token = await prisma.apiToken.findFirst({
    where: { userId: session.user.id },
    select: { id: true, tokenLast4: true, createdAt: true, lastUsedAt: true },
  });

  return NextResponse.json({ token });
}

// Genera un token nuevo (y revoca el anterior si existía): solo puede haber
// un token activo por usuario. El valor en texto plano solo se devuelve acá,
// una única vez — después solo se guarda su hash.
export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { token, tokenHash, tokenLast4 } = generateApiToken();

  await prisma.apiToken.deleteMany({ where: { userId: session.user.id } });
  const created = await prisma.apiToken.create({
    data: { userId: session.user.id, tokenHash, tokenLast4 },
    select: { id: true, tokenLast4: true, createdAt: true, lastUsedAt: true },
  });

  return NextResponse.json({ token: created, plainToken: token }, { status: 201 });
}

export async function DELETE() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  await prisma.apiToken.deleteMany({ where: { userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
