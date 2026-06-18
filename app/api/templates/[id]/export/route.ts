import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildCsv } from '@/lib/csv';
import type { FieldDef } from '@/lib/schema';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const fromStr = url.searchParams.get('from');
  const toStr = url.searchParams.get('to');

  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) return new NextResponse('Not found', { status: 404 });

  const fields = JSON.parse(template.fields) as FieldDef[];

  const where: { templateId: string; loggedAt?: { gte?: Date; lte?: Date } } = { templateId: id };
  if (fromStr || toStr) {
    where.loggedAt = {};
    if (fromStr) where.loggedAt.gte = new Date(fromStr);
    if (toStr)   where.loggedAt.lte = new Date(toStr + 'T23:59:59.999Z');
  }
  const rows = await prisma.log.findMany({ where, orderBy: { loggedAt: 'asc' } });

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const csv = buildCsv(
    fields,
    rows.map((r) => ({ id: r.id, templateId: r.templateId, values: JSON.parse(r.values), loggedAt: r.loggedAt })),
    tz
  );

  const safeName = template.name.replace(/[^A-Za-z0-9_-]+/g, '_');
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeName}.csv"`,
      'X-GoodLogger-Timezone': tz,
    },
  });
}
