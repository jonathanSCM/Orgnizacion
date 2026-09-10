import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, updateOwnProfileSchema } from "@/lib/validation";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { discordUserId: true },
  });

  return NextResponse.json(user);
}

// Cada usuario solo puede tocar su propio registro (a diferencia de
// PATCH /api/users/[id], que es para que un LEAD administre roles de otros).
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = parseBody(updateOwnProfileSchema, await req.json());
  if ("error" in parsed) return parsed.error;

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: { discordUserId: parsed.data.discordUserId || null },
    select: { discordUserId: true },
  });

  return NextResponse.json(updated);
}
