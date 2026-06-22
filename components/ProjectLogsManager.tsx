'use client';

import { useState } from 'react';
import { DeleteButton } from '@/components/DeleteButton';
import { ProjectLogForm } from '@/components/ProjectLogForm';
import type { FieldDef, LogValue, LogValues } from '@/lib/schema';

type LogEntry = {
  id: string;
  values: Record<string, LogValue>;
  loggedAt: string;
  serial: number;
};

type TemplateGroup = {
  id: string;
  name: string;
  fields: FieldDef[];
};

type Props = {
  projectId: string;
  templates: TemplateGroup[];
  parsedLogs: LogEntry[];
  nextSerial: number;
  allFields: FieldDef[];
};

function formatCell(v: LogValue | undefined): string {
  if (v === undefined || v === null || v === '') return '—';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object' && v !== null && 'value' in v && !Array.isArray(v)) {
    return String(v.value);
  }
  return String(v);
}

export function ProjectLogsManager({ projectId, templates, parsedLogs, nextSerial, allFields }: Props) {
  const [editingLog, setEditingLog] = useState<LogEntry | null>(null);

  const startEdit = (log: LogEntry) => {
    // Scroll the form into view
    const formElement = document.getElementById('log-form-container');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
    setEditingLog(log);
  };

  const cancelEdit = () => {
    setEditingLog(null);
  };

  return (
    <div className="space-y-6">
      {/* Unified scrollable log table */}
      <div className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
          <h2 className="font-medium text-sm dark:text-slate-100">
            Entries
            {parsedLogs.length > 0 && (
              <span className="text-slate-400 dark:text-slate-500 font-normal ml-1">({parsedLogs.length})</span>
            )}
          </h2>
          {parsedLogs.length > 0 && (
            <div className="md:hidden text-xs text-slate-400 dark:text-slate-500">
              {parsedLogs.length} log{parsedLogs.length === 1 ? '' : 's'}
            </div>
          )}
        </div>
        {parsedLogs.length > 0 ? (
          <>
            {/* ─── Mobile card view (< md) ─── */}
            <div className="md:hidden p-3 space-y-3 max-h-[400px] overflow-y-auto">
              {[...parsedLogs].reverse().map((log) => (
                <div key={log.id} className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      #{log.serial} · {new Date(log.loggedAt).toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(log)}
                        className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-9"
                      >
                        Edit
                      </button>
                      <DeleteButton target={{ kind: 'log', id: log.id, returnPath: `/projects/${projectId}` }} />
                    </div>
                  </div>
                  {allFields.map((f) => {
                    const v = log.values[f.id];
                    return (
                      <div key={f.id} className="flex items-baseline gap-2 text-sm">
                        <span className="text-slate-500 dark:text-slate-400 shrink-0 w-28 truncate">{f.name}:</span>
                        <span className="font-medium break-words min-w-0">{formatCell(v)}</span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            {/* ─── Desktop table view (md+) ─── */}
            <div className="hidden md:block overflow-auto" style={{ height: '400px' }}>
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-800">
                  <tr className="border-b border-slate-200 dark:border-slate-700 text-left text-slate-500 dark:text-slate-400">
                    <th className="px-4 py-2 font-medium whitespace-nowrap">#</th>
                    {allFields.map((f) => (
                      <th key={f.id} className="px-4 py-2 font-medium whitespace-nowrap">{f.name}</th>
                    ))}
                    <th className="px-4 py-2 font-medium whitespace-nowrap">Logged At</th>
                    <th className="px-4 py-2 font-medium whitespace-nowrap text-right pr-12">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-4 py-2 text-slate-400 dark:text-slate-500 whitespace-nowrap">{log.serial}</td>
                      {allFields.map((f) => {
                        const v = log.values[f.id];
                        return (
                          <td key={f.id} className="px-4 py-2 whitespace-nowrap max-w-[200px] truncate">
                            {formatCell(v)}
                          </td>
                        );
                      })}
                      <td className="px-4 py-2 text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                        {new Date(log.loggedAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2 flex items-center justify-end gap-2 pr-4">
                        <button
                          type="button"
                          onClick={() => startEdit(log)}
                          className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 min-h-11 sm:min-h-0"
                        >
                          Edit
                        </button>
                        <DeleteButton target={{ kind: 'log', id: log.id, returnPath: `/projects/${projectId}` }} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <div className="px-4 py-8 text-center text-sm text-slate-400 dark:text-slate-500">
            No entries yet. Use the form below to log your first entry.
          </div>
        )}
      </div>

      {/* Combined log form — shows all fields from all templates */}
      <div id="log-form-container">
        <ProjectLogForm
          key={editingLog?.id ?? 'new'}
          projectId={projectId}
          templates={templates}
          nextSerial={nextSerial}
          editingLog={editingLog ? { id: editingLog.id, serial: editingLog.serial, values: editingLog.values } : null}
          onCancelEdit={cancelEdit}
          parsedLogs={parsedLogs}
        />
      </div>
    </div>
  );
}
