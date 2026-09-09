import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import TeamManager from "./TeamManager";

export default async function TeamPage() {
  const session = await requireSession();
  const [users, invitations] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true },
      orderBy: { name: "asc" },
    }),
    prisma.invitation.findMany({
      where: { acceptedAt: null },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div>
      <Navbar userName={session.user.name ?? session.user.email ?? ""} />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight text-ink">Equipo</h1>
        <p className="mb-7 text-sm text-ink-soft">
          Invitá por email a quienes quieras que puedan asignarse como encargados de proyectos y tareas.
        </p>
        <TeamManager
          initialUsers={users}
          initialInvitations={invitations}
          viewerIsLead={session.user.role === "LEAD"}
        />
      </main>
    </div>
  );
}
