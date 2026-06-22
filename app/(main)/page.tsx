import { prisma } from '@/lib/prisma';
import { Dashboard } from '@/components/Dashboard';
import type { FieldDef } from '@/lib/schema';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Fetch projects with per-project log counts
  const projects = await prisma.project.findMany({
    include: {
      templates: {
        include: { template: true },
      },
      _count: { select: { logs: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Fetch all logs grouped by date for the calendar
  const allLogs = await prisma.log.findMany({
    select: {
      id: true,
      values: true,
      loggedAt: true,
      projectId: true,
      project: { select: { name: true } },
      templateId: true,
      template: { select: { fields: true } },
    },
    orderBy: { loggedAt: 'desc' },
  });

  // Build log dates for calendar (YYYY-MM-DD grouped counts)
  const dateCountMap = new Map<string, number>();
  for (const log of allLogs) {
    const d = log.loggedAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    dateCountMap.set(key, (dateCountMap.get(key) ?? 0) + 1);
  }
  const logDates = Array.from(dateCountMap.entries()).map(([date, count]) => ({ date, count }));

  // Recent logs (last 30)
  const recentLogs = allLogs.slice(0, 30).map((log) => ({
    id: log.id,
    values: (() => { try { return JSON.parse(log.values); } catch { return {}; } })() as Record<string, unknown>,
    loggedAt: log.loggedAt.toISOString(),
    projectName: log.project?.name ?? null,
    projectId: log.projectId ?? null,
  }));

  // Collect all field definitions from templates used in projects
  const templateIds = new Set<string>();
  for (const p of projects) {
    for (const pt of p.templates) {
      templateIds.add(pt.templateId);
    }
  }

  const templates = await prisma.template.findMany({
    where: { id: { in: Array.from(templateIds) } },
    select: { name: true, fields: true },
  });

  const allFields = templates.map((t) => ({
    projectName: t.name,
    fields: (() => { try { return JSON.parse(t.fields); } catch { return []; } })() as FieldDef[],
  }));

  return (
    <Dashboard
      projects={projects}
      logDates={logDates}
      recentLogs={recentLogs}
      allFields={allFields}
    />
  );
}
