import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { fetchGithubInfo } from "@/lib/github";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { id } = await params;
  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) return NextResponse.json({ error: "No encontrado" }, { status: 404 });
  if (!project.repoUrl) return NextResponse.json({ error: "El proyecto no tiene repositorio configurado" }, { status: 400 });

  const info = await fetchGithubInfo(project.repoUrl);
  if (!info) {
    return NextResponse.json(
      { error: "No se pudo obtener info pública del repo (puede ser privado o la URL es inválida)" },
      { status: 404 }
    );
  }

  return NextResponse.json(info);
}
