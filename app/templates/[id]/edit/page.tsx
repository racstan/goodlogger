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
  const fields = JSON.parse(t.fields) as FieldDef[];
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Edit: {t.name}</h1>
      <TemplateDesigner
        templateId={t.id}
        initialName={t.name}
        initialFields={fields}
        hasLogs={t._count.logs > 0}
      />
    </div>
  );
}
