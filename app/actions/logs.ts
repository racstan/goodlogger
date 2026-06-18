'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { validateLogValues } from '@/lib/validate';
import type { FieldDef, LogValues } from '@/lib/schema';

async function getTemplateFields(id: string): Promise<{ id: string; fields: FieldDef[] }> {
  const t = await prisma.template.findUniqueOrThrow({ where: { id } });
  return { id: t.id, fields: JSON.parse(t.fields) as FieldDef[] };
}

/** Create a log for a single template (existing per-template flow). */
export async function createLog(templateId: string, values: LogValues) {
  const { id, fields } = await getTemplateFields(templateId);
  const v = validateLogValues(fields, values);
  if (!v.success) throw new Error(v.error.issues[0]?.message ?? 'Invalid log');
  await prisma.log.create({
    data: { templateId: id, values: JSON.stringify(values) },
  });
  revalidatePath(`/templates/${id}/logs`);
  redirect(`/templates/${id}/logs`);
}

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

/** Delete a log entry. Provide templateId or projectId for revalidation. */
export async function deleteLog(id: string, returnPath?: string) {
  await prisma.log.delete({ where: { id } });
  if (returnPath) {
    revalidatePath(returnPath);
  }
}
