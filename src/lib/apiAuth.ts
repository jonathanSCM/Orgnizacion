import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type Actor = { id: string; name: string; email: string; role: "LEAD" | "MEMBER" };

// Autentica una request tanto por sesión de navegador como por un token
// personal (header "Authorization: Bearer <token>"), para que un asistente
// de IA pueda llamar a estos endpoints en nombre del usuario dueño del token.
export async function resolveActor(req: Request): Promise<Actor | null> {
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7).trim();
    if (!token) return null;

    const apiToken = await prisma.apiToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!apiToken) return null;

    prisma.apiToken
      .update({ where: { id: apiToken.id }, data: { lastUsedAt: new Date() } })
      .catch(() => {});

    return {
      id: apiToken.user.id,
      name: apiToken.user.name,
      email: apiToken.user.email,
      role: apiToken.user.role,
    };
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    role: session.user.role as "LEAD" | "MEMBER",
  };
}
