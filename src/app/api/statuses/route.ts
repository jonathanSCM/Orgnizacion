import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, createStatusSchema } from "@/lib/validation";

export async function GET() {
  const statuses = await prisma.statusOption.findMany({ orderBy: { order: "asc" } });
  return NextResponse.json(statuses);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = parseBody(createStatusSchema, await req.json());
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const maxOrder = await prisma.statusOption.aggregate({ _max: { order: true } });

  const status = await prisma.statusOption.create({
    data: {
      name: body.name,
      color: body.color || "#64748b",
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(status, { status: 201 });
}
