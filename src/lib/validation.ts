import { NextResponse } from "next/server";
import { z } from "zod";

export function parseBody<T>(schema: z.ZodType<T>, raw: unknown): { data: T } | { error: NextResponse } {
  const result = schema.safeParse(raw);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Datos inválidos";
    return { error: NextResponse.json({ error: message }, { status: 400 }) };
  }
  return { data: result.data };
}

const taskType = z.enum(["CAMBIO_NECESARIO", "CAMBIO_A_REALIZAR", "CAMBIO_REALIZADO", "CAMBIO_PENDIENTE"]);

const optionalUrl = z
  .string()
  .trim()
  .url("URL inválida")
  .nullish()
  .or(z.literal(""));

const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Fecha inválida")
  .nullish()
  .or(z.literal(""));

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(200),
  description: z.string().trim().max(5000).optional(),
  repoUrl: optionalUrl,
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Título requerido").max(300),
  description: z.string().trim().max(5000).optional(),
  type: taskType.optional(),
  assigneeId: z.string().trim().min(1).optional(),
  moduleId: z.string().trim().min(1).optional(),
  dueDate: optionalDate,
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1, "Título requerido").max(300).optional(),
  description: z.string().trim().max(5000).optional(),
  type: taskType.optional(),
  assigneeId: z.string().nullable().optional(),
  moduleId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
});

export const createModuleSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(100),
  color: z.string().trim().max(20).optional(),
});

export const updateModuleSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(100).optional(),
  color: z.string().trim().max(20).optional(),
  order: z.number().int().optional(),
});

export const createStatusSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(50),
  color: z.string().trim().max(20).optional(),
});

export const updateStatusSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(50).optional(),
  color: z.string().trim().max(20).optional(),
  order: z.number().int().optional(),
});

export const createUserSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(100),
  email: z.string().trim().email("Email inválido"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
  role: z.enum(["LEAD", "MEMBER"]).optional(),
});

export const askProjectSchema = z.object({
  question: z.string().trim().min(1, "Escribe una pregunta").max(1000),
});

export const inviteSchema = z.object({
  name: z.string().trim().min(1, "Nombre requerido").max(100),
  email: z.string().trim().email("Email inválido"),
  role: z.enum(["LEAD", "MEMBER"]).optional(),
});

export const acceptInviteSchema = z.object({
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email inválido"),
});

export const createCommentSchema = z.object({
  body: z.string().trim().min(1, "El comentario no puede estar vacío").max(2000),
});

export const createUpdateNoteSchema = z.object({
  note: z.string().trim().min(1, "La actualización no puede estar vacía").max(2000),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(200),
});
