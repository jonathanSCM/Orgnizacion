import { prisma } from "@/lib/prisma";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

export function getDailyAiLimit(): number {
  const raw = process.env.GEMINI_DAILY_LIMIT;
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 200;
}

/**
 * Registra un intento de uso de IA para el día de hoy. Devuelve `false` (sin incrementar)
 * si ya se alcanzó el tope diario configurable (GEMINI_DAILY_LIMIT).
 */
export async function checkAndIncrementAiUsage(): Promise<boolean> {
  const limit = getDailyAiLimit();
  const day = todayKey();

  const current = await prisma.aiUsageLog.findUnique({ where: { day } });
  if (current && current.count >= limit) return false;

  await prisma.aiUsageLog.upsert({
    where: { day },
    update: { count: { increment: 1 } },
    create: { day, count: 1 },
  });

  return true;
}

export function aiLimitReachedMessage(): string {
  return `Límite diario de solicitudes de IA alcanzado (${getDailyAiLimit()}). Se reinicia mañana.`;
}
