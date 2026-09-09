import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import StatusManager from "./StatusManager";

export default async function StatusesPage() {
  const session = await requireSession();
  const statuses = await prisma.statusOption.findMany({ orderBy: { order: "asc" } });

  return (
    <div>
      <Navbar userName={session.user.name ?? session.user.email ?? ""} />
      <main className="mx-auto max-w-2xl px-6 py-10">
        <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight text-ink">
          Estados personalizados
        </h1>
        <p className="mb-7 text-sm text-ink-soft">
          Estos son los estados que se muestran como columnas en el tablero de proyectos.
        </p>
        <StatusManager initialStatuses={statuses} />
      </main>
    </div>
  );
}
