import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendToDiscordWebhook, DISCORD_COLOR } from "@/lib/discord";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id }, select: { name: true, discordWebhookUrl: true } });
  if (!project) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!project.discordWebhookUrl) {
    return NextResponse.json({ error: "Este proyecto todavía no tiene un webhook guardado" }, { status: 400 });
  }

  await sendToDiscordWebhook(project.discordWebhookUrl, {
    title: "Mensaje de prueba",
    description: `Esto es una prueba desde el Panel de Organización para el proyecto "${project.name}". Si ves esto, el webhook está bien configurado.`,
    color: DISCORD_COLOR.assigned,
  });

  return NextResponse.json({ ok: true });
}
