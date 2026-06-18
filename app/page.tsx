import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { DeleteButton } from '@/components/DeleteButton';
import { ProjectForm } from '@/components/ProjectForm';

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    include: {
      templates: {
        include: {
          template: { include: { _count: { select: { logs: true } } } },
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Projects</h1>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400 mb-4">No projects yet. Create one to start organizing your templates.</p>
          <ProjectForm />
        </div>
      ) : (
        <div className="space-y-4">
          <ProjectForm />
          <ul className="divide-y divide-slate-200 dark:divide-slate-700 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            {projects.map((p) => {
              const totalEntries = p.templates.reduce((sum: number, pt: { template: { _count: { logs: number } } }) => sum + pt.template._count.logs, 0);
              return (
                <li key={p.id} className="flex items-center justify-between px-4 py-3">
                  <Link href={`/projects/${p.id}`} className="flex-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {p.description || 'No description'} · {p.templates.length} template{p.templates.length === 1 ? '' : 's'} · {totalEntries} entr{(totalEntries) === 1 ? 'y' : 'ies'}
                    </div>
                  </Link>
                  <DeleteButton target={{ kind: 'project', id: p.id, name: p.name, templateCount: p.templates.length }} />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
