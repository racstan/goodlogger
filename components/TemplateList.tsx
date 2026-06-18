import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { DeleteButton } from './DeleteButton';

export async function TemplateList() {
  const templates = await prisma.template.findMany({
    include: { _count: { select: { logs: true } } },
    orderBy: { createdAt: 'asc' },
  });

  if (templates.length === 0) {
    return <p className="text-slate-500 dark:text-slate-400">No templates yet. Create one to start logging.</p>;
  }

  return (
    <ul className="divide-y divide-slate-200 dark:divide-slate-700 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      {templates.map((t) => {
        const fieldCount = (() => { try { return (JSON.parse(t.fields) as unknown[]).length; } catch { return 0; } })();
        const logCount = t._count.logs;
        return (
          <li key={t.id} className="flex items-center justify-between px-4 py-3 gap-2">
            <div className="min-w-0 flex-1">
              <div className="font-medium truncate">{t.name}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {fieldCount} field{fieldCount === 1 ? '' : 's'} · {logCount} entr{logCount === 1 ? 'y' : 'ies'}
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Link href={`/templates/${t.id}/edit`} className="rounded border border-slate-300 dark:border-slate-600 px-3 py-2 text-sm min-h-11 flex items-center hover:bg-slate-50 dark:hover:bg-slate-700">Edit</Link>
              <DeleteButton target={{ kind: 'template', id: t.id, name: t.name, logCount }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
