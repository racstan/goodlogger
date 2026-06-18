import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { LogTable, type LogRow } from '@/components/LogTable';
import { LogsFilter } from '@/components/LogsFilter';
import type { FieldDef } from '@/lib/schema';

type SearchParams = Promise<{ from?: string; to?: string }>;

export default async function ViewLogsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const { from, to } = await searchParams;
  const t = await prisma.template.findUnique({ where: { id } });
  if (!t) notFound();
  const fields = JSON.parse(t.fields) as FieldDef[];

  const where: { templateId: string; loggedAt?: { gte?: Date; lte?: Date } } = { templateId: id };
  if (from || to) {
    where.loggedAt = {};
    if (from) where.loggedAt.gte = new Date(from);
    if (to)   where.loggedAt.lte = new Date(to + 'T23:59:59.999Z');
  }
  const logs = await prisma.log.findMany({ where, orderBy: { loggedAt: 'desc' } });
  const rows: LogRow[] = logs.map((l) => ({
    id: l.id,
    values: JSON.parse(l.values),
    loggedAt: l.loggedAt.toISOString(),
  }));

  const exportQs = new URLSearchParams();
  if (from) exportQs.set('from', from);
  if (to) exportQs.set('to', to);
  const exportHref = `/api/templates/${id}/export${exportQs.toString() ? `?${exportQs}` : ''}`;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-semibold break-words">{t.name} — Entries</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href={`/templates/${id}/log`} className="flex-1 sm:flex-none text-center rounded bg-emerald-600 text-white px-4 py-2 text-sm min-h-11 hover:bg-emerald-700">+ New Entry</Link>
          <a
            href={exportHref}
            aria-disabled={rows.length === 0}
            className={`flex-1 sm:flex-none text-center rounded border border-slate-300 px-4 py-2 text-sm min-h-11 ${
              rows.length === 0 ? 'pointer-events-none opacity-50' : 'hover:bg-slate-50'
            }`}
          >
            Export CSV
          </a>
        </div>
      </div>
      <LogsFilter templateId={id} />
      <LogTable templateId={id} fields={fields} rows={rows} />
    </div>
  );
}
