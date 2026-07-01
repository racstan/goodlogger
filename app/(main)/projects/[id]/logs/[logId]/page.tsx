import { notFound } from 'next/navigation';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import type { FieldDef, LogValue } from '@/lib/schema';
import { ArrowLeft } from 'lucide-react';

export default async function LogEntryDetailPage({
  params,
}: {
  params: Promise<{ id: string; logId: string }>;
}) {
  const { id, logId } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      templates: {
        include: { template: true },
      },
    },
  });

  if (!project) notFound();

  const log = await prisma.log.findUnique({
    where: { id: logId },
  });

  if (!log) notFound();

  // Parse all fields from templates
  const allFields: FieldDef[] = [];
  const seenFieldIds = new Set<string>();
  for (const pt of project.templates) {
    const fields = JSON.parse(pt.template.fields) as FieldDef[];
    for (const f of fields) {
      if (!seenFieldIds.has(f.id)) {
        seenFieldIds.add(f.id);
        allFields.push(f);
      }
    }
  }

  const values = JSON.parse(log.values) as Record<string, LogValue>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link
            href={`/projects/${id}`}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Project
          </Link>
          <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
            Log Entry Details
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {project.name} • Logged at {new Date(log.loggedAt).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {allFields.map((f) => {
              const v = values[f.id];
              const isEmpty = v === undefined || v === null || v === '';
              
              let displayContent: React.ReactNode = '—';
              
              if (!isEmpty) {
                if (f.type === 'image' && typeof v === 'string') {
                  displayContent = (
                    <a href={v} target="_blank" rel="noreferrer" className="block mt-2">
                      <img src={v} alt={f.name} className="max-w-full h-auto max-h-[400px] rounded border border-slate-200 dark:border-slate-700 object-contain bg-slate-50 dark:bg-slate-900" />
                    </a>
                  );
                } else if (f.type === 'audio' && typeof v === 'string') {
                  displayContent = (
                    <audio src={v} controls className="w-full max-w-md mt-2" />
                  );
                } else if (f.type === 'video' && typeof v === 'string') {
                  displayContent = (
                    <a href={v} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:underline">
                      View Video
                    </a>
                  );
                } else if (Array.isArray(v)) {
                  displayContent = (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {v.map((item, idx) => (
                        <span key={idx} className="inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-800 dark:text-slate-200">
                          {item}
                        </span>
                      ))}
                    </div>
                  );
                } else if (typeof v === 'boolean') {
                  displayContent = v ? 'Yes' : 'No';
                } else if (typeof v === 'object' && v !== null && 'value' in v) {
                  displayContent = String((v as any).value);
                } else {
                  displayContent = String(v);
                }
              }

              return (
                <div key={f.id} className="border-b border-slate-100 dark:border-slate-700/50 pb-4 last:border-0 last:pb-0">
                  <dt className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                    {f.name}
                  </dt>
                  <dd className="text-slate-900 dark:text-slate-100 text-sm whitespace-pre-wrap">
                    {displayContent}
                  </dd>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
