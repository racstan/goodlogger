import { describe, it, expect } from 'vitest';
import { buildCsv, buildProjectCsv, type CsvLog, type ProjectTemplateInfo } from '../csv';
import type { FieldDef } from '../schema';

const fields: FieldDef[] = [
  { id: 'mood',  name: 'Mood',        type: 'select',      required: true,  options: ['😀', '😐', '😞'] },
  { id: 'slept', name: 'Slept well?', type: 'boolean',     required: true },
  { id: 'energy',name: 'Energy level',type: 'slider',      required: true,  min: 1, max: 10, step: 1 },
  { id: 'block', name: 'Blockers',    type: 'multiselect', required: true,  options: ['None', 'People', 'Tools', 'Process'] },
  { id: 'start', name: 'Start time',  type: 'time',        required: true },
];

const logs: CsvLog[] = [
  {
    id: 'l1',
    templateId: 't1',
    values: { mood: '😀', slept: true, energy: 8, block: ['People', 'Tools'], start: '09:00' },
    loggedAt: new Date('2026-06-17T07:05:12Z'),
  },
  {
    id: 'l2',
    templateId: 't1',
    values: { mood: '😐', slept: false, energy: 4, block: ['None'], start: '10:30' },
    loggedAt: new Date('2026-06-17T08:30:00Z'),
  },
];

describe('buildCsv', () => {
  const out = buildCsv(fields, logs, 'UTC');

  it('emits header row with field names + timestamp', () => {
    const header = out.split('\n')[0];
    expect(header).toBe('Mood,Slept well?,Energy level,Blockers,Start time,Timestamp (UTC)');
  });

  it('formats the spec example row correctly (boolean Yes, multi-select quoted, comma-joined)', () => {
    const lines = out.split('\n');
    expect(lines[1].startsWith('😀,Yes,8,"People, Tools",09:00,')).toBe(true);
  });

  it('encodes boolean false as No', () => {
    const lines = out.split('\n');
    expect(lines[2].startsWith('😐,No,4,None,10:30,')).toBe(true);
  });

  it('quotes multi-select values when they contain commas', () => {
    expect(out).toContain('"People, Tools"');
  });

  it('does not needlessly quote simple multi-select values', () => {
    expect(out).toContain(',None,');
  });

  it('renders missing field values as "—" (en dash, unquoted since no special chars)', () => {
    const partial = buildCsv(fields, [{
      ...logs[0],
      values: { mood: '😀', slept: true, energy: 8, start: '09:00' }, // no block
    }], 'UTC');
    const cells = partial.split('\n')[1].split(',');
    expect(cells[3]).toBe('—');
  });

  it('escapes embedded double quotes', () => {
    const f: FieldDef[] = [{ id: 't', name: 't', type: 'text', required: true }];
    const csv = buildCsv(f, [{ ...logs[0], values: { t: 'say "hi"' } }], 'UTC');
    expect(csv).toContain('"say ""hi"""');
  });

  it('preserves newlines in quoted text values', () => {
    const f: FieldDef[] = [{ id: 't', name: 't', type: 'text', required: true }];
    const csv = buildCsv(f, [{ ...logs[0], values: { t: 'a\nb' } }], 'UTC');
    expect(csv).toContain('"a\nb"');
  });

  it('defeats CSV formula injection for dangerous starting characters', () => {
    const f: FieldDef[] = [{ id: 't', name: 't', type: 'text', required: true }];
    for (const evil of ['=SUM(A1:A2)', '+1+1', '-2', '@import', '\tHACK', '\rCR']) {
      const csv = buildCsv(f, [{ ...logs[0], values: { t: evil } }], 'UTC');
      const line = csv.split('\n')[1];
      expect(line.startsWith('"\'')).toBe(true);
    }
  });

  it('formats date field values as YYYY-MM-DD', () => {
    const f: FieldDef[] = [{ id: 'd', name: 'd', type: 'date', required: true }];
    const csv = buildCsv(f, [{ ...logs[0], values: { d: '2026-06-17' } }], 'UTC');
    expect(csv.split('\n')[1]).toContain('2026-06-17');
  });

  it('formats number field values numerically', () => {
    const f: FieldDef[] = [{ id: 'n', name: 'n', type: 'number', required: true }];
    const csv = buildCsv(f, [{ ...logs[0], values: { n: 42 } }], 'UTC');
    const line = csv.split('\n')[1];
    expect(line.startsWith('42,')).toBe(true);
  });

  it('emits empty cells for empty values', () => {
    const f: FieldDef[] = [
      { id: 'a', name: 'a', type: 'text', required: false },
      { id: 'b', name: 'b', type: 'text', required: false },
    ];
    const csv = buildCsv(f, [{ ...logs[0], values: { a: '', b: '' } }], 'UTC');
    const line = csv.split('\n')[1];
    // Two empty cells + a timestamp cell at the end
    const cells = line.split(',');
    expect(cells.length).toBe(3);
    expect(cells[0]).toBe('');
    expect(cells[1]).toBe('');
  });

  it('uses IANA timezone in the timestamp header', () => {
    const csv = buildCsv(fields, logs, 'Europe/Berlin');
    expect(csv.split('\n')[0]).toContain('Timestamp (Europe/Berlin)');
  });
});

describe('buildProjectCsv', () => {
  const templates: ProjectTemplateInfo[] = [
    {
      id: 't1',
      name: 'Daily Standup',
      fields: [
        { id: 'mood', name: 'Mood', type: 'select', required: true, options: ['😀', '😐', '😞'] },
        { id: 'energy', name: 'Energy', type: 'slider', required: true, min: 1, max: 10, step: 1 },
      ],
    },
    {
      id: 't2',
      name: 'Bug Report',
      fields: [
        { id: 'title', name: 'Title', type: 'text', required: true },
        { id: 'severity', name: 'Severity', type: 'select', required: true, options: ['Low', 'Medium', 'High'] },
      ],
    },
  ];

  const logs: CsvLog[] = [
    {
      id: 'l1',
      values: { mood: '😀', energy: 8, title: 'Login fails', severity: 'High' },
      loggedAt: new Date('2026-06-17T08:30:00Z'),
    },
    {
      id: 'l2',
      values: { mood: '😐', energy: 5 },
      loggedAt: new Date('2026-06-17T07:05:12Z'),
    },
    {
      id: 'l3',
      values: { title: 'Another bug', severity: 'Low' },
      loggedAt: new Date('2026-06-17T09:00:00Z'),
    },
  ];

  it('emits header with all field names and timestamp (no Template column)', () => {
    const csv = buildProjectCsv(templates, logs, 'UTC');
    const header = csv.split('\n')[0];
    expect(header).toBe('Mood,Energy,Title,Severity,Timestamp (UTC)');
  });

  it('includes values for all fields in each row, empty if not present', () => {
    const csv = buildProjectCsv(templates, logs, 'UTC');
    const lines = csv.split('\n');
    // l1: all fields filled
    const row1 = lines[1].split(',');
    expect(row1[0]).toBe('😀');
    expect(row1[1]).toBe('8');
    expect(row1[2]).toBe('Login fails');
    expect(row1[3]).toBe('High');
    // l2: only mood and energy
    const row2 = lines[2].split(',');
    expect(row2[0]).toBe('😐');
    expect(row2[1]).toBe('5');
    expect(row2[2]).toBe(''); // title empty
    expect(row2[3]).toBe(''); // severity empty
    // l3: only title and severity
    const row3 = lines[3].split(',');
    expect(row3[0]).toBe(''); // mood empty
    expect(row3[1]).toBe(''); // energy empty
    expect(row3[2]).toBe('Another bug');
    expect(row3[3]).toBe('Low');
  });

  it('sorts logs by loggedAt ascending', () => {
    const csv = buildProjectCsv(templates, logs, 'UTC');
    const lines = csv.split('\n');
    expect(lines[1]).toContain('😀');
    expect(lines[2]).toContain('😐');
    expect(lines[3]).toContain('Another bug');
  });

  it('handles empty logs', () => {
    const csv = buildProjectCsv(templates, [], 'UTC');
    const lines = csv.split('\n').filter((l) => l.length > 0);
    expect(lines.length).toBe(1); // header only
  });

  it('handles single template', () => {
    const csv = buildProjectCsv([templates[0]], [logs[0]], 'UTC');
    const header = csv.split('\n')[0];
    expect(header).toBe('Mood,Energy,Timestamp (UTC)');
  });

  it('uses IANA timezone in the timestamp header', () => {
    const csv = buildProjectCsv(templates, logs, 'America/New_York');
    expect(csv.split('\n')[0]).toContain('Timestamp (America/New_York)');
  });

  it('deduplicates fields with same id across templates (keeps first occurrence)', () => {
    const sharedIdTemplates: ProjectTemplateInfo[] = [
      {
        id: 't1',
        name: 'Template A',
        fields: [
          { id: 'mood', name: 'Mood', type: 'select', required: true, options: ['😀', '😐'] },
        ],
      },
      {
        id: 't2',
        name: 'Template B',
        fields: [
          { id: 'mood', name: 'Overall mood', type: 'rating', required: true, max: 5 },
          { id: 'notes', name: 'Notes', type: 'text', required: false },
        ],
      },
    ];
    const sharedIdLogs: CsvLog[] = [
      { id: 'l1', values: { mood: '😀' }, loggedAt: new Date('2026-06-17T07:00:00Z') },
      { id: 'l2', values: { mood: 4, notes: 'Great day' }, loggedAt: new Date('2026-06-17T08:00:00Z') },
    ];
    const csv = buildProjectCsv(sharedIdTemplates, sharedIdLogs, 'UTC');
    const header = csv.split('\n')[0];
    // Only one "Mood" column (from first template), plus Notes — no Template column
    expect(header).toBe('Mood,Notes,Timestamp (UTC)');
    const row1 = csv.split('\n')[1].split(',');
    expect(row1[0]).toBe('😀');
    expect(row1[1]).toBe('');
    const row2 = csv.split('\n')[2].split(',');
    expect(row2[0]).toBe('4');
    expect(row2[1]).toBe('Great day');
  });
});
