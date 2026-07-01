import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { ProjectLogsManager } from '@/components/ProjectLogsManager';
import type { FieldDef, LogValue } from '@/lib/schema';

export default async function ProjectLogsFullscreenPage({ params }: { params: Promise<{ id: string }> }) {
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

  // Collect ALL unique field definitions across all templates for the table headers
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
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-2 transition-colors"
          >
            &larr; Back to Project
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {project.name} - All Entries
          </h1>
        </div>
      </div>

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
        fullScreenMode={true}
      />
    </div>
  );
}
