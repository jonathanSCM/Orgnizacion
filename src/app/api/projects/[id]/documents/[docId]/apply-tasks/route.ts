import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logHistory } from "@/lib/history";
import type { MeetingExtraction } from "@/lib/gemini";

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
  if (document.tasksApplied) {
    return NextResponse.json({ error: "Las tareas de este documento ya fueron aplicadas" }, { status: 400 });
  }

  const extraction: MeetingExtraction = JSON.parse(document.aiExtractedJson);

  const created = [];
  for (const suggested of extraction.suggestedTasks ?? []) {
    const task = await prisma.task.create({
      data: {
        projectId,
        title: suggested.title,
        description: suggested.description || "",
        type: suggested.type || "CAMBIO_A_REALIZAR",
        sourceDocumentId: docId,
      },
    });
    created.push(task);
  }

  await prisma.document.update({ where: { id: docId }, data: { tasksApplied: true } });

  await logHistory({
    projectId,
    field: "tareas_generadas_por_ia",
    newValue: `${created.length} tarea(s) desde ${document.filename}`,
    changedById: session.user.id,
  });

  return NextResponse.json({ created });
}
