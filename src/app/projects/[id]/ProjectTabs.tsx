"use client";

import { useState } from "react";
import type { ProjectDetail, StatusOption } from "./types";
import OverviewTab from "./OverviewTab";
import TasksTab from "./TasksTab";
import DocumentsTab from "./DocumentsTab";
import HistoryTab from "./HistoryTab";
import WeeklySummary from "./WeeklySummary";

const TABS = ["Tareas", "Info del proyecto", "Documentos", "Historial"] as const;

export default function ProjectTabs({
  project,
  statuses,
  historyHasMore,
}: {
  project: ProjectDetail;
  statuses: StatusOption[];
  historyHasMore: boolean;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Tareas");

  return (
    <div>
      <div className="mb-7 flex gap-6 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-2.5 text-sm font-medium transition-colors ${
              tab === t
                ? "border-rust text-ink"
                : "border-transparent text-ink-faint hover:text-ink-soft"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Tareas" && <TasksTab project={project} />}
      {tab === "Info del proyecto" && <OverviewTab project={project} statuses={statuses} />}
      {tab === "Documentos" && <DocumentsTab project={project} />}
      {tab === "Historial" && (
        <>
          <WeeklySummary project={project} />
          <HistoryTab projectId={project.id} entries={project.historyEntries} initialHasMore={historyHasMore} />
        </>
      )}
    </div>
  );
}
