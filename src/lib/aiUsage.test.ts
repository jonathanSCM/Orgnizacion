import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkAndIncrementAiUsage, getDailyAiLimit } from "./aiUsage";
import { prisma } from "./prisma";

describe("aiUsage", () => {
  const originalLimit = process.env.GEMINI_DAILY_LIMIT;

  beforeEach(async () => {
    await prisma.aiUsageLog.deleteMany({});
  });

  afterEach(async () => {
    await prisma.aiUsageLog.deleteMany({});
    process.env.GEMINI_DAILY_LIMIT = originalLimit;
  });

  it("permite solicitudes por debajo del límite", async () => {
    process.env.GEMINI_DAILY_LIMIT = "3";
    expect(await checkAndIncrementAiUsage()).toBe(true);
    expect(await checkAndIncrementAiUsage()).toBe(true);
    expect(await checkAndIncrementAiUsage()).toBe(true);
  });

  it("bloquea al alcanzar el límite diario", async () => {
    process.env.GEMINI_DAILY_LIMIT = "2";
    expect(await checkAndIncrementAiUsage()).toBe(true);
    expect(await checkAndIncrementAiUsage()).toBe(true);
    expect(await checkAndIncrementAiUsage()).toBe(false);
  });

  it("no sigue incrementando el contador una vez bloqueado", async () => {
    process.env.GEMINI_DAILY_LIMIT = "1";
    await checkAndIncrementAiUsage();
    await checkAndIncrementAiUsage();
    await checkAndIncrementAiUsage();

    const today = new Date().toISOString().slice(0, 10);
    const log = await prisma.aiUsageLog.findUnique({ where: { day: today } });
    expect(log?.count).toBe(1);
  });

  it("usa 200 como límite por defecto si la variable no es válida", () => {
    delete process.env.GEMINI_DAILY_LIMIT;
    expect(getDailyAiLimit()).toBe(200);
  });
});
