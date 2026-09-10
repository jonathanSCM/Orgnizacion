import { prisma } from "@/lib/prisma";

export async function createNotification(params: {
  userId: string;
  type: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      type: params.type,
      message: params.message,
      link: params.link ?? null,
    },
  });
}

// Evita notificarte a vos mismo cuando vos mismo hacés el cambio.
export async function notifyIfOther(
  targetUserId: string | null | undefined,
  actorId: string,
  params: Omit<Parameters<typeof createNotification>[0], "userId">
) {
  if (!targetUserId || targetUserId === actorId) return;
  await createNotification({ userId: targetUserId, ...params });
}
