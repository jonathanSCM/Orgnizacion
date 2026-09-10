import { requireSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import MyTasksView from "./MyTasksView";

export default async function MyTasksPage() {
  const session = await requireSession();

  const tasks = await prisma.task.findMany({
    where: { assigneeId: session.user.id },
    include: {
      project: { select: { id: true, name: true, status: { select: { name: true, color: true } } } },
      module: true,
      assignee: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <Navbar userName={session.user.name ?? session.user.email ?? ""} />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="mb-1 font-display text-3xl font-semibold tracking-tight text-ink">Mis tareas</h1>
        <p className="mb-7 text-sm text-ink-soft">
          Todo lo que tenés asignado, de todos los proyectos, en un solo lugar.
        </p>
        <MyTasksView tasks={tasks} />
      </main>
    </div>
  );
}
