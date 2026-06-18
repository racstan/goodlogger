'use server';

import { prisma } from '@/lib/prisma';
import type { FieldDef } from '@/lib/schema';

export type ExportData = {
  version: 1;
  exportedAt: string;
  templates: {
    id: string;
    name: string;
    fields: FieldDef[];
  }[];
  projects: {
    id: string;
    name: string;
    description: string;
    templateIds: string[];
  }[];
  logs: {
    id: string;
    projectId: string | null;
    templateId: string | null;
    values: Record<string, unknown>;
    loggedAt: string;
  }[];
};

export async function exportAll(): Promise<ExportData> {
  const templates = await prisma.template.findMany({
    orderBy: { createdAt: 'asc' },
  });

  const projects = await prisma.project.findMany({
    include: { templates: { select: { templateId: true } } },
    orderBy: { createdAt: 'asc' },
  });

  const logs = await prisma.log.findMany({
    orderBy: { loggedAt: 'asc' },
  });

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    templates: templates.map((t) => ({
      id: t.id,
      name: t.name,
      fields: JSON.parse(t.fields) as FieldDef[],
    })),
    projects: projects.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      templateIds: p.templates.map((pt) => pt.templateId),
    })),
    logs: logs.map((l) => ({
      id: l.id,
      projectId: l.projectId,
      templateId: l.templateId,
      values: JSON.parse(l.values),
      loggedAt: l.loggedAt.toISOString(),
    })),
  };
}

export async function importData(data: ExportData) {
  if (!data || data.version !== 1) {
    return { error: 'Invalid backup file format' };
  }

  // Track old ID → new ID mappings
  const templateMap = new Map<string, string>();
  const projectMap = new Map<string, string>();
  const logMap = new Map<string, string>();

  // 1. Import templates
  for (const t of data.templates) {
    // Check if template with same name exists
    const existing = await prisma.template.findUnique({ where: { name: t.name } });
    if (existing) {
      templateMap.set(t.id, existing.id);
      // Update fields in case they differ
      await prisma.template.update({
        where: { id: existing.id },
        data: { fields: JSON.stringify(t.fields) },
      });
    } else {
      const created = await prisma.template.create({
        data: { name: t.name, fields: JSON.stringify(t.fields) },
      });
      templateMap.set(t.id, created.id);
    }
  }

  // 2. Import projects
  for (const p of data.projects) {
    const existing = await prisma.project.findUnique({ where: { name: p.name } });
    if (existing) {
      projectMap.set(p.id, existing.id);
      await prisma.project.update({
        where: { id: existing.id },
        data: { description: p.description },
      });
    } else {
      const created = await prisma.project.create({
        data: { name: p.name, description: p.description },
      });
      projectMap.set(p.id, created.id);
    }

    // 3. Import project-template associations
    const newProjectId = projectMap.get(p.id)!;
    for (const oldTemplateId of p.templateIds) {
      const newTemplateId = templateMap.get(oldTemplateId);
      if (!newTemplateId) continue;

      await prisma.projectTemplate.upsert({
        where: {
          projectId_templateId: {
            projectId: newProjectId,
            templateId: newTemplateId,
          },
        },
        create: { projectId: newProjectId, templateId: newTemplateId },
        update: {},
      });
    }
  }

  // 4. Import logs (skip duplicates by checking existing loggedAt + projectId combo)
  let imported = 0;
  let skipped = 0;
  for (const l of data.logs) {
    const newProjectId = l.projectId ? projectMap.get(l.projectId) ?? null : null;
    const newTemplateId = l.templateId ? templateMap.get(l.templateId) ?? null : null;

    // Skip if no valid project reference
    if (l.projectId && !newProjectId) {
      skipped++;
      continue;
    }

    // Check for duplicate (same project + timestamp within 1 second)
    const existingLog = await prisma.log.findFirst({
      where: {
        projectId: newProjectId,
        loggedAt: new Date(l.loggedAt),
      },
    });

    if (existingLog) {
      logMap.set(l.id, existingLog.id);
      skipped++;
      continue;
    }

    const created = await prisma.log.create({
      data: {
        projectId: newProjectId,
        templateId: newTemplateId,
        values: JSON.stringify(l.values),
        loggedAt: new Date(l.loggedAt),
      },
    });
    logMap.set(l.id, created.id);
    imported++;
  }

  return {
    success: true,
    summary: {
      templates: data.templates.length,
      projects: data.projects.length,
      logsImported: imported,
      logsSkipped: skipped,
    },
  };
}
