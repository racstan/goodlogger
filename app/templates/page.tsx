import { prisma } from '@/lib/prisma';
import { TemplateList } from '@/components/TemplateList';

export default async function TemplatesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">All Templates</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Templates are reusable across projects. Import them into a project to organize your work.
      </p>
      <TemplateList />
    </div>
  );
}
