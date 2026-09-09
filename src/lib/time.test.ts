import { describe, expect, it } from "vitest";
import { timeAgo } from "./time";

function ago(ms: number): Date {
  return new Date(Date.now() - ms);
}

describe("timeAgo", () => {
  it("devuelve 'hace un momento' para menos de un minuto", () => {
    expect(timeAgo(ago(30 * 1000))).toBe("hace un momento");
  });

  it("formatea minutos", () => {
    expect(timeAgo(ago(5 * 60 * 1000))).toBe("hace 5 minutos");
  });

  it("formatea 1 minuto en singular", () => {
    expect(timeAgo(ago(90 * 1000))).toBe("hace 1 minuto");
  });

  it("formatea horas", () => {
    expect(timeAgo(ago(3 * 60 * 60 * 1000))).toBe("hace 3 horas");
  });

  it("formatea días", () => {
    expect(timeAgo(ago(2 * 24 * 60 * 60 * 1000))).toBe("hace 2 días");
  });

  it("formatea meses con plural correcto (meses, no mess)", () => {
    expect(timeAgo(ago(70 * 24 * 60 * 60 * 1000))).toBe("hace 2 meses");
  });

  it("acepta un string ISO", () => {
    expect(timeAgo(new Date(Date.now() - 60000).toISOString())).toBe("hace 1 minuto");
  });
});
