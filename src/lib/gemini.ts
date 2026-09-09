import { GoogleGenAI } from "@google/genai";

const MODEL = "gemini-3.5-flash-lite";

function getClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey });
}

function extractJson(text: string): unknown {
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("La IA no devolvió JSON válido");
  return JSON.parse(match[0]);
}

export type ProjectExtraction = {
  summary: string;
  language: string | null;
  stack: string[];
  suggestedStatus: string | null;
  keyFeatures: string[];
  repoUrl: string | null;
  deployUrl: string | null;
  suggestedTasks: { title: string; description: string; type: "CAMBIO_NECESARIO" | "CAMBIO_A_REALIZAR" }[];
};

export async function analyzeProjectDocument(text: string): Promise<ProjectExtraction | null> {
  const client = getClient();
  if (!client) return null;

  const prompt = `Eres un asistente que analiza documentos técnicos de proyectos de software (resúmenes, README, especificaciones, documentación técnica completa).
Lee el documento completo con cuidado, incluyendo tablas, secciones de infraestructura/despliegue, variables de entorno, y las secciones de "pendientes", "roadmap", "próximos pasos", "bugs conocidos" o "riesgos". No te quedes solo con el resumen ejecutivo del principio.
Devuelve SOLO un JSON con esta forma exacta, sin texto adicional ni markdown:
{
  "summary": "resumen breve del proyecto en 2-4 frases",
  "language": "lenguaje de programación principal o null",
  "stack": ["lista completa de tecnologias/frameworks/servicios detectados: frontend, backend, base de datos, infraestructura, terceros, etc."],
  "suggestedStatus": "uno de: Pendiente, En progreso, Necesita revisión, En revisión, Pausado, En producción, Completado, o null si no se puede inferir",
  "keyFeatures": ["lista de funcionalidades clave ya implementadas, sé específico y no te limites a 3-4 si el documento describe más"],
  "repoUrl": "URL completa del repositorio (ej. GitHub/GitLab) mencionada en el documento, o null si no aparece ninguna",
  "deployUrl": "URL completa donde el proyecto está desplegado/en producción (dominio público, no el repo), o null si no aparece ninguna",
  "suggestedTasks": [
    { "title": "título corto de una tarea pendiente/próximo paso/bug conocido mencionado explícitamente en el documento", "description": "detalle breve, incluyendo contexto relevante si lo hay", "type": "CAMBIO_NECESARIO" }
  ]
}
Para "suggestedTasks": recorre TODO el documento (secciones de pendientes, roadmap, bugs conocidos, bloqueadores, riesgos, "no implementado", "sin resolver", etc.) y lista cada ítem accionable como una tarea separada. Usa "type": "CAMBIO_NECESARIO" para bloqueadores/bugs/urgencias, y "CAMBIO_A_REALIZAR" para roadmap/mejoras futuras normales. No inventes tareas que no estén mencionadas o claramente implícitas en el texto. Si no hay ninguna, devuelve una lista vacía.

Texto del documento:
"""
${text.slice(0, 100000)}
"""`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const raw = response.text ?? "";
  return extractJson(raw) as ProjectExtraction;
}

export type MeetingExtraction = {
  summary: string;
  suggestedTasks: { title: string; description: string; type: "CAMBIO_NECESARIO" | "CAMBIO_A_REALIZAR" }[];
};

export async function analyzeMeetingDocument(text: string): Promise<MeetingExtraction | null> {
  const client = getClient();
  if (!client) return null;

  const prompt = `Eres un asistente que revisa transcripciones o actas de reuniones de un equipo de desarrollo de software.
Analiza el siguiente texto y devuelve SOLO un JSON con esta forma exacta, sin texto adicional ni markdown:
{
  "summary": "resumen breve de la reunión en 2-4 frases",
  "suggestedTasks": [
    { "title": "título corto de la tarea/próximo paso", "description": "detalle breve de qué hay que hacer", "type": "CAMBIO_NECESARIO" }
  ]
}
Usa "type": "CAMBIO_NECESARIO" para cosas urgentes/bloqueantes que se mencionaron como necesarias, y "CAMBIO_A_REALIZAR" para próximos pasos o mejoras normales.
Extrae solo tareas accionables reales mencionadas o implícitas en la reunión, no inventes trabajo que no se discutió.

Texto de la transcripción/acta:
"""
${text.slice(0, 100000)}
"""`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  const raw = response.text ?? "";
  return extractJson(raw) as MeetingExtraction;
}

export async function generateWeeklyDigest(projectName: string, entriesText: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const prompt = `Eres un asistente que resume la actividad reciente de un proyecto de software para su líder de equipo.
A continuación tienes el registro crudo de cambios de los últimos 7 días del proyecto "${projectName}" (qué cambió, de qué a qué, quién lo hizo y cuándo).
Escribe un resumen en 1-2 párrafos, en español, en tono directo y útil para alguien que no tuvo tiempo de revisar el detalle día a día. Menciona los cambios de estado más relevantes, quién estuvo más activo, y cualquier patrón notable (por ejemplo, muchas tareas creadas pero pocas completadas). No inventes nada que no esté en el registro. Devuelve SOLO el texto del resumen, sin JSON ni markdown.

Registro de actividad:
"""
${entriesText.slice(0, 20000)}
"""`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return (response.text ?? "").trim() || null;
}

export async function answerProjectQuestion(context: string, question: string): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const prompt = `Eres un asistente que responde preguntas sobre un proyecto de software, usando ÚNICAMENTE el contenido de los documentos que el equipo subió sobre ese proyecto.
Responde en español, de forma directa y concreta. Si la respuesta no está en el contexto de abajo, dilo claramente ("No encuentro esa información en los documentos subidos") en vez de inventar o suponer. No agregues disclaimers innecesarios.

Documentos del proyecto:
"""
${context.slice(0, 80000)}
"""

Pregunta: ${question}`;

  const response = await client.models.generateContent({
    model: MODEL,
    contents: prompt,
  });

  return (response.text ?? "").trim() || null;
}
