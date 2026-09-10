import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logHistory } from "@/lib/history";
import { parseBody, updateDiscordWebhookSchema } from "@/lib/validation";

// Guardar el webhook de Discord de un proyecto queda deliberadamente fuera del
// alcance del token de API (solo sesión de navegador): controla a qué canal
// (y en nombre de quién) llegan los avisos, es más sensible que un repoUrl.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const parsed = parseBody(updateDiscordWebhookSchema, await req.json());
  if ("error" in parsed) return parsed.error;

  const current = await prisma.project.findUnique({ where: { id }, select: { discordWebhookUrl: true } });
  if (!current) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const discordWebhookUrl = parsed.data.discordWebhookUrl || null;
  const updated = await prisma.project.update({
    where: { id },
    data: { discordWebhookUrl },
    select: { discordWebhookUrl: true },
  });

  const wasActive = !!current.discordWebhookUrl;
  const isActive = !!updated.discordWebhookUrl;
  if (wasActive !== isActive || current.discordWebhookUrl !== updated.discordWebhookUrl) {
    await logHistory({
      projectId: id,
      field: "discord_webhook",
      newValue: isActive ? "activado" : "desactivado",
      changedById: session.user.id,
    });
  }

  return NextResponse.json({ discordWebhookUrl: updated.discordWebhookUrl });
}
