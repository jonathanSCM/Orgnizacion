export const PROJECTS_PAGE_SIZE = 50;

export type DashboardStatus = { id: string; name: string; color: string; order: number };

export type DashboardProject = {
  id: string;
  name: string;
  description: string;
  repoUrl: string | null;
  deployUrl: string | null;
  statusId: string;
  status: DashboardStatus;
  statusChangedAt: string | Date;
  assignee: { id: string; name: string } | null;
  _count: { tasks: number };
};
