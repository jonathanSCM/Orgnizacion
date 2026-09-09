import { describe, expect, it } from "vitest";
import {
  createProjectSchema,
  createTaskSchema,
  createUserSchema,
  askProjectSchema,
} from "./validation";

describe("createProjectSchema", () => {
  it("rechaza nombre vacío", () => {
    expect(createProjectSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("acepta un nombre válido sin más campos", () => {
    const result = createProjectSchema.safeParse({ name: "Mi Proyecto" });
    expect(result.success).toBe(true);
  });

  it("rechaza una URL de repo inválida", () => {
    expect(createProjectSchema.safeParse({ name: "X", repoUrl: "no-es-una-url" }).success).toBe(false);
  });

  it("acepta repoUrl vacío", () => {
    expect(createProjectSchema.safeParse({ name: "X", repoUrl: "" }).success).toBe(true);
  });
});

describe("createTaskSchema", () => {
  it("rechaza título vacío", () => {
    expect(createTaskSchema.safeParse({ title: "" }).success).toBe(false);
  });

  it("rechaza un tipo de tarea inválido", () => {
    expect(createTaskSchema.safeParse({ title: "Tarea", type: "NO_EXISTE" }).success).toBe(false);
  });

  it("acepta un tipo de tarea válido", () => {
    expect(createTaskSchema.safeParse({ title: "Tarea", type: "CAMBIO_NECESARIO" }).success).toBe(true);
  });

  it("rechaza una fecha límite inválida", () => {
    expect(createTaskSchema.safeParse({ title: "Tarea", dueDate: "no-es-fecha" }).success).toBe(false);
  });

  it("acepta una fecha límite válida", () => {
    expect(createTaskSchema.safeParse({ title: "Tarea", dueDate: "2026-12-01" }).success).toBe(true);
  });
});

describe("createUserSchema", () => {
  it("rechaza un email inválido", () => {
    const result = createUserSchema.safeParse({ name: "A", email: "no-es-email", password: "12345678" });
    expect(result.success).toBe(false);
  });

  it("rechaza una contraseña corta", () => {
    const result = createUserSchema.safeParse({ name: "A", email: "a@b.com", password: "123" });
    expect(result.success).toBe(false);
  });

  it("acepta datos válidos", () => {
    const result = createUserSchema.safeParse({ name: "A", email: "a@b.com", password: "12345678" });
    expect(result.success).toBe(true);
  });
});

describe("askProjectSchema", () => {
  it("rechaza una pregunta vacía", () => {
    expect(askProjectSchema.safeParse({ question: "  " }).success).toBe(false);
  });

  it("acepta una pregunta normal", () => {
    expect(askProjectSchema.safeParse({ question: "¿En qué dominio está desplegado?" }).success).toBe(true);
  });
});
