import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { extractTextFromFile } from "@/lib/extractText";
import { analyzeProjectDocument, analyzeMeetingDocument } from "@/lib/gemini";
import { logHistory } from "@/lib/history";
import { checkAndIncrementAiUsage, aiLimitReachedMessage } from "@/lib/aiUsage";

const ALLOWED_EXTENSIONS = [".pdf", ".md", ".txt"];
const NO_KEY_MESSAGE = "GEMINI_API_KEY no configurada: el documento se guardó sin análisis de IA.";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId } = await params;
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const docType = (formData.get("docType") as string) || "RESUMEN_PROYECTO";

  if (!file) return NextResponse.json({ error: "Archivo requerido" }, { status: 400 });

  const lowerName = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((ext) => lowerName.endsWith(ext))) {
    return NextResponse.json({ error: "Solo se aceptan archivos .pdf, .md o .txt" }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "El archivo supera el límite de 10 MB" }, { status: 400 });
  }

  let text = "";
  let aiError: string | null = null;

  try {
    text = await extractTextFromFile(file);
  } catch (e) {
    aiError = `No se pudo extraer texto del archivo: ${e instanceof Error ? e.message : String(e)}`;
  }

  const document = await prisma.document.create({
    data: {
      projectId,
      filename: file.name,
      fileType: file.type || lowerName.split(".").pop() || "desconocido",
      docType: docType as "RESUMEN_PROYECTO" | "ACTA_REUNION",
      rawText: text,
    },
  });

  if (text && !aiError) {
    const allowed = await checkAndIncrementAiUsage();
    if (!allowed) {
      aiError = aiLimitReachedMessage();
    } else {
      try {
        const analyze = docType === "ACTA_REUNION" ? analyzeMeetingDocument : analyzeProjectDocument;
        const extraction = await analyze(text);
        if (extraction) {
          await prisma.document.update({
            where: { id: document.id },
            data: { aiExtractedJson: JSON.stringify(extraction) },
          });
        } else {
          aiError = NO_KEY_MESSAGE;
        }
      } catch (e) {
        aiError = e instanceof Error ? e.message : "Error analizando el documento con IA";
      }
    }
  }

  if (aiError) {
    await prisma.document.update({ where: { id: document.id }, data: { aiError } });
  }

  await logHistory({
    projectId,
    field: "documento_subido",
    newValue: `${file.name} (${docType})`,
    changedById: session.user.id,
  });

  const finalDocument = await prisma.document.findUnique({ where: { id: document.id } });

  return NextResponse.json({ document: finalDocument, aiError }, { status: 201 });
}
