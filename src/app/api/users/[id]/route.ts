import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { parseBody } from "@/lib/validation";

const updateRoleSchema = z.object({
  role: z.enum(["LEAD", "MEMBER"]),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  if (session.user.role !== "LEAD") {
    return NextResponse.json({ error: "Solo un líder puede cambiar roles" }, { status: 403 });
  }

  const { id } = await params;
  const parsed = parseBody(updateRoleSchema, await req.json());
  if ("error" in parsed) return parsed.error;
  const { role } = parsed.data;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });

  if (target.role === "LEAD" && role === "MEMBER") {
    const leadCount = await prisma.user.count({ where: { role: "LEAD" } });
    if (leadCount <= 1) {
      return NextResponse.json(
        { error: "No podés quitarle el rol de líder al único líder que queda" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}
