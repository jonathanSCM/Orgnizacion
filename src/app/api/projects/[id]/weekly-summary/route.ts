import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateWeeklyDigest } from "@/lib/gemini";
import { checkAndIncrementAiUsage, aiLimitReachedMessage } from "@/lib/aiUsage";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId } = await params;

  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return NextResponse.json({ error: "Proyecto no encontrado" }, { status: 404 });

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const entries = await prisma.historyEntry.findMany({
    where: { projectId, changedAt: { gte: sevenDaysAgo } },
    include: { changedBy: { select: { name: true } }, task: { select: { title: true } } },
    orderBy: { changedAt: "asc" },
  });

  if (entries.length === 0) {
    return NextResponse.json({ error: "No hay actividad registrada en los últimos 7 días" }, { status: 400 });
  }

  const allowed = await checkAndIncrementAiUsage();
  if (!allowed) {
    return NextResponse.json({ error: aiLimitReachedMessage() }, { status: 429 });
  }

  const entriesText = entries
    .map((e) => {
      const who = e.changedBy?.name ?? "Sistema";
      const when = e.changedAt.toISOString();
      const task = e.task?.title ? ` (tarea: ${e.task.title})` : "";
      const change =
        e.oldValue && e.newValue
          ? `de "${e.oldValue}" a "${e.newValue}"`
          : e.newValue
            ? e.newValue
            : e.oldValue
              ? `se quitó "${e.oldValue}"`
              : "";
      return `- [${when}] ${who}: ${e.field}${task} — ${change}`;
    })
    .join("\n");

  const summary = await generateWeeklyDigest(project.name, entriesText);
  if (!summary) {
    return NextResponse.json({ error: "GEMINI_API_KEY no configurada" }, { status: 400 });
  }

  const updated = await prisma.project.update({
    where: { id: projectId },
    data: { lastWeeklySummary: summary, lastWeeklySummaryAt: new Date() },
  });

  return NextResponse.json({
    summary: updated.lastWeeklySummary,
    generatedAt: updated.lastWeeklySummaryAt,
  });
}
