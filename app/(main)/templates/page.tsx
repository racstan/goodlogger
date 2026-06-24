import Link from 'next/link';
import { TemplateList } from '@/components/TemplateList';

export default async function TemplatesPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">All Templates</h1>
        <Link
          href="/templates/new"
          className="rounded bg-emerald-600 text-white px-4 py-2 text-sm min-h-11 flex items-center hover:bg-emerald-700 shrink-0"
        >
          + New Template
        </Link>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Templates are reusable across projects. Import them into a project to organize your work.
      </p>
      <TemplateList />
    </div>
  );
}
