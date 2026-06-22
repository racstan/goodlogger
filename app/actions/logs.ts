'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { validateLogValues } from '@/lib/validate';
import type { FieldDef, LogValues } from '@/lib/schema';

/** Create a combined log entry for a project (spans all templates in the project). */
export async function createProjectLog(projectId: string, values: LogValues) {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { templates: { include: { template: true } } },
  });
  if (!project) throw new Error('Project not found');

  // Collect all fields from all templates in the project
  const allFields: FieldDef[] = [];
  for (const pt of project.templates) {
    const fields = JSON.parse(pt.template.fields) as FieldDef[];
    allFields.push(...fields);
  }

  // Validate against combined fields
  const v = validateLogValues(allFields, values);
  if (!v.success) throw new Error(v.error.issues[0]?.message ?? 'Invalid log');

  await prisma.log.create({
    data: { projectId, values: JSON.stringify(values) },
  });

  revalidatePath(`/projects/${projectId}`);
}

/** Delete a log entry. Provide returnPath for revalidation. */
export async function deleteLog(id: string, returnPath?: string) {
  await prisma.log.delete({ where: { id } });
  if (returnPath) {
    revalidatePath(returnPath);
  }
}

/** Update an existing log entry. */
export async function updateProjectLog(logId: string, values: LogValues) {
  const log = await prisma.log.findUnique({
    where: { id: logId },
  });
  if (!log) throw new Error('Log not found');

  if (!log.projectId) throw new Error('Log does not belong to a project');

  const project = await prisma.project.findUnique({
    where: { id: log.projectId },
    include: { templates: { include: { template: true } } },
  });
  if (!project) throw new Error('Project not found');

  // Collect all fields from all templates in the project
  const allFields: FieldDef[] = [];
  for (const pt of project.templates) {
    const fields = JSON.parse(pt.template.fields) as FieldDef[];
    allFields.push(...fields);
  }

  // Validate against combined fields
  const v = validateLogValues(allFields, values);
  if (!v.success) throw new Error(v.error.issues[0]?.message ?? 'Invalid log');

  await prisma.log.update({
    where: { id: logId },
    data: { values: JSON.stringify(values) },
  });

  revalidatePath(`/projects/${log.projectId}`);
}
