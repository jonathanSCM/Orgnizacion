import Link from "next/link";
import { FIELD_LABEL } from "@/lib/historyLabels";
import { timeAgo } from "@/lib/time";

type Entry = {
  id: string;
  field: string;
  oldValue: string | null;
  newValue: string | null;
  changedAt: string | Date;
  changedBy: { name: string } | null;
  task: { title: string } | null;
  project: { id: string; name: string };
};

export default function ActivityFeed({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <div className="border border-dashed border-line-strong p-5 text-center text-xs text-ink-soft">
        Todavía no hay actividad para mostrar.
      </div>
    );
  }

  return (
    <div className="border border-line bg-card p-4">
      <h2 className="mb-3 font-display text-sm font-semibold text-ink">Actividad reciente</h2>
      <ul className="space-y-3.5 border-l-2 border-line pl-4">
        {entries.map((entry) => (
          <li key={entry.id} className="relative text-xs">
            <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full border-2 border-card bg-rust" />
            <p className="text-ink">
              <span className="font-semibold">{FIELD_LABEL[entry.field] ?? entry.field}</span>
              {entry.task?.title && <span className="text-ink-soft"> · {entry.task.title}</span>}
            </p>
            <p className="mt-0.5 text-ink-faint">
              <Link href={`/projects/${entry.project.id}`} className="hover:text-ink hover:underline">
                {entry.project.name}
              </Link>{" "}
              · {entry.changedBy?.name ?? "Sistema"} · {timeAgo(entry.changedAt)}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
