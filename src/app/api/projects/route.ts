import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseBody, createProjectSchema } from "@/lib/validation";
import { resolveActor } from "@/lib/apiAuth";

export async function GET(req: Request) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const take = searchParams.get("take") ? Number(searchParams.get("take")) : undefined;
  const skip = searchParams.get("skip") ? Number(searchParams.get("skip")) : undefined;

  const projects = await prisma.project.findMany({
    include: {
      status: true,
      assignee: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
    ...(take ? { take } : {}),
    ...(skip ? { skip } : {}),
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const parsed = parseBody(createProjectSchema, await req.json());
  if ("error" in parsed) return parsed.error;
  const body = parsed.data;

  const firstStatus = await prisma.statusOption.findFirst({ orderBy: { order: "asc" } });
  if (!firstStatus) {
    return NextResponse.json({ error: "No hay estados configurados" }, { status: 400 });
  }

  const project = await prisma.project.create({
    data: {
      name: body.name,
      description: body.description || "",
      repoUrl: body.repoUrl || null,
      statusId: firstStatus.id,
      ownerId: session.user.id,
    },
  });

  return NextResponse.json(project, { status: 201 });
}
