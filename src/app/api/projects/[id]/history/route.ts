import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { logHistory } from "@/lib/history";
import { parseBody, createUpdateNoteSchema } from "@/lib/validation";
import { resolveActor } from "@/lib/apiAuth";
import { notifyDiscord, resolveDiscordMention, DISCORD_COLOR } from "@/lib/discord";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

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

// Permite dejar una actualización de texto libre en el historial del proyecto
// (usado por el botón "Añadir actualización" y por el acceso de API personal).
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await resolveActor(req);
  if (!actor) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId } = await params;
  const parsed = parseBody(createUpdateNoteSchema, await req.json());
  if ("error" in parsed) return parsed.error;

  const entry = await logHistory({
    projectId,
    field: "actualizacion",
    newValue: parsed.data.note,
    changedById: actor.id,
  });

  const project = await prisma.project.findUnique({ where: { id: projectId }, select: { name: true, assigneeId: true } });
  if (project) {
    const mentionUserId = await resolveDiscordMention(project.assigneeId);
    await notifyDiscord(projectId, {
      title: `📝 ${project.name}`,
      description: `**${actor.name}**: ${parsed.data.note}`,
      color: DISCORD_COLOR.status,
      mentionUserId,
    });
  }

  return NextResponse.json(entry, { status: 201 });
}
