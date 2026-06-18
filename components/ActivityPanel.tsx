import Link from 'next/link';
import type { FieldDef } from '@/lib/schema';

type LogEntry = {
  id: string;
  values: Record<string, unknown>;
  loggedAt: string;
  projectName: string | null;
  projectId: string | null;
};

type Props = {
  logs: LogEntry[];
  allFields: { projectName: string; fields: FieldDef[] }[];
};

function formatValue(v: unknown): string {
  if (v === undefined || v === null) return '—';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

export function ActivityPanel({ logs, allFields }: Props) {
  if (logs.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
        No activity yet. Create a project and start logging.
      </div>
    );
  }

  // Flat field name lookup across all projects
  const allFieldNames = new Map<string, string>();
  for (const { fields } of allFields) {
    for (const f of fields) {
      allFieldNames.set(f.id, f.name);
    }
  }

  return (
    <div className="space-y-2 overflow-y-auto">
      {logs.map((log) => (
        <div
          key={log.id}
          className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-1"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-slate-400 dark:text-slate-500">
              {new Date(log.loggedAt).toLocaleString()}
            </span>
            {log.projectId && (
              <Link
                href={`/projects/${log.projectId}`}
                className="text-xs text-slate-500 dark:text-slate-400 hover:underline truncate"
              >
                {log.projectName}
              </Link>
            )}
          </div>
          <div className="space-y-0.5">
            {Object.entries(log.values).slice(0, 4).map(([fieldId, value]) => (
              <div key={fieldId} className="flex items-baseline gap-2 text-sm">
                <span className="text-slate-500 dark:text-slate-400 text-xs w-20 truncate shrink-0">
                  {allFieldNames.get(fieldId) ?? fieldId}:
                </span>
                <span className="font-medium truncate">{formatValue(value)}</span>
              </div>
            ))}
            {Object.keys(log.values).length > 4 && (
              <span className="text-xs text-slate-400">
                +{Object.keys(log.values).length - 4} more
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
