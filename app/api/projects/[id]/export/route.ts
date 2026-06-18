import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { buildProjectCsv } from '@/lib/csv';
import type { FieldDef } from '@/lib/schema';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const url = new URL(req.url);
  const fromStr = url.searchParams.get('from');
  const toStr = url.searchParams.get('to');

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      templates: {
        include: { template: true },
      },
    },
  });
  if (!project) return new NextResponse('Not found', { status: 404 });

  // Build template info array
  const templates = project.templates.map((pt) => ({
    id: pt.template.id,
    name: pt.template.name,
    fields: JSON.parse(pt.template.fields) as FieldDef[],
  }));

  if (templates.length === 0) {
    return new NextResponse('No templates in this project', { status: 404 });
  }

  // Fetch all project-level logs (combined entries spanning all templates)
  const where: { projectId: string; loggedAt?: { gte?: Date; lte?: Date } } = {
    projectId: id,
  };
  if (fromStr || toStr) {
    where.loggedAt = {};
    if (fromStr) where.loggedAt.gte = new Date(fromStr);
    if (toStr) where.loggedAt.lte = new Date(toStr + 'T23:59:59.999Z');
  }

  const rows = await prisma.log.findMany({ where, orderBy: { loggedAt: 'asc' } });

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  const csv = buildProjectCsv(
    templates,
    rows.map((r) => ({ id: r.id, values: JSON.parse(r.values), loggedAt: r.loggedAt })),
    tz
  );

  const safeName = project.name.replace(/[^A-Za-z0-9_-]+/g, '_');
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeName}.csv"`,
      'X-GoodLogger-Timezone': tz,
    },
  });
}
