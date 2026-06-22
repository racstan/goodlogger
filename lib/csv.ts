import type { FieldDef, LogValue } from './schema';

export type CsvLog = {
  id: string;
  templateId?: string | null;
  values: Record<string, LogValue>;
  loggedAt: Date;
};

const DANGEROUS = new Set(['=', '+', '-', '@', '\t', '\r']);
const MISSING = '—';

const pad = (n: number) => String(n).padStart(2, '0');

function formatLocalDateTime(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function formatValue(def: FieldDef, v: LogValue | undefined): string {
  if (v === undefined || v === null || v === '') return '';
  if (typeof v === 'object' && v !== null && 'value' in v && !Array.isArray(v)) {
    return String(v.value);
  }
  switch (def.type) {
    case 'text':
    case 'richtext':
    case 'email':
    case 'url':
    case 'phone':
    case 'color':
      return String(v);
    case 'number':
    case 'slider':
    case 'rating':
      return String(v);
    case 'boolean':
      return v ? 'Yes' : 'No';
    case 'select':
      return String(v);
    case 'multiselect':
      return Array.isArray(v) ? v.join(', ') : '';
    case 'date':
      return String(v);
    case 'time':
      return String(v);
    case 'incrementer':
      return String(v);
  }
}

function csvCell(raw: string): string {
  let s = raw;
  const injected = s.length > 0 && DANGEROUS.has(s[0]);
  if (injected) s = "'" + s;
  const needsQuoting = injected || /[",\n\r]/.test(s);
  if (!needsQuoting) return s;
  return '"' + s.replace(/"/g, '""') + '"';
}

export function buildCsv(fields: FieldDef[], logs: CsvLog[], timezone: string): string {
  const header = [...fields.map((f) => f.name), `Timestamp (${timezone})`];
  const lines: string[] = [header.map(csvCell).join(',')];

  for (const log of logs) {
    const cells: string[] = [];
    for (const f of fields) {
      if (!(f.id in log.values)) {
        cells.push(csvCell(MISSING));
        continue;
      }
      cells.push(csvCell(formatValue(f, log.values[f.id])));
    }
    cells.push(csvCell(formatLocalDateTime(log.loggedAt)));
    lines.push(cells.join(','));
  }
  return lines.join('\n') + '\n';
}

export type ProjectTemplateInfo = {
  id: string;
  name: string;
  fields: FieldDef[];
};

export function buildProjectCsv(templates: ProjectTemplateInfo[], logs: CsvLog[], timezone: string): string {
  // Collect all unique fields across templates — deduplicate by field id
  const fieldOrder: { field: FieldDef }[] = [];
  const seenIds = new Set<string>();
  for (const t of templates) {
    for (const f of t.fields) {
      if (!seenIds.has(f.id)) {
        seenIds.add(f.id);
        fieldOrder.push({ field: f });
      }
    }
  }

  const header = [...fieldOrder.map((e) => e.field.name), `Timestamp (${timezone})`];
  const lines: string[] = [header.map(csvCell).join(',')];

  for (const log of logs) {
    const cells: string[] = [];
    for (const { field } of fieldOrder) {
      if (!(field.id in log.values)) {
        cells.push(csvCell(''));
        continue;
      }
      cells.push(csvCell(formatValue(field, log.values[field.id])));
    }
    cells.push(csvCell(formatLocalDateTime(log.loggedAt)));
    lines.push(cells.join(','));
  }
  return lines.join('\n') + '\n';
}
