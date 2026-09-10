import { prisma } from "@/lib/prisma";

export const DISCORD_COLOR = {
  created: 0xb8461c,
  done: 0x56684a,
  assigned: 0x35506b,
  comment: 0x9a8f7a,
  status: 0x35506b,
};

// Manda un aviso al webhook de Discord del proyecto (si tiene uno configurado).
// No-op silencioso si el proyecto no tiene webhook, o si Discord no responde —
// nunca debe hacer fallar la acción que lo disparó (mismo criterio que sendEmail
// en src/lib/mailer.ts).
export async function notifyDiscord(
  projectId: string,
  params: {
    title: string;
    description: string;
    color?: number;
    mentionUserId?: string | null;
    file?: { buffer: Buffer; filename: string };
  }
) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { discordWebhookUrl: true },
  });
  if (!project?.discordWebhookUrl) return;

  await sendToDiscordWebhook(project.discordWebhookUrl, params);
}

// La mención en Discord solo dispara notificación real si va en "content",
// no dentro de un embed (aunque se vea igual, ahí no pinguea a nadie).
export async function sendToDiscordWebhook(
  webhookUrl: string,
  params: {
    title: string;
    description: string;
    color?: number;
    mentionUserId?: string | null;
    file?: { buffer: Buffer; filename: string };
  }
) {
  const payload = {
    content: params.mentionUserId ? `<@${params.mentionUserId}>` : undefined,
    embeds: [
      {
        title: params.title,
        description: params.description,
        color: params.color ?? DISCORD_COLOR.created,
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const request = params.file
    ? sendWithFile(webhookUrl, payload, params.file)
    : fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

  await request
    .then(async (res) => {
      if (!res.ok) {
        console.error(`[discord] webhook respondió ${res.status}: ${await res.text().catch(() => "")}`);
      }
    })
    .catch((err) => console.error("[discord] error enviando notificación:", err));
}

function sendWithFile(
  webhookUrl: string,
  payload: unknown,
  file: { buffer: Buffer; filename: string }
) {
  const form = new FormData();
  form.append("payload_json", JSON.stringify(payload));
  form.append("files[0]", new Blob([new Uint8Array(file.buffer)]), file.filename);
  return fetch(webhookUrl, { method: "POST", body: form });
}

// Devuelve el discordUserId del primer candidato que tenga uno cargado
// (orden de prioridad: el que se pasa primero gana), o null si ninguno.
export async function resolveDiscordMention(
  ...userIds: (string | null | undefined)[]
): Promise<string | null> {
  const ids = userIds.filter((id): id is string => !!id);
  if (ids.length === 0) return null;

  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, discordUserId: true },
  });
  const byId = new Map(users.map((u) => [u.id, u.discordUserId]));

  for (const id of ids) {
    const discordId = byId.get(id);
    if (discordId) return discordId;
  }
  return null;
}
