import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { answerProjectQuestion } from "@/lib/gemini";
import { checkAndIncrementAiUsage, aiLimitReachedMessage } from "@/lib/aiUsage";
import { logHistory } from "@/lib/history";
import { parseBody, askProjectSchema } from "@/lib/validation";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id: projectId } = await params;
  const parsed = parseBody(askProjectSchema, await req.json());
  if ("error" in parsed) return parsed.error;
  const { question } = parsed.data;

  const documents = await prisma.document.findMany({
    where: { projectId, rawText: { not: "" } },
    orderBy: { uploadedAt: "desc" },
    select: { filename: true, rawText: true },
  });

  if (documents.length === 0) {
    return NextResponse.json(
      { error: "Sube al menos un documento antes de preguntar" },
      { status: 400 }
    );
  }

  const allowed = await checkAndIncrementAiUsage();
  if (!allowed) {
    return NextResponse.json({ error: aiLimitReachedMessage() }, { status: 429 });
  }

  const context = documents.map((d) => `### ${d.filename}\n${d.rawText}`).join("\n\n");

  const answer = await answerProjectQuestion(context, question);
  if (!answer) {
    return NextResponse.json({ error: "GEMINI_API_KEY no configurada" }, { status: 400 });
  }

  await logHistory({
    projectId,
    field: "pregunta_ia",
    newValue: question,
    changedById: session.user.id,
  });

  return NextResponse.json({ answer });
}
