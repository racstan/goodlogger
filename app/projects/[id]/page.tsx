import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TemplatePanel } from '@/components/TemplatePanel';
import { ProjectLogForm } from '@/components/ProjectLogForm';
import { DeleteButton } from '@/components/DeleteButton';
import type { FieldDef, LogValue } from '@/lib/schema';

function formatCell(v: LogValue | undefined): string {
  if (v === undefined || v === null) return '—';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      templates: {
        include: { template: true },
      },
    },
  });
  if (!project) notFound();

  // Parse fields for each template
  const importedTemplates = project.templates.map((pt) => {
    const fields = JSON.parse(pt.template.fields) as FieldDef[];
    return { id: pt.template.id, name: pt.template.name, fields };
  });
  const importedIds = new Set(importedTemplates.map((t) => t.id));

  // All templates not yet in this project
  const allTemplates = await prisma.template.findMany({
    orderBy: { createdAt: 'asc' },
  });
  const availableTemplates = allTemplates
    .filter((t) => !importedIds.has(t.id))
    .map((t) => ({
      ...t,
      fieldCount: (() => { try { return (JSON.parse(t.fields) as unknown[]).length; } catch { return 0; } })(),
    }));

  // Collect ALL unique field definitions across all templates for the table headers
  // Deduplicate by field id
  const allFields: FieldDef[] = [];
  const seenFieldIds = new Set<string>();
  for (const t of importedTemplates) {
    for (const f of t.fields) {
      if (!seenFieldIds.has(f.id)) {
        seenFieldIds.add(f.id);
        allFields.push(f);
      }
    }
  }

  // Fetch all project-level logs
  const logs = await prisma.log.findMany({
    where: { projectId: id },
    orderBy: { loggedAt: 'asc' },
  });

  // Parse and assign serial numbers
  const parsedLogs = logs.map((log, i) => ({
    id: log.id,
    values: JSON.parse(log.values) as Record<string, LogValue>,
    loggedAt: log.loggedAt.toISOString(),
    serial: i + 1,
  }));

  // Compute next serial number
  const nextSerial = parsedLogs.length + 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/" className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 inline-block mb-1">&larr; Projects</Link>
          <h1 className="text-xl sm:text-2xl font-semibold break-words">{project.name}</h1>
          {project.description && <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm sm:text-base">{project.description}</p>}
        </div>
        {importedTemplates.length > 0 && (
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`/api/projects/${project.id}/export`}
              download
              className="rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-2 text-sm min-h-11 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap"
            >
              Export CSV
            </a>
          </div>
        )}
      </div>

      {/* Collapsible template panels */}
      <TemplatePanel
        projectId={project.id}
        importedTemplates={importedTemplates.map((t) => ({
          ...t,
          logCount: parsedLogs.length,
        }))}
        availableTemplates={availableTemplates.map((t) => ({ id: t.id, name: t.name, fieldCount: t.fieldCount }))}
      />

      {/* Unified scrollable log table */}
      {importedTemplates.length > 0 && (
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
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">#{log.serial} · {new Date(log.loggedAt).toLocaleString()}</span>
                      <DeleteButton target={{ kind: 'log', id: log.id, returnPath: `/projects/${id}` }} />
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
                      <th className="px-4 py-2 font-medium whitespace-nowrap"></th>
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
                        <td className="px-4 py-2">
                          <DeleteButton target={{ kind: 'log', id: log.id, returnPath: `/projects/${id}` }} />
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
      )}

      {/* Combined log form — shows all fields from all templates */}
      {importedTemplates.length > 0 && (
        <ProjectLogForm
          projectId={project.id}
          templates={importedTemplates.map((t) => ({
            id: t.id,
            name: t.name,
            fields: t.fields,
          }))}
          nextSerial={nextSerial}
        />
      )}
    </div>
  );
}
