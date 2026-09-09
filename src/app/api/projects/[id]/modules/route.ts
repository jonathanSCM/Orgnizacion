import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logHistory } from "@/lib/history";
import { parseBody, createModuleSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId } = await params;
  const parsed = parseBody(createModuleSchema, await req.json());
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const maxOrder = await prisma.module.aggregate({
    where: { projectId },
    _max: { order: true },
  });

  const module_ = await prisma.module.create({
    data: {
      projectId,
      name: body.name,
      color: body.color || "#56684a",
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  await logHistory({
    projectId,
    field: "modulo_creado",
    newValue: module_.name,
    changedById: session.user.id,
  });

  return NextResponse.json(module_, { status: 201 });
}
