import { prisma } from './prisma';
import type { FieldDef } from './schema';

const DAILY_STANDUP: FieldDef[] = [
  { id: 'f_mood',   name: 'Mood',         type: 'select',      required: true,  options: ['😀', '😐', '😞'] },
  { id: 'f_slept',  name: 'Slept well?',  type: 'boolean',     required: true },
  { id: 'f_energy', name: 'Energy level', type: 'slider',      required: true,  min: 1, max: 10, step: 1 },
  { id: 'f_block',  name: 'Blockers',     type: 'multiselect', required: false, options: ['None', 'People', 'Tools', 'Process'] },
  { id: 'f_start',  name: 'Start time',   type: 'time',        required: true },
  { id: 'f_mood_rating', name: 'Mood Rating', type: 'rating', required: false, max: 5 },
  { id: 'f_email',  name: 'Contact Email', type: 'email',      required: false },
];

export async function seedIfEmpty() {
  const count = await prisma.template.count();
  if (count > 0) return;
  await prisma.template.create({
    data: { name: 'Daily Standup', fields: JSON.stringify(DAILY_STANDUP) },
  });
}
