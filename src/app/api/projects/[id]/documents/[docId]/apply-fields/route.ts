import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logHistory } from "@/lib/history";
import type { ProjectExtraction } from "@/lib/gemini";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId, docId } = await params;

  const document = await prisma.document.findUnique({ where: { id: docId } });
  if (!document || !document.aiExtractedJson) {
    return NextResponse.json({ error: "El documento no tiene análisis de IA" }, { status: 400 });
  }

  const extraction: ProjectExtraction = JSON.parse(document.aiExtractedJson);
  const project = await prisma.project.findUnique({ where: { id: projectId }, include: { status: true } });
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  const data: Record<string, unknown> = {
    description: extraction.summary || project.description,
    language: extraction.language ?? project.language,
    stack: JSON.stringify(extraction.stack ?? []),
    repoUrl: extraction.repoUrl || project.repoUrl,
    deployUrl: extraction.deployUrl || project.deployUrl,
  };

  if (extraction.suggestedStatus && extraction.suggestedStatus !== project.status.name) {
    const matchingStatus = await prisma.statusOption.findFirst({
      where: { name: extraction.suggestedStatus },
    });
    if (matchingStatus) {
      data.statusId = matchingStatus.id;
      data.statusChangedAt = new Date();
    }
  }

  const updated = await prisma.project.update({ where: { id: projectId }, data, include: { status: true } });

  await logHistory({
    projectId,
    field: "ia_aplico_extraccion",
    newValue: document.filename,
    changedById: session.user.id,
  });

  return NextResponse.json(updated);
}
