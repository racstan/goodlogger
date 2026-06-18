'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';

export async function createProject(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  if (!name) throw new Error('Project name is required');
  const p = await prisma.project.create({
    data: { name, description },
  });
  revalidatePath('/');
  redirect(`/projects/${p.id}`);
}

export async function updateProject(id: string, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim();
  if (!name) throw new Error('Project name is required');
  await prisma.project.update({
    where: { id },
    data: { name, description },
  });
  revalidatePath('/');
  revalidatePath(`/projects/${id}`);
}

export async function deleteProject(id: string) {
  await prisma.project.delete({ where: { id } });
  revalidatePath('/');
  redirect('/');
}

export async function importTemplate(projectId: string, templateId: string) {
  await prisma.projectTemplate.create({
    data: { projectId, templateId },
  });
  revalidatePath(`/projects/${projectId}`);
}

export async function removeTemplate(projectId: string, templateId: string) {
  await prisma.projectTemplate.deleteMany({
    where: { projectId, templateId },
  });
  revalidatePath(`/projects/${projectId}`);
}
