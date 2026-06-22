'use client';

import Link from 'next/link';
import { DeleteButton } from './DeleteButton';
import { ProjectForm } from './ProjectForm';

type Project = {
  id: string;
  name: string;
  description: string;
  templates: { template: { name: string } }[];
  _count: { logs: number };
};

type Props = {
  projects: Project[];
};

export function ProjectsPanel({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-slate-500 dark:text-slate-400 mb-4">No projects yet. Create one to start.</p>
        <ProjectForm />
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full overflow-y-auto">
      <ProjectForm />
      <ul className="divide-y divide-slate-200 dark:divide-slate-700 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        {projects.map((p) => {
          const totalEntries = p._count.logs;
          return (
            <li key={p.id} className="flex items-center justify-between px-4 py-3">
              <Link
                href={`/projects/${p.id}`}
                className="flex-1 hover:bg-slate-50 dark:hover:bg-slate-700 rounded px-2 py-1 -mx-2 -my-1"
              >
                <div className="font-medium">{p.name}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {p.description || 'No description'} · {p.templates.length} template{p.templates.length === 1 ? '' : 's'} · {totalEntries} entr{totalEntries === 1 ? 'y' : 'ies'}
                </div>
              </Link>
              <DeleteButton target={{ kind: 'project', id: p.id, name: p.name, templateCount: p.templates.length }} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
