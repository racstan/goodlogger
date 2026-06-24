import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { TemplateDesigner } from '@/components/TemplateDesigner';
import type { FieldDef } from '@/lib/schema';

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await prisma.template.findUnique({
    where: { id },
    include: { _count: { select: { logs: true } } },
  });
  if (!t) notFound();

  // Count all log entries across projects that imported this template
  const projectLogCount = await prisma.log.count({
    where: {
      project: { templates: { some: { templateId: id } } },
    },
  });

  const fields = JSON.parse(t.fields) as FieldDef[];
  const totalEntries = t._count.logs + projectLogCount;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit: {t.name}</h1>
      <TemplateDesigner
        templateId={t.id}
        initialName={t.name}
        initialDescription={t.description}
        initialFields={fields}
        hasLogs={totalEntries > 0}
      />
    </div>
  );
}
