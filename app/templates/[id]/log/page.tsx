import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { LogForm } from '@/components/LogForm';
import type { FieldDef } from '@/lib/schema';

export default async function LogEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await prisma.template.findUnique({ where: { id } });
  if (!t) notFound();
  const fields = JSON.parse(t.fields) as FieldDef[];
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <h1 className="text-xl sm:text-2xl font-semibold break-words">Log: {t.name}</h1>
        <Link href={`/templates/${t.id}/logs`} className="text-sm text-slate-600 underline min-h-11 flex items-center">View all entries</Link>
      </div>
      <LogForm templateId={t.id} fields={fields} />
    </div>
  );
}
