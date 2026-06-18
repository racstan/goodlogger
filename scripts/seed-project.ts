/**
 * Seed script: creates a "Weekly Reflection" template, imports it into
 * the existing project, and creates combined project-level log entries.
 *
 * Run with: npx tsx scripts/seed-project.ts
 */
import { PrismaClient } from '@prisma/client';
import type { FieldDef } from '../lib/schema';

const prisma = new PrismaClient();

const PROJECT_ID = 'cmqi607wz000011v6nhwcr1uv'; // My Work Project

const weeklyReflectionFields: FieldDef[] = [
  { id: 'wins', name: 'Wins this week', type: 'text', required: true },
  { id: 'challenges', name: 'Challenges', type: 'richtext', required: false },
  { id: 'mood', name: 'Overall mood', type: 'rating', required: true, max: 5 },
  { id: 'hours_worked', name: 'Hours worked', type: 'number', required: true },
  { id: 'learned', name: 'Key learning', type: 'text', required: false },
  { id: 'next_week_focus', name: 'Next week focus', type: 'multiselect', required: true, options: ['Backend', 'Frontend', 'Testing', 'Docs', 'DevOps'] },
];

async function main() {
  // 1. Create the "Weekly Reflection" template
  const reflection = await prisma.template.upsert({
    where: { name: 'Weekly Reflection' },
    create: {
      name: 'Weekly Reflection',
      fields: JSON.stringify(weeklyReflectionFields),
    },
    update: {},
  });
  console.log(`✓ Weekly Reflection template: ${reflection.id}`);

  // 2. Import it into the project (if not already)
  const existing = await prisma.projectTemplate.findUnique({
    where: { projectId_templateId: { projectId: PROJECT_ID, templateId: reflection.id } },
  });
  if (!existing) {
    await prisma.projectTemplate.create({
      data: { projectId: PROJECT_ID, templateId: reflection.id },
    });
    console.log('✓ Imported Weekly Reflection into project');
  } else {
    console.log('✓ Weekly Reflection already in project');
  }

  // 3. Find the Daily Standup template
  const standup = await prisma.template.findFirst({ where: { name: 'Daily Standup' } });
  if (!standup) {
    console.log('⚠ Daily Standup template not found — skipping log creation');
    return;
  }
  // Ensure it's imported too
  const existingStd = await prisma.projectTemplate.findUnique({
    where: { projectId_templateId: { projectId: PROJECT_ID, templateId: standup.id } },
  });
  if (!existingStd) {
    await prisma.projectTemplate.create({
      data: { projectId: PROJECT_ID, templateId: standup.id },
    });
    console.log('✓ Imported Daily Standup into project');
  }

  // 4. Delete any existing project logs and create fresh combined entries
  await prisma.log.deleteMany({ where: { projectId: PROJECT_ID } });

  // Daily Standup uses field IDs from the seed: f_mood, f_slept, f_energy, f_block, f_start
  // Weekly Reflection uses field IDs: wins, challenges, mood, hours_worked, learned, next_week_focus
  const entries = [
    {
      f_mood: '😀',
      f_slept: true,
      f_energy: 9,
      f_block: ['None'],
      f_start: '09:00',
      wins: 'Fixed the build pipeline',
      challenges: '',
      mood: 4,
      hours_worked: 7,
      learned: 'How Next.js App Router works',
      next_week_focus: ['Frontend', 'Testing'],
    },
    {
      f_mood: '😐',
      f_slept: false,
      f_energy: 5,
      f_block: ['People'],
      f_start: '10:30',
      wins: 'Debugged CSV export',
      challenges: 'Team sync took too long',
      mood: 3,
      hours_worked: 6.5,
      learned: 'CSV injection safety',
      next_week_focus: ['Backend'],
    },
    {
      f_mood: '😀',
      f_slept: true,
      f_energy: 8,
      f_block: ['None'],
      f_start: '08:45',
      wins: 'Shipped project page redesign',
      challenges: '',
      mood: 5,
      hours_worked: 8,
      learned: 'Prisma schema migrations',
      next_week_focus: ['Docs', 'Testing'],
    },
  ];

  for (const vals of entries) {
    await prisma.log.create({
      data: { projectId: PROJECT_ID, values: JSON.stringify(vals) },
    });
  }
  console.log(`✓ Created ${entries.length} combined project log entries`);

  console.log('\nDone! Start the app with npm start to see the data.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
