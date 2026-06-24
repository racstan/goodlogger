import { prisma } from '@/lib/prisma';
import { ProjectsPanel } from '@/components/ProjectsPanel';

export const dynamic = 'force-dynamic';

export default async function ProjectsPage() {
  const projects = await prisma.project.findMany({
    include: {
      templates: {
        include: { template: true },
      },
      _count: { select: { logs: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Projects</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Projects group templates together and collect log entries over time.
      </p>
      <ProjectsPanel projects={projects} />
    </div>
  );
}
