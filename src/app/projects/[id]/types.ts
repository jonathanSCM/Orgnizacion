export const HISTORY_PAGE_SIZE = 20;

export type StatusOption = { id: string; name: string; color: string; order: number };

export type UserRef = { id: string; name: string };

export type Module = { id: string; name: string; color: string; order: number };

export type Task = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  type: "CAMBIO_NECESARIO" | "CAMBIO_A_REALIZAR" | "CAMBIO_REALIZADO" | "CAMBIO_PENDIENTE";
  assigneeId: string | null;
  assignee: UserRef | null;
  moduleId: string | null;
  module: Module | null;
  dueDate: string | Date | null;
  createdAt: string | Date;
};

export type ProjectDocument = {
  id: string;
  filename: string;
  fileType: string;
  docType: "RESUMEN_PROYECTO" | "ACTA_REUNION";
  aiExtractedJson: string | null;
  aiError: string | null;
  tasksApplied: boolean;
  uploadedAt: string | Date;
};

export type HistoryEntry = {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string | Date;
  changedBy: { name: string } | null;
  task: { title: string } | null;
};

export type ProjectDetail = {
  id: string;
  name: string;
  description: string;
  repoUrl: string | null;
  deployUrl: string | null;
  language: string | null;
  stack: string;
  statusId: string;
  status: StatusOption;
  statusChangedAt: string | Date;
  assigneeId: string | null;
  assignee: UserRef | null;
  owner: { name: string; email: string };
  lastWeeklySummary: string | null;
  lastWeeklySummaryAt: string | Date | null;
  tasks: Task[];
  modules: Module[];
  documents: ProjectDocument[];
  historyEntries: HistoryEntry[];
};

export const TASK_TYPE_LABEL: Record<Task["type"], string> = {
  CAMBIO_NECESARIO: "Cambio necesario",
  CAMBIO_A_REALIZAR: "Cambio a realizar",
  CAMBIO_REALIZADO: "Cambio realizado",
  CAMBIO_PENDIENTE: "Cambio pendiente",
};

export const TASK_TYPE_COLOR: Record<Task["type"], string> = {
  CAMBIO_NECESARIO: "#b8461c",
  CAMBIO_A_REALIZAR: "#35506b",
  CAMBIO_REALIZADO: "#56684a",
  CAMBIO_PENDIENTE: "#9a8f7a",
};
