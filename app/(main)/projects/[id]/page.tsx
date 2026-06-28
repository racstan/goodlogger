import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { TemplatePanel } from '@/components/TemplatePanel';
import { ProjectLogsManager } from '@/components/ProjectLogsManager';
import { ProjectHeader } from '@/components/ProjectHeader';
import type { FieldDef, LogValue } from '@/lib/schema';

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
        <ProjectHeader project={project} />
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

      {/* Unified scrollable log table & form */}
      {importedTemplates.length > 0 && (
        <ProjectLogsManager
          projectId={project.id}
          templates={importedTemplates.map((t) => ({
            id: t.id,
            name: t.name,
            fields: t.fields,
          }))}
          parsedLogs={parsedLogs}
          nextSerial={nextSerial}
          allFields={allFields}
        />
      )}
    </div>
  );
}
