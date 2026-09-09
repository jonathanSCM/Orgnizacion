import { prisma } from "@/lib/prisma";

export async function logHistory(params: {
  projectId: string;
  taskId?: string;
  field: string;
  oldValue?: string | null;
  newValue?: string | null;
  changedById?: string | null;
}) {
  return prisma.historyEntry.create({
    data: {
      projectId: params.projectId,
      taskId: params.taskId,
      field: params.field,
      oldValue: params.oldValue ?? null,
      newValue: params.newValue ?? null,
      changedById: params.changedById ?? null,
    },
  });
}
