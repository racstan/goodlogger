'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { validateFieldDefs, type FieldDef } from '@/lib/schema';

function parseFields(raw: unknown): FieldDef[] {
  if (!Array.isArray(raw)) throw new Error('Fields must be an array');
  return raw as FieldDef[];
}

export async function createTemplate(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const fields = parseFields(JSON.parse(String(formData.get('fields') ?? '[]')));
  if (!name) throw new Error('Name is required');
  const v = validateFieldDefs(fields);
  if (!v.ok) throw new Error(v.error);
  const t = await prisma.template.create({
    data: { name, fields: JSON.stringify(fields) },
  });
  revalidatePath('/');
  redirect(`/templates/${t.id}/edit`);
}

export async function updateTemplate(id: string, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const fields = parseFields(JSON.parse(String(formData.get('fields') ?? '[]')));
  if (!name) throw new Error('Name is required');
  const v = validateFieldDefs(fields);
  if (!v.ok) throw new Error(v.error);
  await prisma.template.update({
    where: { id },
    data: { name, fields: JSON.stringify(fields) },
  });
  revalidatePath('/');
  revalidatePath(`/templates/${id}/edit`);
  redirect(`/templates/${id}/edit?saved=1`);
}

export async function deleteTemplate(id: string) {
  await prisma.template.delete({ where: { id } });
  revalidatePath('/');
  revalidatePath('/templates');
}
