import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId } = await params;
  const { searchParams } = new URL(req.url);
  const skip = Number(searchParams.get("skip") || 0);
  const take = Number(searchParams.get("take") || 20);

  const entries = await prisma.historyEntry.findMany({
    where: { projectId },
    include: { changedBy: { select: { name: true } }, task: { select: { title: true } } },
    orderBy: { changedAt: "desc" },
    skip,
    take,
  });

  return NextResponse.json(entries);
}
